import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const donors = [
  {
    id: "DON-001",
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+1 (555) 123-4567",
    location: "Los Angeles, CA",
    bloodType: "O+",
    totalDonations: 12,
    lastDonation: "2024-01-10",
    status: "Active",
    registeredAt: "2022-03-15",
    avatar: ""
  },
  {
    id: "DON-002",
    name: "Emily Johnson",
    email: "emily.j@email.com",
    phone: "+1 (555) 234-5678",
    location: "Phoenix, AZ",
    bloodType: "A-",
    totalDonations: 8,
    lastDonation: "2024-01-05",
    status: "Active",
    registeredAt: "2022-06-20",
    avatar: ""
  },
  {
    id: "DON-003",
    name: "Michael Brown",
    email: "m.brown@email.com",
    phone: "+1 (555) 345-6789",
    location: "Sacramento, CA",
    bloodType: "B+",
    totalDonations: 5,
    lastDonation: "2023-12-20",
    status: "Inactive",
    registeredAt: "2023-01-10",
    avatar: ""
  },
  {
    id: "DON-004",
    name: "Sarah Williams",
    email: "sarah.w@email.com",
    phone: "+1 (555) 456-7890",
    location: "San Francisco, CA",
    bloodType: "AB+",
    totalDonations: 15,
    lastDonation: "2024-01-12",
    status: "Active",
    registeredAt: "2021-08-05",
    avatar: ""
  }
];

const recipients = [
  {
    id: "REC-001",
    name: "David Lee",
    email: "david.lee@email.com",
    phone: "+1 (555) 567-8901",
    location: "Los Angeles, CA",
    bloodType: "O-",
    totalRequests: 3,
    lastRequest: "2024-01-14",
    status: "Active",
    registeredAt: "2023-05-20",
    avatar: ""
  },
  {
    id: "REC-002",
    name: "Jennifer Martinez",
    email: "jen.m@email.com",
    phone: "+1 (555) 678-9012",
    location: "San Diego, CA",
    bloodType: "A+",
    totalRequests: 2,
    lastRequest: "2024-01-10",
    status: "Active",
    registeredAt: "2023-07-15",
    avatar: ""
  },
  {
    id: "REC-003",
    name: "Robert Garcia",
    email: "r.garcia@email.com",
    phone: "+1 (555) 789-0123",
    location: "Phoenix, AZ",
    bloodType: "B-",
    totalRequests: 1,
    lastRequest: "2023-12-28",
    status: "Inactive",
    registeredAt: "2023-09-10",
    avatar: ""
  }
];

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = donor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donor.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || donor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredRecipients = recipients.filter(recipient => {
    const matchesSearch = recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipient.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || recipient.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    return status === "Active" 
      ? "bg-success text-success-foreground" 
      : "bg-muted text-muted-foreground";
  };

  const getBloodTypeColor = (type: string) => {
    if (type.includes("-")) return "bg-destructive text-destructive-foreground";
    return "bg-primary text-primary-foreground";
  };

  const UserCard = ({ user, type }: { user: typeof donors[0] | typeof recipients[0]; type: 'donor' | 'recipient' }) => (
    <Card className="shadow-soft hover:shadow-medium transition-smooth">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{user.name}</h3>
                <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user.id}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getBloodTypeColor(user.bloodType)}>
                  <Droplet className="w-3 h-3 mr-1" />
                  {user.bloodType}
                </Badge>
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

        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span className="truncate">{user.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>{user.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{user.location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Joined {user.registeredAt}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          {type === 'donor' ? (
            <>
              <div className="text-center">
                <p className="text-lg font-bold">{(user as typeof donors[0]).totalDonations}</p>
                <p className="text-xs text-muted-foreground">Total Donations</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{(user as typeof donors[0]).lastDonation}</p>
                <p className="text-xs text-muted-foreground">Last Donation</p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <p className="text-lg font-bold">{(user as typeof recipients[0]).totalRequests}</p>
                <p className="text-xs text-muted-foreground">Total Requests</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{(user as typeof recipients[0]).lastRequest}</p>
                <p className="text-xs text-muted-foreground">Last Request</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage donors and recipients registered on the platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
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
                <p className="text-2xl font-bold">{donors.filter(d => d.status === 'Active').length}</p>
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
                <p className="text-2xl font-bold">{donors.reduce((acc, d) => acc + d.totalDonations, 0)}</p>
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

      {/* Tabs for Donors and Recipients */}
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
              <UserCard key={donor.id} user={donor} type="donor" />
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
              <UserCard key={recipient.id} user={recipient} type="recipient" />
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
