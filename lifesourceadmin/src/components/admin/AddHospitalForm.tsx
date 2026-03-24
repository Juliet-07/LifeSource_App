import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import axios from "axios";

interface AddHospitalFormProps {
  onBack: () => void;
}

export function AddHospitalForm({ onBack }: AddHospitalFormProps) {
  const apiURL = import.meta.env.VITE_REACT_APP_BASE_URL;
  const token = localStorage.getItem("adminToken");
  const { handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);

  const initialValues = {
    institutionType: "",
    institutionName: "",
    officialEmail: "",
    phoneNumber: "",
    licenseRegNo: "",
    capacity: 0,
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    contactFullName: "",
    contactEmail: "",
    contactPhone: "",
    note: "",
  };

  const [formData, setFormData] = useState(initialValues);

  // Handles both native input events and direct (key, value) calls from Select
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string,
    directValue?: string
  ) => {
    if (typeof e === "string") {
      // Called as handleInputChange("fieldName", value) from Select
      setFormData((prev) => ({ ...prev, [e]: directValue ?? "" }));
    } else {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddHospital = async () => {
    if (!formData.institutionType || !formData.institutionName || !formData.officialEmail) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${apiURL}/admin/hospitals`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      toast.success(
        `${formData.institutionType === "hospital" ? "Hospital" : "Blood Bank"} added successfully!`
      );
      onBack();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to add institution. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add New Institution</h1>
            <p className="text-muted-foreground">Register a new hospital or blood bank</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleAddHospital)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Institution Type & Basic Info */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Institution Information
              </CardTitle>
              <CardDescription>Basic details about the institution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institutionType">Institution Type *</Label>
                <Select
                  value={formData.institutionType}
                  onValueChange={(value) => handleInputChange("institutionType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospital">Hospital</SelectItem>
                    <SelectItem value="bloodbank">Blood Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="institutionName">Institution Name *</Label>
                <Input
                  id="institutionName"
                  name="institutionName"
                  placeholder="e.g., City General Hospital"
                  value={formData.institutionName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="officialEmail">Official Email *</Label>
                <Input
                  id="officialEmail"
                  name="officialEmail"
                  type="email"
                  placeholder="contact@hospital.org"
                  value={formData.officialEmail}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseRegNo">License Number</Label>
                <Input
                  id="licenseRegNo"
                  name="licenseRegNo"
                  placeholder="License/Registration number"
                  value={formData.licenseRegNo}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (beds/units)</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  placeholder="e.g., 500"
                  value={formData.capacity}
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <CardDescription>Address and geographic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="123 Medical Center Drive"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Los Angeles"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="California"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    placeholder="90001"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    placeholder="United States"
                    value={formData.country}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Person */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Primary Contact Person</CardTitle>
              <CardDescription>Main point of contact at the institution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactFullName">Full Name</Label>
                <Input
                  id="contactFullName"
                  name="contactFullName"
                  placeholder="Dr. John Smith"
                  value={formData.contactFullName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  placeholder="john.smith@hospital.org"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  placeholder="+1 (555) 987-6543"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Any other relevant details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note">Description / Notes</Label>
                <Textarea
                  id="note"
                  name="note"
                  placeholder="Add any additional information about the institution..."
                  rows={6}
                  value={formData.note}
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" className="bg-gradient-primary hover:opacity-90" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Institution"}
          </Button>
        </div>
      </form>
    </div>
  );
}