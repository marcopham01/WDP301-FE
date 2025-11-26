import { Button } from "@/components/ui/button";
// import { SidebarTrigger } from "@/components/ui/sidebar";
// import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react"; // Thêm import useState
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Thêm import Dialog components
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
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State cho dialog

  const handleLogout = () => {
    onLogout();
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  const handleConfirmLogout = () => {
    setIsDialogOpen(false); // Đóng dialog
    handleLogout(); // Thực hiện logout
  };

  return (
    <header className="relative px-4 sm:px-8 py-4 sm:py-6 border-b border-ev-green/20 bg-gradient-to-r bg-ev-green text-white shadow-md">
      <div className="absolute inset-0 opacity-15 pointer-events-none select-none [background:radial-gradient(600px_200px_at_20%_-20%,white,transparent)]" />
      <div className="relative flex flex-col sm:flex-row items-center sm:justify-between gap-4 sm:gap-6">
        <div className="flex flex-col items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left">
          {/* SidebarTrigger removed */}
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
              Chào mừng trở lại, {user.name}!
            </h1>
            <p className="text-xs sm:text-sm text-ev-green-50/90">
              {subtitle || "Staff Panel"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 ring-2 ring-white/40 text-white flex items-center justify-center text-xs sm:text-sm font-semibold shadow-sm">
              {user.name.charAt(0)}
            </div>
            <div className="text-right hidden sm:block">
              <p className="font-medium leading-none text-white">{user.name}</p>
              <p className="text-xs text-ev-green-50/80 capitalize">
                {user.role}
              </p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-white/15 hover:bg-white/25 text-white border-white/30 rounded-full px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm transition-all duration-200"
                variant="outline"
              >
                Đăng xuất
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Xác nhận đăng xuất</DialogTitle>
                <DialogDescription>
                  Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không? Hành động
                  này sẽ kết thúc phiên làm việc hiện tại.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button onClick={handleConfirmLogout}>Xác nhận</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}