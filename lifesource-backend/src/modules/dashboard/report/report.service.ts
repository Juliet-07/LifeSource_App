import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Appointment,
  AppointmentDocument,
  BloodInventory,
  BloodInventoryDocument,
  BloodRequest,
  BloodRequestDocument,
  Donation,
  DonationDocument,
  Donor,
  DonorDocument,
  Hospital,
  HospitalDocument,
  User,
  UserDocument,
} from '../../schemas';
import {
  UserRole,
  ActiveRole,
  BloodType,
  HospitalStatus,
  InventoryStatus,
  RequestStatus,
} from '../../../common/enums';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Donor.name) private donorModel: Model<DonorDocument>,
    @InjectModel(Donation.name) private donationModel: Model<DonationDocument>,
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
    @InjectModel(BloodInventory.name)
    private inventoryModel: Model<BloodInventoryDocument>,
    @InjectModel(BloodRequest.name)
    private requestModel: Model<BloodRequestDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
  ) {}

  // ─── 1. Overview / KPI Summary ────────────────────────────────────────────────

  async getOverview() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      activeDonors, // users who have actually donated
      activeRecipients, // users who have actually made a request
      totalHospitals,
      approvedHospitals,
      pendingHospitals,
      totalDonations,
      donationsThisMonth,
      totalRequests,
      requestsThisMonth,
      fulfilledRequests,
      fulfilledThisMonth,
      totalInventoryUnits,
      eligibleDonors,
    ] = await Promise.all([
      this.userModel.countDocuments({ role: UserRole.USER }),
      this.userModel.countDocuments({ role: UserRole.USER, isActive: true }),
      this.userModel.countDocuments({
        role: UserRole.USER,
        usedRoles: ActiveRole.DONOR,
      }),
      this.userModel.countDocuments({
        role: UserRole.USER,
        usedRoles: ActiveRole.RECIPIENT,
      }),
      this.hospitalModel.countDocuments(),
      this.hospitalModel.countDocuments({ status: HospitalStatus.APPROVED }),
      this.hospitalModel.countDocuments({ status: HospitalStatus.PENDING }),
      this.donationModel.countDocuments(),
      this.donationModel.countDocuments({
        donationDate: { $gte: thirtyDaysAgo },
      }),
      this.requestModel.countDocuments(),
      this.requestModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      this.requestModel.countDocuments({ status: RequestStatus.FULFILLED }),
      this.requestModel.countDocuments({
        status: RequestStatus.FULFILLED,
        fulfilledAt: { $gte: thirtyDaysAgo },
      }),
      this.inventoryModel.aggregate([
        { $match: { status: InventoryStatus.AVAILABLE } },
        { $group: { _id: null, total: { $sum: '$units' } } },
      ]),
      this.donorModel.countDocuments({ isEligible: true }),
    ]);

    const overallFulfillmentRate =
      totalRequests > 0
        ? Math.round((fulfilledRequests / totalRequests) * 100)
        : 0;
    const monthlyFulfillmentRate =
      requestsThisMonth > 0
        ? Math.round((fulfilledThisMonth / requestsThisMonth) * 100)
        : 0;

    return {
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          activeDonors,
          activeRecipients,
          dualActive: 0, // computed below if needed
        },
        hospitals: {
          total: totalHospitals,
          approved: approvedHospitals,
          pending: pendingHospitals,
        },
        donations: {
          allTime: totalDonations,
          last30Days: donationsThisMonth,
        },
        requests: {
          allTime: totalRequests,
          last30Days: requestsThisMonth,
          fulfilled: fulfilledRequests,
          fulfilledLast30Days: fulfilledThisMonth,
          fulfillmentRate: overallFulfillmentRate,
          monthlyFulfillmentRate,
        },
        inventory: {
          totalAvailableUnits: totalInventoryUnits[0]?.total || 0,
          eligibleDonors,
        },
      },
    };
  }

  // ─── 2. User Analytics ────────────────────────────────────────────────────────

  async getUserAnalytics(query: {
    startDate?: string;
    endDate?: string;
    groupBy?: string;
  }) {
    const matchBase: any = { role: UserRole.USER };
    if (query.startDate || query.endDate) {
      matchBase.createdAt = {};
      if (query.startDate) matchBase.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) matchBase.createdAt.$lte = new Date(query.endDate);
    }

    const groupFormat = this.getGroupFormat(
      query.groupBy || 'month',
      '$createdAt',
    );

    const [
      registrationTrend,
      byBloodType,
      byCity,
      usedRolesBreakdown,
      roleUsageStats,
    ] = await Promise.all([
      // Registration trend over time
      this.userModel.aggregate([
        { $match: matchBase },
        { $group: { _id: groupFormat, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),

      // Users by blood type
      this.userModel.aggregate([
        { $match: { role: UserRole.USER } },
        {
          $group: {
            _id: '$bloodType',
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Users by city (top 10)
      this.userModel.aggregate([
        { $match: { role: UserRole.USER, city: { $exists: true, $ne: '' } } },
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Users by which roles they've used
      this.userModel.aggregate([
        { $match: { role: UserRole.USER } },
        {
          $group: {
            _id: null,
            donorOnly: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: [ActiveRole.DONOR, '$usedRoles'] },
                      { $not: { $in: [ActiveRole.RECIPIENT, '$usedRoles'] } },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            recipientOnly: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: [ActiveRole.RECIPIENT, '$usedRoles'] },
                      { $not: { $in: [ActiveRole.DONOR, '$usedRoles'] } },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            both: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: [ActiveRole.DONOR, '$usedRoles'] },
                      { $in: [ActiveRole.RECIPIENT, '$usedRoles'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            neitherYet: {
              $sum: { $cond: [{ $eq: ['$usedRoles', []] }, 1, 0] },
            },
          },
        },
      ]),

      // Active role preference
      this.userModel.aggregate([
        { $match: { role: UserRole.USER } },
        { $group: { _id: '$activeRole', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      data: {
        registrationTrend,
        byBloodType,
        topCities: byCity,
        roleUsage: usedRolesBreakdown[0] || {
          donorOnly: 0,
          recipientOnly: 0,
          both: 0,
          neitherYet: 0,
        },
        activeRolePreference: roleUsageStats,
      },
    };
  }

  // ─── 3. Donation Analytics ────────────────────────────────────────────────────

  async getDonationAnalytics(query: {
    startDate?: string;
    endDate?: string;
    groupBy?: string;
    hospitalId?: string;
  }) {
    const match: any = {};
    if (query.startDate || query.endDate) {
      match.donationDate = {};
      if (query.startDate) match.donationDate.$gte = new Date(query.startDate);
      if (query.endDate) match.donationDate.$lte = new Date(query.endDate);
    }
    if (query.hospitalId)
      match.hospitalId = new Types.ObjectId(query.hospitalId);

    const groupFormat = this.getGroupFormat(
      query.groupBy || 'month',
      '$donationDate',
    );

    const [trend, byType, byBloodType, topHospitals, totalStats] =
      await Promise.all([
        this.donationModel.aggregate([
          { $match: match },
          {
            $group: {
              _id: groupFormat,
              count: { $sum: 1 },
              totalMl: { $sum: '$quantity' },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        ]),

        this.donationModel.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$donationType',
              count: { $sum: 1 },
              totalMl: { $sum: '$quantity' },
            },
          },
        ]),

        this.donationModel.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$bloodType',
              count: { $sum: 1 },
              totalMl: { $sum: '$quantity' },
            },
          },
          { $sort: { count: -1 } },
        ]),

        this.donationModel.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$hospitalId',
              count: { $sum: 1 },
              totalMl: { $sum: '$quantity' },
            },
          },
          {
            $lookup: {
              from: 'hospitals',
              localField: '_id',
              foreignField: '_id',
              as: 'hospital',
            },
          },
          { $unwind: { path: '$hospital', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              count: 1,
              totalMl: 1,
              hospitalName: {
                $ifNull: ['$hospital.institutionName', 'Unknown'],
              },
              city: '$hospital.city',
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),

        this.donationModel.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              totalDonations: { $sum: 1 },
              totalMl: { $sum: '$quantity' },
              avgMlPerDonation: { $avg: '$quantity' },
              totalPointsAwarded: { $sum: '$pointsAwarded' },
            },
          },
        ]),
      ]);

    return {
      data: {
        trend,
        byDonationType: byType,
        byBloodType,
        topHospitals,
        totals: totalStats[0] || {
          totalDonations: 0,
          totalMl: 0,
          avgMlPerDonation: 0,
          totalPointsAwarded: 0,
        },
      },
    };
  }

  // ─── 4. Blood Request Analytics ───────────────────────────────────────────────

  async getRequestAnalytics(query: {
    startDate?: string;
    endDate?: string;
    groupBy?: string;
    source?: string; // 'donor' | 'recipient' | 'all'
  }) {
    const match: any = {};
    if (query.startDate || query.endDate) {
      match.createdAt = {};
      if (query.startDate) match.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) match.createdAt.$lte = new Date(query.endDate);
    }
    if (query.source && query.source !== 'all') {
      match.requestSource = query.source;
    }

    const groupFormat = this.getGroupFormat(
      query.groupBy || 'month',
      '$createdAt',
    );

    const [trend, byStatus, byUrgency, byBloodType, bySource, fulfillmentTime] =
      await Promise.all([
        this.requestModel.aggregate([
          { $match: match },
          {
            $group: {
              _id: groupFormat,
              total: { $sum: 1 },
              fulfilled: {
                $sum: {
                  $cond: [{ $eq: ['$status', RequestStatus.FULFILLED] }, 1, 0],
                },
              },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        ]),

        this.requestModel.aggregate([
          { $match: match },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),

        this.requestModel.aggregate([
          { $match: match },
          { $group: { _id: '$urgency', count: { $sum: 1 } } },
        ]),

        this.requestModel.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$bloodType',
              total: { $sum: 1 },
              fulfilled: {
                $sum: {
                  $cond: [{ $eq: ['$status', RequestStatus.FULFILLED] }, 1, 0],
                },
              },
            },
          },
          { $sort: { total: -1 } },
        ]),

        // Breakdown by who submitted (donor vs recipient)
        this.requestModel.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$requestSource',
              total: { $sum: 1 },
              fulfilled: {
                $sum: {
                  $cond: [{ $eq: ['$status', RequestStatus.FULFILLED] }, 1, 0],
                },
              },
            },
          },
        ]),

        // Average time to fulfillment (in hours) for fulfilled requests
        this.requestModel.aggregate([
          {
            $match: {
              ...match,
              status: RequestStatus.FULFILLED,
              fulfilledAt: { $exists: true },
            },
          },
          {
            $project: {
              hoursToFulfill: {
                $divide: [
                  { $subtract: ['$fulfilledAt', '$createdAt'] },
                  3600000,
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              avgHours: { $avg: '$hoursToFulfill' },
              minHours: { $min: '$hoursToFulfill' },
              maxHours: { $max: '$hoursToFulfill' },
            },
          },
        ]),
      ]);

    return {
      data: {
        trend,
        byStatus,
        byUrgency,
        byBloodType,
        bySource,
        fulfillmentTime: fulfillmentTime[0] || {
          avgHours: null,
          minHours: null,
          maxHours: null,
        },
      },
    };
  }

  // ─── 5. Blood Supply & Shortage Report ───────────────────────────────────────

  async getShortageReport() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [inventoryLevels, recentDemand, expiringInventory] =
      await Promise.all([
        this.inventoryModel.aggregate([
          {
            $match: {
              status: InventoryStatus.AVAILABLE,
              expiryDate: { $gt: now },
            },
          },
          {
            $group: {
              _id: '$bloodType',
              totalUnits: { $sum: '$units' },
              batches: { $sum: 1 },
            },
          },
        ]),

        this.requestModel.aggregate([
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: '$bloodType',
              totalRequests: { $sum: 1 },
              totalUnitsNeeded: { $sum: '$unitsNeeded' },
              fulfilled: {
                $sum: {
                  $cond: [{ $eq: ['$status', RequestStatus.FULFILLED] }, 1, 0],
                },
              },
            },
          },
        ]),

        this.inventoryModel.aggregate([
          {
            $match: {
              status: InventoryStatus.AVAILABLE,
              expiryDate: {
                $gt: now,
                $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
              },
            },
          },
          { $group: { _id: '$bloodType', expiringUnits: { $sum: '$units' } } },
        ]),
      ]);

    const bloodTypes = Object.values(BloodType);
    const supplyMap = new Map(inventoryLevels.map((i) => [i._id, i]));
    const demandMap = new Map(recentDemand.map((d) => [d._id, d]));
    const expiryMap = new Map(expiringInventory.map((e) => [e._id, e]));

    const report = bloodTypes.map((bt) => {
      const supply = supplyMap.get(bt);
      const demand = demandMap.get(bt);
      const expiring = expiryMap.get(bt);

      const availableUnits = supply?.totalUnits || 0;
      const unitsNeeded = demand?.totalUnitsNeeded || 0;
      const shortfall = Math.max(0, unitsNeeded - availableUnits);
      const fulfillmentRate =
        demand?.totalRequests > 0
          ? Math.round((demand.fulfilled / demand.totalRequests) * 100)
          : 100;

      const riskLevel =
        availableUnits === 0
          ? 'critical'
          : availableUnits < 5
            ? 'high'
            : availableUnits < 15
              ? 'medium'
              : 'low';

      return {
        bloodType: bt,
        availableUnits,
        batches: supply?.batches || 0,
        expiringInSevenDays: expiring?.expiringUnits || 0,
        demand30Days: {
          requests: demand?.totalRequests || 0,
          unitsNeeded,
          fulfilled: demand?.fulfilled || 0,
          fulfillmentRate,
        },
        shortfall,
        riskLevel,
      };
    });

    return {
      data: {
        asOf: now,
        bloodTypes: report.sort((a, b) => {
          const order = { critical: 0, high: 1, medium: 2, low: 3 };
          return order[a.riskLevel] - order[b.riskLevel];
        }),
        summary: {
          criticalTypes: report
            .filter((r) => r.riskLevel === 'critical')
            .map((r) => r.bloodType),
          highRiskTypes: report
            .filter((r) => r.riskLevel === 'high')
            .map((r) => r.bloodType),
          totalAvailableUnits: report.reduce(
            (sum, r) => sum + r.availableUnits,
            0,
          ),
          expiringThisWeek: report.reduce(
            (sum, r) => sum + r.expiringInSevenDays,
            0,
          ),
        },
      },
    };
  }

  // ─── 6. Hospital Performance Report ─────────────────────────────────────────

  async getHospitalPerformance(query: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    const match: any = {};
    if (query.startDate || query.endDate) {
      match.createdAt = {};
      if (query.startDate) match.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) match.createdAt.$lte = new Date(query.endDate);
    }

    const [requestPerformance, donationVolume, inventoryStatus] =
      await Promise.all([
        this.requestModel.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$hospitalId',
              totalRequests: { $sum: 1 },
              fulfilled: {
                $sum: {
                  $cond: [{ $eq: ['$status', RequestStatus.FULFILLED] }, 1, 0],
                },
              },
              pending: {
                $sum: {
                  $cond: [
                    { $in: ['$status', ['pending', 'notified_donors']] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          {
            $lookup: {
              from: 'hospitals',
              localField: '_id',
              foreignField: '_id',
              as: 'hospital',
            },
          },
          { $unwind: { path: '$hospital', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              hospitalName: {
                $ifNull: ['$hospital.institutionName', 'Unknown'],
              },
              city: '$hospital.city',
              institutionType: '$hospital.institutionType',
              totalRequests: 1,
              fulfilled: 1,
              pending: 1,
              fulfillmentRate: {
                $cond: [
                  { $gt: ['$totalRequests', 0] },
                  {
                    $multiply: [
                      { $divide: ['$fulfilled', '$totalRequests'] },
                      100,
                    ],
                  },
                  0,
                ],
              },
            },
          },
          { $sort: { totalRequests: -1 } },
          { $limit: query.limit || 20 },
        ]),

        this.donationModel.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$hospitalId',
              totalDonations: { $sum: 1 },
              totalMl: { $sum: '$quantity' },
            },
          },
          {
            $lookup: {
              from: 'hospitals',
              localField: '_id',
              foreignField: '_id',
              as: 'hospital',
            },
          },
          { $unwind: { path: '$hospital', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              hospitalName: {
                $ifNull: ['$hospital.institutionName', 'Unknown'],
              },
              totalDonations: 1,
              totalMl: 1,
            },
          },
          { $sort: { totalDonations: -1 } },
          { $limit: query.limit || 20 },
        ]),

        this.inventoryModel.aggregate([
          { $match: { status: InventoryStatus.AVAILABLE } },
          {
            $group: {
              _id: '$hospitalId',
              availableUnits: { $sum: '$units' },
              bloodTypes: { $addToSet: '$bloodType' },
            },
          },
          {
            $lookup: {
              from: 'hospitals',
              localField: '_id',
              foreignField: '_id',
              as: 'hospital',
            },
          },
          { $unwind: { path: '$hospital', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              hospitalName: {
                $ifNull: ['$hospital.institutionName', 'Unknown'],
              },
              availableUnits: 1,
              bloodTypesAvailable: { $size: '$bloodTypes' },
            },
          },
          { $sort: { availableUnits: -1 } },
          { $limit: query.limit || 20 },
        ]),
      ]);

    return {
      data: {
        requestPerformance,
        donationVolume,
        inventoryStatus,
      },
    };
  }

  // ─── Helper ───────────────────────────────────────────────────────────────────

  private getGroupFormat(groupBy: string, dateField: string) {
    switch (groupBy) {
      case 'day':
        return {
          year: { $year: dateField },
          month: { $month: dateField },
          day: { $dayOfMonth: dateField },
        };
      case 'week':
        return {
          year: { $year: dateField },
          week: { $week: dateField },
        };
      default: // month
        return {
          year: { $year: dateField },
          month: { $month: dateField },
        };
    }
  }
}
