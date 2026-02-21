import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Droplets, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { mockBloodInventory, BloodUnit, bloodTypes } from '@/lib/mockData';

export default function Inventory() {
  const [inventory, setInventory] = useState<BloodUnit[]>(mockBloodInventory);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; unit: BloodUnit | null }>({ open: false, unit: null });

  // Form state for new unit
  const [newUnit, setNewUnit] = useState({
    bloodType: '',
    quantity: 1,
    donorName: '',
    storageLocation: '',
    collectionDate: '',
  });

  const filteredInventory = inventory.filter(unit => {
    const matchesSearch = unit.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          unit.storageLocation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || unit.bloodType === typeFilter;
    const matchesStatus = statusFilter === 'all' || unit.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleAddUnit = () => {
    if (!newUnit.bloodType || !newUnit.donorName || !newUnit.collectionDate) {
      toast.error('Please fill all required fields');
      return;
    }

    const expiryDate = new Date(newUnit.collectionDate);
    expiryDate.setDate(expiryDate.getDate() + 42); // Blood expires in 42 days

    const unit: BloodUnit = {
      id: Date.now().toString(),
      bloodType: newUnit.bloodType,
      quantity: newUnit.quantity,
      donorId: Date.now().toString(),
      donorName: newUnit.donorName,
      collectionDate: newUnit.collectionDate,
      expiryDate: expiryDate.toISOString().split('T')[0],
      storageLocation: newUnit.storageLocation,
      status: 'available',
    };

    setInventory(prev => [...prev, unit]);
    toast.success('Blood unit added to inventory');
    setAddDialog(false);
    setNewUnit({ bloodType: '', quantity: 1, donorName: '', storageLocation: '', collectionDate: '' });
  };

  const updateUnitStatus = (id: string, status: BloodUnit['status']) => {
    setInventory(prev => prev.map(unit => 
      unit.id === id ? { ...unit, status } : unit
    ));
    toast.success(`Unit marked as ${status}`);
  };

  const deleteUnit = (id: string) => {
    setInventory(prev => prev.filter(unit => unit.id !== id));
    toast.success('Unit removed from inventory');
  };

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
    total: inventory.filter(u => u.status === 'available').reduce((acc, u) => acc + u.quantity, 0),
    reserved: inventory.filter(u => u.status === 'reserved').reduce((acc, u) => acc + u.quantity, 0),
    expiringSoon: inventory.filter(u => {
      const expiry = new Date(u.expiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
              <Plus className="w-4 h-4 mr-2" />
              Add Blood Unit
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity (units)</Label>
                <Input 
                  type="number" 
                  min="1"
                  value={newUnit.quantity}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Donor Name *</Label>
                <Input 
                  value={newUnit.donorName}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, donorName: e.target.value }))}
                  placeholder="Enter donor name"
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
              <Button className="bg-secondary hover:bg-secondary/90" onClick={handleAddUnit}>Add Unit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Units</p>
                <p className="text-2xl font-bold text-success">{inventoryStats.total}</p>
              </div>
              <Droplets className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reserved Units</p>
                <p className="text-2xl font-bold text-warning">{inventoryStats.reserved}</p>
              </div>
              <Droplets className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold text-destructive">{inventoryStats.expiringSoon}</p>
              </div>
              <Droplets className="w-8 h-8 text-destructive" />
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
                {bloodTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Blood Type</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Qty</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Donor</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Collection</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Expiry</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Location</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((unit) => (
                  <tr key={unit.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-3">
                      <Badge variant="outline" className="text-primary border-primary font-bold">{unit.bloodType}</Badge>
                    </td>
                    <td className="py-3 px-3 font-medium text-foreground">{unit.quantity}</td>
                    <td className="py-3 px-3 text-foreground">{unit.donorName}</td>
                    <td className="py-3 px-3 text-foreground">{unit.collectionDate}</td>
                    <td className="py-3 px-3 text-foreground">{unit.expiryDate}</td>
                    <td className="py-3 px-3 text-foreground">{unit.storageLocation}</td>
                    <td className="py-3 px-3">{getStatusBadge(unit.status)}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        {unit.status === 'available' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => updateUnitStatus(unit.id, 'used')}>
                              Used
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateUnitStatus(unit.id, 'discarded')}>
                              Discard
                            </Button>
                          </>
                        )}
                        {unit.status === 'expired' && (
                          <Button size="sm" variant="destructive" onClick={() => deleteUnit(unit.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredInventory.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No blood units found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
