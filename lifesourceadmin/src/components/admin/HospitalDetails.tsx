import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  Ban,
  Shield
} from "lucide-react";

interface HospitalDetailsProps {
  hospitalId: string;
  onBack: () => void;
}

// Mock data for hospital details
const hospitalData = {
  id: "HOSP-001",
  name: "City General Hospital",
  type: "hospital",
  location: "Los Angeles, CA",
  address: "123 Medical Center Drive, Los Angeles, CA 90001",
  email: "info@citygeneralhospital.org",
  phone: "+1 (555) 123-4567",
  status: "Approved",
  capacity: 450,
  registeredAt: "2023-06-15",
  licenseNumber: "CA-MED-2023-4567",
  documentsStatus: "Verified",
  contactPerson: {
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@citygeneralhospital.org",
    phone: "+1 (555) 987-6543",
    role: "Chief Medical Officer"
  },
  stats: {
    totalDonors: 1245,
    totalRequests: 892,
    fulfilledRequests: 756,
    pendingRequests: 136,
    bloodUnitsStored: 2340
  },
  recentRequests: [
    { id: "REQ-001", type: "O- Blood", quantity: "5 units", status: "Pending", date: "2024-01-15" },
    { id: "REQ-002", type: "A+ Platelets", quantity: "8 units", status: "Fulfilled", date: "2024-01-14" },
    { id: "REQ-003", type: "B+ Blood", quantity: "3 units", status: "In Progress", date: "2024-01-13" }
  ],
  documents: [
    { name: "Hospital License", status: "Verified", uploadDate: "2023-06-15" },
    { name: "Operating Certificate", status: "Verified", uploadDate: "2023-06-15" },
    { name: "Insurance Document", status: "Verified", uploadDate: "2023-06-15" },
    { name: "Accreditation Certificate", status: "Pending", uploadDate: "2023-06-20" }
  ]
};

export function HospitalDetails({ hospitalId, onBack }: HospitalDetailsProps) {
  const hospital = hospitalData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
      case "Verified":
      case "Fulfilled":
        return "bg-success text-success-foreground";
      case "Pending":
      case "In Progress":
        return "bg-warning text-warning-foreground";
      case "Rejected":
      case "Suspended":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{hospital.name}</h1>
              <Badge className={getStatusColor(hospital.status)}>
                {hospital.status}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {hospital.address}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-warning">
            <Ban className="w-4 h-4 mr-1" />
            Suspend
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-1" />
            Remove
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{hospital.stats.totalDonors.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Donors</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{hospital.stats.totalRequests.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{hospital.stats.fulfilledRequests.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Fulfilled</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">{hospital.stats.pendingRequests.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{hospital.stats.bloodUnitsStored.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Blood Units</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Institution Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Institution ID</p>
                    <p className="font-medium">{hospital.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{hospital.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">License Number</p>
                    <p className="font-medium">{hospital.licenseNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Capacity</p>
                    <p className="font-medium">{hospital.capacity} beds</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registered Date</p>
                    <p className="font-medium">{hospital.registeredAt}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Document Status</p>
                    <Badge className={getStatusColor(hospital.documentsStatus)}>
                      {hospital.documentsStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Contact Person
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{hospital.contactPerson.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium">{hospital.contactPerson.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{hospital.contactPerson.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{hospital.contactPerson.phone}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Recent Requests</CardTitle>
              <CardDescription>Latest blood and organ requests from this institution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hospital.recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-1">
                      <p className="font-medium">{request.id}</p>
                      <p className="text-sm text-muted-foreground">{request.type} - {request.quantity}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{request.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Verification Documents
              </CardTitle>
              <CardDescription>Uploaded documents for verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hospital.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">Uploaded: {doc.uploadDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(doc.status)}>
                        {doc.status === "Verified" ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {doc.status}
                      </Badge>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="mt-4">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Official contact details for this institution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Institution Contact</h3>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p>{hospital.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p>{hospital.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <p>{hospital.address}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Primary Contact Person</h3>
                  <p className="font-medium">{hospital.contactPerson.name}</p>
                  <p className="text-sm text-muted-foreground">{hospital.contactPerson.role}</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p>{hospital.contactPerson.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p>{hospital.contactPerson.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
