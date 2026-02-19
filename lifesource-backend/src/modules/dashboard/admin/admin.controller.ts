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
import { AdminService } from './admin.service';
import {
  ApproveHospitalDto,
  AssignCredentialsDto,
  RedirectRequestDto,
  CreateBroadcastDto,
  AdminQueryDto,
  ReportQueryDto,
} from '../../dtos';
import { JwtAuthGuard, RolesGuard } from '../../auth/guard';
import { Roles, CurrentUser } from '../../../common/decorators';
import { UserRole } from '../../../common/enums';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Hospital Verification ────────────────────────────────────────────────────

  @Get('hospitals/pending')
  @ApiOperation({ summary: 'Get all hospitals pending approval' })
  getPendingHospitals(@Query() query: AdminQueryDto) {
    return this.adminService.getPendingHospitals(query);
  }

  @Get('hospitals')
  @ApiOperation({ summary: 'Get all hospitals (filterable by status)' })
  getAllHospitals(@Query() query: AdminQueryDto) {
    return this.adminService.getAllHospitals(query);
  }

  @Patch('hospitals/:id/approve')
  @ApiOperation({ summary: 'Approve a hospital registration' })
  @ApiResponse({ status: 200, description: 'Hospital approved' })
  approveHospital(
    @CurrentUser('_id') adminId: string,
    @Param('id') hospitalId: string,
  ) {
    return this.adminService.approveHospital(adminId, hospitalId);
  }

  @Patch('hospitals/:id/reject')
  @ApiOperation({ summary: 'Reject a hospital registration' })
  rejectHospital(
    @CurrentUser('_id') adminId: string,
    @Param('id') hospitalId: string,
    @Body() dto: ApproveHospitalDto,
  ) {
    return this.adminService.rejectHospital(adminId, hospitalId, dto);
  }

  @Post('hospitals/:id/assign-credentials')
  @ApiOperation({
    summary: 'Assign hospital admin credentials to a user',
    description:
      'Promotes a user to hospital-admin role for a specific hospital.',
  })
  assignCredentials(
    @Param('id') hospitalId: string,
    @Body() dto: AssignCredentialsDto,
  ) {
    return this.adminService.assignCredentials(hospitalId, dto);
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get system-wide dashboard metrics',
    description:
      'Returns aggregated stats: donors, recipients, hospitals, requests, donations, blood type distribution.',
  })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // ─── Request Management ───────────────────────────────────────────────────────

  @Get('requests')
  @ApiOperation({ summary: 'Get all blood requests system-wide' })
  getAllRequests(@Query() query: AdminQueryDto) {
    return this.adminService.getAllRequests(query);
  }

  @Patch('requests/:id/redirect')
  @ApiOperation({
    summary: 'Redirect a blood request to another hospital',
    description:
      'Used when the originally assigned hospital cannot fulfill the request.',
  })
  redirectRequest(
    @CurrentUser('_id') adminId: string,
    @Param('id') requestId: string,
    @Body() dto: RedirectRequestDto,
  ) {
    return this.adminService.redirectRequest(adminId, requestId, dto);
  }

  // ─── Broadcasts ───────────────────────────────────────────────────────────────

  @Post('broadcasts')
  @ApiOperation({
    summary: 'Send a system-wide broadcast notification',
    description:
      'Target all users, donors, recipients, or hospitals. Can filter by blood type or city.',
  })
  createBroadcast(
    @CurrentUser('_id') adminId: string,
    @Body() dto: CreateBroadcastDto,
  ) {
    return this.adminService.createBroadcast(adminId, dto);
  }

  @Get('broadcasts')
  @ApiOperation({
    summary: 'Get all broadcasts with delivery status',
  })
  getBroadcasts(@Query() query: AdminQueryDto) {
    return this.adminService.getBroadcasts(query);
  }

  // ─── Reports ──────────────────────────────────────────────────────────────────

  @Get('reports/donations')
  @ApiOperation({
    summary: 'Get donation reports',
    description:
      'Aggregated donation stats by month/week/day. Can filter by hospital and date range.',
  })
  getDonationReport(@Query() query: ReportQueryDto) {
    return this.adminService.getDonationReport(query);
  }

  @Get('reports/shortages')
  @ApiOperation({
    summary: 'Get blood shortage predictions and trends',
    description:
      'Analyzes current inventory vs recent demand to identify shortage risk by blood type.',
  })
  getShortageReport(@Query() query: ReportQueryDto) {
    return this.adminService.getShortageReport(query);
  }
}
