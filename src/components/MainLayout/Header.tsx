import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Bell, Calendar, CreditCard, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { config } from "@/config/config";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BASE_URL = config.API_BASE_URL;

interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

interface HeaderProps {
  navItems?: NavItem[];
  onLogout?: () => void;
}

const Header = ({ navItems, onLogout }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const lastScrollY = useRef(window.scrollY);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Debug log
  useEffect(() => {
    if (user) {
      console.log('🎨 [Header] User updated:', { 
        id: user.id, 
        fullName: user.fullName, 
        avatar: user.avatar,
        hasAvatar: !!user.avatar 
      });
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 80) {
        setShowHeader(false); // cuộn xuống ẩn header
      } else if (currentY < lastScrollY.current) {
        setShowHeader(true); // cuộn lên hiện header
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Nếu không truyền navItems, dùng mặc định (chưa đăng nhập)
  const defaultNavItems: NavItem[] = [
    {
      label: "Trang chủ",
      href: "/",
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (location.pathname !== "/") {
          navigate("/");
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      },
      active: location.pathname === "/",
    },
    { label: "Đặt lịch", href: "/booking", active: location.pathname.startsWith("/booking") },
    { label: "Về chúng tôi", href: "/about", active: location.pathname.startsWith("/about") },
    { label: "Liên hệ", href: "/contact", active: location.pathname.startsWith("/contact") },
  ];
  const menuItems = navItems || defaultNavItems;

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    setLogoutDialogOpen(false);
    onLogout?.();
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b transition-transform duration-500 ${showHeader ? "translate-y-0" : "-translate-y-full"}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <img src={logo} alt="EV Service Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
                EV Service
              </h1>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  "text-foreground hover:text-primary transition-smooth",
                  item.active && "font-semibold text-primary"
                )}
                onClick={item.onClick || ((e) => {
                  e.preventDefault();
                  navigate(item.href);
                })}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative"
                  onClick={() => navigate('/customer/chat')}
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
                <NotificationDropdown>
                  <div className="relative cursor-pointer">
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                    </Button>
                  </div>
                </NotificationDropdown>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        {user.avatar && (
                          <AvatarImage src={`${BASE_URL}${user.avatar}`} alt={user.fullName || user.username || ""} />
                        )}
                        <AvatarFallback>
                          {(user.fullName || user.username || user.email || "").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.fullName || user.username}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/customer/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Hồ sơ</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/customer/vehicles")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Quản lý xe</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/customer/booking-history")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Lịch sử đặt lịch</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/customer/payment-history")}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Lịch sử thanh toán</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogoutClick}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="h-10 px-5 min-w-[120px] text-sm font-medium rounded-md border border-ev-green/40 bg-ev-green/5 text-ev-green hover:bg-ev-green/10 hover:text-ev-green"
                >
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="h-10 px-5 min-w-[120px] text-sm font-medium rounded-md bg-ev-green text-white hover:bg-ev-green/90"
                >
                  Đăng ký
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          isMenuOpen ? "max-h-96 pb-4" : "max-h-0"
        )}>
          <nav className="flex flex-col space-y-3 pt-4">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  "text-foreground hover:text-primary transition-smooth px-4 py-2",
                  item.active && "font-semibold text-primary"
                )}
                onClick={e => {
                  setIsMenuOpen(false);
                  if (item.onClick) item.onClick(e);
                  else {
                    e.preventDefault();
                    navigate(item.href);
                  }
                }}
              >
                {item.label}
              </a>
            ))}
            <div className="flex flex-col space-y-2 px-4 pt-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="relative flex-1 justify-start"
                      onClick={() => { setIsMenuOpen(false); navigate('/customer/chat'); }}
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      <span className="text-sm">Chat</span>
                    </Button>
                    <NotificationDropdown>
                      <div className="relative cursor-pointer flex-1">
                        <Button variant="ghost" size="sm" className="relative w-full justify-start">
                          <Bell className="h-5 w-5 mr-2" />
                          <span className="text-sm">Thông báo</span>
                        </Button>
                      </div>
                    </NotificationDropdown>
                  </div>
                  <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        {user.avatar && (
                          <AvatarImage src={`${BASE_URL}${user.avatar}`} alt={user.fullName || user.username || ""} />
                        )}
                        <AvatarFallback>
                          {(user.fullName || user.username || user.email || "").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.fullName || user.username}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { setIsMenuOpen(false); navigate("/customer/profile"); }}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Hồ sơ</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setIsMenuOpen(false); navigate("/customer/vehicles"); }}>
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Quản lý xe</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setIsMenuOpen(false); navigate("/customer/booking-history"); }}>
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Lịch sử đặt lịch</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setIsMenuOpen(false); navigate("/customer/payment-history"); }}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Lịch sử thanh toán</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { setIsMenuOpen(false); handleLogoutClick(); }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    className="h-11 px-5 w-full text-sm font-medium rounded-md border border-ev-green/40 bg-ev-green/5 text-ev-green hover:bg-ev-green/10 hover:text-ev-green"
                    onClick={() => { setIsMenuOpen(false); navigate('/login'); }}
                  >
                    Đăng nhập
                  </Button>
                  <Button
                    className="h-11 px-5 w-full text-sm font-medium rounded-md bg-ev-green text-white hover:bg-ev-green/90"
                    onClick={() => { setIsMenuOpen(false); navigate('/register'); }}
                  >
                    Đăng ký
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đăng xuất</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>
              Đăng xuất
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
};

export default Header;
