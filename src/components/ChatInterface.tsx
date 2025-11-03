import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { UserProfile } from "./OnboardingModal";
import hkLogo from "@/assets/hk-logo.jpeg";

// --- (NEW) IMPORT THE EMBED COMPONENT ---
import YouTubeEmbed from "./YouTubeEmbed";

// --- (NEW) DEFINE THE VIDEO DATA SHAPE ---
interface VideoData {
  videoId: string;
  title: string;
  thumbnailUrl: string;
}

// --- (MODIFIED) MESSAGE INTERFACE ---
// Content can now be a string OR a video object
interface Message {
  role: "user" | "assistant";
  content: string | { type: 'video', data: VideoData };
}

interface ChatInterfaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile | null;
}

// --- (REMOVED) The old FloatingVideoPlayer component is no longer needed ---

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

  // --- (REMOVED) floatingVideoId state is no longer needed ---

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

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
        // Only send string content to the history
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

      if (!res.ok) {
        throw new Error("API request failed");
      }

      // --- (MODIFIED) API RESPONSE HANDLING ---
      const responseData = await res.json();
      
      let aiMessage: Message;

      if (responseData.type === 'video') {
        // AI sent a video object. Add it directly to the chat.
        aiMessage = {
          role: "assistant",
          content: responseData, // The content is the { type: 'video', data: ... } object
        };
      } else {
        // It's a normal text response
        aiMessage = {
          role: "assistant",
          content: responseData.data, // The content is the text string
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
  
  // No change to handleOpenChange
  const handleOpenChange = (isOpen: boolean) => {
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
            
            {/* --- (MODIFIED) MAPPING LOGIC --- */}
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
                    className={`rounded-lg ${
                      message.role === "user"
                        ? "bg-[#005c91] text-white px-4 py-3"
                        : "bg-[#1a1a1a] text-white" 
                    } ${
                      // Remove padding if it's a video embed
                      typeof message.content !== 'string' && message.content.type === 'video' ? 'p-0 overflow-hidden' : 'px-4 py-3'
                    }`}
                  >
                    {/* --- (NEW) Message Rendering Logic --- */}
                    {typeof message.content === 'string' ? (
                      // It's a string, just render it
                      <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                    ) : (
                      // It's an object, check if it's our video
                      message.content.type === 'video' && (
                        <YouTubeEmbed videoData={message.content.data} />
                      )
                    )}
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

        {/* --- (REMOVED) The old FloatingVideoPlayer is gone --- */}
      </DialogContent>
    </Dialog>
  );
};