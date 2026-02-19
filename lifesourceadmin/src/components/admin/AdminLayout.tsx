import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building2,
  FileText,
  BarChart3,
  Megaphone,
  Bell,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import Logo from '@/assets/logo.svg';
import LogoText from '@/assets/logo-text.svg';
import { UserProfileDropdown } from "./UserProfileDropdown";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "hospitals", label: "Hospitals", icon: Building2 },
  { id: "users", label: "Users", icon: Users },
  { id: "requests", label: "Requests", icon: FileText },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "announcements", label: "Announcements", icon: Megaphone },
];

export function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-soft">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Link to="/admin" className="flex items-center gap-2">
                <img src={Logo} className="w-16 h-16" alt="LifeSourceAdmin" />
                <img src={LogoText} className="w-[120px]" alt="LifeSourceAdmin" />
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full text-xs flex items-center justify-center text-secondary-foreground">
                3
              </span>
            </Button>
            <UserProfileDropdown />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "sticky top-16 h-[calc(100vh-4rem)] bg-card border-r transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}>
          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start transition-smooth",
                    sidebarOpen ? "px-3" : "px-2 justify-center"
                  )}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className="w-4 h-4" />
                  {sidebarOpen && (
                    <span className="ml-2">{item.label}</span>
                  )}
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}