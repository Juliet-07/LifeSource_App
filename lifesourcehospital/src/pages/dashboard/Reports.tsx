import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Droplets, Calendar, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { mockBloodInventory, mockAppointments, mockRecipientRequests, mockDonors, mockRecipients } from '@/lib/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function Reports() {
  // Calculate stats
  const inventoryByType = mockBloodInventory
    .filter(u => u.status === 'available')
    .reduce((acc, u) => {
      acc[u.bloodType] = (acc[u.bloodType] || 0) + u.quantity;
      return acc;
    }, {} as Record<string, number>);

  const inventoryChartData = Object.entries(inventoryByType).map(([type, count]) => ({
    bloodType: type,
    units: count,
  }));

  const appointmentsByStatus = mockAppointments.reduce((acc, apt) => {
    acc[apt.status] = (acc[apt.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const appointmentChartData = Object.entries(appointmentsByStatus).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
  }));

  const requestsByUrgency = mockRecipientRequests.reduce((acc, req) => {
    acc[req.urgency] = (acc[req.urgency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const urgencyChartData = Object.entries(requestsByUrgency).map(([urgency, count]) => ({
    name: urgency.charAt(0).toUpperCase() + urgency.slice(1),
    value: count,
  }));

  const COLORS = ['hsl(0, 70%, 51%)', 'hsl(180, 100%, 25%)', 'hsl(43, 96%, 56%)', 'hsl(142, 71%, 45%)'];

  const totalUnitsAvailable = mockBloodInventory.filter(u => u.status === 'available').reduce((acc, u) => acc + u.quantity, 0);
  const totalUnitsUsed = mockBloodInventory.filter(u => u.status === 'used').reduce((acc, u) => acc + u.quantity, 0);
  const completedAppointments = mockAppointments.filter(a => a.status === 'completed').length;
  const fulfilledRequests = mockRecipientRequests.filter(r => r.status === 'fulfilled').length;

  const stats = [
    { label: 'Total Blood Units Available', value: totalUnitsAvailable, icon: Droplets, trend: '+5', trendUp: true },
    { label: 'Units Used This Month', value: totalUnitsUsed, icon: TrendingUp, trend: '+2', trendUp: true },
    { label: 'Donations Completed', value: completedAppointments, icon: Calendar, trend: '+1', trendUp: true },
    { label: 'Requests Fulfilled', value: fulfilledRequests, icon: Users, trend: '0', trendUp: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground">View blood bank performance and statistics</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    <Badge variant="outline" className={stat.trendUp ? 'text-success border-success' : 'text-destructive border-destructive'}>
                      {stat.trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {stat.trend}
                    </Badge>
                  </div>
                </div>
                <stat.icon className="w-10 h-10 text-secondary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory by Blood Type */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-primary" />
              Inventory by Blood Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="bloodType" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="units" fill="hsl(0, 70%, 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Status Distribution */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              Appointment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {appointmentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Request Urgency Distribution */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Request Urgency Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={urgencyChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {urgencyChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Summary */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              System Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Total Registered Donors</span>
                <span className="font-bold text-foreground">{mockDonors.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Active Donors</span>
                <span className="font-bold text-success">{mockDonors.filter(d => d.status === 'active').length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Total Recipients Serviced</span>
                <span className="font-bold text-foreground">{mockRecipients.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Pending Blood Requests</span>
                <span className="font-bold text-warning">{mockRecipientRequests.filter(r => r.status === 'pending').length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Critical Requests</span>
                <span className="font-bold text-destructive">{mockRecipientRequests.filter(r => r.urgency === 'critical' && r.status === 'pending').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
