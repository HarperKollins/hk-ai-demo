// src/components/ChatInterface.tsx

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare } from "lucide-react";
import { UserProfile } from "./OnboardingModal";
import hkLogo from "@/assets/hk-logo.jpeg";
import { cn } from "@/lib/utils"; 

import YouTubeEmbed from "./YouTubeEmbed";
import { VideoLessonPlayer, VideoPlayerHandle } from "./VideoLessonPlayer";
import { CheckpointModal } from "./CheckpointModal";
import { Checkpoint, LessonPayload, VideoData } from "@/types/lesson"; // Import all types
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string | { type: 'video', data: VideoData };
  isTyping?: boolean;
}

interface ChatInterfaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile | null;
}

// --- Progress Hook (No changes) ---
const useVideoProgress = (videoId: string | null) => {
  const [startTime, setStartTime] = useState(0);
  const [completedCheckpoints, setCompletedCheckpoints] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false); 

  useEffect(() => {
    if (!videoId) {
      setIsLoaded(true); 
      return;
    }
    
    setIsLoaded(false);
    try {
      const key = `hk_progress_${videoId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        setStartTime(parsed.lastTimeSeconds || 0);
        setCompletedCheckpoints(parsed.completedCheckpoints || []);
      } else {
        setStartTime(0);
        setCompletedCheckpoints([]);
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
      setStartTime(0);
      setCompletedCheckpoints([]);
    }
    setIsLoaded(true); 
    
  }, [videoId]);

  const saveTime = (time: number) => {
    if (!videoId || !isLoaded) return;
    try {
      const key = `hk_progress_${videoId}`;
      const progress = {
        lastTimeSeconds: time,
        completedCheckpoints: completedCheckpoints
      };
      localStorage.setItem(key, JSON.stringify(progress));
    } catch (error) {
      console.error("Failed to save time:", error);
    }
  };

  const completeCheckpoint = (id: string) => {
    if (!videoId || !isLoaded) return;
    try {
      const key = `hk_progress_${videoId}`;
      const newCompleted = Array.from(new Set([...completedCheckpoints, id])); 
      setCompletedCheckpoints(newCompleted);
      
      const raw = localStorage.getItem(key);
      const lastTime = raw ? JSON.parse(raw).lastTimeSeconds : startTime; 
      
      const progress = {
        lastTimeSeconds: lastTime,
        completedCheckpoints: newCompleted
      };
      localStorage.setItem(key, JSON.stringify(progress));
    } catch (error) {
      console.error("Failed to save checkpoint:", error);
    }
  };

  return { startTime, completedCheckpoints, saveTime, completeCheckpoint, isProgressLoaded: isLoaded };
};
// --- (END) Progress Hook ---


export const ChatInterface = ({ open, onOpenChange, userProfile }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      // --- FIX: The generic, non-conversational greeting is GONE ---
      content: userProfile
        ? `Hey ${userProfile.name}! 👋 I'm HK AI, your personal mentor. What's on your mind today?`
        : "Welcome! What would you like to explore first?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [activeLesson, setActiveLesson] = useState<LessonPayload | null>(null);
  const playerRef = useRef<VideoPlayerHandle>(null);
  const { 
    startTime, 
    completedCheckpoints, 
    saveTime, 
    completeCheckpoint,
    isProgressLoaded
  } = useVideoProgress(activeLesson?.videoData.videoId || null);

  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- (NEW) This effect runs AFTER the lesson is loaded ---
  useEffect(() => {
    // If we have a lesson, AND it's a dynamic one (empty checkpoints),
    // AND we have a video ID...
    if (activeLesson && activeLesson.source === 'youtube_dynamic_search' && activeLesson.checkpoints.length === 0) {
      const videoId = activeLesson.videoData.videoId;
      const videoTitle = activeLesson.videoData.title;

      // ...then we call our NEW API in the background.
      console.log("Dynamic lesson detected. Fetching checkpoints in background...");
      
      const generateCheckpoints = async () => {
        try {
          const res = await fetch("/api/lesson/generate_checkpoints", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videoId, videoTitle }),
          });
          if (!res.ok) throw new Error("Failed to generate checkpoints");
          
          const { checkpoints } = await res.json();
          
          if (checkpoints && checkpoints.length > 0) {
            console.log("Successfully loaded dynamic checkpoints:", checkpoints);
            // Hot-load the new checkpoints into the active lesson
            setActiveLesson(prevLesson => ({
              ...prevLesson!,
              checkpoints: checkpoints
            }));
            
            toast({
              title: "Lesson Plan Generated!",
              description: "I've created a custom learning plan for this video.",
            });
          }
        } catch (error: any) {
          console.error("Error generating checkpoints:", error.message);
          // Don't bother the user, just log it. The video will still play.
        }
      };
      
      generateCheckpoints();
    }
  }, [activeLesson]); // This runs only when `activeLesson` changes

  // --- (MODIFIED) This function is now FAST ---
  const fetchLesson = async (topicSlug: string) => {
    try {
      const res = await fetch("/api/lesson/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicSlug }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch lesson");
      }
      
      const lessonData: LessonPayload = await res.json();
      setActiveLesson(lessonData); // This will make the video player appear FAST

      const lessonMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Great! I've loaded the lesson: "${lessonData.videoData.title}". The player is now active. Let's start!`
      };
      setMessages((prev) => [...prev.filter(m => m.id !== "typing-indicator"), lessonMessage]);

    } catch (err: any) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Sorry, I had trouble finding that lesson: ${err.message}`,
      };
      setMessages((prev) => [...prev.filter(m => m.id !== "typing-indicator"), errorMessage]);
    }
    setIsTyping(false); 
  };


  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = { 
      id: crypto.randomUUID(),
      role: "user", 
      content: textToSend,
    };
    
    const typingMessage: Message = {
      id: "typing-indicator",
      role: "assistant",
      content: "",
      isTyping: true,
    };

    const messagesForHistory = [...messages, userMessage];
    setMessages([...messages, userMessage, typingMessage]);
    setInput("");
    setIsTyping(true);

    const apiHistory = messagesForHistory
      .slice(1)
      .map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : '[Video Embed]',
      }));

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: apiHistory.slice(0, -1),
          message: textToSend,
        }),
      });

      if (!res.ok) throw new Error("API request failed");
      const responseData = await res.json();
      
      if (responseData.type === 'lesson') {
        // We leave the typing indicator ON
        // and call fetchLesson. fetchLesson will turn it off.
        fetchLesson(responseData.data); 
        return; 
      }
      
      let aiMessage: Message;
      if (responseData.type === 'video') {
        aiMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: responseData, 
        };
      } else {
        aiMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: responseData.data,
        };
      }
      
      setMessages((prev) => [
        ...prev.filter(m => m.id !== "typing-indicator"),
        aiMessage,
      ]);

    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
      };
      setMessages((prev) => [
        ...prev.filter(m => m.id !== "typing-indicator"),
        errorMessage,
      ]);
    }
    setIsTyping(false);
  };
  
  const handleCheckpointReached = (checkpoint: Checkpoint) => {
    console.log("CHECKPOINT REACHED! Opening modal for:", checkpoint.topic);
    setActiveCheckpoint(checkpoint);
    setIsModalOpen(true);
  };

  const handleModalClose = (passed: boolean) => {
    setIsModalOpen(false);
    
    if (passed && activeCheckpoint) {
      console.log("Checkpoint PASSED. Saving progress and resuming video.");
      completeCheckpoint(activeCheckpoint.id); 
      playerRef.current?.playVideo(); 
      toast({
        title: "Checkpoint Cleared!",
        description: "Great job, let's continue.",
      });
    } else {
      console.log("Checkpoint FAILED. Video remains paused.");
      toast({
        title: "Try again",
        description: "The video will stay paused. You can retry by playing the video again.",
        variant: "destructive"
      });
    }
    setActiveCheckpoint(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setActiveLesson(null);
    }
  };

  // Get checkpoints we haven't completed yet
  const incompleteCheckpoints = (activeLesson?.checkpoints || []).filter(
    cp => !completedCheckpoints.includes(cp.id)
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* --- FIX: The "SEXY" ANIMATION --- 
          - It's "max-w-md" (small) by default
          - When "activeLesson" is true, it animates to "max-w-6xl" (large)
      */}
      <DialogContent className={cn(
          "h-[90vh] p-0 gap-0 flex flex-col bg-[#0a0a0a] border-0 transition-all duration-300 ease-in-out",
          activeLesson ? "max-w-6xl" : "max-w-md"
        )}>
        
        <div className="flex flex-col md:flex-row h-full w-full min-h-0">

          {/* --- PART 1: VIDEO PLAYER (Left Side) --- 
              - This panel is now HIDDEN by default on desktop
              - It becomes visible ("md:flex") and animates to 50% width when a lesson is active
          */}
          <div className={cn(
            "w-full flex-col bg-[#050505] transition-all duration-300 ease-in-out",
            // If lesson is active: show it, take 50% width on desktop
            activeLesson ? "md:w-1/2 md:flex" : "md:w-0 md:hidden",
            // On mobile, it's a normal stacked block
            activeLesson ? "flex" : "hidden"
          )}>
            {/* Header */}
            <div className="bg-[#0066b2] px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <img src={hkLogo} alt="HK AI" className="h-8 w-8 rounded" />
                <h2 className="text-white font-bold text-xl">
                  {activeLesson ? "Lesson Mode" : "Conversational AI"}
                </h2>
              </div>
              <button 
                onClick={() => handleOpenChange(false)}
                className="text-white/80 hover:text-white md:hidden" // Hide close button on this side on desktop
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Video Player Area */}
            <div className="w-full p-4 md:p-6 flex-1 flex items-center justify-center min-h-0">
              {/* --- FIX: ADDED aspect-video HERE --- */}
              {/* This makes the video 16:9 *within* its 50% container */}
              <div className="w-full aspect-video">
                {activeLesson && isProgressLoaded ? (
                  <VideoLessonPlayer
                    ref={playerRef}
                    videoId={activeLesson.videoData.videoId}
                    checkpoints={incompleteCheckpoints}
                    onCheckpointReached={handleCheckpointReached}
                    onReady={() => console.log("Player is ready")}
                    onTimeUpdate={(time) => saveTime(time)}
                    startTime={startTime}
                  />
                ) : (
                  // This shows when no video is loaded
                  <div className="text-center text-white/50">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4" />
                    <p>Ask me to teach you a topic!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* --- PART 2: CHAT INTERFACE (Right Side) --- 
              - This panel is now 100% width by default
              - It *animates* to 50% width on desktop when a lesson is active
          */}
          <div className={cn(
            "w-full flex flex-col bg-[#0a0a0a] transition-all duration-300 ease-in-out",
            activeLesson ? "md:w-1/2" : "md:w-full",
            activeLesson ? "border-t-2 md:border-t-0 md:border-l-2 border-white/10" : "border-none"
          )}>
            {/* --- NEW: Header for the Chat side --- */}
             <div className={cn(
               "bg-[#0066b2] px-6 py-4 items-center justify-between flex-shrink-0",
               activeLesson ? "hidden md:flex" : "flex" // Show if NO lesson (desktop) or ALWAYS (mobile)
             )}>
              <div className="flex items-center gap-3">
                {/* Show logo ONLY if no lesson is active */}
                {!activeLesson && <img src={hkLogo} alt="HK AI" className="h-8 w-8 rounded" />}
                <h2 className="text-white font-bold text-xl">Conversational AI</h2>
              </div>
              <button 
                onClick={() => handleOpenChange(false)}
                className="text-white/80 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user" ? "bg-white/20" : "bg-white/10"
                    }`}>
                      {message.role === "user" ? (
                        <span className="text-white text-sm">U</span>
                      ) : (
                        <img src={hkLogo} alt="AI" className="w-6 h-6 rounded" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`rounded-lg ${
                          message.role === "user"
                            ? "bg-[#005c91] text-white px-4 py-3"
                            : "bg-[#1a1a1a] text-white" 
                        } ${
                          (typeof message.content !== 'string' && message.content.type === 'video') || message.isTyping
                            ? 'p-0 overflow-hidden' 
                            : 'px-4 py-3'
                        }`}
                      >
                        {message.isTyping ? (
                          <div className="flex gap-1.5 items-center p-3">
                            <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                            <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse [animation-delay:0.2s]" />
                            <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse [animation-delay:0.4s]" />
                          </div>
                        ) : typeof message.content === 'string' ? (
                          <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                        ) : (
                          message.content.type === 'video' && (
                            <YouTubeEmbed videoData={message.content.data} />
                          )
                        )}
                      </div>
                      {!message.isTyping && (
                        <span className="text-white/40 text-xs mt-1 block">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-white/10 p-4 bg-[#0a0a0a] flex-shrink-0">
              <div className="flex gap-2 max-w-4xl mx-auto">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="flex-1 bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/40"
                  disabled={isTyping}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="bg-[#00a884] hover:bg-[#00a884]/90 text-white px-6"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* --- The Checkpoint Modal --- */}
        <CheckpointModal
          checkpoint={activeCheckpoint}
          open={isModalOpen}
          onClose={handleModalClose}
        />
      </DialogContent>
    </Dialog>
  );
};