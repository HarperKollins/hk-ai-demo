// src/components/CheckpointModal.tsx

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkpoint } from "@/types/lesson";
import { Loader2, Check, X } from "lucide-react";

interface CheckpointModalProps {
  checkpoint: Checkpoint | null;
  open: boolean;
  onClose: (passed: boolean) => void;
}

type Status = "idle" | "loading" | "pass" | "fail";

export const CheckpointModal = ({ checkpoint, open, onClose }: CheckpointModalProps) => {
  const [answerText, setAnswerText] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (open) {
      setStatus("idle");
      setFeedback("");
      setAnswerText("");
      setDriveLink("");
    }
  }, [open, checkpoint]);

  const handleSubmit = async () => {
    if (!checkpoint) return;

    setStatus("loading");
    setFeedback("");

    const submissionText =
      checkpoint.type === "project"
        ? `Google Drive Link: ${driveLink}\n\nDescription: ${answerText}`
        : answerText;

    try {
      const res = await fetch("/api/checkpoint/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkpointId: checkpoint.id,
          checkpointTopic: checkpoint.topic, 
          checkpointType: checkpoint.type,   
          answerText: submissionText,
        }),
      });

      if (!res.ok) {
        throw new Error("Network response was not ok");
      }

      const result = await res.json();

      if (result.passed) {
        setStatus("pass");
        setFeedback(result.feedback);
      } else {
        setStatus("fail");
        setFeedback(result.feedback);
      }
    } catch (err) {
      setStatus("fail");
      setFeedback("An error occurred while grading. Please try again.");
    }
  };

  const handleClose = () => {
    onClose(status === 'pass');
  };

  const handleTryAgain = () => {
    setStatus("idle");
    setFeedback("");
  };

  const isSubmitDisabled = 
    status === 'loading' ||
    (checkpoint?.type === 'quiz' && !answerText.trim()) ||
    (checkpoint?.type === 'project' && !driveLink.trim());

  const renderContent = () => {
    if (status === "loading") {
      return (
        <div className="flex flex-col items-center justify-center h-40">
          <Loader2 className="w-12 h-12 animate-spin text-[#00a884]" />
          <p className="mt-4 text-muted-foreground">Grading your answer...</p>
        </div>
      );
    }

    if (status === "pass") {
      return (
        <>
          <div className="flex flex-col items-center justify-center h-40">
            <Check className="w-16 h-16 text-green-500" />
            <p className="mt-4 font-semibold text-lg">Great job!</p>
            <p className="mt-2 text-center text-muted-foreground">{feedback}</p>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleClose} 
              className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-white"
            >
              Continue Lesson
            </Button>
          </DialogFooter>
        </>
      );
    }

    if (status === "fail") {
      return (
        <>
          <div className="flex flex-col items-center justify-center h-40">
            <X className="w-16 h-16 text-destructive" />
            <p className="mt-4 font-semibold text-lg">Not quite...</p>
            <p className="mt-2 text-center text-muted-foreground">{feedback}</p>
          </div>
          <DialogFooter>
            <Button onClick={handleTryAgain} className="w-full" variant="outline">
              Try Again
            </Button>
          </DialogFooter>
        </>
      );
    }

    // --- THIS IS THE FIX ---
    // This <p> tag displays the actual question from the AI
    return (
      <>
        {/* THIS IS THE NEW PART THAT SHOWS THE QUESTION */}
        <p className="py-4 text-white/90 whitespace-pre-line">
          {checkpoint?.question}
        </p>

        <div className="space-y-4">
          {checkpoint?.type === "quiz" && (
            <div className="space-y-2">
              <Label htmlFor="answer">Your Answer</Label>
              <Textarea
                id="answer"
                placeholder="Type your answer here..."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={5}
                className="bg-[#1a1a1a] border-white/10 text-white"
              />
            </div>
          )}
          {checkpoint?.type === "project" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="driveLink">Public Google Drive Link</Label>
                <Input
                  id="driveLink"
                  placeholder="https://drive.google.com/..."
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  className="bg-[#1a1a1a] border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Describe your project</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., 'I created an index.html file with a heading...'"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  rows={3}
                  className="bg-[#1a1a1a] border-white/10 text-white"
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="pt-4">
          <Button 
            onClick={handleSubmit} 
            className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-white" 
            disabled={isSubmitDisabled}
          >
            Submit
          </Button>
        </DialogFooter>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && status !== 'idle' && status !== 'loading') {
        handleClose();
      }
    }}>
      <DialogContent 
        className="sm:max-w-md bg-[#0a0a0a] border-white/10 text-white" 
        onInteractOutside={(e) => {
          if (status === 'idle' || status === 'loading') {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (status === 'idle' || status === 'loading') {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white">{checkpoint?.topic}</DialogTitle>
          <DialogDescription>
            {checkpoint?.type === 'quiz' 
              ? "Time for a quick question to check your understanding." 
              : "Time to complete your project. Submit your link below."}
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};