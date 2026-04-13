import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Droplets, Plus, Search, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const donationTypes = [
  { value: "whole_blood", label: "Whole Blood" },
  { value: "plasma", label: "Plasma" },
  { value: "platelet", label: "Platelets" },
  { value: "double_red_cells", label: "Red Cells" },
];

interface BloodUnit {
  _id: string;
  bloodType: string;
  donationType: string;
  units: number;
  donorId: string;
  collectionDate: string;
  expiryDate: string;
  storageLocation: string;
  status: 'available' | 'reserved' | 'used' | 'expired' | 'discarded';
}

export default function Inventory() {
  const apiURL = import.meta.env.VITE_REACT_APP_BASE_URL;
  const token = localStorage.getItem("hospitalToken");
  const queryClient = useQueryClient();

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [addingUnit, setAddingUnit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addDialog, setAddDialog] = useState(false);

  const initialValues = {
    bloodType: '',
    donationType: '',
    units: 0,
    collectionDate: '',
    batchNumber: '',
    storageLocation: '',
    donorName: '',
    notes: ''
  }
  const [newUnit, setNewUnit] = useState(initialValues);

  // ── GET inventory ──────────────────────────────────────────────────────────
  const { data: inventory = [], isLoading, isError } = useQuery<BloodUnit[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await axios.get(`${apiURL}/hospital/inventory`, { headers });
      console.log(res.data.data.inventory)
      return res.data.data.inventory;
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── POST add unit ──────────────────────────────────────────────────────────
  const handleAddUnit = async () => {
    if (!newUnit.bloodType || !newUnit.donationType || !newUnit.donorName || !newUnit.collectionDate) {
      toast.error('Please fill all required fields');
      return;
    }

    const expiryDate = new Date(newUnit.collectionDate);
    expiryDate.setDate(expiryDate.getDate() + 42);

    const payload = {
      bloodType: newUnit.bloodType,
      units: newUnit.units,
      donorName: newUnit.donorName,
      donationType: newUnit.donationType,
      collectionDate: newUnit.collectionDate,
      expiryDate: expiryDate.toISOString().split('T')[0],
      batchNumber: newUnit.batchNumber,
      storageLocation: newUnit.storageLocation,
      notes: newUnit.notes
    };

    setAddingUnit(true);
    try {
      await axios.post(`${apiURL}/hospital/inventory`, payload, { headers });
      toast.success('Blood unit added to inventory');
      setAddDialog(false);
      setNewUnit(initialValues);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    } catch (error) {
      toast.error('Failed to add blood unit');
      console.error(error);
    } finally {
      setAddingUnit(false);
    }
  };

  // ── PATCH update status ────────────────────────────────────────────────────
  const updateUnitStatus = async (id: string, status: BloodUnit['status']) => {
    setActionLoadingId(id);
    try {
      await axios.patch(`${apiURL}/hospital/inventory/${id}`, { status }, { headers });
      toast.success(`Unit marked as ${status}`);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    } catch (error) {
      toast.error('Failed to update unit status');
      console.error(error);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredInventory = inventory.filter(unit => {
    const matchesSearch =
      unit.donorId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.storageLocation?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || unit.bloodType === typeFilter;
    const matchesStatus = statusFilter === 'all' || unit.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return <Badge className="bg-success text-success-foreground">Available</Badge>;
      case 'reserved': return <Badge className="bg-warning text-warning-foreground">Reserved</Badge>;
      case 'used': return <Badge className="bg-secondary text-secondary-foreground">Used</Badge>;
      case 'expired': return <Badge variant="destructive">Expired</Badge>;
      case 'discarded': return <Badge variant="outline">Discarded</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const inventoryStats = {
    total: inventory.filter(u => u.status === 'available').reduce((acc, u) => acc + u.units, 0),
    reserved: inventory.filter(u => u.status === 'reserved').reduce((acc, u) => acc + u.units, 0),
    expiringSoon: inventory.filter(u => {
      const daysUntilExpiry = Math.ceil(
        (new Date(u.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return u.status === 'available' && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    }).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blood Inventory</h1>
          <p className="text-muted-foreground">Manage blood units and storage</p>
        </div>

        <Dialog open={addDialog} onOpenChange={setAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-secondary hover:bg-secondary/90">
              <Plus className="w-4 h-4 mr-2" /> Add Blood Unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Blood Unit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Blood Type *</Label>
                <Select value={newUnit.bloodType} onValueChange={(v) => setNewUnit(prev => ({ ...prev, bloodType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select blood type" /></SelectTrigger>
                  <SelectContent>
                    {bloodGroups.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Donation Type *</Label>
                <Select value={newUnit.donationType} onValueChange={(v) => setNewUnit(prev => ({ ...prev, donationType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select donation type" /></SelectTrigger>
                  <SelectContent>
                    {donationTypes.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity (units)</Label>
                <Input
                  type="number"
                  value={newUnit.units}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, units: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Donor Name</Label>
                <Input
                  value={newUnit.donorName}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, donorName: e.target.value }))}
                  placeholder="Enter donor name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Collection Date *</Label>
                <Input
                  type="date"
                  value={newUnit.collectionDate}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, collectionDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Batch Number</Label>
                <Input
                  value={newUnit.batchNumber}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, batchNumber: e.target.value }))}
                  placeholder="Enter batch number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Storage Location</Label>
                <Input
                  value={newUnit.storageLocation}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, storageLocation: e.target.value }))}
                  placeholder="e.g., Refrigerator A"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
              <Button
                className="bg-secondary hover:bg-secondary/90"
                onClick={handleAddUnit}
                disabled={addingUnit}
              >
                {addingUnit ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</> : 'Add Unit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Available Units', value: inventoryStats.total, color: 'text-success' },
          { label: 'Reserved Units', value: inventoryStats.reserved, color: 'text-warning' },
          { label: 'Expiring Soon', value: inventoryStats.expiringSoon, color: 'text-destructive' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
                <Droplets className={`w-8 h-8 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by donor or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Blood Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {bloodGroups.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="discarded">Discarded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-primary" />
            Inventory ({filteredInventory.length} units)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading inventory...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-destructive">
              Failed to load inventory. Please try again.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Blood Type', 'Donation Type', 'Qty', 'Donor', 'Collection', 'Expiry', 'Location', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((unit) => (
                    <tr key={unit._id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-primary border-primary font-bold">{unit.bloodType}</Badge>
                      </td>
                      <td className="py-3 px-3 font-medium text-foreground">{unit.donationType}</td>
                      <td className="py-3 px-3 font-medium text-foreground">{unit.units}</td>
                      <td className="py-3 px-3 text-foreground">{unit.donorId}</td>
                      <td className="py-3 px-3 text-foreground">{new Date(unit.collectionDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</td>
                      <td className="py-3 px-3 text-foreground">{new Date(unit.expiryDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</td>
                      <td className="py-3 px-3 text-foreground">{unit.storageLocation}</td>
                      <td className="py-3 px-3">{getStatusBadge(unit.status)}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1">
                          {unit.status === 'available' && (
                            <>
                              <Button
                                size="sm" variant="outline"
                                disabled={actionLoadingId === unit._id}
                                onClick={() => updateUnitStatus(unit._id, 'used')}
                              >
                                {actionLoadingId === unit._id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Used'}
                              </Button>
                              <Button
                                size="sm" variant="outline"
                                disabled={actionLoadingId === unit._id}
                                onClick={() => updateUnitStatus(unit._id, 'discarded')}
                              >
                                Discard
                              </Button>
                            </>
                          )}
                          {unit.status === 'expired' && (
                            <Button
                              size="sm" variant="destructive"
                              disabled={actionLoadingId === unit._id}
                              onClick={() => updateUnitStatus(unit._id, 'discarded')}
                            >
                              {actionLoadingId === unit._id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Trash2 className="w-4 h-4" />}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredInventory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No blood units found</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}