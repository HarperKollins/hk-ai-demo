import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import hkLogo from "@/assets/hk-logo.jpeg";

interface NavbarProps {
  onTryBeta: () => void;
}

export const Navbar = ({ onTryBeta }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  const navItems = [
    { label: "Home", id: "home" },
    { label: "Features", id: "features" },
    { label: "Why HK AI", id: "why" },
    { label: "About", id: "about" },
    { label: "Founder", id: "founder" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-lg shadow-card"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => scrollToSection("home")}
            className="flex items-center gap-2 group"
            data-analytics="nav_logo"
          >
            <img 
              src={hkLogo} 
              alt="HK AI Logo" 
              className="w-12 h-12 object-contain transition-all group-hover:scale-105"
            />
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-foreground/70 hover:text-foreground transition-colors font-medium"
                data-analytics={`nav_${item.id}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button
              onClick={onTryBeta}
              variant="hero"
              size="lg"
              data-analytics="cta_try_beta_nav"
            >
              Try HK AI Beta
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
            data-analytics="nav_mobile_toggle"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4 animate-in slide-in-from-top">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="block w-full text-left py-2 text-foreground/70 hover:text-foreground transition-colors font-medium"
                data-analytics={`nav_mobile_${item.id}`}
              >
                {item.label}
              </button>
            ))}
            <Button
              onClick={onTryBeta}
              variant="hero"
              className="w-full"
              data-analytics="cta_try_beta_mobile"
            >
              Try HK AI Beta
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};
