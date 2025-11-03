import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { WhySection } from "@/components/WhySection";
import { CTASection } from "@/components/CTASection";
import { AboutSection } from "@/components/AboutSection";
import { FounderSection } from "@/components/FounderSection";
import { Footer } from "@/components/Footer";
import { WaitlistModal } from "@/components/WaitlistModal";

const Index = () => {
  const navigate = useNavigate();
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const handleTryBeta = () => {
    navigate("/dashboard");
  };

  const handleJoinWaitlist = () => {
    setWaitlistOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onTryBeta={handleTryBeta} />
      
      <main>
        <Hero onTryBeta={handleTryBeta} />
        <Features />
        <WhySection />
        <CTASection onJoinWaitlist={handleJoinWaitlist} />
        <AboutSection />
        <FounderSection />
      </main>

      <Footer />

      {/* Modals */}
      <WaitlistModal
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
      />
    </div>
  );
};

export default Index;
