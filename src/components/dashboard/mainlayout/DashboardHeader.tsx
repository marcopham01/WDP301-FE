import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface DashboardHeaderProps {
  user: { name: string; role: string };
  onLogout: () => void;
  notificationCount?: number;
  subtitle?: string;
}

export function DashboardHeader({
  user,
  onLogout,
  notificationCount = 0,
  subtitle,
}: DashboardHeaderProps) {
  const navigate = useNavigate();
  const handleLogout = () => {
    onLogout();
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };
  return (
    <header className="bg-card border-b border-border/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Chào mừng trở lại, {user.name}
          </h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full text-xs text-white flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {user.name.charAt(0)}
            </div>
            <div className="text-right">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {user.role}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Đăng xuất
          </Button>
        </div>
      </div>
    </header>
  );
}
