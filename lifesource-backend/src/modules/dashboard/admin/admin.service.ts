import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Hospital,
  HospitalDocument,
  BloodInventory,
  BloodInventoryDocument,
  BloodRequest,
  BloodRequestDocument,
  Donation,
  DonationDocument,
  User,
  UserDocument,
  Broadcast,
  BroadcastDocument,
  Notification,
  NotificationDocument,
} from '../../schemas';
import {
  ApproveHospitalDto,
  AssignCredentialsDto,
  RedirectRequestDto,
  CreateBroadcastDto,
  AdminQueryDto,
  ReportQueryDto,
} from '../../dtos';
import {
  HospitalStatus,
  RequestStatus,
  NotificationType,
  BloodType,
  UserRole,
} from '../../../common/enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
    @InjectModel(BloodInventory.name)
    private inventoryModel: Model<BloodInventoryDocument>,
    @InjectModel(BloodRequest.name)
    private requestModel: Model<BloodRequestDocument>,
    @InjectModel(Donation.name) private donationModel: Model<DonationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Broadcast.name)
    private broadcastModel: Model<BroadcastDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  // ─── Hospital Verification ────────────────────────────────────────────────────

  async getPendingHospitals(query: AdminQueryDto) {
    const filter: any = { status: HospitalStatus.PENDING };
    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { city: new RegExp(query.search, 'i') },
        { email: new RegExp(query.search, 'i') },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [hospitals, total] = await Promise.all([
      this.hospitalModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
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

  async approveHospital(adminId: string, hospitalId: string) {
    const hospital = await this.hospitalModel.findById(hospitalId);
    if (!hospital) throw new NotFoundException('Hospital not found');
    if (hospital.status !== HospitalStatus.PENDING) {
      throw new BadRequestException('Hospital is not in pending status');
    }

    hospital.status = HospitalStatus.APPROVED;
    hospital.approvedAt = new Date();
    hospital.approvedBy = new Types.ObjectId(adminId);
    await hospital.save();

    this.eventEmitter.emit('hospital.approved', { hospital });
    return { message: 'Hospital approved successfully', data: hospital };
  }

  async rejectHospital(
    adminId: string,
    hospitalId: string,
    dto: ApproveHospitalDto,
  ) {
    const hospital = await this.hospitalModel.findById(hospitalId);
    if (!hospital) throw new NotFoundException('Hospital not found');

    hospital.status = HospitalStatus.REJECTED;
    hospital.rejectedReason = dto.reason;
    await hospital.save();

    this.eventEmitter.emit('hospital.rejected', {
      hospital,
      reason: dto.reason,
    });
    return { message: 'Hospital rejected', data: hospital };
  }

  async assignCredentials(hospitalId: string, dto: AssignCredentialsDto) {
    const hospital = await this.hospitalModel.findById(hospitalId);
    if (!hospital) throw new NotFoundException('Hospital not found');

    const user = await this.userModel.findById(dto.userId);
    if (!user) throw new NotFoundException('User not found');

    // Update user role
    await this.userModel.findByIdAndUpdate(dto.userId, {
      role: UserRole.HOSPITAL_ADMIN,
    });

    if (!hospital.adminUsers.map((id) => id.toString()).includes(dto.userId)) {
      hospital.adminUsers.push(new Types.ObjectId(dto.userId));
      await hospital.save();
    }

    return { message: 'Credentials assigned successfully', data: hospital };
  }

  async getAllHospitals(query: AdminQueryDto) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { city: new RegExp(query.search, 'i') },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [hospitals, total] = await Promise.all([
      this.hospitalModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
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

  // ─── Global Dashboard ─────────────────────────────────────────────────────────

  async getDashboard() {
    const [
      totalDonors,
      activeDonors,
      totalRecipients,
      totalHospitals,
      approvedHospitals,
      pendingHospitals,
      totalRequests,
      pendingRequests,
      fulfilledRequests,
      totalDonations,
      recentRequests,
      bloodTypeDistribution,
      inventoryByBloodType,
    ] = await Promise.all([
      this.userModel.countDocuments({ role: UserRole.DONOR }),
      this.userModel.countDocuments({ role: UserRole.DONOR, isActive: true }),
      this.userModel.countDocuments({ role: UserRole.RECIPIENT }),
      this.hospitalModel.countDocuments(),
      this.hospitalModel.countDocuments({ status: HospitalStatus.APPROVED }),
      this.hospitalModel.countDocuments({ status: HospitalStatus.PENDING }),
      this.requestModel.countDocuments(),
      this.requestModel.countDocuments({ status: RequestStatus.PENDING }),
      this.requestModel.countDocuments({ status: RequestStatus.FULFILLED }),
      this.donationModel.countDocuments(),
      this.requestModel
        .find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('hospitalId', 'name')
        .lean(),
      this.userModel.aggregate([
        { $match: { role: UserRole.DONOR } },
        { $group: { _id: '$bloodType', count: { $sum: 1 } } },
      ]),
      this.inventoryModel.aggregate([
        { $match: { status: 'available' } },
        { $group: { _id: '$bloodType', totalUnits: { $sum: '$units' } } },
      ]),
    ]);

    return {
      data: {
        stats: {
          donors: { total: totalDonors, active: activeDonors },
          recipients: { total: totalRecipients },
          hospitals: {
            total: totalHospitals,
            approved: approvedHospitals,
            pending: pendingHospitals,
          },
          requests: {
            total: totalRequests,
            pending: pendingRequests,
            fulfilled: fulfilledRequests,
            fulfillmentRate:
              totalRequests > 0
                ? Math.round((fulfilledRequests / totalRequests) * 100)
                : 0,
          },
          donations: { total: totalDonations },
        },
        recentRequests,
        bloodTypeDistribution,
        inventoryByBloodType,
      },
    };
  }

  // ─── Global Request Management ────────────────────────────────────────────────

  async getAllRequests(query: AdminQueryDto) {
    const filter: any = {};
    if (query.status) filter.status = query.status;

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [requests, total] = await Promise.all([
      this.requestModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ urgency: 1, createdAt: -1 })
        .populate('recipientId', 'name email')
        .populate('hospitalId', 'name city')
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

  async redirectRequest(
    adminId: string,
    requestId: string,
    dto: RedirectRequestDto,
  ) {
    const request = await this.requestModel.findById(requestId);
    if (!request) throw new NotFoundException('Request not found');

    const hospital = await this.hospitalModel.findById(dto.hospitalId);
    if (!hospital) throw new NotFoundException('Hospital not found');
    if (hospital.status !== HospitalStatus.APPROVED) {
      throw new BadRequestException('Target hospital is not approved');
    }

    request.redirectedBy = new Types.ObjectId(adminId);
    request.redirectedTo = new Types.ObjectId(dto.hospitalId);
    request.hospitalId = new Types.ObjectId(dto.hospitalId);
    request.hospitalName = hospital.name;
    request.status = RequestStatus.PENDING;
    await request.save();

    this.eventEmitter.emit('request.redirected', { request, hospital });
    return { message: 'Request redirected successfully', data: request };
  }

  // ─── Broadcasts ───────────────────────────────────────────────────────────────

  async createBroadcast(adminId: string, dto: CreateBroadcastDto) {
    // Build user filter for targeting
    const userFilter: any = { isActive: true };
    if (dto.target !== 'all') {
      const roleMap = {
        donors: UserRole.DONOR,
        recipients: UserRole.RECIPIENT,
        hospitals: UserRole.HOSPITAL_ADMIN,
      };
      userFilter.role = roleMap[dto.target];
    }
    if (dto.targetBloodTypes?.length > 0) {
      userFilter.bloodType = { $in: dto.targetBloodTypes };
    }
    if (dto.targetCities?.length > 0) {
      userFilter.city = { $in: dto.targetCities };
    }

    const targetUsers = await this.userModel
      .find(userFilter)
      .select('_id')
      .lean();
    const totalRecipients = targetUsers.length;

    const broadcast = await this.broadcastModel.create({
      sentBy: adminId,
      title: dto.title,
      message: dto.message,
      target: dto.target,
      targetBloodTypes: dto.targetBloodTypes || [],
      targetCities: dto.targetCities || [],
      isPushEnabled: dto.isPushEnabled ?? true,
      isEmailEnabled: dto.isEmailEnabled ?? false,
      totalRecipients,
    });

    // Create in-app notifications for all targets
    const notifications = targetUsers.map((user) => ({
      userId: user._id,
      type: NotificationType.BROADCAST,
      title: dto.title,
      message: dto.message,
      data: { broadcastId: broadcast._id },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    }));

    await this.notificationModel.insertMany(notifications);

    await this.broadcastModel.findByIdAndUpdate(broadcast._id, {
      delivered: totalRecipients,
    });

    this.eventEmitter.emit('broadcast.sent', { broadcast, targetUsers });

    return {
      message: `Broadcast sent to ${totalRecipients} users`,
      data: { ...broadcast.toObject(), totalRecipients },
    };
  }

  async getBroadcasts(query: AdminQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const [broadcasts, total] = await Promise.all([
      this.broadcastModel
        .find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('sentBy', 'name email')
        .lean(),
      this.broadcastModel.countDocuments(),
    ]);

    return {
      data: {
        broadcasts,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      },
    };
  }

  // ─── Reports & Analytics ──────────────────────────────────────────────────────

  async getDonationReport(query: ReportQueryDto) {
    const matchStage: any = {};
    if (query.hospitalId)
      matchStage.hospitalId = new Types.ObjectId(query.hospitalId);
    if (query.startDate || query.endDate) {
      matchStage.donationDate = {};
      if (query.startDate)
        matchStage.donationDate.$gte = new Date(query.startDate);
      if (query.endDate) matchStage.donationDate.$lte = new Date(query.endDate);
    }

    const groupFormat = {
      day: {
        year: { $year: '$donationDate' },
        month: { $month: '$donationDate' },
        day: { $dayOfMonth: '$donationDate' },
      },
      week: {
        year: { $year: '$donationDate' },
        week: { $week: '$donationDate' },
      },
      month: {
        year: { $year: '$donationDate' },
        month: { $month: '$donationDate' },
      },
    };

    const groupBy = groupFormat[query.groupBy] || groupFormat.month;

    const [byPeriod, byBloodType, byHospital, totals] = await Promise.all([
      this.donationModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: groupBy,
            count: { $sum: 1 },
            totalMl: { $sum: '$quantity' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      this.donationModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$bloodType',
            count: { $sum: 1 },
            totalMl: { $sum: '$quantity' },
          },
        },
      ]),
      this.donationModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$hospitalId',
            count: { $sum: 1 },
            totalMl: { $sum: '$quantity' },
          },
        },
        {
          $lookup: {
            from: 'hospitals',
            localField: '_id',
            foreignField: '_id',
            as: 'hospital',
          },
        },
        { $unwind: '$hospital' },
        {
          $project: {
            count: 1,
            totalMl: 1,
            hospitalName: '$hospital.name',
            city: '$hospital.city',
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      this.donationModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalMl: { $sum: '$quantity' },
          },
        },
      ]),
    ]);

    return {
      data: {
        byPeriod,
        byBloodType,
        byHospital,
        totals: totals[0] || { total: 0, totalMl: 0 },
      },
    };
  }

  async getShortageReport(query: ReportQueryDto) {
    const hospitalFilter: any = { status: HospitalStatus.APPROVED };
    if (query.hospitalId)
      hospitalFilter._id = new Types.ObjectId(query.hospitalId);

    // Get current inventory levels per blood type
    const inventoryLevels = await this.inventoryModel.aggregate([
      { $match: { status: 'available', expiryDate: { $gt: new Date() } } },
      {
        $group: {
          _id: '$bloodType',
          totalUnits: { $sum: '$units' },
          hospitalCount: { $addToSet: '$hospitalId' },
        },
      },
    ]);

    // Get recent demand (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDemand = await this.requestModel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$bloodType',
          totalRequests: { $sum: 1 },
          totalUnitsNeeded: { $sum: '$unitsNeeded' },
          fulfilled: {
            $sum: {
              $cond: [{ $eq: ['$status', RequestStatus.FULFILLED] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Identify shortages (demand > supply)
    const bloodTypes = Object.values(BloodType);
    const shortages = bloodTypes.map((bt) => {
      const supply = inventoryLevels.find((i) => i._id === bt);
      const demand = recentDemand.find((d) => d._id === bt);
      const availableUnits = supply?.totalUnits || 0;
      const demandedUnits = demand?.totalUnitsNeeded || 0;
      const fulfillmentRate = demand?.totalRequests
        ? Math.round((demand.fulfilled / demand.totalRequests) * 100)
        : 100;

      return {
        bloodType: bt,
        availableUnits,
        recentDemand: demandedUnits,
        shortfall: Math.max(0, demandedUnits - availableUnits),
        fulfillmentRate,
        riskLevel:
          availableUnits === 0
            ? 'critical'
            : availableUnits < 5
              ? 'high'
              : availableUnits < 15
                ? 'medium'
                : 'low',
      };
    });

    return {
      data: {
        shortages: shortages.sort((a, b) => b.shortfall - a.shortfall),
        summary: {
          criticalTypes: shortages
            .filter((s) => s.riskLevel === 'critical')
            .map((s) => s.bloodType),
          highRiskTypes: shortages
            .filter((s) => s.riskLevel === 'high')
            .map((s) => s.bloodType),
        },
      },
    };
  }
}
