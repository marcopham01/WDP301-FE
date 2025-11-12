import { useLocation } from "react-router-dom";
import { ChatPopover } from "@/components/ui/chat-popover";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext/useAuth";

export default function GlobalCustomerChatWidget() {
  const { user } = useAuth();
  const location = useLocation();

  const path = location.pathname;
  const hideOnPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  const shouldHide =
    hideOnPaths.includes(path) ||
    path.startsWith("/dashboard") ||
    (user && user.role && user.role !== "customer");

  if (shouldHide) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <ChatPopover>
        <button
          aria-label="Open chat"
          className="relative h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-shadow duration-200 flex items-center justify-center outline-none focus:ring-4 focus:ring-blue-300"
        >
          <MessageCircle className="h-7 w-7" />
          {/* glow */}
          <span className="absolute -inset-1 rounded-full bg-blue-500/20 blur-lg -z-10" />
        </button>
      </ChatPopover>
    </div>
  );
}
