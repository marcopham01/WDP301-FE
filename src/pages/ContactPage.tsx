import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, MessageSquare, Headphones, Send, Clock } from "lucide-react";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { toast } from "react-toastify";

const DEST_LAT = 10.8511877;
const DEST_LNG = 106.8073073;

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setSubmitting(false);
    }, 1500);
  };

  const openDirections = () => {
    const dest = `${DEST_LAT},${DEST_LNG}`;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const origin = `${latitude},${longitude}`;
          window.open(
            `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`,
            "_blank"
          );
        },
        () => {
          window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${dest}`,
            "_blank"
          );
        },
        { timeout: 5000 }
      );
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${dest}`,
        "_blank"
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
    toast.success("Đăng xuất thành công!");

  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col bg-gradient-to-br from-ev-green-light via-green-50/30 to-teal-50/20"
    >
      <Header onLogout={handleLogout} />
      
      <main className="flex-1 py-8">
        <div className="container max-w-7xl pt-20 space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-ev-green"
            >
              Liên hệ với chúng tôi
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground max-w-2xl mx-auto"
            >
              Có câu hỏi về dịch vụ hoặc điện xăng giao dụng? Đội tư vấn của chúng tôi đã sẵn sàng tư vấn và hỗ trợ cho bạn. Đừng ngại để lại các thông tin và câu hỏi ở bên dưới nhé.
            </motion.p>
          </div>

          {/* Contact Methods */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <Card className="hover:shadow-lg transition-shadow min-h-[170px]">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Điện thoại</h3>
                  <p className="text-xs text-muted-foreground">Thứ 2-6 8:00-18:00, Thứ 7 9:00-16:00</p>
                  <p className="text-sm font-medium text-ev-green mt-2">+84 (12) 345-6789</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow min-h-[170px]">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Email</h3>
                  <p className="text-xs text-muted-foreground">Phản hồi trong vòng 24 giờ</p>
                  <p className="text-sm font-medium text-ev-green mt-2">support@evcare.vn</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow min-h-[170px]">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Trụ sở</h3>
                  <p className="text-xs text-muted-foreground">Đến trực tiếp để được hỗ trợ</p>
                  <p className="text-sm font-medium text-ev-green mt-2">FPT University HCMC</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow min-h-[170px]">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Giờ làm việc</h3>
                  <p className="text-xs text-muted-foreground">Thứ 7: 9:00 - 16:00, Chủ nhật: Nghỉ</p>
                  <p className="text-sm font-medium text-ev-green mt-2">Thứ 2-6: 8:00 - 18:00</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Support Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-center mb-6">Nhận hỗ trợ</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Tư vấn/đặt lịch trực tuyến</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Nhấn vào để kết nối trực tiếp tư vấn với ưu đãi
                    </p>
                    <Button className="w-full bg-gradient-to-r from-ev-green to-teal-500 hover:from-green-700 hover:to-teal-600">
                      Nhắn tin
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                    <Headphones className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Hỗ trợ qua điện thoại</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Nhấn vào đây tư vấn viên của EV CAR
                    </p>
                    <Button className="w-full bg-gradient-to-r from-ev-green to-teal-500 hover:from-green-700 hover:to-teal-600">
                      Gọi ngay
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto">
                    <Mail className="w-8 h-8 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Hỗ trợ qua email</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Gửi email, dễ dàng để chúng tôi hỗ trợ bạn
                    </p>
                    <Button className="w-full bg-gradient-to-r from-ev-green to-teal-500 hover:from-green-700 hover:to-teal-600">
                      Gửi email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Visit HQ Info (placed under Support options) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="text-center space-y-3"
          >
            <h2 className="text-2xl font-bold">Ghé thăm trụ sở của chúng tôi</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-sm">
              Đội ngũ chăm sóc khách hàng thường trực để hỗ trợ bạn. Đến trực tiếp nếu cần tư vấn chuyên sâu hoặc trải nghiệm dịch vụ tại chỗ.
            </p>
          </motion.div>

          {/* Contact Form & Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 auto-rows-fr"
          >
            {/* Form */}
            <Card className="h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <h2 className="text-xl font-bold mb-3">Gửi tin nhắn cho chúng tôi</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Cảm ơn bạn. Vui lòng điền các thông tin dưới đây để chúng tôi hỗ trợ nhanh hơn.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Họ và tên *</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nhập họ và tên"
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Địa chỉ Email *</label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Nhập địa chỉ email"
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Số điện thoại *</label>
                    <Input
                      type="tel"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Nhập số điện thoại"
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Nội dung</label>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Vui lòng nhập nội dung tin nhắn tại đây..."
                      rows={5}
                      className="w-full resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-2 bg-gradient-to-r from-ev-green to-teal-500 hover:from-green-700 hover:to-teal-600 gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? "Đang gửi..." : "Gửi tin nhắn"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Map Embed */}
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <div className="relative w-full h-[520px] md:h-[560px] rounded-lg overflow-hidden">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.4446862023377!2d106.80730731533428!3d10.851187792276238!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752731176b07b1%3A0xb752b24b379bae5e!2sFPT%20University%20HCMC!5e0!3m2!1sen!2s!4v1699999999999!5m2!1sen!2s"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="FPT University HCM Location"
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-t bg-white/70">
                  <div className="text-xs text-muted-foreground">Lô E2a-7, Đường D1, TP. Thủ Đức, HCM</div>
                  <Button size="sm" variant="outline" className="h-8" onClick={openDirections}>
                    Chỉ đường
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* (Removed duplicate bottom HQ section after moving it above) */}
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default ContactPage;
