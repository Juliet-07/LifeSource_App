import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Calendar, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';
import { mockAppointments, DonationAppointment } from '@/lib/mockData';

export default function Appointments() {
  const [appointments, setAppointments] = useState<DonationAppointment[]>(mockAppointments);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rescheduleDialog, setRescheduleDialog] = useState<{ open: boolean; appointment: DonationAppointment | null }>({ open: false, appointment: null });
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          apt.donorEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = (id: string, status: DonationAppointment['status'], notes?: string) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, status, notes: notes || apt.notes } : apt
    ));
    toast.success(`Appointment ${status}`);
  };

  const handleReschedule = () => {
    if (!rescheduleDialog.appointment || !newDate || !newTime) return;
    
    setAppointments(prev => prev.map(apt => 
      apt.id === rescheduleDialog.appointment!.id 
        ? { ...apt, appointmentDate: newDate, appointmentTime: newTime, status: 'rescheduled' as const }
        : apt
    ));
    toast.success('Appointment rescheduled');
    setRescheduleDialog({ open: false, appointment: null });
    setNewDate('');
    setNewTime('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-secondary text-secondary-foreground">Confirmed</Badge>;
      case 'completed': return <Badge className="bg-success text-success-foreground">Completed</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'rescheduled': return <Badge className="bg-warning text-warning-foreground">Rescheduled</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Donation Appointments</h1>
        <p className="text-muted-foreground">Manage and track all blood donation appointments</p>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by donor name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-secondary" />
            Appointments ({filteredAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Donor</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Contact</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Blood Type</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Date & Time</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-3">
                      <p className="font-medium text-foreground">{apt.donorName}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-sm text-foreground">{apt.donorPhone}</p>
                      <p className="text-xs text-muted-foreground">{apt.donorEmail}</p>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="outline" className="text-primary border-primary">{apt.bloodType}</Badge>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-foreground">{apt.appointmentDate}</p>
                      <p className="text-sm text-muted-foreground">{apt.appointmentTime}</p>
                    </td>
                    <td className="py-3 px-3">
                      {getStatusBadge(apt.status)}
                      {apt.notes && <p className="text-xs text-muted-foreground mt-1">{apt.notes}</p>}
                    </td>
                    <td className="py-3 px-3">
                      {apt.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-secondary hover:bg-secondary/90"
                            onClick={() => updateStatus(apt.id, 'confirmed')}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => updateStatus(apt.id, 'rejected')}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                          <Dialog 
                            open={rescheduleDialog.open && rescheduleDialog.appointment?.id === apt.id}
                            onOpenChange={(open) => setRescheduleDialog({ open, appointment: open ? apt : null })}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Clock className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reschedule Appointment</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>New Date</Label>
                                  <Input 
                                    type="date" 
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>New Time</Label>
                                  <Input 
                                    type="time" 
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setRescheduleDialog({ open: false, appointment: null })}>
                                  Cancel
                                </Button>
                                <Button className="bg-secondary hover:bg-secondary/90" onClick={handleReschedule}>
                                  Reschedule
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                      {apt.status === 'confirmed' && (
                        <Button 
                          size="sm" 
                          className="bg-success hover:bg-success/90"
                          onClick={() => updateStatus(apt.id, 'completed')}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredAppointments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No appointments found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
