import Header from "../components/MainLayout/Header";
import HeroSection from "../components/MainLayout/HeroSection";
import FeaturesSection from "../components/HomePage/FeaturesSection";

import FeedbackSection from "../components/HomePage/FeedbackSection";
import Footer from "../components/MainLayout/Footer";
import { useScrollReveal } from "../lib/useScrollReveal";

const Index = () => {
  const heroRef = useScrollReveal<HTMLDivElement>({ direction: "up" });
  const featuresRef = useScrollReveal<HTMLDivElement>({ direction: "up" });
  const feedbackRef = useScrollReveal<HTMLDivElement>({ direction: "up" });

  return (
    <div className="min-h-screen">
      <Header />
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
