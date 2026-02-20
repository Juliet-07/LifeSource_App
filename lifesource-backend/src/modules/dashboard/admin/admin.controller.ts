import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  ApproveHospitalDto,
  RedirectRequestDto,
  CreateBroadcastDto,
  AdminQueryDto,
  ReportQueryDto,
  CreateHospitalDto,
  RejectHospitalDto,
  UserManagementQueryDto,
  SuspendUserDto,
  UpdateHospitalDto,
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

  // ─── Hospital Management ────────────────────────────────────────────────────

  @Post('hospitals')
  @ApiOperation({
    summary: 'Add a new hospital',
    description:
      'Admin creates the hospital record (status: PENDING). No login account is created yet — that happens automatically on approval. ' +
      'Fields: institutionType, institutionName, officialEmail, phoneNumber, licenseRegNo, capacity, address, city, state, zipCode, country, ' +
      'contactFullName, contactEmail, contactPhone, note.',
  })
  @ApiResponse({
    status: 201,
    description: 'Hospital created (pending approval)',
  })
  @ApiResponse({
    status: 409,
    description: 'Official or contact email already registered',
  })
  createHospital(
    @CurrentUser('_id') adminId: string,
    @Body() dto: CreateHospitalDto,
  ) {
    return this.adminService.createHospital(adminId, dto);
  }

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

  @Get('hospitals/:id')
  @ApiOperation({
    summary: 'Get a single hospital with linked admin user info',
  })
  @ApiParam({ name: 'id', description: 'Hospital ID' })
  getHospitalById(@Param('id') hospitalId: string) {
    return this.adminService.getHospitalById(hospitalId);
  }

  @Put('hospitals/:id')
  @ApiOperation({ summary: 'Update hospital details' })
  updateHospital(
    @Param('id') hospitalId: string,
    @Body() dto: UpdateHospitalDto,
  ) {
    return this.adminService.updateHospital(hospitalId, dto);
  }

  @Patch('hospitals/:id/approve')
  @ApiOperation({
    summary: 'Approve a hospital',
    description:
      'Approving a hospital automatically: (1) generates a secure temporary password, ' +
      '(2) creates a hospital-admin User account using contactEmail & contactFullName, ' +
      '(3) sends a welcome email to the officialEmail, ' +
      '(4) sends login credentials (email + password) to the contactEmail.',
  })
  @ApiResponse({
    status: 200,
    description: 'Hospital approved and admin account created',
  })
  @ApiResponse({
    status: 409,
    description: 'Contact email already exists as a user',
  })
  approveHospital(
    @CurrentUser('_id') adminId: string,
    @Param('id') hospitalId: string,
  ) {
    return this.adminService.approveHospital(adminId, hospitalId);
  }

  @Patch('hospitals/:id/reject')
  @ApiOperation({ summary: 'Reject a hospital registration with a reason' })
  rejectHospital(
    @CurrentUser('_id') adminId: string,
    @Param('id') hospitalId: string,
    @Body() dto: RejectHospitalDto,
  ) {
    return this.adminService.rejectHospital(adminId, hospitalId, dto);
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

  // ─── User Management ───────────────────────────────────────────────────────
  @Get('users/donors')
  @ApiOperation({
    summary: 'Get all donors',
    description:
      'Returns donor user accounts enriched with their donor profile (eligibility, total donations, points, badges). ' +
      'Filter by bloodType, city, isActive, or search by name/email.',
  })
  getDonors(@Query() query: UserManagementQueryDto) {
    return this.adminService.getDonors(query);
  }

  @Get('users/donors/:id')
  @ApiOperation({
    summary: 'Get a single donor with full details',
    description:
      'Returns user account, donor profile, and 10 most recent donations.',
  })
  getDonorById(@Param('id') userId: string) {
    return this.adminService.getDonorById(userId);
  }

  @Patch('users/donors/:id/suspend')
  @ApiOperation({ summary: 'Suspend a donor account' })
  suspendDonor(
    @CurrentUser('_id') adminId: string,
    @Param('id') userId: string,
    @Body() dto: SuspendUserDto,
  ) {
    return this.adminService.suspendDonor(adminId, userId, dto);
  }

  @Patch('users/donors/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a suspended donor account' })
  reactivateDonor(
    @CurrentUser('_id') adminId: string,
    @Param('id') userId: string,
  ) {
    return this.adminService.reactivateDonor(adminId, userId);
  }

  @Get('users/recipients')
  @ApiOperation({
    summary: 'Get all recipients',
    description:
      'Filter by bloodType, city, isActive, or search by name/email.',
  })
  getRecipients(@Query() query: UserManagementQueryDto) {
    return this.adminService.getRecipients(query);
  }

  @Get('users/recipients/:id')
  @ApiOperation({
    summary: 'Get a single recipient with full details',
    description: 'Returns user account and 10 most recent blood requests.',
  })
  getRecipientById(@Param('id') userId: string) {
    return this.adminService.getRecipientById(userId);
  }

  @Patch('users/recipients/:id/suspend')
  @ApiOperation({ summary: 'Suspend a recipient account' })
  suspendRecipient(
    @CurrentUser('_id') adminId: string,
    @Param('id') userId: string,
    @Body() dto: SuspendUserDto,
  ) {
    return this.adminService.suspendRecipient(adminId, userId, dto);
  }

  @Patch('users/recipients/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a suspended recipient account' })
  reactivateRecipient(
    @CurrentUser('_id') adminId: string,
    @Param('id') userId: string,
  ) {
    return this.adminService.reactivateRecipient(adminId, userId);
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
