import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Map, DollarSign, MessageCircle } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Discover Skills",
    description: "Uncover hidden talents through AI-powered conversations",
    details:
      "HK AI analyzes your interests, experiences, and passions to reveal skills you didn't know you had. Through natural dialogue, it identifies your unique strengths and potential career paths.",
  },
  {
    icon: Map,
    title: "Learning Paths",
    description: "Personalized roadmaps tailored to your goals",
    details:
      "Get custom 30-day, 90-day, or 6-month learning plans designed around your schedule, learning style, and objectives. Each path includes milestones, resources, and progress tracking.",
  },
  {
    icon: DollarSign,
    title: "Monetization",
    description: "Turn your skills into income streams",
    details:
      "Discover practical ways to monetize your talents. From freelancing to digital products, HK AI provides actionable strategies to start earning from what you love.",
  },
  {
    icon: MessageCircle,
    title: "Chat Mentor",
    description: "24/7 AI guidance whenever you need it",
    details:
      "Your personal mentor is always available. Ask questions, get feedback, overcome obstacles, and stay motivated with intelligent, context-aware support.",
  },
];

export const Features = () => {
  const [selectedFeature, setSelectedFeature] = useState<typeof features[0] | null>(null);

  return (
    <section id="features" className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Everything You Need to
            <br />
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              Master Your Future
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete ecosystem designed to transform your potential into reality
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group cursor-pointer hover:shadow-elevated transition-all duration-300 border-primary/10 hover:border-primary/30 bg-card/50 backdrop-blur-sm"
              onClick={() => setSelectedFeature(feature)}
              data-analytics="feature_click"
              data-feature={feature.title}
            >
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow group-hover:shadow-elevated transition-all">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
                <div className="text-sm text-primary font-medium pt-2">
                  Learn more →
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedFeature && (
                <>
                  <div className="w-12 h-12 rounded-lg bg-gradient-hero flex items-center justify-center shadow-glow">
                    <selectedFeature.icon className="w-6 h-6 text-white" />
                  </div>
                  {selectedFeature.title}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-muted-foreground leading-relaxed">
              {selectedFeature?.details}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
