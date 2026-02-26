import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BloodRequest,
  BloodRequestDocument,
  Hospital,
  HospitalDocument,
  Notification,
  NotificationDocument,
  RequestSource,
  User,
  UserDocument,
} from '../../schemas';
import {
  CreateBloodRequestDto,
  UpdateRecipientProfileDto,
  RequestQueryDto,
  HospitalListQueryDto,
} from '../../dtos';
import {
  RequestStatus,
  NotificationType,
  HospitalStatus,
} from '../../../common/enums';

@Injectable()
export class RecipientService {
  constructor(
    @InjectModel(BloodRequest.name)
    private requestModel: Model<BloodRequestDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password -refreshToken')
      .lean();
    if (!user) throw new NotFoundException('User not found');
    return { data: user };
  }

  async updateProfile(userId: string, dto: UpdateRecipientProfileDto) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, dto, { new: true })
      .select('-password -refreshToken')
      .lean();
    return { message: 'Profile updated', data: user };
  }

  // ─── Hospitals list (for request placement) ───────────────────────────────────

  async getHospitals(query: HospitalListQueryDto) {
    const filter: any = { status: HospitalStatus.APPROVED };

    if (query.city) filter.city = new RegExp(query.city, 'i');
    if (query.search) {
      filter.$or = [
        { institutionName: new RegExp(query.search, 'i') },
        { city: new RegExp(query.search, 'i') },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [hospitals, total] = await Promise.all([
      this.hospitalModel
        .find(filter)
        .select(
          'institutionName institutionType officialEmail phoneNumber address city state country capacity',
        )
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ institutionName: 1 })
        .lean(),
      this.hospitalModel.countDocuments(filter),
    ]);

    return {
      data: {
        hospitals,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      },
    };
  }

  // ─── Blood Requests ───────────────────────────────────────────────────────────

  async createRequest(userId: string, dto: CreateBloodRequestDto) {
    // Verify hospital exists and is approved
    const hospital = await this.hospitalModel.findOne({
      _id: dto.hospitalId,
      status: HospitalStatus.APPROVED,
    });
    if (!hospital) {
      throw new BadRequestException(
        'Hospital not found or not approved. Use GET /recipient/hospitals to select a valid hospital.',
      );
    }

    const request = await this.requestModel.create({
      requestSource: RequestSource.RECIPIENT,
      requestorId: userId,
      bloodType: dto.bloodType,
      donationType: dto.donationType,
      unitsNeeded: dto.unitsNeeded,
      urgency: dto.urgency,
      patientName: dto.patientName,
      patientAge: dto.patientAge,
      medicalCondition: dto.medicalCondition,
      requiredBy: dto.requiredBy,
      notes: dto.notes,
      hospitalId: hospital._id,
      hospitalName: hospital.institutionName,
      city: hospital.city,
      status: RequestStatus.PENDING,
    });

    this.eventEmitter.emit('request.created', { request });

    return {
      message: 'Blood request submitted. We are finding donors for you.',
      data: request,
    };
  }

  async getMyRequests(userId: string, query: RequestQueryDto) {
    const filter: any = { recipientId: userId };
    if (query.status) filter.status = query.status;
    if (query.bloodType) filter.bloodType = query.bloodType;
    if (query.urgency) filter.urgency = query.urgency;

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.requestModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('hospitalId', 'institutionName city phoneNumber address')
        .lean(),
      this.requestModel.countDocuments(filter),
    ]);

    return {
      data: {
        requests,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      },
    };
  }

  async getRequestStatus(userId: string, requestId: string) {
    const request = await this.requestModel
      .findById(requestId)
      .populate('hospitalId', 'institutionName city phoneNumber address')
      .lean();

    if (!request) throw new NotFoundException('Request not found');
    if (request.requestorId.toString() !== userId.toString())
      throw new ForbiddenException('Access denied');

    const respondedDonors = request.matchedDonors.filter(
      (d) => d.status === 'accepted',
    ).length;

    return {
      data: {
        request,
        summary: {
          status: request.status,
          unitsNeeded: request.unitsNeeded,
          unitsFulfilled: request.unitsFulfilled,
          donorsNotified: request.matchedDonors.length,
          donorsAccepted: respondedDonors,
        },
      },
    };
  }

  async cancelRequest(userId: string, requestId: string) {
    const request = await this.requestModel.findById(requestId);
    if (!request) throw new NotFoundException('Request not found');
    if (request.requestorId.toString() !== userId.toString())
      throw new ForbiddenException('Access denied');
    if (
      [RequestStatus.FULFILLED, RequestStatus.CANCELLED].includes(
        request.status,
      )
    ) {
      throw new ForbiddenException('Cannot cancel a completed request');
    }

    request.status = RequestStatus.CANCELLED;
    await request.save();

    return { message: 'Request cancelled successfully' };
  }

  async getNotifications(userId: string) {
    const notifications = await this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return {
      data: {
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      },
    };
  }
}
