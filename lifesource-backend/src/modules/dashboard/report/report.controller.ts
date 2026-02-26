import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './report.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guard';
import { Roles } from '../../../common/decorators';
import { UserRole } from '../../../common/enums';

@ApiTags('Analytics & Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('analytics')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'System-wide KPI overview',
    description:
      'Top-level metrics: total users, active donors, active recipients, hospital counts, ' +
      'donation totals, request fulfillment rate, and current inventory levels.',
  })
  getOverview() {
    return this.reportsService.getOverview();
  }

  @Get('users')
  @ApiOperation({
    summary: 'User analytics',
    description:
      'Registration trends, breakdown by blood type and city, ' +
      'and role-usage analysis (donor-only vs recipient-only vs both vs unused).',
  })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-12-31' })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: ['day', 'week', 'month'],
    example: 'month',
  })
  getUserAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: string,
  ) {
    return this.reportsService.getUserAnalytics({
      startDate,
      endDate,
      groupBy,
    });
  }

  @Get('donations')
  @ApiOperation({
    summary: 'Donation analytics',
    description:
      'Donation trend over time, breakdown by donation type, blood type, and top hospitals. ' +
      'Includes total volume (ml) and points awarded.',
  })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: ['day', 'week', 'month'],
  })
  @ApiQuery({
    name: 'hospitalId',
    required: false,
    description: 'Filter by a specific hospital',
  })
  getDonationAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: string,
    @Query('hospitalId') hospitalId?: string,
  ) {
    return this.reportsService.getDonationAnalytics({
      startDate,
      endDate,
      groupBy,
      hospitalId,
    });
  }

  @Get('requests')
  @ApiOperation({
    summary: 'Blood request analytics',
    description:
      'Request trends, breakdown by status, urgency, blood type, and request source (donor vs recipient). ' +
      'Includes average fulfillment time for completed requests.',
  })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: ['day', 'week', 'month'],
  })
  @ApiQuery({
    name: 'source',
    required: false,
    enum: ['donor', 'recipient', 'all'],
    description: 'Filter by who submitted the request',
  })
  getRequestAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: string,
    @Query('source') source?: string,
  ) {
    return this.reportsService.getRequestAnalytics({
      startDate,
      endDate,
      groupBy,
      source,
    });
  }

  @Get('shortages')
  @ApiOperation({
    summary: 'Blood shortage & supply report',
    description:
      'Per-blood-type supply snapshot: available units, 30-day demand, shortfall, ' +
      'units expiring in 7 days, and risk level (critical/high/medium/low).',
  })
  getShortageReport() {
    return this.reportsService.getShortageReport();
  }

  @Get('hospitals')
  @ApiOperation({
    summary: 'Hospital performance report',
    description:
      'Top hospitals by request fulfillment rate, donation volume, and current inventory levels.',
  })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getHospitalPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getHospitalPerformance({
      startDate,
      endDate,
      limit,
    });
  }
}
