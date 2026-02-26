import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DonorService } from './donor.service';
import {
  UpdateDonorProfileDto,
  LogDonationDto,
  RespondToRequestDto,
  HospitalListQueryDto,
  CreateDonorBloodRequestDto,
  DonorRequestQueryDto,
} from '../../dtos';
import { JwtAuthGuard, RolesGuard } from '../../auth/guard';
import { Roles, CurrentUser } from '../../../common/decorators';
import { ActiveRole } from '../../../common/enums';

@ApiTags('Donor')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ActiveRole.DONOR)
@Controller('donor')
export class DonorController {
  constructor(private readonly donorService: DonorService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get full donor profile',
    description:
      'Returns personal details, donor profile, donation stats, eligibility countdown, and last donation info.',
  })
  getProfile(@CurrentUser('_id') userId: string) {
    return this.donorService.getProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update donor profile and personal details' })
  updateProfile(
    @CurrentUser('_id') userId: string,
    @Body() dto: UpdateDonorProfileDto,
  ) {
    return this.donorService.updateProfile(userId, dto);
  }

  @Get('hospitals')
  @ApiOperation({
    summary: 'List approved hospitals',
    description:
      'Returns all approved hospitals in the system. Use the hospital _id when logging a donation.',
  })
  getHospitals(@Query() query: HospitalListQueryDto) {
    return this.donorService.getHospitals(query);
  }

  @Get('accepted-requests')
  @ApiOperation({
    summary: 'List blood requests the donor has accepted',
    description:
      'Returns requests this donor responded to with "accept". Use the request _id as requestId when logging a donation. ' +
      'Each item shows whether a donation has already been logged for it.',
  })
  getAcceptedRequests(@CurrentUser('_id') userId: string) {
    return this.donorService.getAcceptedRequests(userId);
  }

  @Post('respond-request')
  @ApiOperation({
    summary: 'Accept or decline a blood request notification',
    description:
      'When a blood request matches this donor, they receive a notification. ' +
      'Use this endpoint to accept or decline. Accepted requests appear in GET /donor/accepted-requests.',
  })
  respondToRequest(
    @CurrentUser('_id') userId: string,
    @Body() dto: RespondToRequestDto,
  ) {
    return this.donorService.respondToRequest(userId, dto);
  }

  // ─── Donor-initiated blood requests (to hospitals) ────────────────────────────

  @Post('requests')
  @ApiOperation({
    summary: 'Submit a blood request to a hospital (as a donor needing blood)',
    description:
      'Donors can also request blood for themselves. This is completely separate from recipient requests — ' +
      'no recipient data is ever mixed in or visible here. Use GET /donor/hospitals to find a hospital.',
  })
  createBloodRequest(
    @CurrentUser('_id') userId: string,
    @Body() dto: CreateDonorBloodRequestDto,
  ) {
    return this.donorService.createBloodRequest(userId, dto);
  }

  @Get('requests')
  @ApiOperation({
    summary: 'My blood requests (donor-initiated)',
    description:
      'Lists blood requests this donor submitted to hospitals. Completely isolated from recipient data.',
  })
  getMyBloodRequests(
    @CurrentUser('_id') userId: string,
    @Query() query: DonorRequestQueryDto,
  ) {
    return this.donorService.getMyBloodRequests(userId, query);
  }

  @Get('requests/:id/status')
  @ApiOperation({ summary: 'Track status of a donor-submitted blood request' })
  getBloodRequestStatus(
    @CurrentUser('_id') userId: string,
    @Param('id') requestId: string,
  ) {
    return this.donorService.getBloodRequestStatus(userId, requestId);
  }

  @Patch('requests/:id/cancel')
  @ApiOperation({ summary: 'Cancel a donor-submitted blood request' })
  cancelBloodRequest(
    @CurrentUser('_id') userId: string,
    @Param('id') requestId: string,
  ) {
    return this.donorService.cancelBloodRequest(userId, requestId);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get donor notifications' })
  getNotifications(@CurrentUser('_id') userId: string) {
    return this.donorService.getNotifications(userId);
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(
    @CurrentUser('_id') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.donorService.markNotificationRead(userId, notificationId);
  }

  @Post('donation')
  @ApiOperation({
    summary: 'Log a completed donation',
    description:
      'Records a donation. `hospitalId` must come from GET /donor/hospitals (approved hospitals only). ' +
      '`requestId` is optional — if provided it must come from GET /donor/accepted-requests. ' +
      'Updates eligibility timer, points, and badges automatically.',
  })
  logDonation(@CurrentUser('_id') userId: string, @Body() dto: LogDonationDto) {
    return this.donorService.logDonation(userId, dto);
  }

  @Get('donations')
  @ApiOperation({ summary: 'Get full donation history with stats' })
  getDonationHistory(@CurrentUser('_id') userId: string) {
    return this.donorService.getDonationHistory(userId);
  }

  @Get('eligibility')
  @ApiOperation({
    summary: 'Check eligibility status',
    description:
      'Returns eligibility flag, next eligible date with human-readable countdown, and donation interval reference table.',
  })
  getEligibility(@CurrentUser('_id') userId: string) {
    return this.donorService.getEligibilityStatus(userId);
  }
}
