import { Check } from "lucide-react";

export const WhySection = () => {
  const benefits = [
    "Chat-first interface - no complex dashboards",
    "Personalized to your unique journey",
    "Backed by educational expertise",
    "Free to start, premium features available",
  ];

  return (
    <section id="why" className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Why
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                {" "}
                HK AI{" "}
              </span>
              is Different
            </h2>
            <p className="text-xl text-muted-foreground">
              Traditional education asks you to fit into a system. HK AI builds a
              system around you.
            </p>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-card border border-primary/20 flex items-center justify-center shadow-card overflow-hidden">
              <div className="text-center p-8 space-y-4">
                <div className="w-20 h-20 bg-gradient-hero rounded-full mx-auto shadow-glow" />
                <h3 className="text-2xl font-bold">Your Journey, Your Pace</h3>
                <p className="text-muted-foreground">
                  AI-powered mentorship that adapts to your life, not the other way around
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
