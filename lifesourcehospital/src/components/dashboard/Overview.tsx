import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, Calendar, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { mockBloodInventory, mockAppointments, mockRecipientRequests, mockDonors, mockRecipients } from '@/lib/mockData';

export default function Overview() {
  const availableUnits = mockBloodInventory.filter(u => u.status === 'available').reduce((acc, u) => acc + u.quantity, 0);
  const pendingAppointments = mockAppointments.filter(a => a.status === 'pending').length;
  const criticalRequests = mockRecipientRequests.filter(r => r.urgency === 'critical' && r.status === 'pending').length;
  const totalDonors = mockDonors.length;
  const totalRecipients = mockRecipients.length;

  const stats = [
    { label: 'Available Blood Units', value: availableUnits, icon: Droplets, color: 'text-primary' },
    { label: 'Pending Appointments', value: pendingAppointments, icon: Calendar, color: 'text-secondary' },
    { label: 'Critical Requests', value: criticalRequests, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Registered Donors', value: totalDonors, icon: Users, color: 'text-secondary' },
  ];

  const inventoryByType = mockBloodInventory
    .filter(u => u.status === 'available')
    .reduce((acc, u) => {
      acc[u.bloodType] = (acc[u.bloodType] || 0) + u.quantity;
      return acc;
    }, {} as Record<string, number>);

  const recentAppointments = mockAppointments.slice(0, 5);
  const urgentRequests = mockRecipientRequests
    .filter(r => r.status === 'pending')
    .sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome to LifeSource Blood Bank Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <stat.icon className={`w-10 h-10 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood Inventory by Type */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-primary" />
              Blood Inventory by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((type) => (
                <div 
                  key={type} 
                  className="bg-muted rounded-lg p-3 text-center"
                >
                  <p className="text-lg font-bold text-primary">{type}</p>
                  <p className="text-2xl font-bold text-foreground">{inventoryByType[type] || 0}</p>
                  <p className="text-xs text-muted-foreground">units</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Appointments */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              Recent Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{apt.donorName}</p>
                    <p className="text-sm text-muted-foreground">{apt.appointmentDate} at {apt.appointmentTime}</p>
                  </div>
                  <Badge variant={
                    apt.status === 'confirmed' ? 'default' :
                    apt.status === 'completed' ? 'secondary' :
                    apt.status === 'rejected' ? 'destructive' : 'outline'
                  }>
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Requests */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Urgent Blood Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {urgentRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success" />
              <p>No urgent requests pending</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Patient</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Blood Type</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Units</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Urgency</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Required By</th>
                  </tr>
                </thead>
                <tbody>
                  {urgentRequests.map((req) => (
                    <tr key={req.id} className="border-b border-border last:border-0">
                      <td className="py-2 px-3 text-foreground">{req.recipientName}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-primary border-primary">{req.bloodType}</Badge>
                      </td>
                      <td className="py-2 px-3 text-foreground">{req.unitsNeeded}</td>
                      <td className="py-2 px-3">
                        <Badge variant={
                          req.urgency === 'critical' ? 'destructive' :
                          req.urgency === 'high' ? 'default' : 'secondary'
                        }>
                          {req.urgency}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-foreground">{req.requiredBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
