import { Card } from "@/components/ui/card";
import { Calendar, Bell, CreditCard, BarChart3, MessageSquare, Cog, Battery, Zap } from "lucide-react";

const FeaturesSection = () => {
  const customerFeatures = [
    {
      icon: Calendar,
      title: "Đặt lịch trực tuyến",
      description: "Đặt lịch bảo dưỡng/sửa chữa 24/7, chọn trung tâm và loại dịch vụ phù hợp"
    },
    {
      icon: Bell,
      title: "Nhắc nhở thông minh", 
      description: "Tự động nhắc bảo dưỡng theo km/thời gian, thanh toán gói dịch vụ"
    },
    {
      icon: CreditCard,
      title: "Thanh toán tiện lợi",
      description: "Thanh toán online qua e-wallet, banking với bảo mật cao"
    },
    {
      icon: Battery,
      title: "Theo dõi pin EV",
      description: "Giám sát tình trạng pin, dung lượng và chu kỳ sạc điện"
    }
  ];

  const staffFeatures = [
    {
      icon: MessageSquare,
      title: "Chat trực tuyến",
      description: "Hỗ trợ khách hàng real-time, tư vấn dịch vụ chuyên nghiệp"
    },
    {
      icon: BarChart3,
      title: "Quản lý lịch hẹn",
      description: "Phân công kỹ thuật viên, quản lý hàng chờ hiệu quả"
    },
    {
      icon: Cog,
      title: "Quy trình chuẩn",
      description: "Checklist bảo dưỡng EV, phiếu tiếp nhận dịch vụ điện tử"
    },
    {
      icon: Zap,
      title: "AI Insights",
      description: "Gợi ý phụ tùng, dự đoán nhu cầu bảo dưỡng bằng AI"
    }
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Tính năng <span className="gradient-primary bg-clip-text text-transparent">nổi bật</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Giải pháp toàn diện với công nghệ AI và automation, tối ưu hóa quy trình bảo dưỡng xe điện
          </p>
        </div>

        {/* Customer Features */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">Dành cho Khách hàng</h3>
            <p className="text-muted-foreground">Trải nghiệm dịch vụ tuyệt vời với công nghệ hiện đại</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {customerFeatures.map((feature, index) => (
              <Card 
                key={index}
                className="p-6 shadow-card hover:shadow-glow transition-smooth group cursor-pointer gradient-card border-0"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center group-hover:scale-110 transition-bounce">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Staff Features */}
        <div>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">Dành cho Trung tâm dịch vụ</h3>
            <p className="text-muted-foreground">Công cụ quản lý mạnh mẽ với AI và tự động hóa</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {staffFeatures.map((feature, index) => (
              <Card 
                key={index}
                className="p-6 shadow-card hover:shadow-glow transition-smooth group cursor-pointer gradient-card border-0"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg gradient-secondary flex items-center justify-center group-hover:scale-110 transition-bounce">
                    <feature.icon className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-20">
          <Card className="p-8 gradient-card border-0 shadow-card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">50+</div>
                <div className="text-sm text-muted-foreground">Trung tâm dịch vụ</div>
              </div>
              <div>
                <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">10k+</div>
                <div className="text-sm text-muted-foreground">Khách hàng tin tưởng</div>
              </div>
              <div>
                <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">24/7</div>
                <div className="text-sm text-muted-foreground">Hỗ trợ</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
