import { useState } from "react";
import { MessageSquare, LayoutDashboard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import hkLogo from "@/assets/hk-logo.jpeg";
import { ChatInterface } from "@/components/ChatInterface";
import { UserProfile } from "@/components/OnboardingModal";

const Dashboard = () => {
  const [activeView, setActiveView] = useState<"dashboard" | "conversations">("dashboard");
  const [chatOpen, setChatOpen] = useState(false);
  const [userProfile] = useState<UserProfile>({
    name: "User",
    email: "user@example.com",
    goal: "Learning",
    source: "demo"
  });

  const handleNewChat = () => {
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* Top Bar */}
      <header className="bg-[#0066b2] h-14 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <img src={hkLogo} alt="HK.AI" className="h-8 w-8 rounded" />
          <span className="text-white font-bold text-lg">HK.AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-white/80 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm">
            U
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-48 bg-[#1a1a1a] border-r border-white/10 flex flex-col">
          <nav className="flex-1 py-4">
            <button
              onClick={() => setActiveView("dashboard")}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                activeView === "dashboard"
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-sm">Dashboard</span>
            </button>
            <button
              onClick={() => setActiveView("conversations")}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                activeView === "conversations"
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm">Conversations</span>
            </button>
          </nav>

          {/* Bottom Logo */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-white/60">
              <img src={hkLogo} alt="HK.AI" className="h-6 w-6 rounded" />
              <span className="text-xs font-medium">HK.AI</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {activeView === "dashboard" ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <h1 className="text-white text-3xl font-bold mb-8">Dashboard</h1>
              <Button
                onClick={handleNewChat}
                size="lg"
                className="rounded-full w-16 h-16 bg-[#00a884] hover:bg-[#00a884]/90 text-white shadow-lg"
              >
                <Plus className="w-8 h-8" />
              </Button>
              <p className="text-white/60 mt-4">Start a new conversation</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <MessageSquare className="w-16 h-16 text-white/20 mb-4" />
              <h2 className="text-white text-xl mb-2">No conversations yet</h2>
              <p className="text-white/60 mb-6">Start chatting with HK.AI</p>
              <Button
                onClick={handleNewChat}
                className="bg-[#00a884] hover:bg-[#00a884]/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Conversation
              </Button>
            </div>
          )}

          {/* Footer */}
          <footer className="bg-[#0066b2] px-6 py-3 flex items-center justify-between">
            <div className="flex gap-6 text-white/80 text-sm">
              <button className="hover:text-white">Product</button>
              <button className="hover:text-white">Resources</button>
              <button className="hover:text-white">Legal</button>
            </div>
            <div className="flex gap-4 text-white/80">
              <button className="hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </button>
              <button className="hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                </svg>
              </button>
              <button className="hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* Chat Interface */}
      <ChatInterface
        open={chatOpen}
        onOpenChange={setChatOpen}
        userProfile={userProfile}
      />
    </div>
  );
};

export default Dashboard;
