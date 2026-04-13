/**
 * Triggered when a hospital marks a request as UNAVAILABLE — meaning they
 * have no blood inventory to fulfill it and need a live donor.
 *
 * Matching criteria (blood type only, no location filter):
 *   - Donor blood type is compatible with the requested blood type
 *   - Donor is eligible to donate (isEligible: true)
 *   - Donor is available (isAvailable: true)
 *   - Donor has notifications enabled
 *   - Donor has not already been notified for this request
 *
 * The donor sees this in their notifications and can accept or decline
 * via POST /donor/respond-request.
 */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  BLOOD_COMPATIBILITY,
  NotificationType,
  RequestStatus,
  UrgencyLevel,
} from 'src/common/enums';
import {
  BloodRequest,
  BloodRequestDocument,
  Donor,
  DonorDocument,
  Notification,
  NotificationDocument,
} from '../../schemas';
import { OnEvent } from '@nestjs/event-emitter';
import { addDays } from 'date-fns';

@Injectable()
export class MatchingService {
  constructor(
    private requestModel: Model<BloodRequestDocument>,
    @InjectModel(Donor.name) private donorModel: Model<DonorDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  @OnEvent('request.needsDonor')
  async handleNeedsDonor({ request }: { request: BloodRequestDocument }) {
    console.log(
      `🩸 Hospital marked request ${request._id} unavailable — finding eligible donors`,
    );

    // Compatible blood types that can donate for this request's blood type
    const compatibleBloodTypes = BLOOD_COMPATIBILITY[request.bloodType] || [
      request.bloodType,
    ];

    // Find eligible donors with a matching blood type
    // No location filter — the hospital already determined they can't help,
    // so we cast the net to all eligible donors regardless of distance
    const eligibleDonors = await this.donorModel
      .find({
        bloodType: { $in: compatibleBloodTypes },
        isEligible: true,
        isAvailable: true,
        notificationsEnabled: true,
      })
      .lean();

    if (eligibleDonors.length === 0) {
      console.warn(
        `⚠️ No eligible donors found for unavailable request ${request._id} (${request.bloodType})`,
      );
      return;
    }

    // Exclude donors already notified for this request
    const alreadyNotified = new Set(
      request.matchedDonors.map((d) => d.donorId.toString()),
    );

    const donorsToNotify = eligibleDonors
      .filter((d) => !alreadyNotified.has(d.userId.toString()))
      .slice(0, request.urgency === UrgencyLevel.CRITICAL ? 20 : 10);

    if (donorsToNotify.length === 0) {
      console.warn(
        `⚠️ All eligible donors already notified for request ${request._id}`,
      );
      return;
    }

    // Add new matched donor entries to the request
    const matchEntries = donorsToNotify.map((donor) => ({
      donorId: donor.userId,
      status: 'notified',
      notifiedAt: new Date(),
    }));

    await this.requestModel.findByIdAndUpdate(request._id, {
      $push: { matchedDonors: { $each: matchEntries } },
      // Keep status as UNAVAILABLE — hospital has no inventory.
      // Status will update to NOTIFIED_DONORS only if donors respond.
      status: RequestStatus.NOTIFIED_DONORS,
    });

    // Create in-app notifications for each donor
    const hospitalName = request.hospitalName || 'a hospital';
    const notifications = donorsToNotify.map((donor) => ({
      userId: donor.userId,
      type: NotificationType.BLOOD_REQUEST,
      title: `🩸 Blood donation needed — can you help?`,
      message:
        `${request.urgency.toUpperCase()}: ${request.unitsNeeded} unit(s) of ` +
        `${request.bloodType} blood needed at ${hospitalName}` +
        `${request.city ? ` in ${request.city}` : ''}. ` +
        `The hospital has no stock — a live donor is required.`,
      data: {
        requestId: request._id,
        bloodType: request.bloodType,
        urgency: request.urgency,
        hospitalName,
        city: request.city,
        hospitalId: request.hospitalId,
      },
      expiresAt: addDays(new Date(), 3),
    }));

    await this.notificationModel.insertMany(notifications);

    console.log(
      `✅ Notified ${donorsToNotify.length} donors for unavailable request ${request._id}`,
    );
  }
}
