import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, X as CloseIcon } from "lucide-react"; // Import CloseIcon
import { UserProfile } from "./OnboardingModal";
import hkLogo from "@/assets/hk-logo.jpeg";

interface ChatInterfaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  // We no longer need the "type" field, as all messages will be text.
  // The video will be handled by a separate state.
}

// NEW Floating Player Component
const FloatingVideoPlayer = ({ videoId, onClose }: { videoId: string; onClose: () => void }) => {
  return (
    <div 
      // This positions it inside the modal (which has z-50)
      // It will float in the bottom-right corner, above the input.
      className="absolute bottom-24 right-8 w-80 h-auto bg-[#1a1a1a] border border-white/20 rounded-lg shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95"
    >
      <div className="h-6 w-full bg-[#005c91] text-white/80 flex items-center justify-between px-2">
        <span className="text-xs font-medium">Video Player</span>
        <button onClick={onClose} className="hover:text-white">
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="aspect-video"> {/* This ensures the iframe keeps its ratio */}
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} // Add autoplay
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export const ChatInterface = ({ open, onOpenChange, userProfile }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: userProfile
        ? `Hey ${userProfile.name}! 👋 I'm HK AI, your personal mentor. I see you want to ${userProfile.goal}. I'm here to help you discover your hidden talents, create personalized learning paths, and find ways to monetize your skills. What would you like to explore first?`
        : "Welcome! How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- NEW STATE FOR THE FLOATING PLAYER ---
  const [floatingVideoId, setFloatingVideoId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    // Add user message
    const userMessage: Message = { 
      role: "user", 
      content: textToSend,
    };
    
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput("");
    setIsTyping(true);

    // Format history for the API
    const apiHistory = currentMessages
      .slice(1) // Skip the initial assistant greeting
      .map(msg => ({
        role: msg.role,
        content: msg.content
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

      if (!res.ok) {
        throw new Error("API request failed");
      }

      const { text: aiResponse } = await res.json();
      
      let aiMessage: Message;

      // --- NEW LOGIC FOR HANDLING THE RESPONSE ---
      if (aiResponse.startsWith("YT_VIDEO::")) {
        const videoId = aiResponse.replace("YT_VIDEO::", "");
        
        // 1. Set the floating video ID
        setFloatingVideoId(videoId);
        
        // 2. Send a simple text message
        aiMessage = {
          role: "assistant",
          content: "No worries at all! I found this video that should help, I'll play it for you now.",
        };
        
      } else {
        // It's a normal text response
        aiMessage = {
          role: "assistant",
          content: aiResponse,
        };
      }
      
      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // When the modal closes, also close the video player
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setFloatingVideoId(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 flex flex-col bg-[#0a0a0a] border-0">
        {/* Header (no change) */}
        <div className="bg-[#0066b2] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={hkLogo} alt="HK AI" className="h-8 w-8 rounded" />
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
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-[#0a0a0a]">
          <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* The mapping logic is now simpler */}
            {messages.map((message, index) => (
              <div
                key={index}
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
                    className={`rounded-lg px-4 py-3 ${
                      message.role === "user"
                        ? "bg-[#005c91] text-white"
                        : "bg-[#1a1a1a] text-white"
                    }`}
                  >
                    {/* It's now *always* text */}
                    <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                  </div>
                  <span className="text-white/40 text-xs mt-1 block">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <img src={hkLogo} alt="AI" className="w-6 h-6 rounded" />
                </div>
                <div className="bg-[#1a1a1a] rounded-lg px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-white/60" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input (no change) */}
        <div className="border-t border-white/10 p-4 bg-[#0a0a0a]">
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

        {/* --- NEW: Floating Player Render --- */}
        {floatingVideoId && (
          <FloatingVideoPlayer 
            videoId={floatingVideoId} 
            onClose={() => setFloatingVideoId(null)} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
};