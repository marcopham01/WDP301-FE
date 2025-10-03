import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import SwipeButton from "@/components/ui/swipe-button";
import { Car, Zap, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext/useAuth";

interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

interface HeaderProps {
  navItems?: NavItem[];
  showLogout?: boolean;
  onLogout?: () => void;
}

const Header = ({ navItems, showLogout, onLogout }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(window.scrollY);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

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
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      active: location.pathname === "/",
    },
    { label: "Đặt lịch", href: "/booking", active: location.pathname.startsWith("/booking") },
    { label: "Về chúng tôi", href: "/about", active: location.pathname.startsWith("/about") },
    { label: "Liên hệ", href: "/contact", active: location.pathname.startsWith("/contact") },
  ];
  const menuItems = navItems || defaultNavItems;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b transition-transform duration-500 ${showHeader ? "translate-y-0" : "-translate-y-full"}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Car className="h-8 w-8 text-primary" />
              <Zap className="h-4 w-4 text-secondary absolute -top-1 -right-1" />
            </div>
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
            {user && showLogout ? (
              <Button className="bg-ev-green text-white px-6" onClick={onLogout}>Đăng xuất</Button>
            ) : (
              <SwipeButton
                firstText="Đăng nhập"
                secondText="Đăng ký"
                firstClass="bg-ev-green text-white"
                secondClass="bg-black text-white"
                onClick={e => {
                  if (e.currentTarget.matches(':hover')) {
                    navigate('/register');
                  } else {
                    navigate('/login');
                  }
                }}
              />
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
              {user && showLogout ? (
                <Button className="bg-ev-green text-white w-full" onClick={() => { setIsMenuOpen(false); onLogout && onLogout(); }}>Đăng xuất</Button>
              ) : (
                <SwipeButton
                  firstText="Đăng nhập"
                  secondText="Đăng ký"
                  firstClass="bg-ev-green text-white"
                  secondClass="bg-black text-white"
                  className="justify-start"
                  onClick={e => {
                    setIsMenuOpen(false);
                    if (e.currentTarget.matches(':hover')) {
                      navigate('/register');
                    } else {
                      navigate('/login');
                    }
                  }}
                />
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
