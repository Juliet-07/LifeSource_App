import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HospitalService } from './hospital.service';
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
  PublicHospitalQueryDto,
} from '../../dtos';
import { JwtAuthGuard, RolesGuard } from '../../auth/guard';
import { Roles, CurrentUser } from '../../../common/decorators';
import { UserRole } from '../../../common/enums';

@ApiTags('Hospital')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.HOSPITAL_ADMIN)
@Controller('hospital')
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({
    summary: 'Hospital dashboard',
    description:
      'Aggregated stats for this hospital: available inventory by blood type, ' +
      'expiring units alert, open/fulfilled request counts, fulfillment rate, ' +
      "today's appointments, upcoming this week, and monthly donation activity.",
  })
  getDashboard(@CurrentUser('_id') userId: string) {
    return this.hospitalService.getDashboard(userId);
  }

  // ─── Profile ──────────────────────────────────────────────────────────────────

  @Post('profile')
  @ApiOperation({ summary: 'Create or update hospital profile' })
  @ApiResponse({ status: 201, description: 'Profile created/updated' })
  createOrUpdateProfile(
    @CurrentUser('_id') userId: string,
    @Body() dto: CreateHospitalProfileDto,
  ) {
    return this.hospitalService.createOrUpdateProfile(userId, dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get my hospital profile' })
  getMyHospital(@CurrentUser('_id') userId: string) {
    return this.hospitalService.getMyHospital(userId);
  }

  // ─── Inventory ────────────────────────────────────────────────────────────────

  @Post('inventory')
  @ApiOperation({ summary: 'Add blood units to inventory' })
  addInventory(
    @CurrentUser('_id') userId: string,
    @Body() dto: AddInventoryDto,
  ) {
    return this.hospitalService.addInventory(userId, dto);
  }

  @Patch('inventory/:id')
  @ApiOperation({
    summary: 'Update inventory record (mark as used/expired/discarded)',
  })
  updateInventory(
    @CurrentUser('_id') userId: string,
    @Param('id') inventoryId: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.hospitalService.updateInventory(userId, inventoryId, dto);
  }

  @Get('inventory')
  @ApiOperation({
    summary: 'Get blood inventory',
    description: 'Filter by blood type, donation type, or availability status.',
  })
  getInventory(
    @CurrentUser('_id') userId: string,
    @Query() query: InventoryQueryDto,
  ) {
    return this.hospitalService.getInventory(userId, query);
  }

  // ─── Appointments ─────────────────────────────────────────────────────────────

  @Get('appointments')
  @ApiOperation({ summary: 'Get donation appointments' })
  getAppointments(
    @CurrentUser('_id') userId: string,
    @Query() query: AppointmentQueryDto,
  ) {
    return this.hospitalService.getAppointments(userId, query);
  }

  @Patch('appointments/:id/confirm')
  @ApiOperation({ summary: 'Confirm a donation appointment' })
  confirmAppointment(
    @CurrentUser('_id') userId: string,
    @Param('id') appointmentId: string,
  ) {
    return this.hospitalService.confirmAppointment(userId, appointmentId);
  }

  @Patch('appointments/:id/reschedule')
  @ApiOperation({ summary: 'Reschedule a donation appointment' })
  rescheduleAppointment(
    @CurrentUser('_id') userId: string,
    @Param('id') appointmentId: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.hospitalService.rescheduleAppointment(
      userId,
      appointmentId,
      dto,
    );
  }

  @Patch('appointments/:id/cancel')
  @ApiOperation({ summary: 'Cancel a donation appointment' })
  cancelAppointment(
    @CurrentUser('_id') userId: string,
    @Param('id') appointmentId: string,
  ) {
    return this.hospitalService.cancelAppointment(userId, appointmentId);
  }

  @Get('appointments/confirmed')
  @ApiOperation({
    summary: 'Confirmed & completed appointments history',
    description:
      'Returns all appointments this hospital has confirmed or completed. ' +
      'Filter by date (YYYY-MM-DD) to see a specific day. ' +
      'Includes donor details and a summary count.',
  })
  getConfirmedAppointments(
    @CurrentUser('_id') userId: string,
    @Query() query: AppointmentQueryDto,
  ) {
    return this.hospitalService.getConfirmedAppointments(userId, query);
  }

  @Get('requests/handled')
  @ApiOperation({
    summary: 'Handled blood requests history',
    description:
      'Returns all blood requests this hospital has taken action on ' +
      '(confirmed, fulfilled, or partially fulfilled). ' +
      'Each request includes a requestType indicator (donor vs recipient). ' +
      'Excludes still-pending and unavailable requests.',
  })
  getHandledRequests(
    @CurrentUser('_id') userId: string,
    @Query() query: HospitalRequestQueryDto,
  ) {
    return this.hospitalService.getHandledRequests(userId, query);
  }

  // ─── Request Management ───────────────────────────────────────────────────────

  @Get('requests')
  @ApiOperation({
    summary: 'Get blood requests assigned to this hospital',
    description: 'Filter by urgency level and blood type. Sorted by urgency.',
  })
  getRequests(
    @CurrentUser('_id') userId: string,
    @Query() query: HospitalRequestQueryDto,
  ) {
    return this.hospitalService.getRequests(userId, query);
  }

  @Patch('requests/:id/match')
  @ApiOperation({
    summary: 'Match blood inventory to a request',
    description:
      'Assigns available inventory units to fulfill a blood request.',
  })
  matchInventory(
    @CurrentUser('_id') userId: string,
    @Param('id') requestId: string,
    @Body() dto: MatchInventoryDto,
  ) {
    return this.hospitalService.matchInventoryToRequest(userId, requestId, dto);
  }

  @Patch('requests/:id/status')
  @ApiOperation({
    summary: 'Update blood request status',
    description:
      'Set status: pending, fulfilled, partially_fulfilled, unavailable.',
  })
  updateRequestStatus(
    @CurrentUser('_id') userId: string,
    @Param('id') requestId: string,
    @Body() dto: UpdateRequestStatusDto,
  ) {
    return this.hospitalService.updateRequestStatus(userId, requestId, dto);
  }
}

@ApiTags('Hospitals')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER) // any regular user (donor OR recipient context)
@Controller('hospitals')
export class PublicHospitalsController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Get()
  @ApiOperation({
    summary: 'List all approved hospitals',
    description:
      'Returns all approved hospitals. Accessible to any authenticated user regardless of ' +
      'active role (donor or recipient). ' +
      'Use the hospital _id when logging a donation (POST /donor/donation) ' +
      'or when submitting a blood request (POST /requests).',
  })
  getHospitals(@Query() query: PublicHospitalQueryDto) {
    return this.hospitalService.getApprovedHospitals(query);
  }
}
