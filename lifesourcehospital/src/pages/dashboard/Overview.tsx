import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, Calendar, Users, AlertTriangle, CheckCircle, Clock, Building2, TrendingUp, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function Overview() {
  const apiURL = import.meta.env.VITE_REACT_APP_BASE_URL;
  const token = localStorage.getItem("hospitalToken");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const getDashboardData = async () => {
    const res = await axios.get(`${apiURL}/hospital/dashboard`, { headers: authHeaders });
    return res.data.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["hospitalDashboard"],
    queryFn: getDashboardData,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Activity className="w-8 h-8 animate-pulse" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-destructive">
          <AlertTriangle className="w-8 h-8" />
          <p>Failed to load dashboard. Please try again.</p>
        </div>
      </div>
    );
  }

  const { hospital, inventory, requests, appointments, donations } = data;

  const stats = [
    {
      label: 'Available Blood Units',
      value: inventory?.totalAvailableUnits ?? 0,
      icon: Droplets,
      color: 'text-primary',
      sub: `${inventory?.expiringInSevenDays ?? 0} expiring in 7 days`,
      subColor: inventory?.expiringInSevenDays > 0 ? 'text-destructive' : 'text-muted-foreground',
    },
    {
      label: 'Awaiting Confirmation',
      value: appointments?.awaitingConfirmation ?? 0,
      icon: Calendar,
      color: 'text-secondary',
      sub: `${appointments?.today ?? 0} today · ${appointments?.upcomingThisWeek ?? 0} this week`,
      subColor: 'text-muted-foreground',
    },
    {
      label: 'Urgent Open Requests',
      value: requests?.urgentOpen ?? 0,
      icon: AlertTriangle,
      color: 'text-destructive',
      sub: `${requests?.pending ?? 0} total pending`,
      subColor: 'text-muted-foreground',
    },
    {
      label: 'Donations This Month',
      value: donations?.processedThisMonth ?? 0,
      icon: TrendingUp,
      color: 'text-secondary',
      sub: `${requests?.fulfillmentRate ?? 0}% fulfillment rate`,
      subColor: 'text-muted-foreground',
    },
  ];

  const bloodTypeOrder = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

  // Normalize byBloodType array into a lookup map
  const inventoryByType: Record<string, number> = {};
  (inventory?.byBloodType ?? []).forEach((entry: { bloodType: string; units: number }) => {
    inventoryByType[entry.bloodType] = entry.units;
  });

  const donationsByType: Record<string, number> = {};
  (donations?.byType ?? []).forEach((entry: { bloodType: string; count: number }) => {
    donationsByType[entry.bloodType] = entry.count;
  });

  const recentRequests = requests?.recent ?? [];

  const urgencyVariantMap: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
    critical: "destructive",
    high: "default",
    medium: "secondary",
    low: "outline",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
          <div className="flex items-center gap-2 mt-1">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {hospital?.name}
              {hospital?.city ? ` · ${hospital.city}` : ""}
            </p>
            {/* <Badge variant={hospital?.status === "approved" ? "default" : "secondary"} className="capitalize">
              {hospital?.status}
            </Badge> */}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              <p className={`text-xs mt-1 ${stat.subColor}`}>{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Blood Inventory by Type */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-primary" />
            Blood Inventory by Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inventory?.byBloodType?.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No inventory data available
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {bloodTypeOrder.map((type) => {
                const units = inventoryByType[type] ?? 0;
                return (
                  <div
                    key={type}
                    className={`rounded-lg p-3 text-center border ${units === 0 ? 'border-border bg-muted/40' : 'border-primary/20 bg-primary/5'}`}
                  >
                    <p className="text-lg font-bold text-primary">{type}</p>
                    <p className="text-2xl font-bold text-foreground">{units}</p>
                    <p className="text-xs text-muted-foreground">units</p>
                  </div>
                );
              })}
            </div>
          )}
          {(inventory?.expiredUnits ?? 0) > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4" />
              {inventory.expiredUnits} expired unit{inventory.expiredUnits > 1 ? 's' : ''} need to be removed
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Summary */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              Appointments Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Today's Appointments", value: appointments?.today ?? 0, icon: Clock },
                { label: "Upcoming This Week", value: appointments?.upcomingThisWeek ?? 0, icon: Calendar },
                { label: "Awaiting Confirmation", value: appointments?.awaitingConfirmation ?? 0, icon: AlertTriangle },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-foreground">{label}</p>
                  </div>
                  <span className="text-lg font-bold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Requests Summary */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Requests Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Total Requests", value: requests?.total ?? 0, icon: CheckCircle },
                { label: "Pending", value: requests?.pending ?? 0, icon: Clock },
                { label: "Fulfilled This Month", value: requests?.fulfilledThisMonth ?? 0, icon: TrendingUp },
                { label: "Urgent Open", value: requests?.urgentOpen ?? 0, icon: AlertTriangle },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-foreground">{label}</p>
                  </div>
                  <span className="text-lg font-bold text-foreground">{value}</span>
                </div>
              ))}
              <div className="mt-2 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fulfillment Rate</span>
                  <span className="font-semibold text-foreground">{requests?.fulfillmentRate ?? 0}%</span>
                </div>
                <div className="mt-2 w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(requests?.fulfillmentRate ?? 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Recent Blood Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success" />
              <p>No recent requests</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Patient</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Blood Type</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Units</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Urgency</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((req: any) => (
                    <tr key={req._id ?? req.id} className="border-b border-border last:border-0">
                      <td className="py-2 px-3 text-foreground">{req.recipientName ?? req.patientName ?? "—"}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-primary border-primary">{req.bloodType}</Badge>
                      </td>
                      <td className="py-2 px-3 text-foreground">{req.unitsNeeded ?? req.units ?? "—"}</td>
                      <td className="py-2 px-3">
                        <Badge variant={urgencyVariantMap[req.urgency] ?? "default"} className="capitalize">
                          {req.urgency}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1 text-sm capitalize">
                          {req.status === 'fulfilled' ? (
                            <CheckCircle className="w-3 h-3 text-success" />
                          ) : req.status === 'in_progress' ? (
                            <Clock className="w-3 h-3 text-warning" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-destructive" />
                          )}
                          {req.status?.replace("_", " ")}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}