import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  MapPin,
  Calendar,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";

// Mock data for charts
const dailyRequests = [
  { name: "Mon", requests: 45, resolved: 38 },
  { name: "Tue", requests: 52, resolved: 45 },
  { name: "Wed", requests: 48, resolved: 42 },
  { name: "Thu", requests: 61, resolved: 55 },
  { name: "Fri", requests: 55, resolved: 48 },
  { name: "Sat", requests: 38, resolved: 35 },
  { name: "Sun", requests: 32, resolved: 28 },
];

const weeklyRequests = [
  { name: "Week 1", requests: 285, resolved: 248 },
  { name: "Week 2", requests: 312, resolved: 278 },
  { name: "Week 3", requests: 298, resolved: 265 },
  { name: "Week 4", requests: 345, resolved: 312 },
];

const monthlyRequests = [
  { name: "Jan", requests: 1245, resolved: 1089 },
  { name: "Feb", requests: 1180, resolved: 1045 },
  { name: "Mar", requests: 1320, resolved: 1198 },
  { name: "Apr", requests: 1410, resolved: 1285 },
  { name: "May", requests: 1380, resolved: 1245 },
  { name: "Jun", requests: 1520, resolved: 1389 },
  { name: "Jul", requests: 1650, resolved: 1512 },
  { name: "Aug", requests: 1580, resolved: 1445 },
  { name: "Sep", requests: 1490, resolved: 1365 },
  { name: "Oct", requests: 1620, resolved: 1498 },
  { name: "Nov", requests: 1545, resolved: 1412 },
  { name: "Dec", requests: 1380, resolved: 1265 },
];

const locationData = [
  { name: "Los Angeles, CA", requests: 3245, percentage: 22 },
  { name: "Phoenix, AZ", requests: 2890, percentage: 19 },
  { name: "San Francisco, CA", requests: 2456, percentage: 16 },
  { name: "San Diego, CA", requests: 2120, percentage: 14 },
  { name: "Sacramento, CA", requests: 1845, percentage: 12 },
  { name: "Las Vegas, NV", requests: 1520, percentage: 10 },
  { name: "Other", requests: 1124, percentage: 7 },
];

const requestStatusData = [
  { name: "Fulfilled", value: 68, color: "hsl(var(--success))" },
  { name: "In Progress", value: 18, color: "hsl(var(--warning))" },
  { name: "Pending", value: 10, color: "hsl(var(--destructive))" },
  { name: "Redirected", value: 4, color: "hsl(var(--accent))" },
];

const bloodTypeRequests = [
  { type: "O+", requests: 4520, fulfilled: 4125 },
  { type: "O-", requests: 2890, fulfilled: 2456 },
  { type: "A+", requests: 3245, fulfilled: 2978 },
  { type: "A-", requests: 1560, fulfilled: 1389 },
  { type: "B+", requests: 2120, fulfilled: 1945 },
  { type: "B-", requests: 980, fulfilled: 856 },
  { type: "AB+", requests: 756, fulfilled: 689 },
  { type: "AB-", requests: 320, fulfilled: 285 },
];

export function ReportsModule() {
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">("daily");

  const getChartData = () => {
    switch (timeRange) {
      case "daily":
        return dailyRequests;
      case "weekly":
        return weeklyRequests;
      case "monthly":
        return monthlyRequests;
      default:
        return dailyRequests;
    }
  };

  const totalRequests = getChartData().reduce((acc, curr) => acc + curr.requests, 0);
  const totalResolved = getChartData().reduce((acc, curr) => acc + curr.resolved, 0);
  const resolutionRate = ((totalResolved / totalRequests) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground">Comprehensive insights on requests, resolutions, and trends</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{totalRequests.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Requests</p>
              </div>
              <div className="flex items-center text-success text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12%
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-success">{totalResolved.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
              <div className="flex items-center text-success text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                +8%
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{resolutionRate}%</p>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-warning">{(totalRequests - totalResolved).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Request Trends
              </CardTitle>
              <CardDescription>
                Track incoming requests and resolution rates over time
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={timeRange === "daily" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("daily")}
              >
                Daily
              </Button>
              <Button
                variant={timeRange === "weekly" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("weekly")}
              >
                Weekly
              </Button>
              <Button
                variant={timeRange === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("monthly")}
              >
                Monthly
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getChartData()}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorRequests)"
                  name="Requests"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stroke="hsl(var(--success))"
                  fillOpacity={1}
                  fill="url(#colorResolved)"
                  name="Resolved"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Stats */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Requests by Location
            </CardTitle>
            <CardDescription>
              Geographic distribution of blood requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locationData.map((location, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{location.name}</span>
                    <span className="text-muted-foreground">{location.requests.toLocaleString()} requests</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                      style={{ width: `${location.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Request Status Distribution */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Request Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of request statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={requestStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                  >
                    {requestStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {requestStatusData.map((status, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-sm">{status.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blood Type Analysis */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Requests by Blood Type</CardTitle>
          <CardDescription>
            Demand analysis across different blood types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bloodTypeRequests} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="type" type="category" className="text-xs" width={50} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Legend />
                <Bar dataKey="requests" fill="hsl(var(--primary))" name="Total Requests" radius={[0, 4, 4, 0]} />
                <Bar dataKey="fulfilled" fill="hsl(var(--success))" name="Fulfilled" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Resolution Summary</CardTitle>
          <CardDescription>
            Detailed breakdown of request handling performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Blood Type</th>
                  <th className="text-right py-3 px-4 font-medium">Total Requests</th>
                  <th className="text-right py-3 px-4 font-medium">Fulfilled</th>
                  <th className="text-right py-3 px-4 font-medium">Resolution Rate</th>
                  <th className="text-right py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bloodTypeRequests.map((item, index) => {
                  const rate = ((item.fulfilled / item.requests) * 100).toFixed(1);
                  const rateNum = parseFloat(rate);
                  return (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-3 px-4 font-medium">{item.type}</td>
                      <td className="text-right py-3 px-4">{item.requests.toLocaleString()}</td>
                      <td className="text-right py-3 px-4 text-success">{item.fulfilled.toLocaleString()}</td>
                      <td className="text-right py-3 px-4">{rate}%</td>
                      <td className="text-right py-3 px-4">
                        <Badge className={
                          rateNum >= 90 ? "bg-success text-success-foreground" :
                          rateNum >= 80 ? "bg-warning text-warning-foreground" :
                          "bg-destructive text-destructive-foreground"
                        }>
                          {rateNum >= 90 ? "Excellent" : rateNum >= 80 ? "Good" : "Needs Attention"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
