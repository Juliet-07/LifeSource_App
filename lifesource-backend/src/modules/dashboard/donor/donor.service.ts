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
} from '../../schemas';
import {
  UpdateDonorProfileDto,
  LogDonationDto,
  RespondToRequestDto,
} from '../../dtos';
import {
  DonationType,
  NotificationType,
  RequestStatus,
} from '../../../common/enums';
import { addDays } from 'date-fns';

const DONATION_INTERVALS: Record<DonationType, number> = {
  [DonationType.WHOLE_BLOOD]: 56,
  [DonationType.PLATELET]: 7,
  [DonationType.PLASMA]: 28,
  [DonationType.DOUBLE_RED_CELLS]: 112,
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
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async getProfile(userId: string) {
    const donor = await this.donorModel
      .findOne({ userId })
      .populate('preferredHospitals', 'name city');
    if (!donor) throw new NotFoundException('Donor profile not found');
    return { data: donor };
  }

  async updateProfile(userId: string, dto: UpdateDonorProfileDto) {
    // Update user fields
    const userUpdate: any = {};
    if (dto.name) userUpdate.name = dto.name;
    if (dto.phone) userUpdate.phone = dto.phone;
    if (dto.city) userUpdate.city = dto.city;
    if (dto.longitude && dto.latitude) {
      userUpdate.location = {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      };
    }
    if (Object.keys(userUpdate).length > 0) {
      await this.userModel.findByIdAndUpdate(userId, userUpdate);
    }

    // Update donor profile fields
    const donorUpdate: any = {};
    const donorFields = [
      'weight',
      'age',
      'preferredDonationType',
      'isAvailable',
      'notificationsEnabled',
      'consentGiven',
      'consentForAnonymousDonation',
      'preferredHospitals',
    ];
    donorFields.forEach((f) => {
      if (dto[f] !== undefined) donorUpdate[f] = dto[f];
    });

    const donor = await this.donorModel.findOneAndUpdate(
      { userId },
      donorUpdate,
      { new: true },
    );

    return { message: 'Profile updated', data: donor };
  }

  async getNotifications(userId: string) {
    const notifications = await this.notificationModel
      .find({ userId, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return { data: { notifications, unreadCount } };
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

  async respondToRequest(userId: string, dto: RespondToRequestDto) {
    const request = await this.requestModel.findById(dto.requestId);
    if (!request) throw new NotFoundException('Blood request not found');

    const matchedDonor = request.matchedDonors.find(
      (d) => d.donorId.toString() === userId,
    );

    if (!matchedDonor) {
      throw new ForbiddenException('You were not matched to this request');
    }

    if (matchedDonor.status !== 'notified') {
      throw new BadRequestException(
        'You have already responded to this request',
      );
    }

    const newStatus = dto.response === 'accept' ? 'accepted' : 'declined';
    matchedDonor.status = newStatus;
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

  async logDonation(userId: string, dto: LogDonationDto) {
    const donor = await this.donorModel.findOne({ userId });
    if (!donor) throw new NotFoundException('Donor profile not found');

    const donationDate = new Date(dto.donationDate);
    const intervalDays = DONATION_INTERVALS[dto.donationType];
    const nextEligible = addDays(donationDate, intervalDays);
    const points = DONATION_POINTS[dto.donationType];

    const donation = await this.donationModel.create({
      donorId: userId,
      hospitalId: dto.hospitalId,
      requestId: dto.requestId,
      bloodType: donor.bloodType,
      donationType: dto.donationType,
      quantity: dto.quantity,
      donationDate,
      notes: dto.notes,
      pointsAwarded: points,
    });

    // Update donor eligibility
    await this.donorModel.findByIdAndUpdate(donor._id, {
      lastDonationDate: donationDate,
      nextEligibleDate: nextEligible,
      isEligible: false,
      $inc: { totalDonations: 1, points },
    });

    // Award badges
    const newTotal = donor.totalDonations + 1;
    await this.awardBadges(donor._id.toString(), newTotal);

    this.eventEmitter.emit('donation.logged', { donorId: userId, donation });

    return { message: 'Donation logged successfully', data: donation };
  }

  async getDonationHistory(userId: string) {
    const donations = await this.donationModel
      .find({ donorId: userId })
      .sort({ donationDate: -1 })
      .populate('hospitalId', 'name city')
      .lean();

    const stats = {
      total: donations.length,
      totalMl: donations.reduce((acc, d) => acc + d.quantity, 0),
    };

    return { data: { donations, stats } };
  }

  async getEligibilityStatus(userId: string) {
    const donor = await this.donorModel.findOne({ userId }).lean();
    if (!donor) throw new NotFoundException('Donor profile not found');

    const now = new Date();
    const isEligible = !donor.nextEligibleDate || now >= donor.nextEligibleDate;

    // Auto-correct eligibility flag if needed
    if (isEligible !== donor.isEligible) {
      await this.donorModel.findByIdAndUpdate(donor._id, { isEligible });
    }

    return {
      data: {
        isEligible,
        lastDonationDate: donor.lastDonationDate,
        nextEligibleDate: donor.nextEligibleDate,
        daysUntilEligible: donor.nextEligibleDate
          ? Math.max(
              0,
              Math.ceil(
                (donor.nextEligibleDate.getTime() - now.getTime()) / 86400000,
              ),
            )
          : 0,
      },
    };
  }

  // ─── Scheduled job: restore eligibility ──────────────────────────────────────
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
          'Your donation eligibility has been restored. Thank you for saving lives!',
        data: {},
        expiresAt: addDays(now, 30),
      });

      this.eventEmitter.emit('donor.eligible', { donorId: donor.userId });
    }
  }

  private async awardBadges(donorId: string, totalDonations: number) {
    const badges: string[] = [];
    if (totalDonations === 1) badges.push('First Drop');
    if (totalDonations === 5) badges.push('Life Saver');
    if (totalDonations === 10) badges.push('Blood Hero');
    if (totalDonations === 25) badges.push('Champion');
    if (totalDonations === 50) badges.push('Legend');

    if (badges.length > 0) {
      await this.donorModel.findByIdAndUpdate(donorId, {
        $addToSet: { badges: { $each: badges } },
      });
    }
  }
}
