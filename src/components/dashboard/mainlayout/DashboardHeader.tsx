import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
// import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
// Chat bubble moved to a global floating widget for staff; no header trigger

interface DashboardHeaderProps {
  user: { name: string; role: string };
  onLogout: () => void;
  subtitle?: string;
}

export function DashboardHeader({
  user,
  onLogout,
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
    <header className="relative px-6 py-5 border-b border-transparent bg-gradient-to-r from-ev-green to-teal-500 text-white shadow-sm">
      <div className="absolute inset-0 opacity-10 pointer-events-none select-none [background:radial-gradient(600px_200px_at_20%_-20%,white,transparent)]" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="text-white hover:bg-white/10" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Chào mừng trở lại, {user.name}</h1>
            <p className="text-sm text-green-50/90">{subtitle || "Staff Panel"}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/15 ring-2 ring-white/30 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
              {user.name.charAt(0)}
            </div>
            <div className="text-right">
              <p className="font-medium leading-none">{user.name}</p>
              <p className="text-xs text-green-50/80 capitalize">{user.role}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            variant="outline">
            Đăng xuất
          </Button>
        </div>
      </div>
    </header>
  );
}
