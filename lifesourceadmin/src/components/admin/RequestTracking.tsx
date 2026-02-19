import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Calendar
} from "lucide-react";

const requests = [
  {
    id: "REQ-2024-001",
    hospital: "City General Hospital",
    location: "Los Angeles, CA",
    type: "O- Blood",
    quantity: "5 units",
    urgency: "Critical",
    status: "Pending",
    submittedAt: "2024-01-15T10:30:00Z",
    requiredBy: "2024-01-15T14:00:00Z",
    recipient: "Emergency Surgery - Patient #4021",
    notes: "Emergency surgery patient requires immediate transfusion"
  },
  {
    id: "REQ-2024-002",
    hospital: "St. Mary's Medical Center",
    location: "Phoenix, AZ",
    type: "A+ Platelets",
    quantity: "8 units",
    urgency: "High",
    status: "In Progress",
    submittedAt: "2024-01-15T09:15:00Z",
    requiredBy: "2024-01-16T08:00:00Z",
    recipient: "Cancer Treatment - Patient #2847",
    notes: "Chemotherapy patient with low platelet count"
  },
  {
    id: "REQ-2024-003",
    hospital: "Regional Health Network",
    location: "Sacramento, CA",
    type: "B+ Blood",
    quantity: "3 units",
    urgency: "Medium",
    status: "Fulfilled",
    submittedAt: "2024-01-14T16:45:00Z",
    requiredBy: "2024-01-15T12:00:00Z",
    recipient: "Scheduled Surgery - Patient #1593",
    notes: "Routine cardiac surgery preparation"
  },
  {
    id: "REQ-2024-004",
    hospital: "Metro Emergency Center",
    location: "Phoenix, AZ",
    type: "AB+ Plasma",
    quantity: "10 units",
    urgency: "Critical",
    status: "Redirected",
    submittedAt: "2024-01-15T11:20:00Z",
    requiredBy: "2024-01-15T15:30:00Z",
    recipient: "Trauma Center - Multiple Patients",
    notes: "Multi-vehicle accident, multiple casualties"
  }
];

export function RequestTracking() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [urgencyFilter, setUrgencyFilter] = useState("All");

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || request.status === statusFilter;
    const matchesUrgency = urgencyFilter === "All" || request.urgency === urgencyFilter;
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Fulfilled": return "bg-success text-success-foreground";
      case "In Progress": return "bg-warning text-warning-foreground";
      case "Pending": return "bg-destructive text-destructive-foreground";
      case "Redirected": return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "Critical": return "bg-destructive text-destructive-foreground";
      case "High": return "bg-warning text-warning-foreground";
      case "Medium": return "bg-accent text-accent-foreground";
      case "Low": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Fulfilled": return <CheckCircle className="w-4 h-4" />;
      case "In Progress": return <Clock className="w-4 h-4" />;
      case "Pending": return <AlertTriangle className="w-4 h-4" />;
      case "Redirected": return <ArrowRight className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Request Tracking</h1>
          <p className="text-muted-foreground">Monitor and manage all blood and organ requests system-wide</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <FileText className="w-4 h-4 mr-2" />
          Export Requests
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by request ID, hospital, or blood type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="space-x-2">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                {["All", "Pending", "In Progress", "Fulfilled", "Redirected"].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    onClick={() => setStatusFilter(status)}
                    size="sm"
                  >
                    {status}
                  </Button>
                ))}
              </div>
              <div className="space-x-2">
                <span className="text-sm font-medium text-muted-foreground">Urgency:</span>
                {["All", "Critical", "High", "Medium", "Low"].map((urgency) => (
                  <Button
                    key={urgency}
                    variant={urgencyFilter === urgency ? "default" : "outline"}
                    onClick={() => setUrgencyFilter(urgency)}
                    size="sm"
                  >
                    {urgency}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => {
          const submittedTime = formatDateTime(request.submittedAt);
          const requiredTime = formatDateTime(request.requiredBy);

          return (
            <Card key={request.id} className="shadow-soft hover:shadow-medium transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg flex items-center">
                      {request.id}
                      <Badge className={`ml-3 ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status}</span>
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {request.hospital}, {request.location}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge className={getUrgencyColor(request.urgency)}>
                    {request.urgency} Priority
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Blood Type & Quantity</p>
                    <p className="font-medium">{request.type}</p>
                    <p className="text-sm text-muted-foreground">{request.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Recipient</p>
                    <p className="font-medium text-sm">{request.recipient}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                    <p className="font-medium text-sm">{submittedTime.date}</p>
                    <p className="text-xs text-muted-foreground">{submittedTime.time}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Required By</p>
                    <p className="font-medium text-sm">{requiredTime.date}</p>
                    <p className="text-xs text-muted-foreground">{requiredTime.time}</p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-muted-foreground mb-1">Medical Notes</p>
                  <p className="text-sm">{request.notes}</p>
                </div>

                <div className="flex space-x-2">
                  {request.status === "Pending" && (
                    <>
                      <Button size="sm" className="bg-success hover:bg-success/90">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Match Donor
                      </Button>
                      <Button size="sm" variant="outline">
                        <ArrowRight className="w-4 h-4 mr-1" />
                        Redirect
                      </Button>
                    </>
                  )}
                  {request.status === "In Progress" && (
                    <>
                      <Button size="sm" className="bg-success hover:bg-success/90">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Fulfilled
                      </Button>
                      <Button size="sm" variant="outline">
                        Update Status
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRequests.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No requests found</p>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}