import Header from "../components/MainLayout/Header";
import HeroSection from "../components/MainLayout/HeroSection";
import FeaturesSection from "../components/HomePage/FeaturesSection";

import FeedbackSection from "../components/HomePage/FeedbackSection";
import Footer from "../components/MainLayout/Footer";
import { useScrollReveal } from "../lib/useScrollReveal";
import { useAuth } from "../context/AuthContext/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Index = () => {
  const heroRef = useScrollReveal<HTMLDivElement>({ direction: "up" });
  const featuresRef = useScrollReveal<HTMLDivElement>({ direction: "up" });
  const feedbackRef = useScrollReveal<HTMLDivElement>({ direction: "up" });
  const navigate = useNavigate();

  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success("Đăng xuất thành công!");
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  return (
    <div className="min-h-screen">
      <Header onLogout={handleLogout} />
      <main>
        <div ref={heroRef}>
          <HeroSection />
        </div>
        <div ref={featuresRef}>
          <FeaturesSection />
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
