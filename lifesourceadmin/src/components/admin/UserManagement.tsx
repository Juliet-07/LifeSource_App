import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Search,
  Filter,
  Heart,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Droplet,
  Eye,
  Ban,
  MoreHorizontal,
  ShieldCheck
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Types based on actual API response ---
interface DonorProfile {
  _id: string;
  userId: string;
  bloodType: string;
  age: number;
  weight: number;
  totalDonations: number;
  points: number;
  isAvailable: boolean;
  isEligible: boolean;
  preferredDonationType: string;
  notificationsEnabled: boolean;
  hasChronicIllness: boolean;
  onMedication: boolean;
  consentGiven: boolean;
  consentForAnonymousDonation: boolean;
  badges: string[];
  preferredHospitals: string[];
  createdAt: string;
  updatedAt: string;
}

interface Donor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  bloodType: string;
  city: string;
  state: string;
  country: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  donorProfile: DonorProfile;
  location: { type: string; coordinates: number[] };
}

interface Recipient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  bloodType: string;
  city: string;
  state: string;
  country: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  donorProfile: DonorProfile;
  location: { type: string; coordinates: number[] };
}

export function UserManagement() {
  const apiURL = import.meta.env.VITE_REACT_APP_BASE_URL;
  const token = localStorage.getItem("adminToken");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const getDonors = async (): Promise<Donor[]> => {
    const res = await axios.get(`${apiURL}/admin/users/donors`, { headers: authHeaders });
    console.log(res.data.data.users)
    return res.data.data.users;
  };

  const getRecipients = async (): Promise<Recipient[]> => {
    const res = await axios.get(`${apiURL}/admin/users/recipients`, { headers: authHeaders });
    console.log(res.data.data.recipients)
    return res.data.data.recipients;
  };

  const { data: donors = [] } = useQuery({
    queryKey: ["users-donors"],
    queryFn: getDonors,
    staleTime: 5 * 60 * 1000,
  });

  const { data: recipients = [] } = useQuery({
    queryKey: ["users-recipients"],
    queryFn: getRecipients,
    staleTime: 5 * 60 * 1000,
  });

  // --- Helpers ---
  const donorStatus = (donor: Donor) => (donor.isActive ? "Active" : "Inactive");
  const recipientStatus = (recipient: Recipient) => (recipient.isActive ? "Active" : "Inactive");

  const filteredDonors = donors.filter((donor) => {
    const fullName = `${donor.firstName} ${donor.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      donor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donor._id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || donorStatus(donor) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredRecipients = recipients.filter((recipient) => {
    const fullName = `${recipient.firstName} ${recipient.lastName}`.toLowerCase()
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      recipient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipient._id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || recipientStatus(recipient) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (active: boolean) =>
    active
      ? "bg-success text-success-foreground"
      : "bg-muted text-muted-foreground";

  const getBloodTypeColor = (type: string) =>
    type.includes("-")
      ? "bg-destructive text-destructive-foreground"
      : "bg-primary text-primary-foreground";

  const formatDate = (dateStr: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

  // --- Donor Card ---
  const DonorCard = ({ donor }: { donor: Donor }) => {
    const initials = `${donor.firstName?.[0] ?? ""}${donor.lastName?.[0] ?? ""}`;
    const profile = donor.donorProfile;
    const locationStr = [donor.city, donor.state, donor.country].filter(Boolean).join(", ");

    return (
      <Card className="shadow-soft hover:shadow-medium transition-smooth">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{donor.firstName} {donor.lastName}</h3>
                  <Badge className={getStatusColor(donor.isActive)}>
                    {donorStatus(donor)}
                  </Badge>
                  {donor.isEmailVerified && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono">{donor._id}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className={getBloodTypeColor(donor.bloodType)}>
                    <Droplet className="w-3 h-3 mr-1" />
                    {donor.bloodType}
                  </Badge>
                  {profile?.isEligible && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-400">
                      Eligible
                    </Badge>
                  )}
                  {profile?.isAvailable && (
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-400">
                      Available
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Ban className="w-4 h-4 mr-2" />
                  Suspend User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Contact & Location */}
          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4 shrink-0" />
              <span className="truncate">{donor.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4 shrink-0" />
              <span>{donor.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{locationStr || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Joined {formatDate(donor.createdAt)}</span>
            </div>
          </div>

          {/* Donor Stats */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t gap-2 flex-wrap">
            <div className="text-center">
              <p className="text-lg font-bold">{profile?.totalDonations ?? 0}</p>
              <p className="text-xs text-muted-foreground">Donations</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{profile?.points ?? 0}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{profile?.age ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Age</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{profile?.weight ? `${profile.weight} kg` : "—"}</p>
              <p className="text-xs text-muted-foreground">Weight</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium capitalize">{profile?.preferredDonationType?.replace("_", " ") ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Pref. Type</p>
            </div>
          </div>

          {/* Last Login */}
          <p className="text-xs text-muted-foreground mt-3">
            Last login: {formatDate(donor.lastLoginAt)}
          </p>
        </CardContent>
      </Card>
    );
  };

  // --- Recipient Card ---
  const RecipientCard = ({ recipient }: { recipient: Recipient }) => {
    const initials = `${recipient.firstName?.[0] ?? ""}${recipient.lastName?.[0] ?? ""}`;
    const profile = recipient.donorProfile;
    const locationStr = [recipient.city, recipient.state, recipient.country].filter(Boolean).join(", ");

    return (
      <Card className="shadow-soft hover:shadow-medium transition-smooth">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{recipient.firstName} {recipient.lastName}</h3>
                  <Badge className={getStatusColor(recipient.isActive)}>
                    {recipientStatus(recipient)}
                  </Badge>
                  {recipient.isEmailVerified && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono">{recipient._id}</p>
                <Badge className={getBloodTypeColor(recipient.bloodType)}>
                  <Droplet className="w-3 h-3 mr-1" />
                  {recipient.bloodType}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="w-4 h-4 mr-2" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Mail className="w-4 h-4 mr-2" /> Send Email
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Ban className="w-4 h-4 mr-2" /> Suspend User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4 shrink-0" />
              <span className="truncate">{recipient.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4 shrink-0" />
              <span>{recipient.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{recipient.city}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Joined {formatDate(recipient.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-center">
              {/* <p className="text-lg font-bold">{recipient.totalRequests}</p> */}
              <p className="text-xs text-muted-foreground">Total Requests</p>
            </div>
            <div className="text-center">
              {/* <p className="text-sm font-medium">{formatDate(recipient.lastRequest)}</p> */}
              <p className="text-xs text-muted-foreground">Last Request</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // --- Aggregate stats ---
  const activeDonors = donors.filter((d) => d.isActive).length;
  const totalDonationsCount = donors.reduce(
    (acc, d) => acc + (d.donorProfile?.totalDonations ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage donors and recipients registered on the platform
          </p>
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{donors.length.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Donors</p>
              </div>
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{recipients.length.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Recipients</p>
              </div>
              <div className="w-10 h-10 bg-gradient-success rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{activeDonors}</p>
                <p className="text-sm text-muted-foreground">Active Donors</p>
              </div>
              <div className="w-10 h-10 bg-gradient-success rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{totalDonationsCount}</p>
                <p className="text-sm text-muted-foreground">Total Donations</p>
              </div>
              <div className="w-10 h-10 bg-gradient-danger rounded-lg flex items-center justify-center">
                <Droplet className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {["All", "Active", "Inactive"].map((status) => (
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
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="donors" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="donors" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Donors ({filteredDonors.length})
          </TabsTrigger>
          <TabsTrigger value="recipients" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Recipients ({filteredRecipients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="donors" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDonors.map((donor) => (
              <DonorCard key={donor._id} donor={donor} />
            ))}
          </div>
          {filteredDonors.length === 0 && (
            <Card className="shadow-soft">
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No donors found</p>
                <p className="text-muted-foreground">Try adjusting your search criteria</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recipients" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecipients.map((recipient) => (
              <RecipientCard key={recipient._id} recipient={recipient} />
            ))}
          </div>
          {filteredRecipients.length === 0 && (
            <Card className="shadow-soft">
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No recipients found</p>
                <p className="text-muted-foreground">Try adjusting your search criteria</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}