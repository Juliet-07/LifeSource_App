import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Heart,
  Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

const recentRequests1 = [
  {
    id: "REQ-2024-001",
    hospital: "City General Hospital",
    type: "O- Blood",
    urgency: "Critical",
    status: "Pending",
    time: "2 min ago"
  },
  {
    id: "REQ-2024-002",
    hospital: "St. Mary's Medical Center",
    type: "A+ Platelets",
    urgency: "High",
    status: "In Progress",
    time: "15 min ago"
  },
  {
    id: "REQ-2024-003",
    hospital: "Regional Health Network",
    type: "B+ Blood",
    urgency: "Medium",
    status: "Fulfilled",
    time: "1 hour ago"
  }
];

const hospitalsPendingApproval = [
  {
    name: "Valley Medical Institute",
    location: "Sacramento, CA",
    submitted: "2 days ago",
    documents: "Complete"
  },
  {
    name: "Metro Emergency Center",
    location: "Phoenix, AZ",
    submitted: "5 days ago",
    documents: "Incomplete"
  }
];

export function Dashboard() {
  const apiURL = import.meta.env.VITE_REACT_APP_BASE_URL;
  const token = localStorage.getItem("adminToken");
  const queryClient = useQueryClient()

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  }

  // ─── Queries ───────────────────────────────────────────────────────────────

  const getDashboardData = async () => {
    const res = await axios.get(`${apiURL}/admin/dashboard`, { headers: authHeaders });
    return res.data.data.stats;
  };

  const getRecentRequests = async () => {
    const res = await axios.get(`${apiURL}/admin/requests`, { headers: authHeaders });
    return res.data.data.requests;
  };

  const getPendingHospitals = async () => {
    const res = await axios.get(`${apiURL}/admin/hospitals/pending`, { headers: authHeaders });
    return res.data.data.hospitals;
  };

  const { data: stats = {} } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: getDashboardData,
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentRequests = [] } = useQuery({
    queryKey: ["RecentRequests"],
    queryFn: getRecentRequests,
    staleTime: 5 * 60 * 1000,
  });

  const { data: pendingHospitals = [] } = useQuery({
    queryKey: ["PendingHospitals"],
    queryFn: getPendingHospitals,
    staleTime: 5 * 60 * 1000,
  });

  // ─── Approve mutation ──────────────────────────────────────────────────────

  const approveMutation = useMutation({
    mutationFn: (hospitalId: string) =>
      axios.patch(
        `${apiURL}/admin/hospitals/${hospitalId}/approve`,
        {},
        { headers: authHeaders },
      ),
    onSuccess: (_, hospitalId) => {
      toast.success("Hospital approved successfully. Credentials have been emailed to the contact.");
      // Remove the approved hospital from the pending list immediately
      queryClient.setQueryData(["PendingHospitals"], (prev: any[]) =>
        (prev ?? []).filter((h) => h._id !== hospitalId),
      );
      // Refresh stats and the full hospitals list in the background
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ?? "Failed to approve hospital. Please try again.";
      toast.error(message);
    },
  });

  const handleApprove = (hospitalId: string, institutionName: string) => {
    if (!window.confirm(`Approve "${institutionName}"? An admin account will be created and credentials will be emailed to the contact.`)) {
      return;
    }
    approveMutation.mutate(hospitalId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">System-wide overview and key metrics</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <TrendingUp className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Stats Grid */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-soft hover:shadow-medium transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={`font-medium ${stat.trend === 'up' ? 'text-success' : 'text-destructive'
                    }`}>
                    {stat.change}
                  </span>
                  {" "}from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div> */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-soft hover:shadow-medium transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Hospitals
            </CardTitle>
            <div className={`w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center`}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.hospitals?.total}</div>
            {/* <p className="text-xs text-muted-foreground">
              <span className={`font-medium ${stat.trend === 'up' ? 'text-success' : 'text-destructive'
                }`}>
                {stat.change}
              </span>
              {" "}from last month
            </p> */}
          </CardContent>
        </Card>
        <Card className="shadow-soft hover:shadow-medium transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Donors
            </CardTitle>
            <div className={`w-10 h-10 bg-gradient-success rounded-lg flex items-center justify-center`}>
              <Users className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.donors?.active}</div>
            {/* <p className="text-xs text-muted-foreground">
              <span className={`font-medium ${stat.trend === 'up' ? 'text-success' : 'text-destructive'
                }`}>
                {stat.change}
              </span>
              {" "}from last month
            </p> */}
          </CardContent>
        </Card>
        <Card className="shadow-soft hover:shadow-medium transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Requests
            </CardTitle>
            <div className={`w-10 h-10 bg-gradient-warning rounded-lg flex items-center justify-center`}>
              <FileText className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.requests?.pending}</div>
            {/* <p className="text-xs text-muted-foreground">
              <span className={`font-medium ${stat.trend === 'up' ? 'text-success' : 'text-destructive'
                }`}>
                {stat.change}
              </span>
              {" "}from last month
            </p> */}
          </CardContent>
        </Card>
        <Card className="shadow-soft hover:shadow-medium transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Donations
            </CardTitle>
            <div className={`w-10 h-10 bg-gradient-danger rounded-lg flex items-center justify-center`}>
              <Heart className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.donations?.total}</div>
            {/* <p className="text-xs text-muted-foreground">
              <span className={`font-medium ${stat.trend === 'up' ? 'text-success' : 'text-destructive'
                }`}>
                {stat.change}
              </span>
              {" "}from last month
            </p> */}
          </CardContent>
        </Card>

      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Recent Requests
            </CardTitle>
            <CardDescription>
              Latest blood and organ requests across all hospitals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRequests.length === 0 ? (<div className="flex items-center justify-center">No Recent Requests</div>) : (
                recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-1">
                      <p className="font-medium">{request.id}</p>
                      <p className="text-sm text-muted-foreground">{request.hospital}</p>
                      <p className="text-xs font-medium">{request.type}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={
                        request.urgency === 'Critical' ? 'destructive' :
                          request.urgency === 'High' ? 'secondary' : 'default'
                      }>
                        {request.urgency}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground">
                        {request.status === 'Fulfilled' ? (
                          <CheckCircle className="w-3 h-3 mr-1 text-success" />
                        ) : request.status === 'In Progress' ? (
                          <Clock className="w-3 h-3 mr-1 text-warning" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 mr-1 text-destructive" />
                        )}
                        {request.time}
                      </div>
                    </div>
                  </div>
                )))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Hospital Approvals */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Pending Approvals
            </CardTitle>
            <CardDescription>
              Hospitals awaiting verification and approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingHospitals.length === 0 ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
                  No pending approvals
                </div>
              ) : (
                pendingHospitals.map((hospital: any, index) => {
                  const isApprovingThis = approveMutation.isPending && approveMutation.variables === hospital._id;
                  return (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-1">
                        <p className="font-medium">{hospital?.institutionName}</p>
                        <p className="text-sm text-muted-foreground">{hospital?.city + ", " + hospital?.country}</p>
                        {/* <p className="text-xs">Submitted {hospital?.submitted}</p> */}
                      </div>
                      <div className="space-y-2">
                        <Badge variant={hospital?.institutionType === 'hospital' ? 'default' : 'secondary'}>
                          {hospital?.institutionType}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            disabled={isApprovingThis}
                            onClick={() => handleApprove(hospital._id, hospital.institutionName)}
                          >
                            {isApprovingThis ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Approving…
                              </>
                            ) : (
                              "Approve"
                            )}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                }))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}