import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (profile: UserProfile) => void;
}

export interface UserProfile {
  name: string;
  email: string;
  goal: string;
  source: string;
}

export const OnboardingModal = ({ open, onOpenChange, onComplete }: OnboardingModalProps) => {
  const [formData, setFormData] = useState<UserProfile>({
    name: "",
    email: "",
    goal: "",
    source: "landing_page",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.goal) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Simulate API call to waitlist endpoint
    console.log("Waitlist submission:", formData);
    
    toast({
      title: "Welcome to HK AI! 🎉",
      description: "Your profile has been created. Let's start chatting!",
    });

    onComplete(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to HK AI</DialogTitle>
          <p className="text-muted-foreground">
            Let's personalize your experience
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              data-analytics="onboarding_name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              data-analytics="onboarding_email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">What's your main goal?</Label>
            <Textarea
              id="goal"
              placeholder="E.g., Learn web development, Start a side hustle..."
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              rows={3}
              data-analytics="onboarding_goal"
            />
          </div>

          <Button
            type="submit"
            variant="hero"
            className="w-full"
            size="lg"
            data-analytics="onboarding_submit"
          >
            Start My Journey
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
