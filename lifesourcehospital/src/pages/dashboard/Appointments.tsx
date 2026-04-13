import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Calendar, CheckCircle, XCircle, Clock, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Appointment {
  _id: string;
  donorId: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  bloodType: string;
  scheduledAt: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
}

export default function Appointments() {
  const apiURL = import.meta.env.VITE_REACT_APP_BASE_URL;
  const token = localStorage.getItem("hospitalToken");
  const queryClient = useQueryClient();

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rescheduleDialog, setRescheduleDialog] = useState<{ open: boolean; appointment: Appointment | null }>({ open: false, appointment: null });
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  // ── GET appointments ───────────────────────────────────────────────────────
  const { data: appointments = [], isLoading, isError } = useQuery<Appointment[]>({
    queryKey: ["hospital-appointments"],
    queryFn: async () => {
      const res = await axios.get(`${apiURL}/hospital/appointments`, { headers });
      console.log(res.data.data.appointments)
      return res.data.data.appointments ?? res.data.data ?? res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── PATCH actions — each with its own endpoint ─────────────────────────────
  const confirmAppointment = async (id: string) => {
    setActionLoadingId(id);
    try {
      await axios.patch(`${apiURL}/hospital/appointments/${id}/confirm`, {}, { headers });
      toast.success('Appointment confirmed');
      queryClient.invalidateQueries({ queryKey: ["hospital-appointments"] });
    } catch (error) {
      toast.error('Failed to confirm appointment');
      console.error(error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const cancelAppointment = async (id: string) => {
    setActionLoadingId(id);
    try {
      await axios.patch(`${apiURL}/hospital/appointments/${id}/cancel`, {}, { headers });
      toast.success('Appointment cancelled');
      queryClient.invalidateQueries({ queryKey: ["hospital-appointments"] });
    } catch (error) {
      toast.error('Failed to cancel appointment');
      console.error(error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDialog.appointment || !newDate || !newTime) return;
    const id = rescheduleDialog.appointment._id;
    const scheduledAt = new Date(`${newDate}T${newTime}:00.000Z`).toISOString();
    setActionLoadingId(id);
    try {
      await axios.patch(`${apiURL}/hospital/appointments/${id}/reschedule`, { scheduledAt }, { headers });
      toast.success('Appointment rescheduled');
      queryClient.invalidateQueries({ queryKey: ["hospital-appointments"] });
      setRescheduleDialog({ open: false, appointment: null });
      setNewDate('');
      setNewTime('');
    } catch (error) {
      toast.error('Failed to reschedule appointment');
      console.error(error);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredAppointments = appointments.filter(apt => {
    const donorName = `${apt.donorId?.firstName ?? ''} ${apt.donorId?.lastName ?? ''}`.toLowerCase();
    const donorEmail = apt.donorId?.email?.toLowerCase() ?? '';
    const matchesSearch = donorName.includes(searchQuery.toLowerCase()) || donorEmail.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge variant="outline">Scheduled</Badge>;
      case 'confirmed': return <Badge className="bg-secondary text-secondary-foreground">Confirmed</Badge>;
      case 'completed': return <Badge className="bg-success text-success-foreground">Completed</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      case 'rescheduled': return <Badge className="bg-warning text-warning-foreground">Rescheduled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
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
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading appointments...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-destructive">Failed to load appointments. Please try again.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Donor', 'Contact', 'Blood Type', 'Date', 'Time', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((apt) => (
                    <tr key={apt._id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-3">
                        <p className=" text-foreground">
                          {apt.donorId?.firstName} {apt.donorId?.lastName}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-sm text-foreground">{apt.donorId?.phone}</p>
                        <p className="text-xs text-muted-foreground">{apt.donorId?.email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-primary border-primary">{apt.bloodType}</Badge>
                      </td>
                      <td className="py-3 px-3 text-foreground">
                        {new Date(apt.scheduledAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {new Date(apt.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 px-3">
                        {getStatusBadge(apt.status)}
                        {apt.notes && <p className="text-xs text-muted-foreground mt-1">{apt.notes}</p>}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex gap-2">

                          {/* ── scheduled: confirm, cancel, reschedule ── */}
                          {apt.status === 'scheduled' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-secondary hover:bg-secondary/90"
                                disabled={actionLoadingId === apt._id}
                                onClick={() => confirmAppointment(apt._id)}
                              >
                                {actionLoadingId === apt._id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <CheckCircle className="w-4 h-4" />}
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={actionLoadingId === apt._id}
                                onClick={() => cancelAppointment(apt._id)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>

                              <Dialog
                                open={rescheduleDialog.open && rescheduleDialog.appointment?._id === apt._id}
                                onOpenChange={(open) => setRescheduleDialog({ open, appointment: open ? apt : null })}
                              >
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" disabled={actionLoadingId === apt._id}>
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
                                      <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>New Time</Label>
                                      <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setRescheduleDialog({ open: false, appointment: null })}>
                                      Cancel
                                    </Button>
                                    <Button
                                      className="bg-secondary hover:bg-secondary/90"
                                      disabled={!newDate || !newTime || actionLoadingId === apt._id}
                                      onClick={handleReschedule}
                                    >
                                      {actionLoadingId === apt._id
                                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Rescheduling...</>
                                        : 'Reschedule'}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}

                          {/* ── confirmed: mark complete or cancel ── */}
                          {apt.status === 'confirmed' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-success hover:bg-success/90"
                                disabled={actionLoadingId === apt._id}
                                onClick={() => confirmAppointment(apt._id)}
                              >
                                {actionLoadingId === apt._id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : 'Mark Complete'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={actionLoadingId === apt._id}
                                onClick={() => cancelAppointment(apt._id)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}

                          {/* ── rescheduled: still allow confirm or cancel ── */}
                          {apt.status === 'rescheduled' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-secondary hover:bg-secondary/90"
                                disabled={actionLoadingId === apt._id}
                                onClick={() => confirmAppointment(apt._id)}
                              >
                                {actionLoadingId === apt._id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <CheckCircle className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={actionLoadingId === apt._id}
                                onClick={() => cancelAppointment(apt._id)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAppointments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No appointments found</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}