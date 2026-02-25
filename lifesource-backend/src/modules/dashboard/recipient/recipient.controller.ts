import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { RecipientService } from './recipient.service';
import {
  CreateBloodRequestDto,
  UpdateRecipientProfileDto,
  RequestQueryDto,
} from '../../dtos';
import { JwtAuthGuard, RolesGuard } from '../../auth/guard';
import { Roles, CurrentUser } from '../../../common/decorators';
import { UserRole } from '../../../common/enums';

@ApiTags('Recipient')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RECIPIENT)
@Controller('recipient')
export class RecipientController {
  constructor(private readonly recipientService: RecipientService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get recipient profile' })
  getProfile(@CurrentUser('_id') userId: string) {
    return this.recipientService.getProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update recipient profile' })
  updateProfile(
    @CurrentUser('_id') userId: string,
    @Body() dto: UpdateRecipientProfileDto,
  ) {
    return this.recipientService.updateProfile(userId, dto);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get recipient notifications' })
  getNotifications(@CurrentUser('_id') userId: string) {
    return this.recipientService.getNotifications(userId);
  }
}

// Separate controller for /requests routes
@ApiTags('Requests')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RECIPIENT)
@Controller('requests')
export class RequestsController {
  constructor(private readonly recipientService: RecipientService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new blood request',
    description:
      'Submit a blood request. The matching engine will find eligible donors nearby and notify them.',
  })
  @ApiResponse({
    status: 201,
    description: 'Request created and matching initiated',
  })
  createRequest(
    @CurrentUser('_id') userId: string,
    @Body() dto: CreateBloodRequestDto,
  ) {
    return this.recipientService.createRequest(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all my blood requests' })
  getMyRequests(
    @CurrentUser('_id') userId: string,
    @Query() query: RequestQueryDto,
  ) {
    return this.recipientService.getMyRequests(userId, query);
  }

  @Get(':id/status')
  @ApiOperation({
    summary: 'Get blood request status',
    description:
      'Returns current status: pending → notified_donors → confirmed_by_hospital → fulfilled.',
  })
  getRequestStatus(
    @CurrentUser('_id') userId: string,
    @Param('id') requestId: string,
  ) {
    return this.recipientService.getRequestStatus(userId, requestId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending blood request' })
  cancelRequest(
    @CurrentUser('_id') userId: string,
    @Param('id') requestId: string,
  ) {
    return this.recipientService.cancelRequest(userId, requestId);
  }
}
