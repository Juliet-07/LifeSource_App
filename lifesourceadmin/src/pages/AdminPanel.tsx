import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Dashboard } from "@/components/admin/Dashboard";
import { HospitalManagement } from "@/components/admin/HospitalManagement";
import { RequestTracking } from "@/components/admin/RequestTracking";
import { UserManagement } from "@/components/admin/UserManagement";
import { ReportsModule } from "@/components/admin/ReportsModule";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "hospitals":
        return <HospitalManagement />;
      case "users":
        return <UserManagement />;
      case "requests":
        return <RequestTracking />;
      case "reports":
        return <ReportsModule />;
      case "announcements":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Broadcast Announcements</h1>
              <p className="text-muted-foreground">Send system-wide notifications and alerts</p>
            </div>
            <Card className="shadow-soft">
              <CardContent className="text-center py-12">
                <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Announcements System</p>
                <p className="text-muted-foreground">Broadcast messaging system coming soon</p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPanel;
