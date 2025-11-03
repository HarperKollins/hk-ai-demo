import { Card, CardContent } from "@/components/ui/card";
import { Building, GraduationCap, Zap, Mic } from "lucide-react";

const projects = [
  {
    icon: Building,
    name: "Adullam Studios",
    description: "Creative agency focused on transformative digital experiences",
  },
  {
    icon: GraduationCap,
    name: "HK Academy",
    description: "Educational platform empowering learners worldwide",
  },
  {
    icon: Zap,
    name: "PowerShift",
    description: "Youth empowerment initiative building future leaders",
  },
  {
    icon: Mic,
    name: "Rollercoaster Podcast",
    description: "Conversations about life, growth, and navigating challenges",
  },
];

export const AboutSection = () => {
  return (
    <section id="about" className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Part of the
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              {" "}
              Harper Kollins{" "}
            </span>
            Ecosystem
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            HK AI is one of several initiatives by Harper Kollins Inc., all dedicated
            to empowering the next generation
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.map((project, index) => (
            <Card
              key={index}
              className="group hover:shadow-elevated transition-all duration-300 border-primary/10 hover:border-primary/30 bg-card/50 backdrop-blur-sm"
            >
              <CardContent className="p-6 space-y-4 text-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-hero flex items-center justify-center mx-auto shadow-glow group-hover:shadow-elevated transition-all">
                  <project.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold">{project.name}</h3>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
