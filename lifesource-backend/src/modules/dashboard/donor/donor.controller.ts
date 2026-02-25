import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
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
} from '../../dtos';
import { JwtAuthGuard, RolesGuard } from '../../auth/guard';
import { Roles, CurrentUser } from '../../../common/decorators';
import { UserRole } from '../../../common/enums';

@ApiTags('Donor')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DONOR)
@Controller('donor')
export class DonorController {
  constructor(private readonly donorService: DonorService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get donor profile' })
  getProfile(@CurrentUser('_id') userId: string) {
    return this.donorService.getProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update donor profile and preferences' })
  updateProfile(
    @CurrentUser('_id') userId: string,
    @Body() dto: UpdateDonorProfileDto,
  ) {
    return this.donorService.updateProfile(userId, dto);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get donor notifications (blood requests, alerts)' })
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

  @Post('respond-request')
  @ApiOperation({
    summary: 'Accept or decline a blood donation request',
    description: 'Donor responds to a matched blood request notification.',
  })
  @ApiResponse({ status: 201, description: 'Response recorded' })
  respondToRequest(
    @CurrentUser('_id') userId: string,
    @Body() dto: RespondToRequestDto,
  ) {
    return this.donorService.respondToRequest(userId, dto);
  }

  @Post('donation')
  @ApiOperation({
    summary: 'Log a donation',
    description:
      'Records a completed donation, updates eligibility timer and points.',
  })
  logDonation(@CurrentUser('_id') userId: string, @Body() dto: LogDonationDto) {
    return this.donorService.logDonation(userId, dto);
  }

  @Get('donations')
  @ApiOperation({ summary: 'Get donation history with stats' })
  getDonationHistory(@CurrentUser('_id') userId: string) {
    return this.donorService.getDonationHistory(userId);
  }

  @Get('eligibility')
  @ApiOperation({ summary: 'Check current donation eligibility status' })
  getEligibility(@CurrentUser('_id') userId: string) {
    return this.donorService.getEligibilityStatus(userId);
  }
}
