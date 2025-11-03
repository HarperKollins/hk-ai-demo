import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import hkLogo from "@/assets/hk-logo.jpeg";

export const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const footerLinks = {
    Product: ["Features", "Pricing", "Beta Access", "Roadmap"],
    Company: ["About", "Team", "Careers", "Contact"],
    Resources: ["Blog", "Docs", "Support", "Community"],
    Legal: ["Privacy", "Terms", "Cookies", "Licenses"],
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <img 
                src={hkLogo} 
                alt="HK AI Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
            <p className="text-muted-foreground">
              Your personal AI mentor, helping you discover skills, create learning
              paths, and monetize your talents.
            </p>
            <p className="text-sm text-muted-foreground">
              © 2025 Harper Kollins Inc. All rights reserved.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Built with 💜 by Harper Kollins Inc.
          </p>
          <Button
            onClick={scrollToTop}
            variant="ghost"
            size="sm"
            className="gap-2"
            data-analytics="footer_back_to_top"
          >
            Back to top
            <ArrowUp className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </footer>
  );
};
