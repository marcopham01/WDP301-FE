import Header from "../components/MainLayout/Header";
import HeroSection from "../components/MainLayout/HeroSection";
import FeaturesSection from "../components/HomePage/FeaturesSection";

import FeedbackSection from "../components/HomePage/FeedbackSection";
import Footer from "../components/MainLayout/Footer";
import { useScrollReveal } from "../lib/useScrollReveal";
import { useAuth } from "../context/AuthContext/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ChatWidget from "@/components/ChatWidget";
import NearbyCenters from "@/components/HomePage/NearbyCenters";

const Index = () => {
  const heroRef = useScrollReveal<HTMLDivElement>({ direction: "up" });
  const featuresRef = useScrollReveal<HTMLDivElement>({ direction: "up" });
  const feedbackRef = useScrollReveal<HTMLDivElement>({ direction: "up" });
  const navigate = useNavigate();

  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    setTimeout(() => {
      navigate("/login");
    }, 1000);
    toast.success("Đăng xuất thành công!");

  };

  return (
    <div className="min-h-screen">
      <Header onLogout={handleLogout} />
      <main>
        <div ref={heroRef}>
          <HeroSection />
        </div>
        {user && <ChatWidget />}
        <div ref={featuresRef} id="features-section">
          <FeaturesSection />
        </div>
        
        {/* Stats Section */}
        <div className="py-12 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">50+</div>
                <div className="text-sm text-gray-600">Trung tâm dịch vụ</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">10k+</div>
                <div className="text-sm text-gray-600">Khách hàng tin tưởng</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">24/7</div>
                <div className="text-sm text-gray-600">Hỗ trợ</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-16">
          <NearbyCenters />
        </div>
        <div ref={feedbackRef}>
          <FeedbackSection />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
