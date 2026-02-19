import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Search, MapPin, Phone, Mail, Eye, Plus } from "lucide-react";
import { AddHospitalForm } from "./AddHospitalForm";
import { HospitalDetails } from "./HospitalDetails";

const hospitals = [
  { id: "HOSP-001", name: "City General Hospital", location: "Los Angeles, CA", email: "info@citygeneralhospital.org", phone: "+1 (555) 123-4567", status: "Approved", type: "hospital", capacity: 450, registeredAt: "2023-06-15", documentsStatus: "Verified" },
  { id: "HOSP-002", name: "St. Mary's Medical Center", location: "Phoenix, AZ", email: "contact@stmarys.org", phone: "+1 (555) 234-5678", status: "Approved", type: "hospital", capacity: 320, registeredAt: "2023-08-22", documentsStatus: "Verified" },
  { id: "BB-001", name: "Central Blood Bank", location: "Sacramento, CA", email: "info@centralbloodbank.org", phone: "+1 (555) 456-7890", status: "Pending", type: "bloodbank", capacity: 280, registeredAt: "2024-01-10", documentsStatus: "Pending Review" },
  { id: "HOSP-003", name: "Metro Emergency Center", location: "Phoenix, AZ", email: "admin@metroemergency.com", phone: "+1 (555) 567-8901", status: "Suspended", type: "hospital", capacity: 180, registeredAt: "2023-04-05", documentsStatus: "Expired" }
];

type ViewMode = "list" | "add" | "details";

export function HospitalManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) || hospital.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || hospital.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved": return "bg-success text-success-foreground";
      case "Pending": return "bg-warning text-warning-foreground";
      case "Suspended": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (viewMode === "add") return <AddHospitalForm onBack={() => setViewMode("list")} />;
  if (viewMode === "details" && selectedHospitalId) return <HospitalDetails hospitalId={selectedHospitalId} onBack={() => setViewMode("list")} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hospital Management</h1>
          <p className="text-muted-foreground">Manage hospital, bloodbanks registrations, verifications, and status</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90" onClick={() => setViewMode("add")}>
          <Plus className="w-4 h-4 mr-2" />
          Add Institution
        </Button>
      </div>

      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search hospitals and blood banks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2">
              {["All", "Approved", "Pending", "Suspended"].map((status) => (
                <Button key={status} variant={statusFilter === status ? "default" : "outline"} onClick={() => setStatusFilter(status)} size="sm">{status}</Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHospitals.map((hospital) => (
          <Card key={hospital.id} className="shadow-soft hover:shadow-medium transition-smooth">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">{hospital.name}<Badge variant="outline" className="capitalize">{hospital.type}</Badge></CardTitle>
                  <CardDescription className="flex items-center mt-1"><MapPin className="w-4 h-4 mr-1" />{hospital.location}</CardDescription>
                </div>
                <Badge className={getStatusColor(hospital.status)}>{hospital.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" />{hospital.email}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{hospital.phone}</div>
              </div>
              <div className="flex justify-end mt-4">
                <Button size="sm" variant="outline" onClick={() => { setSelectedHospitalId(hospital.id); setViewMode("details"); }}><Eye className="w-4 h-4 mr-1" />View Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredHospitals.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No hospitals found</p>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}