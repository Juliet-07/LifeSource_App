import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Search, Droplets, Heart } from 'lucide-react';
import { mockDonors, mockRecipients, Donor, Recipient } from '@/lib/mockData';

export default function DonorsRecipients() {
  const [donorSearch, setDonorSearch] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');

  const filteredDonors = mockDonors.filter(donor =>
    donor.name.toLowerCase().includes(donorSearch.toLowerCase()) ||
    donor.email.toLowerCase().includes(donorSearch.toLowerCase()) ||
    donor.bloodType.includes(donorSearch.toUpperCase())
  );

  const filteredRecipients = mockRecipients.filter(recipient =>
    recipient.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
    recipient.email.toLowerCase().includes(recipientSearch.toLowerCase()) ||
    recipient.bloodType.includes(recipientSearch.toUpperCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case 'inactive': return <Badge variant="outline">Inactive</Badge>;
      case 'deferred': return <Badge className="bg-warning text-warning-foreground">Deferred</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Donors & Recipients</h1>
        <p className="text-muted-foreground">View and manage registered donors and recipients serviced through LifeSource</p>
      </div>

      <Tabs defaultValue="donors" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="donors" className="flex items-center gap-2">
            <Droplets className="w-4 h-4" />
            Donors ({mockDonors.length})
          </TabsTrigger>
          <TabsTrigger value="recipients" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Recipients ({mockRecipients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="donors" className="space-y-4 mt-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or blood type..."
              value={donorSearch}
              onChange={(e) => setDonorSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Donors Table */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-primary" />
                Registered Donors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Contact</th>
                      <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Blood Type</th>
                      <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Total Donations</th>
                      <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Last Donation</th>
                      <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Eligible Since</th>
                      <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonors.map((donor) => (
                      <tr key={donor.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-3">
                          <p className="font-medium text-foreground">{donor.name}</p>
                          <p className="text-xs text-muted-foreground">{donor.address}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-sm text-foreground">{donor.phone}</p>
                          <p className="text-xs text-muted-foreground">{donor.email}</p>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="outline" className="text-primary border-primary font-bold">{donor.bloodType}</Badge>
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-foreground">{donor.totalDonations}</td>
                        <td className="py-3 px-3 text-foreground">{donor.lastDonationDate}</td>
                        <td className="py-3 px-3 text-foreground">{donor.eligibleToDonateSince}</td>
                        <td className="py-3 px-3">{getStatusBadge(donor.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredDonors.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No donors found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4 mt-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or blood type..."
              value={recipientSearch}
              onChange={(e) => setRecipientSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Recipients Table */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Serviced Recipients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Contact</th>
                      <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Blood Type</th>
                      <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Total Transfusions</th>
                      <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Last Transfusion</th>
                      <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Condition</th>
                      <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecipients.map((recipient) => (
                      <tr key={recipient.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-3">
                          <p className="font-medium text-foreground">{recipient.name}</p>
                          <p className="text-xs text-muted-foreground">{recipient.address}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-sm text-foreground">{recipient.phone}</p>
                          <p className="text-xs text-muted-foreground">{recipient.email}</p>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="outline" className="text-primary border-primary font-bold">{recipient.bloodType}</Badge>
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-foreground">{recipient.totalTransfusions}</td>
                        <td className="py-3 px-3 text-foreground">{recipient.lastTransfusionDate}</td>
                        <td className="py-3 px-3 text-foreground">{recipient.medicalCondition}</td>
                        <td className="py-3 px-3">{getStatusBadge(recipient.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredRecipients.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No recipients found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
