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
  Heart
} from "lucide-react";

const stats = [
  {
    title: "Total Hospitals",
    value: "247",
    change: "+12%",
    trend: "up",
    icon: Building2,
    color: "bg-gradient-primary"
  },
  {
    title: "Active Donors",
    value: "15,892",
    change: "+8%",
    trend: "up", 
    icon: Users,
    color: "bg-gradient-success"
  },
  {
    title: "Pending Requests",
    value: "1,247",
    change: "-15%",
    trend: "down",
    icon: FileText,
    color: "bg-gradient-warning"
  },
  {
    title: "Donations Today",
    value: "892",
    change: "+23%",
    trend: "up",
    icon: Heart,
    color: "bg-gradient-danger"
  }
];

const recentRequests = [
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <span className={`font-medium ${
                    stat.trend === 'up' ? 'text-success' : 'text-destructive'
                  }`}>
                    {stat.change}
                  </span>
                  {" "}from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
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
              {recentRequests.map((request) => (
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
              ))}
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
              {hospitalsPendingApproval.map((hospital, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-1">
                    <p className="font-medium">{hospital.name}</p>
                    <p className="text-sm text-muted-foreground">{hospital.location}</p>
                    <p className="text-xs">Submitted {hospital.submitted}</p>
                  </div>
                  <div className="space-y-2">
                    <Badge variant={hospital.documents === 'Complete' ? 'default' : 'secondary'}>
                      {hospital.documents}
                    </Badge>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="default" className="h-7 text-xs">
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}