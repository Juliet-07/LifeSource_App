import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Heart, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { mockRecipientRequests, mockBloodInventory, RecipientRequest, bloodTypes, bloodCompatibility } from '@/lib/mockData';

export default function Requests() {
  const [requests, setRequests] = useState<RecipientRequest[]>(mockRecipientRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [matchDialog, setMatchDialog] = useState<{ open: boolean; request: RecipientRequest | null }>({ open: false, request: null });

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || req.bloodType === typeFilter;
    const matchesUrgency = urgencyFilter === 'all' || req.urgency === urgencyFilter;
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesType && matchesUrgency && matchesStatus;
  }).sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });

  const getAvailableMatchingUnits = (bloodType: string) => {
    // Find compatible blood types that can donate to this blood type
    const compatibleTypes = Object.entries(bloodCompatibility)
      .filter(([_, recipients]) => recipients.includes(bloodType))
      .map(([donor]) => donor);

    return mockBloodInventory.filter(unit => 
      unit.status === 'available' && compatibleTypes.includes(unit.bloodType)
    );
  };

  const updateRequestStatus = (id: string, status: RecipientRequest['status']) => {
    setRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status } : req
    ));
    toast.success(`Request marked as ${status}`);
  };

  const handleMatchRequest = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    const matchingUnits = getAvailableMatchingUnits(request.bloodType);
    if (matchingUnits.length === 0) {
      toast.error('No matching blood units available');
      return;
    }

    const availableQuantity = matchingUnits.reduce((acc, u) => acc + u.quantity, 0);
    const canFulfill = availableQuantity >= request.unitsNeeded;

    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            status: canFulfill ? 'fulfilled' : 'partially_fulfilled',
            matchedUnits: matchingUnits.slice(0, request.unitsNeeded).map(u => u.id)
          } 
        : req
    ));

    toast.success(canFulfill 
      ? 'Request fulfilled with available inventory' 
      : 'Request partially fulfilled - some units still needed'
    );
    setMatchDialog({ open: false, request: null });
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge className="bg-warning text-warning-foreground">High</Badge>;
      case 'medium': return <Badge className="bg-secondary text-secondary-foreground">Medium</Badge>;
      default: return <Badge variant="outline">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fulfilled': return <Badge className="bg-success text-success-foreground">Fulfilled</Badge>;
      case 'partially_fulfilled': return <Badge className="bg-warning text-warning-foreground">Partial</Badge>;
      case 'unavailable': return <Badge variant="destructive">Unavailable</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    critical: requests.filter(r => r.urgency === 'critical' && r.status === 'pending').length,
    fulfilled: requests.filter(r => r.status === 'fulfilled').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Blood Requests</h1>
        <p className="text-muted-foreground">Manage recipient blood requests and match with inventory</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              </div>
              <Heart className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border border-destructive/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Requests</p>
                <p className="text-2xl font-bold text-destructive">{stats.critical}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fulfilled Requests</p>
                <p className="text-2xl font-bold text-success">{stats.fulfilled}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Blood Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {bloodTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="partially_fulfilled">Partial</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Blood Requests ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Patient</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Contact</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Blood Type</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Units</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Urgency</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Required By</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  const matchingUnits = getAvailableMatchingUnits(req.bloodType);
                  const availableQty = matchingUnits.reduce((acc, u) => acc + u.quantity, 0);
                  
                  return (
                    <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-3 font-medium text-foreground">{req.recipientName}</td>
                      <td className="py-3 px-3">
                        <p className="text-sm text-foreground">{req.recipientPhone}</p>
                        <p className="text-xs text-muted-foreground">{req.recipientEmail}</p>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-primary border-primary">{req.bloodType}</Badge>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-foreground">{req.unitsNeeded}</span>
                        <span className="text-xs text-muted-foreground ml-1">({availableQty} avail)</span>
                      </td>
                      <td className="py-3 px-3">{getUrgencyBadge(req.urgency)}</td>
                      <td className="py-3 px-3 text-foreground">{req.requiredBy}</td>
                      <td className="py-3 px-3">{getStatusBadge(req.status)}</td>
                      <td className="py-3 px-3">
                        {req.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              className="bg-secondary hover:bg-secondary/90"
                              onClick={() => handleMatchRequest(req.id)}
                              disabled={availableQty === 0}
                            >
                              Match
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => updateRequestStatus(req.id, 'unavailable')}
                            >
                              Unavail
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredRequests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No requests found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
