import * as bcrypt from 'bcrypt';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
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
  DonorDocument,
  Donor,
} from '../../schemas';
import {
  CreateHospitalDto,
  ApproveHospitalDto,
  RedirectRequestDto,
  CreateBroadcastDto,
  AdminQueryDto,
  ReportQueryDto,
  UserManagementQueryDto,
  SuspendUserDto,
  RejectHospitalDto,
  UpdateHospitalDto,
} from '../../dtos';
import {
  HospitalStatus,
  RequestStatus,
  NotificationType,
  BloodType,
  UserRole,
} from '../../../common/enums';
import { EmailService } from 'src/common/utils/email.service';

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
    @InjectModel(Donor.name) private donorModel: Model<DonorDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private eventEmitter: EventEmitter2,
    private emailService: EmailService,
  ) {}

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

  // ─── Hospital Management ────────────────────────────────────────────────────
  async createHospital(adminId: string, dto: CreateHospitalDto) {
    const existingOfficial = await this.hospitalModel.findOne({
      officialEmail: dto.officialEmail,
    });
    if (existingOfficial) {
      throw new ConflictException(
        'A hospital with this official email already exists',
      );
    }

    const existingContact = await this.hospitalModel.findOne({
      contactEmail: dto.contactEmail,
    });
    if (existingContact) {
      throw new ConflictException(
        'This contact email is already registered to another hospital',
      );
    }

    const hospital = await this.hospitalModel.create({
      ...dto,
      status: HospitalStatus.PENDING,
    });

    console.log(
      `🏥 Hospital created: ${dto.institutionName} (pending approval)`,
    );

    return {
      message:
        'Hospital added successfully. Approve to provision the admin account.',
      data: hospital,
    };
  }

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
      throw new BadRequestException(`Hospital is already ${hospital.status}`);
    }

    // Check if contact email is already a registered user
    const existingUser = await this.userModel.findOne({
      email: hospital.contactEmail,
    });
    if (existingUser) {
      throw new ConflictException(
        'The contact email is already registered as a user. Update it before approving.',
      );
    }

    // Generate temp password
    const plainPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    // Split contactFullName into firstName / lastName for the User schema
    const nameParts = (hospital.contactFullName ?? '').trim().split(/\s+/);
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // Create hospital-admin user
    const user = await this.userModel.create({
      firstName,
      lastName,
      email: hospital.contactEmail,
      password: hashedPassword,
      role: UserRole.HOSPITAL_ADMIN,
      phone: hospital.contactPhone,
      city: hospital.city,
      country: hospital.country,
      isActive: true,
      isEmailVerified: true,
    });

    if (!user) {
      throw new BadRequestException('Failed to create admin user');
    }

    // Link user to hospital & approve
    hospital.adminUserId = user._id as Types.ObjectId;
    hospital.status = HospitalStatus.APPROVED;
    hospital.approvedAt = new Date();
    hospital.approvedBy = new Types.ObjectId(adminId);
    await hospital.save();

    // Send approval email directly with credentials
    await this.emailService.sendHospitalApprovalEmail(
      hospital.contactEmail,
      nameParts[0],
      plainPassword,
    );

    this.eventEmitter.emit('hospital.approved', {
      hospital,
      user,
      plainPassword,
    });

    console.log(
      `✅ Hospital approved: ${hospital.institutionName} | Admin account: ${hospital.contactEmail}`,
    );

    return {
      message: `Hospital approved. Admin account created for ${hospital.contactEmail}. Credentials emailed.`,
      data: {
        hospital,
        adminUser: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          role: user.role,
        },
      },
    };
  }

  async rejectHospital(
    adminId: string,
    hospitalId: string,
    dto: RejectHospitalDto,
  ) {
    const hospital = await this.hospitalModel.findById(hospitalId);
    if (!hospital) throw new NotFoundException('Hospital not found');
    if (hospital.status === HospitalStatus.APPROVED) {
      throw new BadRequestException(
        'Cannot reject an already approved hospital',
      );
    }

    hospital.status = HospitalStatus.REJECTED;
    hospital.rejectedReason = dto.reason;
    await hospital.save();

    await this.emailService.sendHospitalRejectionEmail(
      hospital.contactEmail,
      hospital.contactFullName?.split('')[0] ?? 'Applicant',
      dto.reason,
    );

    this.eventEmitter.emit('hospital.rejected', {
      hospital,
      reason: dto.reason,
    });

    return { message: 'Hospital rejected', data: hospital };
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

    const formattedHospitals = hospitals.map((hospital) => ({
      ...hospital,
      status: hospital.status
        ? hospital.status.charAt(0).toUpperCase() +
          hospital.status.slice(1).toLowerCase()
        : hospital.status,
    }));

    return {
      data: {
        hospitals: formattedHospitals,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    };
  }

  async deleteHospital(hospitalId: string) {
    const hospital = await this.hospitalModel.findById(hospitalId);
    if (!hospital) throw new NotFoundException('Hospital not found');

    if (hospital.status === HospitalStatus.APPROVED) {
      throw new BadRequestException(
        'Cannot delete an approved hospital. Suspend or reject it first.',
      );
    }

    await this.hospitalModel.findByIdAndDelete(hospitalId);
    return { message: 'Hospital deleted successfully' };
  }

  async getHospitalById(hospitalId: string) {
    const hospital = await this.hospitalModel
      .findById(hospitalId)
      .populate('adminUserId', 'firstName lastName email isActive lastLoginAt')
      .lean();
    if (!hospital) throw new NotFoundException('Hospital not found');
    return { data: hospital };
  }

  async updateHospital(hospitalId: string, dto: UpdateHospitalDto) {
    const hospital = await this.hospitalModel.findById(hospitalId);
    if (!hospital) throw new NotFoundException('Hospital not found');

    const updated = await this.hospitalModel.findByIdAndUpdate(
      hospitalId,
      dto,
      { new: true },
    );
    return { message: 'Hospital updated', data: updated };
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
        .populate('recipientId', 'firstName lastName email')
        .populate('hospitalId', 'institutionName city')
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
    // Use institutionName since Hospital schema uses that field
    request.hospitalName = hospital.institutionName;
    request.status = RequestStatus.PENDING;
    await request.save();

    this.eventEmitter.emit('request.redirected', { request, hospital });
    return { message: 'Request redirected successfully', data: request };
  }

  // ─── Broadcasts ───────────────────────────────────────────────────────────────

  async createBroadcast(adminId: string, dto: CreateBroadcastDto) {
    const userFilter: any = { isActive: true };
    if (dto.target !== 'all') {
      const roleMap: Record<string, UserRole> = {
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

    const notifications = targetUsers.map((user) => ({
      userId: user._id,
      type: NotificationType.BROADCAST,
      title: dto.title,
      message: dto.message,
      data: { broadcastId: broadcast._id },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
        .populate('sentBy', 'firstName lastName email')
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

  // ─── User Management — Donors ─────────────────────────────────────────────────

  async getDonors(query: UserManagementQueryDto) {
    const userFilter: any = { role: UserRole.DONOR };
    this.applyUserFilter(userFilter, query);

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [donors, total] = await Promise.all([
      this.userModel
        .find(userFilter)
        .select('-password -refreshToken')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.userModel.countDocuments(userFilter),
    ]);

    const donorIds = donors.map((d) => d._id);
    const donorProfiles = await this.donorModel
      .find({ userId: { $in: donorIds } })
      .lean();

    const profileMap = new Map(
      donorProfiles.map((p) => [p.userId.toString(), p]),
    );

    const enriched = donors.map((u) => ({
      ...u,
      donorProfile: profileMap.get(u._id.toString()) || null,
    }));

    return {
      data: {
        donors: enriched,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      },
    };
  }

  async getDonorById(userId: string) {
    const user = await this.userModel
      .findOne({ _id: userId, role: UserRole.DONOR })
      .select('-password -refreshToken')
      .lean();
    if (!user) throw new NotFoundException('Donor not found');

    const [donorProfile, donations, totalDonations] = await Promise.all([
      this.donorModel.findOne({ userId }).lean(),
      this.donationModel
        .find({ donorId: userId })
        .sort({ donationDate: -1 })
        .limit(10)
        .populate('hospitalId', 'institutionName city')
        .lean(),
      this.donationModel.countDocuments({ donorId: userId }),
    ]);

    return {
      data: { user, donorProfile, recentDonations: donations, totalDonations },
    };
  }

  async suspendDonor(adminId: string, userId: string, dto: SuspendUserDto) {
    return this.setUserActiveStatus(userId, false, dto.reason, UserRole.DONOR);
  }

  async reactivateDonor(adminId: string, userId: string) {
    return this.setUserActiveStatus(userId, true, null, UserRole.DONOR);
  }

  // ─── User Management — Recipients ────────────────────────────────────────────

  async getRecipients(query: UserManagementQueryDto) {
    const userFilter: any = { role: UserRole.RECIPIENT };
    this.applyUserFilter(userFilter, query);

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [recipients, total] = await Promise.all([
      this.userModel
        .find(userFilter)
        .select('-password -refreshToken')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.userModel.countDocuments(userFilter),
    ]);

    return {
      data: {
        recipients,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      },
    };
  }

  async getRecipientById(userId: string) {
    const user = await this.userModel
      .findOne({ _id: userId, role: UserRole.RECIPIENT })
      .select('-password -refreshToken')
      .lean();
    if (!user) throw new NotFoundException('Recipient not found');

    const [requests, totalRequests] = await Promise.all([
      this.requestModel
        .find({ recipientId: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('hospitalId', 'institutionName city')
        .lean(),
      this.requestModel.countDocuments({ recipientId: userId }),
    ]);

    return { data: { user, recentRequests: requests, totalRequests } };
  }

  async suspendRecipient(adminId: string, userId: string, dto: SuspendUserDto) {
    return this.setUserActiveStatus(
      userId,
      false,
      dto.reason,
      UserRole.RECIPIENT,
    );
  }

  async reactivateRecipient(adminId: string, userId: string) {
    return this.setUserActiveStatus(userId, true, null, UserRole.RECIPIENT);
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

    const groupFormat: Record<string, object> = {
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

    const groupBy = groupFormat[query.groupBy] ?? groupFormat['month'];

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
            hospitalName: '$hospital.institutionName',
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

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private async setUserActiveStatus(
    userId: string,
    isActive: boolean,
    reason: string | null,
    role: UserRole,
  ) {
    const user = await this.userModel.findOne({ _id: userId, role });
    if (!user) throw new NotFoundException('User not found');

    user.isActive = isActive;
    await user.save();

    const action = isActive ? 'reactivated' : 'suspended';
    console.log(
      `👤 ${role} ${userId} ${action}${reason ? ` — ${reason}` : ''}`,
    );

    return {
      message: `User ${action} successfully`,
      data: { id: user._id, isActive: user.isActive },
    };
  }

  private applyUserFilter(filter: any, query: UserManagementQueryDto) {
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.bloodType) filter.bloodType = query.bloodType;
    if (query.city) filter.city = new RegExp(query.city, 'i');
    if (query.search) {
      filter.$or = [
        { firstName: new RegExp(query.search, 'i') },
        { lastName: new RegExp(query.search, 'i') },
        { email: new RegExp(query.search, 'i') },
      ];
    }
  }

  private generatePassword(): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%';
    const rand = (s: string) => s[Math.floor(Math.random() * s.length)];

    const chars = [
      rand(upper),
      rand(upper),
      rand(digits),
      rand(digits),
      rand(special),
      ...Array.from({ length: 7 }, () => rand(lower)),
    ];
    return chars.sort(() => Math.random() - 0.5).join('');
  }
}
