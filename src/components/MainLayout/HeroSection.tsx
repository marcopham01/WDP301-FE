import SlideArrowButton from "@/components/ui/slide-arrow-button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Zap, Shield, Clock, Users } from "lucide-react";
import heroImage from "@/assets/hero-ev-service.jpg";

const HeroSection = () => {
  const features = [
    { icon: Zap, title: "Công nghệ hiện đại", desc: "Thiết bị chẩn đoán EV tiên tiến" },
    { icon: Shield, title: "Bảo hành toàn diện", desc: "Cam kết chất lượng dịch vụ" },
    { icon: Clock, title: "Phục vụ 24/7", desc: "Hỗ trợ khẩn cấp mọi lúc" },
    { icon: Users, title: "Đội ngũ chuyên nghiệp", desc: "Kỹ thuật viên được chứng nhận" },
  ];

  const benefits = [
    "Quản lý lịch bảo dưỡng tự động",
    "Theo dõi trạng thái xe điện real-time", 
    "Đặt lịch dịch vụ online dễ dàng",
    "Thanh toán điện tử an toàn",
    "Lịch sử bảo dưỡng chi tiết",
    "Nhắc nhở bảo dưỡng thông minh"
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="EV Service Center" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        <div className="absolute inset-0 gradient-hero opacity-20" />
      </div>

      <div className="relative container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-slide-up">
            <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium">
                🚗⚡ Hệ thống quản lý bảo dưỡng xe điện
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                <span className="gradient-primary bg-clip-text text-transparent">
                  EV Service Center
                </span>
                <br />
                <span className="text-foreground">Management System</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                Giải pháp toàn diện cho trung tâm dịch vụ xe điện - từ đặt lịch bảo dưỡng 
                đến quản lý quy trình, tối ưu hóa hiệu quả và trải nghiệm khách hàng.
              </p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="flex justify-center sm:justify-start">
              <SlideArrowButton
                text="Đặt lịch bảo dưỡng"
                primaryColor="linear-gradient(90deg, #43ea6d 0%, #1abc9c 100%)"
                className="text-lg px-0 py-0"
                onClick={() => window.location.href = '/login'}
              />
            </div>
          </div>

          {/* Right Content - Feature Cards */}
          <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {features.map((feature, index) => (
              <Card key={index} className="p-6 shadow-card gradient-card border-0 hover:shadow-glow transition-smooth">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-1/4 right-10 w-4 h-4 bg-primary rounded-full animate-float opacity-60" />
      <div className="absolute top-3/4 right-1/4 w-6 h-6 bg-secondary rounded-full animate-float opacity-40" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-1/2 left-10 w-3 h-3 bg-charging-orange rounded-full animate-float opacity-50" style={{ animationDelay: '1s' }} />
    </section>
  );
};

export default HeroSection;