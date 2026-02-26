import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  MapPin,
  X,
  Droplets,
  Heart,
  User
} from "lucide-react";
import { HospitalDropdown } from "../Dropdown";

interface RedirectModalProps {
  requestId: string;
  onClose: () => void;
  onSubmit: (hospitalId: string, reason: string) => void;
  isLoading: boolean;
}

function RedirectModal({ requestId, onClose, onSubmit, isLoading }: RedirectModalProps) {
  const [hospitalId, setHospitalId] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Redirect Request</CardTitle>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>Redirect request {requestId} to another hospital</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <HospitalDropdown
            value={hospitalId}
            onChange={(name, id) => {
              setSelectedHospital(name);
              setHospitalId(id);
            }}
          />
          <div>
            <label className="text-sm font-medium mb-1 block">Reason</label>
            <Input
              placeholder="Enter reason for redirect..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 pt-2">
            <Button
              className="flex-1"
              onClick={() => onSubmit(hospitalId, reason)}
              disabled={!hospitalId || !reason || isLoading}
            >
              {isLoading ? "Redirecting..." : "Confirm Redirect"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Prominent banner that shows whether this is a donor or recipient request */
function RequestSourceBanner({ requestSource, requestType }: { requestSource: string; requestType: string }) {
  const isDonor = requestSource === "donor";

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold w-fit
        ${isDonor
          ? "bg-blue-100 text-blue-800 border border-blue-200"
          : "bg-rose-100 text-rose-800 border border-rose-200"
        }`}
    >
      {isDonor ? (
        <Droplets className="w-4 h-4 text-blue-600 shrink-0" />
      ) : (
        <Heart className="w-4 h-4 text-rose-600 shrink-0" />
      )}
      <span>{requestType || (isDonor ? "🩸 Donor Request" : "🏥 Recipient Request")}</span>
    </div>
  );
}

export function RequestTracking() {
  const apiURL = import.meta.env.VITE_REACT_APP_BASE_URL;
  const token = localStorage.getItem("adminToken");
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [urgencyFilter, setUrgencyFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [redirectModalId, setRedirectModalId] = useState<string | null>(null);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  const getRequests = async () => {
    const res = await axios.get(`${apiURL}/admin/requests`, { headers: authHeaders });
    return res.data.data.requests;
  };

  const { data: requests = [] } = useQuery({
    queryKey: ["Requests"],
    queryFn: getRequests,
    staleTime: 5 * 60 * 1000,
  });

  const redirectMutation = useMutation({
    mutationFn: async ({ id, hospitalId, reason }: { id: string; hospitalId: string; reason: string }) => {
      const res = await axios.patch(
        `${apiURL}/admin/requests/${id}/redirect`,
        { hospitalId, reason },
        { headers: authHeaders }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["Requests"] });
      setRedirectModalId(null);
    }
  });

  const filteredRequests = requests.filter((request: any) => {
    const requestorName = request.requestorId
      ? `${request.requestorId.firstName} ${request.requestorId.lastName}`
      : "";
    const matchesSearch =
      request._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.bloodType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.patientName && request.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      requestorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || request.status === statusFilter;
    const matchesUrgency = urgencyFilter === "All" || request.urgency === urgencyFilter;
    const matchesSource = sourceFilter === "All" || request.requestSource === sourceFilter;
    return matchesSearch && matchesStatus && matchesUrgency && matchesSource;
  });

  // Summary counts
  const donorCount = requests.filter((r: any) => r.requestSource === "donor").length;
  const recipientCount = requests.filter((r: any) => r.requestSource === "recipient").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "fulfilled": return "bg-success text-success-foreground";
      case "in_progress": return "bg-warning text-warning-foreground";
      case "pending": return "bg-destructive text-destructive-foreground";
      case "redirected": return "bg-accent text-accent-foreground";
      case "cancelled": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical": return "bg-destructive text-destructive-foreground";
      case "high": return "bg-warning text-warning-foreground";
      case "medium": return "bg-accent text-accent-foreground";
      case "low": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "fulfilled": return <CheckCircle className="w-4 h-4" />;
      case "in_progress": return <Clock className="w-4 h-4" />;
      case "pending": return <AlertTriangle className="w-4 h-4" />;
      case "redirected": return <ArrowRight className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatStatus = (status: string) =>
    status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const formatUrgency = (urgency: string) =>
    urgency.charAt(0).toUpperCase() + urgency.slice(1);

  const formatDonationType = (type: string) =>
    type?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "—";

  const formatDateTime = (dateString: string) => {
    if (!dateString) return { date: "—", time: "" };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
  };

  return (
    <div className="space-y-6">
      {/* Redirect Modal */}
      {redirectModalId && (
        <RedirectModal
          requestId={redirectModalId}
          onClose={() => setRedirectModalId(null)}
          isLoading={redirectMutation.isPending}
          onSubmit={(hospitalId, reason) =>
            redirectMutation.mutate({ id: redirectModalId, hospitalId, reason })
          }
        />
      )}

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

      {/* Source Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer border-2 transition-all ${sourceFilter === "donor" ? "border-blue-500 shadow-md" : "border-transparent shadow-soft"}`}
          onClick={() => setSourceFilter(sourceFilter === "donor" ? "All" : "donor")}
        >
          <CardContent className="flex items-center gap-4 py-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{donorCount}</p>
              <p className="text-sm text-muted-foreground">Donor Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer border-2 transition-all ${sourceFilter === "recipient" ? "border-rose-500 shadow-md" : "border-transparent shadow-soft"}`}
          onClick={() => setSourceFilter(sourceFilter === "recipient" ? "All" : "recipient")}
        >
          <CardContent className="flex items-center gap-4 py-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-700">{recipientCount}</p>
              <p className="text-sm text-muted-foreground">Recipient Requests</p>
            </div>
          </CardContent>
        </Card>
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
                placeholder="Search by request ID, hospital, blood type, patient or requestor name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">Source:</span>
                {["All", "donor", "recipient"].map((src) => (
                  <Button
                    key={src}
                    variant={sourceFilter === src ? "default" : "outline"}
                    onClick={() => setSourceFilter(src)}
                    size="sm"
                  >
                    {src === "All" ? "All" : src === "donor" ? "🩸 Donor" : "🏥 Recipient"}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                {["All", "pending", "in_progress", "fulfilled", "redirected", "cancelled"].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    onClick={() => setStatusFilter(status)}
                    size="sm"
                  >
                    {status === "All" ? "All" : formatStatus(status)}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">Urgency:</span>
                {["All", "critical", "high", "medium", "low"].map((urgency) => (
                  <Button
                    key={urgency}
                    variant={urgencyFilter === urgency ? "default" : "outline"}
                    onClick={() => setUrgencyFilter(urgency)}
                    size="sm"
                  >
                    {urgency === "All" ? "All" : formatUrgency(urgency)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request List */}
      <div className="space-y-4">
        {filteredRequests.map((request: any) => {
          const submittedTime = formatDateTime(request.createdAt);
          const requiredTime = formatDateTime(request.requiredBy);
          const requestorName = request.requestorId
            ? `${request.requestorId.firstName} ${request.requestorId.lastName}`
            : "—";
          const requestorEmail = request.requestorId?.email ?? "";
          const requestorBloodType = request.requestorId?.bloodType ?? "";
          const isDonor = request.requestSource === "donor";

          return (
            <Card
              key={request._id}
              className={`shadow-soft hover:shadow-medium transition-smooth border-l-4 ${isDonor ? "border-l-blue-400" : "border-l-rose-400"}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-2">
                    {/* Request source type banner — most prominent indicator */}
                    <RequestSourceBanner
                      requestSource={request.requestSource}
                      requestType={request.requestType}
                    />
                    <CardTitle className="text-base flex items-center flex-wrap gap-2">
                      <span className="font-mono text-sm text-muted-foreground">{request._id}</span>
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{formatStatus(request.status)}</span>
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {request.hospitalName}, {request.city}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge className={getUrgencyColor(request.urgency)}>
                    {formatUrgency(request.urgency)} Priority
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Blood Type & Donation</p>
                    <p className="font-semibold text-lg">{request.bloodType}</p>
                    <p className="text-sm text-muted-foreground">{formatDonationType(request.donationType)}</p>
                  </div>

                  {/* Requestor info — donor or patient's representative */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {isDonor ? "Donor" : "Requestor"}
                    </p>
                    <p className="font-medium text-sm">{requestorName}</p>
                    <p className="text-xs text-muted-foreground">{requestorEmail}</p>
                    {requestorBloodType && (
                      <p className="text-xs text-muted-foreground">Blood: {requestorBloodType}</p>
                    )}
                  </div>

                  {/* Patient info — only meaningful for recipient requests */}
                  {!isDonor && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Patient</p>
                      <p className="font-medium text-sm">{request.patientName || "—"}</p>
                      {request.patientAge !== undefined && request.patientAge !== null && (
                        <p className="text-xs text-muted-foreground">Age: {request.patientAge}</p>
                      )}
                      {request.medicalCondition && (
                        <p className="text-xs text-muted-foreground">{request.medicalCondition}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                    <p className="font-medium text-sm">{submittedTime.date}</p>
                    <p className="text-xs text-muted-foreground">{submittedTime.time}</p>
                  </div>

                  {request.requiredBy && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Required By</p>
                      <p className="font-medium text-sm">{requiredTime.date}</p>
                      <p className="text-xs text-muted-foreground">{requiredTime.time}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Units</p>
                    <p className="text-sm">
                      <span className="font-medium">{request.unitsFulfilled}</span>
                      {request.unitsNeeded !== undefined && (
                        <span className="text-muted-foreground"> / {request.unitsNeeded} fulfilled</span>
                      )}
                    </p>
                  </div>
                </div>

                {request.notes && (
                  <div className="bg-muted/50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{request.notes}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  {(request.status === "pending" || request.status === "in_progress") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRedirectModalId(request._id)}
                    >
                      <ArrowRight className="w-4 h-4 mr-1" />
                      Redirect
                    </Button>
                  )}
                  {request.status === "in_progress" && (
                    <Button size="sm" variant="outline">
                      Update Status
                    </Button>
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