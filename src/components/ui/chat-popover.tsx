import { useState, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext/useAuth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Message {
  id: number;
  sender: string;
  message: string;
  time: string;
  isSupport: boolean;
}

interface ChatPopoverProps {
  children: ReactNode;
}

export function ChatPopover({ children }: ChatPopoverProps) {
  const { user } = useAuth();
  const userId = user?.id || "default";
  const storageKey = userId === "default" ? "chatMessages" : `chatMessages_${userId}`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "EV Care Support",
      message: "Xin chào! Chúng tôi có thể giúp gì cho bạn hôm nay?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSupport: true,
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Load messages from localStorage with fallback
  useEffect(() => {
    let savedMessages = localStorage.getItem(storageKey);
    if (!savedMessages && storageKey !== "chatMessages") {
      savedMessages = localStorage.getItem("chatMessages");
    }
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (error) {
        console.error("Error loading chat messages:", error);
      }
    }
  }, [storageKey]);

  // Save messages to localStorage (primary + fallback key for staff compatibility)
  useEffect(() => {
    if (messages.length > 1) {
      const payload = JSON.stringify(messages);
      localStorage.setItem(storageKey, payload);
      if (storageKey !== "chatMessages") {
        localStorage.setItem("chatMessages", payload);
      }
    }
  }, [messages, storageKey]);

  // Calculate unread count
  useEffect(() => {
    if (!isOpen) {
      const supportMessages = messages.filter((msg) => msg.isSupport);
      const lastUserRead = parseInt(localStorage.getItem(`lastReadMessageId_${userId}`) || "0");
      const unread = supportMessages.filter((msg) => msg.id > lastUserRead).length;
      setUnreadCount(unread);
    }
  }, [messages, isOpen, userId]);

  // Mark messages as read when popover opens
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const lastMessageId = messages[messages.length - 1].id;
      localStorage.setItem(`lastReadMessageId_${userId}`, lastMessageId.toString());
      setUnreadCount(0);
    }
  }, [isOpen, messages, userId]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: messages.length + 1,
        sender: user?.fullName || user?.username || "Bạn",
        message: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSupport: false,
      };
      setMessages([...messages, message]);
      setNewMessage("");

      // Simulate support response
      setTimeout(() => {
        const supportMessage: Message = {
          id: messages.length + 2,
          sender: "EV Care Support",
          message: "Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất có thể!",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSupport: true,
        };
        setMessages((prev) => [...prev, supportMessage]);
      }, 2000);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative cursor-pointer">
          {children}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" sideOffset={12} className="w-[380px] h-[520px] p-0 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-semibold">Hỗ trợ khách hàng</div>
              <div className="text-xs text-muted-foreground">Phản hồi trong 24 giờ</div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isSupport ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg ${
                      msg.isSupport ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <div className="text-xs font-medium mb-1">{msg.sender}</div>
                    <div className="text-sm">{msg.message}</div>
                    <div className={`text-xs mt-1 ${msg.isSupport ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Input
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
