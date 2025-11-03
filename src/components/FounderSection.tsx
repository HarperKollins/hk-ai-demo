import { Button } from "@/components/ui/button";
import { Linkedin, Twitter, Instagram, Globe } from "lucide-react";
import founderPhoto from "@/assets/founder-photo.jpeg";

export const FounderSection = () => {
  const socials = [
    { icon: Linkedin, label: "LinkedIn", url: "#" },
    { icon: Twitter, label: "Twitter", url: "#" },
    { icon: Instagram, label: "Instagram", url: "#" },
    { icon: Globe, label: "Website", url: "#" },
  ];

  return (
    <section id="founder" className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-elevated">
                <img 
                  src={founderPhoto} 
                  alt="Harper Kollins - Founder & CEO" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-2">
                  Harper Kollins
                </h2>
                <p className="text-xl text-primary font-medium">Founder & CEO</p>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Harper Kollins is an educator, entrepreneur, and advocate for
                transformative learning experiences. Through Harper Kollins Inc., he's
                building tools that help young people discover their potential and
                create their own paths to success.
              </p>
              <div className="flex gap-3">
                {socials.map((social, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="icon"
                    className="rounded-full hover:bg-gradient-hero hover:text-white hover:border-primary transition-all"
                    asChild
                  >
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
