import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Shield, BarChart3, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">LifeSourceAdmin</h1>
              <p className="text-xs text-muted-foreground">Healthcare Management Platform</p>
            </div>
          </div>
          <Link to="/admin">
            <Button className="bg-gradient-primary hover:opacity-90">
              <Shield className="w-4 h-4 mr-2" />
              Admin Access
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Super Admin
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Healthcare</span>
            <br />Management Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Comprehensive system-wide management for hospitals, donors, recipients, and critical medical requests across the healthcare network.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/admin">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90">
                <Shield className="w-5 h-5 mr-2" />
                Access Admin Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              <BarChart3 className="w-5 h-5 mr-2" />
              View System Status
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Platform Capabilities</h2>
          <p className="text-xl text-muted-foreground">Complete administrative control and oversight</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="shadow-soft hover:shadow-medium transition-smooth">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Hospital Onboarding</CardTitle>
              <CardDescription>
                Review, verify, and approve hospital registrations with comprehensive document validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Registration verification process</li>
                <li>• Document authentication</li>
                <li>• Credential assignment</li>
                <li>• Quality control measures</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-smooth">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-success rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Global Dashboard</CardTitle>
              <CardDescription>
                Real-time overview of all platform activity with comprehensive metrics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• System-wide statistics</li>
                <li>• Activity monitoring</li>
                <li>• Performance analytics</li>
                <li>• Resource allocation tracking</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-smooth">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-warning rounded-lg flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Request Tracking</CardTitle>
              <CardDescription>
                Monitor and manage all blood and organ requests across the entire network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Cross-hospital coordination</li>
                <li>• Urgent request prioritization</li>
                <li>• Resource redistribution</li>
                <li>• Fulfillment optimization</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">LifeSourceAdmin Platform</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 LifeSourceAdmin. Advanced healthcare management system.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
