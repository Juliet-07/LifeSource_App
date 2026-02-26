import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BloodRequest,
  BloodRequestDocument,
  Donor,
  DonorDocument,
  Donation,
  DonationDocument,
  Notification,
  NotificationDocument,
  User,
  UserDocument,
  Hospital,
  HospitalDocument,
  RequestSource,
} from '../../schemas';
import {
  UpdateDonorProfileDto,
  LogDonationDto,
  RespondToRequestDto,
  HospitalListQueryDto,
} from '../../dtos';
import {
  DonationType,
  HospitalStatus,
  NotificationType,
  RequestStatus,
} from '../../../common/enums';
import { addDays, formatDistanceToNow, format } from 'date-fns';

const DONATION_INTERVALS: Record<DonationType, number> = {
  [DonationType.WHOLE_BLOOD]: 56,
  [DonationType.PLATELET]: 7,
  [DonationType.PLASMA]: 28,
  [DonationType.DOUBLE_RED_CELLS]: 112,
};

const DONATION_INTERVAL_LABELS: Record<DonationType, string> = {
  [DonationType.WHOLE_BLOOD]: '56 days (8 weeks)',
  [DonationType.PLATELET]: '7 days (1 week)',
  [DonationType.PLASMA]: '28 days (4 weeks)',
  [DonationType.DOUBLE_RED_CELLS]: '112 days (16 weeks)',
};

const DONATION_POINTS: Record<DonationType, number> = {
  [DonationType.WHOLE_BLOOD]: 10,
  [DonationType.PLATELET]: 8,
  [DonationType.PLASMA]: 8,
  [DonationType.DOUBLE_RED_CELLS]: 15,
};

@Injectable()
export class DonorService {
  constructor(
    @InjectModel(Donor.name) private donorModel: Model<DonorDocument>,
    @InjectModel(Donation.name) private donationModel: Model<DonationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(BloodRequest.name)
    private requestModel: Model<BloodRequestDocument>,
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  // ─── Profile ──────────────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    // Fetch both user and donor profile in parallel
    const [user, donor] = await Promise.all([
      this.userModel.findById(userId).select('-password -refreshToken').lean(),
      this.donorModel.findOne({ userId }).lean(),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!donor) throw new NotFoundException('Donor profile not found');

    // Build eligibility detail
    const now = new Date();
    const isEligible = !donor.nextEligibleDate || now >= donor.nextEligibleDate;
    const daysUntilEligible =
      donor.nextEligibleDate && !isEligible
        ? Math.ceil(
            (donor.nextEligibleDate.getTime() - now.getTime()) / 86400000,
          )
        : 0;

    // Last donation detail
    let lastDonationDetail = null;
    if (donor.lastDonationDate) {
      const lastDonation = await this.donationModel
        .findOne({ donorId: userId })
        .sort({ donationDate: -1 })
        .populate('hospitalId', 'institutionName city')
        .lean();

      if (lastDonation) {
        lastDonationDetail = {
          date: lastDonation.donationDate,
          formattedDate: format(
            new Date(lastDonation.donationDate),
            'dd MMM yyyy',
          ),
          timeAgo: formatDistanceToNow(new Date(lastDonation.donationDate), {
            addSuffix: true,
          }),
          donationType: lastDonation.donationType,
          quantity: lastDonation.quantity,
          hospital: lastDonation.hospitalId,
          eligibilityInterval:
            DONATION_INTERVAL_LABELS[lastDonation.donationType],
        };
      }
    }

    return {
      data: {
        // Personal / account details
        id: user._id,
        name: user.firstName + user.lastName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        state: user.state,
        country: user.country,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        createdAt: (user as any).createdAt,
        lastLoginAt: user.lastLoginAt,

        // Donor profile
        bloodType: donor.bloodType,
        isEligible,
        isAvailable: donor.isAvailable,
        consentGiven: donor.consentGiven,
        consentForAnonymousDonation: donor.consentForAnonymousDonation,
        preferredDonationType: donor.preferredDonationType,
        weight: donor.weight,
        age: donor.age,
        hasChronicIllness: donor.hasChronicIllness,
        onMedication: donor.onMedication,
        notificationsEnabled: donor.notificationsEnabled,

        // Donation stats
        totalDonations: donor.totalDonations,
        points: donor.points,
        badges: donor.badges,

        // Eligibility detail
        eligibility: {
          isEligible,
          lastDonationDate: donor.lastDonationDate,
          nextEligibleDate: donor.nextEligibleDate,
          daysUntilEligible,
          nextEligibleFormatted: donor.nextEligibleDate
            ? format(new Date(donor.nextEligibleDate), 'dd MMM yyyy')
            : null,
          timeUntilEligible:
            donor.nextEligibleDate && !isEligible
              ? formatDistanceToNow(new Date(donor.nextEligibleDate), {
                  addSuffix: true,
                })
              : null,
        },

        // Last donation detail
        lastDonation: lastDonationDetail,
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateDonorProfileDto) {
    // Split into user-level and donor-level fields
    const userFields = ['name', 'phone', 'city', 'state', 'country'];
    const userUpdate: any = {};
    userFields.forEach((f) => {
      if (dto[f] !== undefined) userUpdate[f] = dto[f];
    });
    if (Object.keys(userUpdate).length > 0) {
      await this.userModel.findByIdAndUpdate(userId, userUpdate);
    }

    const donorFields = [
      'weight',
      'age',
      'preferredDonationType',
      'isAvailable',
      'notificationsEnabled',
      'consentGiven',
      'consentForAnonymousDonation',
    ];
    const donorUpdate: any = {};
    donorFields.forEach((f) => {
      if (dto[f] !== undefined) donorUpdate[f] = dto[f];
    });

    const donor = await this.donorModel
      .findOneAndUpdate({ userId }, donorUpdate, { new: true })
      .lean();
    return { message: 'Profile updated', data: donor };
  }

  // ─── Hospitals list (for donation logging) ────────────────────────────────────

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

  // ─── Handle Requests ─────────────────────────────────

  async getAcceptedRequests(userId: string) {
    // Requests where this donor has accepted and not yet logged a donation for them
    const requests = await this.requestModel
      .find({
        matchedDonors: {
          $elemMatch: {
            donorId: new Types.ObjectId(userId),
            status: 'accepted',
          },
        },
      })
      .select(
        'bloodType donationType unitsNeeded urgency status hospitalId hospitalName city createdAt requiredBy patientName',
      )
      .populate('hospitalId', 'institutionName city address phoneNumber')
      .sort({ createdAt: -1 })
      .lean();

    // Annotate each with whether a donation has already been logged for it
    const loggedRequestIds = await this.donationModel.distinct('requestId', {
      donorId: userId,
      requestId: { $ne: null },
    });
    const loggedSet = new Set(loggedRequestIds.map((id) => id.toString()));

    const annotated = requests.map((r) => ({
      ...r,
      donationAlreadyLogged: loggedSet.has(r._id.toString()),
    }));

    return { data: annotated };
  }

  async respondToRequest(userId: string, dto: RespondToRequestDto) {
    const request = await this.requestModel.findById(dto.requestId);
    if (!request) throw new NotFoundException('Blood request not found');

    const matchedDonor = request.matchedDonors.find(
      (d) => d.donorId.toString() === userId,
    );
    if (!matchedDonor)
      throw new ForbiddenException('You were not matched to this request');
    if (matchedDonor.status !== 'notified') {
      throw new BadRequestException(
        'You have already responded to this request',
      );
    }

    matchedDonor.status = dto.response === 'accept' ? 'accepted' : 'declined';
    matchedDonor.respondedAt = new Date();
    await request.save();

    this.eventEmitter.emit('donor.responded', {
      requestId: request._id,
      donorId: userId,
      response: dto.response,
      reason: dto.reason,
    });

    return { message: `Request ${dto.response}ed successfully` };
  }

  // ─── Donor Blood Requests (donor requesting blood for themselves) ─────────────

  async createBloodRequest(userId: string, dto: any) {
    const hospital = await this.hospitalModel.findOne({
      _id: dto.hospitalId,
      status: HospitalStatus.APPROVED,
    });
    if (!hospital) {
      throw new BadRequestException(
        'Hospital not found or not approved. Use GET /donor/hospitals to select a valid hospital.',
      );
    }

    const request = await this.requestModel.create({
      requestSource: RequestSource.DONOR,
      requestorId: userId,
      bloodType: dto.bloodType,
      donationType: dto.donationType,
      notes: dto.notes,
      hospitalId: hospital._id,
      hospitalName: hospital.institutionName,
      city: hospital.city,
      status: RequestStatus.PENDING,
    });

    this.eventEmitter.emit('request.created', { request });

    if (!request) throw new BadRequestException('Failed o create request');
    
    return {
      message: 'Blood request submitted to the hospital.',
      data: this.sanitizeForDonor(request.toObject()),
    };
  }

  async getMyBloodRequests(userId: string, query: any) {
    const filter: any = {
      requestorId: userId,
      requestSource: RequestSource.DONOR,
    };
    if (query.status) filter.status = query.status;
    if (query.bloodType) filter.bloodType = query.bloodType;

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [requests, total] = await Promise.all([
      this.requestModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('hospitalId', 'institutionName city phoneNumber address')
        .lean(),
      this.requestModel.countDocuments(filter),
    ]);

    return {
      data: {
        requests: requests.map(this.sanitizeForDonor),
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      },
    };
  }

  async getBloodRequestStatus(userId: string, requestId: string) {
    const request = await this.requestModel
      .findOne({
        _id: requestId,
        requestorId: userId,
        requestSource: RequestSource.DONOR,
      })
      .populate('hospitalId', 'institutionName city phoneNumber address')
      .lean();
    if (!request) throw new NotFoundException('Request not found');

    return {
      data: {
        request: this.sanitizeForDonor(request),
        summary: {
          status: request.status,
          unitsNeeded: request.unitsNeeded,
          unitsFulfilled: request.unitsFulfilled,
        },
      },
    };
  }

  async cancelBloodRequest(userId: string, requestId: string) {
    const request = await this.requestModel.findOne({
      _id: requestId,
      requestorId: userId,
      requestSource: RequestSource.DONOR,
    });
    if (!request) throw new NotFoundException('Request not found');
    if (['fulfilled', 'unavailable'].includes(request.status)) {
      throw new BadRequestException('Cannot cancel a completed request');
    }
    request.status = 'unavailable' as any;
    await request.save();
    return { message: 'Request cancelled successfully' };
  }

  // ─── Notifications ────────────────────────────────────────────────────────────

  async getNotifications(userId: string) {
    const notifications = await this.notificationModel
      .find({ userId, expiresAt: { $gt: new Date() } })
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

  async markNotificationRead(userId: string, notificationId: string) {
    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true },
    );
    if (!notification) throw new NotFoundException('Notification not found');
    return { message: 'Notification marked as read', data: notification };
  }

  // ─── Log donation ─────────────────────────────────────────────────────────────

  async logDonation(userId: string, dto: LogDonationDto) {
    const donor = await this.donorModel.findOne({ userId });
    if (!donor) throw new NotFoundException('Donor profile not found');

    // Verify hospital exists and is approved within the system
    const hospital = await this.hospitalModel.findOne({
      _id: dto.hospitalId,
      status: HospitalStatus.APPROVED,
    });
    if (!hospital) {
      throw new BadRequestException(
        'Hospital not found or not approved. Use GET /donor/hospitals to select a valid hospital.',
      );
    }

    // If a requestId is provided, verify it belongs to an accepted request for this donor
    if (dto.requestId) {
      const request = await this.requestModel.findOne({
        _id: dto.requestId,
        matchedDonors: {
          $elemMatch: {
            donorId: new Types.ObjectId(userId),
            status: 'accepted',
          },
        },
      });
      if (!request) {
        throw new BadRequestException(
          'Request not found or you have not accepted it. Use GET /donor/accepted-requests to see your accepted requests.',
        );
      }

      // Prevent duplicate donation log for same request
      const alreadyLogged = await this.donationModel.findOne({
        donorId: userId,
        requestId: dto.requestId,
      });
      if (alreadyLogged) {
        throw new BadRequestException(
          'You have already logged a donation for this request.',
        );
      }
    }

    const donationDate = new Date(dto.donationDate);
    const intervalDays = DONATION_INTERVALS[dto.donationType];
    const nextEligible = addDays(donationDate, intervalDays);
    const points = DONATION_POINTS[dto.donationType];

    const donation = await this.donationModel.create({
      donorId: userId,
      hospitalId: dto.hospitalId,
      requestId: dto.requestId || null,
      bloodType: donor.bloodType,
      donationType: dto.donationType,
      quantity: dto.quantity,
      donationDate,
      notes: dto.notes,
      pointsAwarded: points,
    });

    await this.donorModel.findByIdAndUpdate(donor._id, {
      lastDonationDate: donationDate,
      nextEligibleDate: nextEligible,
      isEligible: false,
      $inc: { totalDonations: 1, points },
    });

    await this.awardBadges(donor._id.toString(), donor.totalDonations + 1);
    this.eventEmitter.emit('donation.logged', { donorId: userId, donation });

    return {
      message: 'Donation logged successfully',
      data: {
        donation,
        nextEligibleDate: nextEligible,
        nextEligibleFormatted: format(nextEligible, 'dd MMM yyyy'),
        eligibilityRestoredIn: `${intervalDays} days (${DONATION_INTERVAL_LABELS[dto.donationType]})`,
        pointsAwarded: points,
      },
    };
  }

  // ─── Donation history ─────────────────────────────────────────────────────────

  async getDonationHistory(userId: string) {
    const donations = await this.donationModel
      .find({ donorId: userId })
      .sort({ donationDate: -1 })
      .populate('hospitalId', 'institutionName city')
      .lean();

    const stats = {
      total: donations.length,
      totalMl: donations.reduce((acc, d) => acc + d.quantity, 0),
      byType: donations.reduce(
        (acc, d) => {
          acc[d.donationType] = (acc[d.donationType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };

    return { data: { donations, stats } };
  }

  // ─── Eligibility status ───────────────────────────────────────────────────────

  async getEligibilityStatus(userId: string) {
    const donor = await this.donorModel.findOne({ userId }).lean();
    if (!donor) throw new NotFoundException('Donor profile not found');

    const now = new Date();
    const isEligible = !donor.nextEligibleDate || now >= donor.nextEligibleDate;

    if (isEligible !== donor.isEligible) {
      await this.donorModel.findByIdAndUpdate(donor._id, { isEligible });
    }

    const daysUntilEligible =
      donor.nextEligibleDate && !isEligible
        ? Math.ceil(
            (donor.nextEligibleDate.getTime() - now.getTime()) / 86400000,
          )
        : 0;

    return {
      data: {
        isEligible,
        lastDonationDate: donor.lastDonationDate,
        lastDonationFormatted: donor.lastDonationDate
          ? format(new Date(donor.lastDonationDate), 'dd MMM yyyy')
          : null,
        nextEligibleDate: donor.nextEligibleDate,
        nextEligibleFormatted: donor.nextEligibleDate
          ? format(new Date(donor.nextEligibleDate), 'dd MMM yyyy')
          : null,
        daysUntilEligible,
        timeUntilEligible:
          donor.nextEligibleDate && !isEligible
            ? formatDistanceToNow(new Date(donor.nextEligibleDate), {
                addSuffix: true,
              })
            : null,
        donationIntervals: DONATION_INTERVAL_LABELS,
      },
    };
  }

  // ─── Scheduled: restore eligibility ──────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async checkEligibilityRestoration() {
    const now = new Date();
    const donors = await this.donorModel.find({
      isEligible: false,
      nextEligibleDate: { $lte: now },
    });

    for (const donor of donors) {
      await this.donorModel.findByIdAndUpdate(donor._id, { isEligible: true });
      await this.notificationModel.create({
        userId: donor.userId,
        type: NotificationType.ELIGIBILITY_RESTORED,
        title: 'You are eligible to donate again! 🩸',
        message:
          'Your donation eligibility has been restored. You can now schedule your next donation.',
        data: {},
        expiresAt: addDays(now, 30),
      });
      this.eventEmitter.emit('donor.eligible', { donorId: donor.userId });
    }
  }

  private async awardBadges(donorId: string, totalDonations: number) {
    const milestones: Record<number, string> = {
      1: 'First Drop',
      5: 'Life Saver',
      10: 'Blood Hero',
      25: 'Champion',
      50: 'Legend',
    };
    const badge = milestones[totalDonations];
    if (badge) {
      await this.donorModel.findByIdAndUpdate(donorId, {
        $addToSet: { badges: badge },
      });
    }
  }

  // Strips recipient-identity fields — donors never see recipient info
  private sanitizeForDonor(request: any) {
    const { matchedDonors, assignedInventory, requestorId, ...safe } = request;
    return safe;
  }
}
