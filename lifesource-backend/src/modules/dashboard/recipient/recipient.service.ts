import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BloodRequest,
  BloodRequestDocument,
  Notification,
  NotificationDocument,
  User,
  UserDocument,
} from '../../schemas';
import {
  CreateBloodRequestDto,
  UpdateRecipientProfileDto,
  RequestQueryDto,
} from '../../dtos';
import { RequestStatus, NotificationType } from '../../../common/enums';

@Injectable()
export class RecipientService {
  constructor(
    @InjectModel(BloodRequest.name)
    private requestModel: Model<BloodRequestDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');
    return { data: user };
  }

  async updateProfile(userId: string, dto: UpdateRecipientProfileDto) {
    const update: any = { ...dto };
    if (dto.longitude && dto.latitude) {
      update.location = {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      };
      delete update.longitude;
      delete update.latitude;
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, update, { new: true })
      .lean();
    return { message: 'Profile updated', data: user };
  }

  async createRequest(userId: string, dto: CreateBloodRequestDto) {
    const location =
      dto.longitude && dto.latitude
        ? { type: 'Point', coordinates: [dto.longitude, dto.latitude] }
        : undefined;

    const request = await this.requestModel.create({
      recipientId: userId,
      bloodType: dto.bloodType,
      donationType: dto.donationType,
      unitsNeeded: dto.unitsNeeded,
      urgency: dto.urgency,
      patientName: dto.patientName,
      patientAge: dto.patientAge,
      medicalCondition: dto.medicalCondition,
      requiredBy: dto.requiredBy,
      notes: dto.notes,
      hospitalId: dto.hospitalId,
      hospitalName: dto.hospitalName,
      city: dto.city,
      location,
      status: RequestStatus.PENDING,
    });

    // Trigger matching engine
    this.eventEmitter.emit('request.created', { request });

    return {
      message:
        'Blood request submitted successfully. We are finding donors for you.',
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
        .populate('hospitalId', 'name city phone')
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
      .populate('hospitalId', 'name city phone address')
      .lean();

    if (!request) throw new NotFoundException('Request not found');
    if (request.recipientId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

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
    if (request.recipientId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (
      [RequestStatus.FULFILLED, RequestStatus.UNAVAILABLE].includes(
        request.status,
      )
    ) {
      throw new ForbiddenException('Cannot cancel a completed request');
    }

    request.status = RequestStatus.UNAVAILABLE;
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
