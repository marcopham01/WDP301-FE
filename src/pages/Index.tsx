import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";

import FeedbackSection from "../components/FeedbackSection";
import Footer from "../components/Footer";
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
