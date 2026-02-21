import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
  } from '@nestjs/common';
  import { InjectModel } from '@nestjs/mongoose';
  import { Model, Types } from 'mongoose';
  import { Cron, CronExpression } from '@nestjs/schedule';
  import { EventEmitter2 } from '@nestjs/event-emitter';
  import {
    Appointment,
    AppointmentDocument,
    BloodInventory,
    BloodInventoryDocument,
    BloodRequest,
    BloodRequestDocument,
    Hospital,
    HospitalDocument,
    Notification,
    NotificationDocument,
  } from '../../schemas';
  import {
    CreateHospitalProfileDto,
    AddInventoryDto,
    UpdateInventoryDto,
    InventoryQueryDto,
    AppointmentQueryDto,
    RescheduleAppointmentDto,
    HospitalRequestQueryDto,
    MatchInventoryDto,
    UpdateRequestStatusDto,
  } from '../../dtos';
  import {
    InventoryStatus,
    AppointmentStatus,
    RequestStatus,
    NotificationType,
  } from '../../../common/enums';
  import { addDays, isBefore } from 'date-fns';
  
  @Injectable()
  export class HospitalService {
    constructor(
      @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
      @InjectModel(BloodInventory.name)
      private inventoryModel: Model<BloodInventoryDocument>,
      @InjectModel(Appointment.name)
      private appointmentModel: Model<AppointmentDocument>,
      @InjectModel(BloodRequest.name)
      private requestModel: Model<BloodRequestDocument>,
      @InjectModel(Notification.name)
      private notificationModel: Model<NotificationDocument>,
      private eventEmitter: EventEmitter2,
    ) {}
  
    // ─── Hospital Profile ─────────────────────────────────────────────────────────
  
    async createOrUpdateProfile(userId: string, dto: CreateHospitalProfileDto) {
      const location =
        dto.longitude && dto.latitude
          ? { type: 'Point', coordinates: [dto.longitude, dto.latitude] }
          : undefined;
  
      // FIX 1: adminUsers -> adminUserId (matches Hospital schema field)
      const existing = await this.hospitalModel.findOne({ adminUserId: userId });
  
      if (existing) {
        const updated = await this.hospitalModel.findByIdAndUpdate(
          existing._id,
          { ...dto, location },
          { new: true },
        );
        return { message: 'Hospital profile updated', data: updated };
      }
  
      const hospital = await this.hospitalModel.create({
        ...dto,
        location,
        adminUserId: userId,  // FIX 1: adminUsers -> adminUserId
      });
      return {
        message: 'Hospital profile created, awaiting approval',
        data: hospital,
      };
    }
  
    async getMyHospital(userId: string) {
      // FIX 1: adminUsers -> adminUserId
      const hospital = await this.hospitalModel.findOne({ adminUserId: userId });
      if (!hospital) throw new NotFoundException('Hospital profile not found');
      return { data: hospital };
    }
  
    private async getHospitalByAdmin(userId: string): Promise<HospitalDocument> {
      // FIX 1: adminUsers -> adminUserId
      const hospital = await this.hospitalModel.findOne({ adminUserId: userId });
      if (!hospital) throw new NotFoundException('Hospital profile not found');
      return hospital;
    }
  
    // ─── Blood Inventory ──────────────────────────────────────────────────────────
    async addInventory(userId: string, dto: AddInventoryDto) {
      const hospital = await this.getHospitalByAdmin(userId);
  
      const inventory = await this.inventoryModel.create({
        hospitalId: hospital._id,
        bloodType: dto.bloodType,
        donationType: dto.donationType,
        units: dto.units,
        collectionDate: new Date(dto.collectionDate),
        expiryDate: new Date(dto.expiryDate),
        batchNumber: dto.batchNumber,
        storageLocation: dto.storageLocation,
        donorId: dto.donorId,
        notes: dto.notes,
        addedBy: userId,
      });
  
      return { message: 'Inventory added successfully', data: inventory };
    }
  
    async updateInventory(
      userId: string,
      inventoryId: string,
      dto: UpdateInventoryDto,
    ) {
      const hospital = await this.getHospitalByAdmin(userId);
  
      const inventory = await this.inventoryModel.findOne({
        _id: inventoryId,
        hospitalId: hospital._id,
      });
      if (!inventory) throw new NotFoundException('Inventory record not found');
  
      const update: any = { ...dto, updatedBy: userId };
      if (dto.status === InventoryStatus.USED) update.usedAt = new Date();
      if (dto.status === InventoryStatus.DISCARDED)
        update.discardedAt = new Date();
  
      const updated = await this.inventoryModel.findByIdAndUpdate(
        inventoryId,
        update,
        { new: true },
      );
  
      return { message: 'Inventory updated', data: updated };
    }
  
    async getInventory(userId: string, query: InventoryQueryDto) {
      const hospital = await this.getHospitalByAdmin(userId);
      const filter: any = { hospitalId: hospital._id };
  
      if (query.bloodType) filter.bloodType = query.bloodType;
      if (query.status) filter.status = query.status;
      if (query.donationType) filter.donationType = query.donationType;
  
      const inventory = await this.inventoryModel
        .find(filter)
        .sort({ expiryDate: 1 })
        .lean();
  
      // Summary by blood type
      const summary = await this.inventoryModel.aggregate([
        {
          $match: { hospitalId: hospital._id, status: InventoryStatus.AVAILABLE },
        },
        { $group: { _id: '$bloodType', totalUnits: { $sum: '$units' } } },
      ]);
  
      return { data: { inventory, summary } };
    }
  
    // ─── Appointments ──────────────────────────────────────────────────────────────
  
    async getAppointments(userId: string, query: AppointmentQueryDto) {
      const hospital = await this.getHospitalByAdmin(userId);
      const filter: any = { hospitalId: hospital._id };
      if (query.status) filter.status = query.status;
      if (query.date) {
        const day = new Date(query.date);
        const nextDay = addDays(day, 1);
        filter.scheduledAt = { $gte: day, $lt: nextDay };
      }
  
      const page = query.page || 1;
      const limit = query.limit || 20;
  
      const [appointments, total] = await Promise.all([
        this.appointmentModel
          .find(filter)
          .skip((page - 1) * limit)
          .limit(limit)
          .sort({ scheduledAt: 1 })
          .populate('donorId', 'name email phone')
          .lean(),
        this.appointmentModel.countDocuments(filter),
      ]);
  
      return {
        data: {
          appointments,
          pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        },
      };
    }
  
    async confirmAppointment(userId: string, appointmentId: string) {
      const hospital = await this.getHospitalByAdmin(userId);
      const appointment = await this.appointmentModel.findOne({
        _id: appointmentId,
        hospitalId: hospital._id,
      });
      if (!appointment) throw new NotFoundException('Appointment not found');
  
      appointment.status = AppointmentStatus.CONFIRMED;
      appointment.confirmedAt = new Date();
      appointment.confirmedBy = new Types.ObjectId(userId);
      await appointment.save();
  
      this.eventEmitter.emit('appointment.confirmed', { appointment });
      return { message: 'Appointment confirmed', data: appointment };
    }
  
    async rescheduleAppointment(
      userId: string,
      appointmentId: string,
      dto: RescheduleAppointmentDto,
    ) {
      const hospital = await this.getHospitalByAdmin(userId);
      const appointment = await this.appointmentModel.findOne({
        _id: appointmentId,
        hospitalId: hospital._id,
      });
      if (!appointment) throw new NotFoundException('Appointment not found');
  
      appointment.status = AppointmentStatus.RESCHEDULED;
      appointment.rescheduledTo = new Date(dto.newDateTime);
      appointment.scheduledAt = new Date(dto.newDateTime);
      appointment.notes = dto.reason || appointment.notes;
      await appointment.save();
  
      this.eventEmitter.emit('appointment.rescheduled', { appointment });
      return { message: 'Appointment rescheduled', data: appointment };
    }
  
    async cancelAppointment(userId: string, appointmentId: string) {
      const hospital = await this.getHospitalByAdmin(userId);
      const appointment = await this.appointmentModel.findOne({
        _id: appointmentId,
        hospitalId: hospital._id,
      });
      if (!appointment) throw new NotFoundException('Appointment not found');
  
      appointment.status = AppointmentStatus.CANCELLED;
      await appointment.save();
  
      this.eventEmitter.emit('appointment.cancelled', { appointment });
      return { message: 'Appointment cancelled', data: appointment };
    }
  
    // ─── Request Management ──────────────────────────────────────────────────────
  
    async getRequests(userId: string, query: HospitalRequestQueryDto) {
      const hospital = await this.getHospitalByAdmin(userId);
      const filter: any = { hospitalId: hospital._id };
  
      if (query.urgency) filter.urgency = query.urgency;
      if (query.bloodType) filter.bloodType = query.bloodType;
      if (query.status) filter.status = query.status;
  
      const page = query.page || 1;
      const limit = query.limit || 20;
  
      const [requests, total] = await Promise.all([
        this.requestModel
          .find(filter)
          .skip((page - 1) * limit)
          .limit(limit)
          .sort({ urgency: 1, createdAt: -1 })
          .populate('recipientId', 'name email phone')
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
  
    async matchInventoryToRequest(
      userId: string,
      requestId: string,
      dto: MatchInventoryDto,
    ) {
      const hospital = await this.getHospitalByAdmin(userId);
      const request = await this.requestModel.findOne({
        _id: requestId,
        hospitalId: hospital._id,
      });
      if (!request) throw new NotFoundException('Request not found');
  
      // Verify all inventory belongs to this hospital and is available
      const inventoryItems = await this.inventoryModel.find({
        _id: { $in: dto.inventoryIds },
        hospitalId: hospital._id,
        status: InventoryStatus.AVAILABLE,
      });
  
      if (inventoryItems.length !== dto.inventoryIds.length) {
        throw new BadRequestException('Some inventory items are not available');
      }
  
      // Reserve the inventory
      await this.inventoryModel.updateMany(
        { _id: { $in: dto.inventoryIds } },
        { status: InventoryStatus.RESERVED, usedForRequest: requestId },
      );
  
      const totalUnits = inventoryItems.reduce((acc, inv) => acc + inv.units, 0);
  
      request.assignedInventory.push(
        ...dto.inventoryIds.map((id) => new Types.ObjectId(id)),
      );
      request.unitsFulfilled = (request.unitsFulfilled || 0) + totalUnits;
      request.status = RequestStatus.CONFIRMED_BY_HOSPITAL;
      await request.save();
  
      this.eventEmitter.emit('request.matched', { request, inventoryItems });
  
      return { message: 'Inventory matched to request', data: request };
    }
  
    async updateRequestStatus(
      userId: string,
      requestId: string,
      dto: UpdateRequestStatusDto,
    ) {
      const hospital = await this.getHospitalByAdmin(userId);
      const request = await this.requestModel.findOne({
        _id: requestId,
        hospitalId: hospital._id,
      });
      if (!request) throw new NotFoundException('Request not found');
  
      request.status = dto.status;
      if (dto.unitsFulfilled !== undefined)
        request.unitsFulfilled = dto.unitsFulfilled;
      if (dto.status === RequestStatus.FULFILLED) {
        request.fulfilledAt = new Date();
        // Mark reserved inventory as used
        await this.inventoryModel.updateMany(
          { usedForRequest: requestId, status: InventoryStatus.RESERVED },
          { status: InventoryStatus.USED, usedAt: new Date() },
        );
        // FIX 2: Hospital.findByIdAndUpdate -> this.hospitalModel.findByIdAndUpdate
        await this.hospitalModel.findByIdAndUpdate(hospital._id, {
          $inc: { totalRequestsFulfilled: 1 },
        });
      }
  
      await request.save();
  
      this.eventEmitter.emit('request.statusUpdated', {
        request,
        status: dto.status,
      });
  
      return { message: 'Request status updated', data: request };
    }
  
    // ─── Scheduled jobs ───────────────────────────────────────────────────────────
  
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async checkExpiredInventory() {
      const now = new Date();
      const expired = await this.inventoryModel.updateMany(
        { status: InventoryStatus.AVAILABLE, expiryDate: { $lte: now } },
        { status: InventoryStatus.EXPIRED },
      );
      if (expired.modifiedCount > 0) {
        console.log(
          `⚠️ Marked ${expired.modifiedCount} inventory units as expired`,
        );
      }
    }
  
    @Cron(CronExpression.EVERY_DAY_AT_9AM)
    async sendAppointmentReminders() {
      const tomorrow = addDays(new Date(), 1);
      const dayAfter = addDays(new Date(), 2);
  
      const upcoming = await this.appointmentModel.find({
        scheduledAt: { $gte: tomorrow, $lt: dayAfter },
        status: {
          $in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        },
        reminderSent: false,
      });
  
      for (const appt of upcoming) {
        await this.notificationModel.create({
          userId: appt.donorId,
          type: NotificationType.APPOINTMENT_REMINDER,
          title: 'Appointment Reminder 🩸',
          message: `You have a blood donation appointment tomorrow. Thank you for saving lives!`,
          data: { appointmentId: appt._id },
          expiresAt: addDays(new Date(), 7),
        });
  
        await this.appointmentModel.findByIdAndUpdate(appt._id, {
          reminderSent: true,
        });
        this.eventEmitter.emit('appointment.reminder', { appointment: appt });
      }
    }
  }