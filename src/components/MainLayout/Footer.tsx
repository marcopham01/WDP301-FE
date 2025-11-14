import { Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src={logo} alt="EV Service Logo" className="h-10 w-10 object-contain" />
              <div>
                <h3 className="text-xl font-bold">EV Service</h3>
                <p className="text-xs opacity-80">Management System</p>
              </div>
            </div>
            <p className="text-sm opacity-80">
              Giải pháp quản lý bảo dưỡng xe điện toàn diện, hiện đại và thông minh.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Liên kết nhanh</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><a href="/" className="hover:text-primary-glow transition-smooth">Trang chủ</a></li>
              <li><a href="/services" className="hover:text-primary-glow transition-smooth">Dịch vụ</a></li>
              <li><a href="/about" className="hover:text-primary-glow transition-smooth">Về chúng tôi</a></li>
              <li><a href="/contact" className="hover:text-primary-glow transition-smooth">Liên hệ</a></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-semibold">Dịch vụ</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>Bảo dưỡng định kỳ</li>
              <li>Sửa chữa xe điện</li>
              <li>Thay thế linh kiện</li>
              <li>Kiểm tra pin EV</li>
              <li>Hỗ trợ khẩn cấp</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold">Liên hệ</h4>
            <div className="space-y-3 text-sm opacity-80">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>support@evservice.vn</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+84 (12) 345-6789</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>FPT University HCMC</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-8 pt-8 text-center text-sm opacity-60">
          <p>&copy; 2024 EV Service Management System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;