import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";

interface AdminUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export function UserProfileDropdown() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const rawUser = localStorage.getItem("adminUser");

  const user: AdminUser | null = rawUser
    ? JSON.parse(rawUser)
    : null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const fullName = user
    ? `${user.firstName} ${user.lastName}`
    : "Admin";

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user
                ? getInitials(user.firstName, user.lastName)
                : "SA"}
            </AvatarFallback>
          </Avatar>

          <div className="hidden md:flex flex-col items-start text-left">
            <span className="text-sm font-medium">
              {fullName}
            </span>
            <span className="text-xs text-muted-foreground">
              {user?.role ?? "Super Admin"}
            </span>
          </div>

          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 bg-popover border shadow-medium"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">
              {fullName}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.email ?? "admin@lifesource.com"}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => navigate("/profile")}
          className="cursor-pointer"
        >
          <User className="w-4 h-4 mr-2" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate("/settings")}
          className="cursor-pointer"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
