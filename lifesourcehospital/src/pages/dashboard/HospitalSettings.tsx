import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, Building2, MapPin, Phone, Mail, Globe, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { mockHospitalInfo, HospitalInfo } from '@/lib/mockData';

const availableServices = [
  'Blood Transfusion',
  'Blood Testing',
  'Platelet Donation',
  'Plasma Collection',
  'Emergency Services',
  'Blood Component Separation',
  'Autologous Donation',
  'Directed Donation',
];

export default function HospitalSettings() {
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo>(mockHospitalInfo);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<HospitalInfo>(mockHospitalInfo);

  const handleSave = () => {
    setHospitalInfo(editForm);
    setIsEditing(false);
    toast.success('Hospital information updated successfully');
  };

  const handleCancel = () => {
    setEditForm(hospitalInfo);
    setIsEditing(false);
  };

  const toggleService = (service: string) => {
    setEditForm(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hospital Settings</h1>
          <p className="text-muted-foreground">Manage hospital verification and service details</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-secondary hover:bg-secondary/90">
            Edit Information
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave} className="bg-secondary hover:bg-secondary/90">Save Changes</Button>
          </div>
        )}
      </div>

      {/* Verification Status */}
      <Card className={`border-2 ${hospitalInfo.isVerified ? 'border-success' : 'border-warning'}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${hospitalInfo.isVerified ? 'bg-success/10' : 'bg-warning/10'}`}>
                {hospitalInfo.isVerified ? (
                  <CheckCircle className="w-8 h-8 text-success" />
                ) : (
                  <Shield className="w-8 h-8 text-warning" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Verification Status</h3>
                <p className="text-sm text-muted-foreground">
                  {hospitalInfo.isVerified 
                    ? 'Your hospital is verified and approved to operate on LifeSource'
                    : 'Verification pending - awaiting approval from health authority'
                  }
                </p>
              </div>
            </div>
            <Badge className={hospitalInfo.isVerified ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}>
              {hospitalInfo.isVerified ? 'Verified' : 'Pending'}
            </Badge>
          </div>
          {hospitalInfo.isVerified && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">License Number:</span>
                  <span className="ml-2 font-medium text-foreground">{hospitalInfo.licenseNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Registration Date:</span>
                  <span className="ml-2 font-medium text-foreground">{hospitalInfo.registrationDate}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-secondary" />
              Basic Information
            </CardTitle>
            <CardDescription>Hospital name and identification details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Hospital Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              ) : (
                <p className="text-foreground font-medium">{hospitalInfo.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="license">License Number</Label>
              {isEditing ? (
                <Input
                  id="license"
                  value={editForm.licenseNumber}
                  onChange={(e) => setEditForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                />
              ) : (
                <p className="text-foreground">{hospitalInfo.licenseNumber}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-secondary" />
              Contact Information
            </CardTitle>
            <CardDescription>Phone, email, and website details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              ) : (
                <p className="text-foreground">{hospitalInfo.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                />
              ) : (
                <p className="text-foreground">{hospitalInfo.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website
              </Label>
              {isEditing ? (
                <Input
                  id="website"
                  value={editForm.website}
                  onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                />
              ) : (
                <p className="text-foreground">{hospitalInfo.website}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-secondary" />
              Address
            </CardTitle>
            <CardDescription>Physical location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              {isEditing ? (
                <Input
                  id="address"
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                />
              ) : (
                <p className="text-foreground">{hospitalInfo.address}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                {isEditing ? (
                  <Input
                    id="city"
                    value={editForm.city}
                    onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                  />
                ) : (
                  <p className="text-foreground">{hospitalInfo.city}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                {isEditing ? (
                  <Input
                    id="state"
                    value={editForm.state}
                    onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                  />
                ) : (
                  <p className="text-foreground">{hospitalInfo.state}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code</Label>
              {isEditing ? (
                <Input
                  id="zipCode"
                  value={editForm.zipCode}
                  onChange={(e) => setEditForm(prev => ({ ...prev, zipCode: e.target.value }))}
                />
              ) : (
                <p className="text-foreground">{hospitalInfo.zipCode}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Available Services */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-secondary" />
              Available Services
            </CardTitle>
            <CardDescription>Blood bank services offered at this facility</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableServices.map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={service}
                      checked={editForm.services.includes(service)}
                      onCheckedChange={() => toggleService(service)}
                    />
                    <label htmlFor={service} className="text-sm text-foreground cursor-pointer">
                      {service}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hospitalInfo.services.map((service) => (
                  <Badge key={service} variant="outline" className="text-secondary border-secondary">
                    {service}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
