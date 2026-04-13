import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart, Search, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { bloodTypes, bloodCompatibility } from '@/lib/data';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Requestor {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
}

interface RecipientRequest {
  _id: string;
  id: string;
  requestorId: Requestor;
  bloodType: string;
  unitsNeeded: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  requiredBy: string;
  status: 'pending' | 'confirmed_by_hospital' | 'fulfilled' | 'partially_fulfilled' | 'unavailable' | 'cancelled';
  matchedUnits?: string[];
}

interface InventoryUnit {
  _id: string;
  id: string;
  bloodType: string;
  quantity: number;
  status: string;
  expiryDate?: string;
  donorName?: string;
}

export default function Requests() {
  const apiURL = import.meta.env.VITE_REACT_APP_BASE_URL;
  const token = localStorage.getItem("hospitalToken");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const queryClient = useQueryClient();

  const [matchingId, setMatchingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [matchDialog, setMatchDialog] = useState<{ open: boolean; request: RecipientRequest | null }>({ open: false, request: null });
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<string[]>([]);

  // Fetch requests
  const { data: requests = [], isLoading: loadingRequests } = useQuery<RecipientRequest[]>({
    queryKey: ['my-requests'],
    queryFn: async () => {
      const res = await axios.get(`${apiURL}/hospital/requests`, { headers });
      console.log(res.data.data.requests)
      return res.data.data.requests;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch inventory — only when match dialog is open
  const { data: inventory = [], isLoading: loadingInventory } = useQuery<InventoryUnit[]>({
    queryKey: ['hospital-inventory'],
    queryFn: async () => {
      const res = await axios.get(`${apiURL}/hospital/inventory`, { headers });
      return res.data.data.inventory ?? res.data.data;
    },
    enabled: matchDialog.open,
    staleTime: 2 * 60 * 1000,
  });

  const openMatchDialog = (request: RecipientRequest) => {
    setMatchDialog({ open: true, request });
    setSelectedInventoryIds([]);
  };

  const closeMatchDialog = () => {
    setMatchDialog({ open: false, request: null });
    setSelectedInventoryIds([]);
  };

  const getCompatibleInventory = (bloodType: string) => {
    const compatibleTypes = Object.entries(bloodCompatibility)
      .filter(([_, recipients]) => recipients.includes(bloodType))
      .map(([donor]) => donor);
    return inventory.filter(unit => unit.status === 'available' && compatibleTypes.includes(unit.bloodType));
  };

  const toggleInventorySelection = (id: string) => {
    setSelectedInventoryIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleMatchRequest = async () => {
    if (!matchDialog.request) return;
    if (selectedInventoryIds.length === 0) {
      toast.error('Please select at least one inventory unit');
      return;
    }
    const requestId = matchDialog.request._id ?? matchDialog.request.id;
    try {
      setMatchingId(requestId);
      await axios.patch(
        `${apiURL}/hospital/requests/${requestId}/match`,
        { inventoryIds: selectedInventoryIds },
        { headers }
      );
      toast.success('Request matched successfully');
      closeMatchDialog();
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    } catch (err) {
      toast.error('Failed to match request');
    } finally {
      setMatchingId(null);
    }
  };

  const markUnavailable = async (req: RecipientRequest) => {
    const requestId = req._id ?? req.id;
    try {
      await axios.patch(
        `${apiURL}/hospital/requests/${requestId}/match`,
        { status: 'unavailable' },
        { headers }
      );
      toast.success('Request marked as unavailable');
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    } catch {
      toast.error('Failed to update request');
    }
  };

  const filteredRequests = requests.filter(req => {
    const name = `${req.requestorId?.firstName ?? ''} ${req.requestorId?.lastName ?? ''}`.toLowerCase();
    const email = req.requestorId?.email?.toLowerCase() ?? '';
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || req.bloodType === typeFilter;
    const matchesUrgency = urgencyFilter === 'all' || req.urgency === urgencyFilter;
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesType && matchesUrgency && matchesStatus;
  }).sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });

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
      case 'confirmed_by_hospital': return <Badge className="bg-amber-500 text-white">Confirmed</Badge>;
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

  const compatibleInventory = matchDialog.request
    ? getCompatibleInventory(matchDialog.request.bloodType)
    : [];

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
        <Card className="border border-destructive/50">
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
          {loadingRequests ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
                    const reqId = req._id ?? req.id;
                    const patientName = `${req.requestorId?.firstName ?? ''} ${req.requestorId?.lastName ?? ''}`.trim();
                    return (
                      <tr key={reqId} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-3 text-foreground">{patientName || '—'}</td>
                        <td className="py-3 px-3">
                          <p className="text-sm text-foreground">{req.requestorId?.phone ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{req.requestorId?.email ?? '—'}</p>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="outline" className="text-primary border-primary">{req.bloodType}</Badge>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-foreground">{req.unitsNeeded}</span>
                        </td>
                        <td className="py-3 px-3">{getUrgencyBadge(req.urgency)}</td>
                        <td className="py-3 px-3 text-foreground">{new Date(req.requiredBy).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</td>
                        <td className="py-3 px-3">{getStatusBadge(req.status)}</td>
                        <td className="py-3 px-3">
                          {req.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                className="bg-secondary hover:bg-secondary/90"
                                onClick={() => openMatchDialog(req)}
                              >
                                Match
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => markUnavailable(req)}
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
              {filteredRequests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No requests found</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Match Dialog */}
      <Dialog open={matchDialog.open} onOpenChange={(open) => !open && closeMatchDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Match Blood Request</DialogTitle>
          </DialogHeader>

          {matchDialog.request && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
                <p>
                  <span className="font-medium">Patient:</span>{' '}
                  {`${matchDialog.request.requestorId?.firstName ?? ''} ${matchDialog.request.requestorId?.lastName ?? ''}`.trim() || '—'}
                </p>
                <p>
                  <span className="font-medium">Needs:</span> {matchDialog.request.unitsNeeded} unit(s) of{' '}
                  <Badge variant="outline" className="text-primary border-primary ml-1">{matchDialog.request.bloodType}</Badge>
                </p>
                <p><span className="font-medium">Urgency:</span> {getUrgencyBadge(matchDialog.request.urgency)}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">
                  Compatible Inventory
                  {!loadingInventory && (
                    <span className="text-muted-foreground font-normal ml-1">({compatibleInventory.length} units available)</span>
                  )}
                </p>

                {loadingInventory ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : compatibleInventory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No compatible inventory available</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {compatibleInventory.map((unit) => {
                      const unitId = unit._id ?? unit.id;
                      return (
                        <label
                          key={unitId}
                          className="flex items-center gap-3 p-3 rounded-md border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedInventoryIds.includes(unitId)}
                            onCheckedChange={() => toggleInventorySelection(unitId)}
                          />
                          <div className="flex-1 text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-primary border-primary text-xs">{unit.bloodType}</Badge>
                              <span className="font-medium">{unit.quantity} unit(s)</span>
                              {unit.donorName && (
                                <span className="text-muted-foreground">· {unit.donorName}</span>
                              )}
                            </div>
                            {unit.expiryDate && (
                              <p className="text-xs text-muted-foreground mt-0.5">Expires: {new Date(unit.expiryDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedInventoryIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedInventoryIds.length} inventory unit(s) selected
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeMatchDialog}>Cancel</Button>
            <Button
              onClick={handleMatchRequest}
              disabled={selectedInventoryIds.length === 0 || !!matchingId}
              className="bg-secondary hover:bg-secondary/90"
            >
              {matchingId ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Matching...</>
              ) : (
                'Confirm Match'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}