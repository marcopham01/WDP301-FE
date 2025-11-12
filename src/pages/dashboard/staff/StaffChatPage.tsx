import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext/useAuth";
import { initializeSocket } from "@/lib/socket";
import { getChatHistory, sendChatMessage, ChatMessageDTO, getChatPartners } from "@/lib/chatApi";


// Customer minimal shape for sidebar
type Customer = { _id: string; fullName?: string; username?: string; email?: string };

interface ChatMessageUI {
  id: string;
  text: string;
  at: string; // HH:mm DD/MM/YYYY
  sender: "staff" | "customer";
}

export default function StaffChatPage() {
  // Sidebar: customers to chat with
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const { user, accessToken } = useAuth();
  const [otherId, setOtherId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  const endRef = useRef<HTMLDivElement>(null);

  const active = customers.find((c) => c._id === activeId);

  // Format helper
  const formatAt = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  // Load customers list for staff sidebar: only partners who have chatted
  useEffect(() => {
    if (!accessToken) return;
    setLoadingCustomer(true);
    getChatPartners(accessToken)
      .then((partners) => {
        console.log("👥 Partners found:", partners.length);
        const mapped: Customer[] = (partners || [])
          .map((c) => ({ _id: (c._id || "") as string, fullName: c.fullName, username: c.username, email: c.email }))
          .filter((c) => !!c._id);
        setCustomers(mapped);
        if (mapped.length > 0) {
          setActiveId(mapped[0]._id);
          setOtherId(mapped[0]._id);
        }
        setLoadingCustomer(false);
      })
      .catch((err) => {
        console.error("❌ Error loading partners:", err);
        setLoadingCustomer(false);
      });
  }, [accessToken]);

  // Initialize socket and join room của staff
  useEffect(() => {
    if (!user?.id) return;
    const socket = initializeSocket();
    socket.emit("join", user.id); // staff join room của mình
    // Lắng nghe tin nhắn đến
    socket.on("new_message", (msg: ChatMessageDTO) => {
      // Nếu khách chưa có trong danh sách -> thêm vào đầu danh sách
      setCustomers((prev) => {
        const exists = prev.some((c) => c._id === msg.sender);
        if (exists) return prev;
        return [{ _id: msg.sender }, ...prev];
      });
      // Nếu đang chưa chọn khách, hoặc tin nhắn đến từ khách khác -> tự động chuyển cuộc trò chuyện sang khách đó
      if (!otherId || otherId !== msg.sender) {
        setOtherId(msg.sender);
        setActiveId(msg.sender);
        return; // Lịch sử sẽ được tải bởi effect khác
      }
      // Đúng khách hiện tại -> append
      setMessages(prev => [...prev, {
        id: msg._id || crypto.randomUUID(),
        text: msg.content,
        at: formatAt(new Date(msg.createdAt || Date.now())),
        sender: "customer"
      }]);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    });
    return () => {
      socket.off("new_message");
    };
  }, [user?.id, otherId]);

  // Load history giữa staff và customer giả định otherId
  useEffect(() => {
    if (!otherId || !accessToken || !user?.id) return;
    getChatHistory(otherId, accessToken).then(list => {
      const mapped: ChatMessageUI[] = list.map(m => ({
        id: m._id || crypto.randomUUID(),
        text: m.content,
        at: formatAt(new Date(m.createdAt || Date.now())),
        sender: m.sender === user.id ? "staff" : "customer"
      }));
      setMessages(mapped);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    }).catch(() => {});
  }, [otherId, accessToken, user?.id]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || !accessToken || !otherId) return;
    sendChatMessage(otherId, text, accessToken).then(saved => {
      setMessages(prev => [...prev, {
        id: saved._id || crypto.randomUUID(),
        text: saved.content,
        at: formatAt(new Date(saved.createdAt || Date.now())),
        sender: "staff"
      }]);
      // Emit qua socket cho customer (server đã emit cho receiver) -> không cần emit lại.
      setInput("");
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    });
  }, [input, accessToken, otherId]);

  return (
    <main className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Chat Với Khách Hàng</h1>
        <p className="text-muted-foreground">Trao đổi trực tiếp với khách hàng về lịch hẹn</p>
        {loadingCustomer && <p className="text-sm text-yellow-600 mt-2">⏳ Đang tải thông tin customer...</p>}
        {!loadingCustomer && !otherId && <p className="text-sm text-red-600 mt-2">⚠️ Không tìm thấy customer nào</p>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left: Customers list */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Danh Sách Khách Hàng</h2>
          <div className="space-y-3">
            {customers.map((c) => {
              const selected = c._id === activeId;
              return (
                <button
                  key={c._id}
                  onClick={() => { setActiveId(c._id); setOtherId(c._id); }}
                  className={`w-full text-left rounded-xl border transition shadow-sm px-4 py-3 ${
                    selected
                      ? "bg-ev-green text-white border-ev-green"
                      : "bg-white hover:bg-muted/50"
                  }`}
                >
                  <div className="font-medium leading-tight">{c.fullName || c.username || "Khách hàng"}</div>
                  <div className={`text-sm ${selected ? "opacity-90" : "text-muted-foreground"}`}>{c.email || ""}</div>
                </button>
              );
            })}
            {!loadingCustomer && customers.length === 0 && (
              <div className="text-sm text-muted-foreground">Chưa có khách hàng.</div>
            )}
          </div>
        </Card>

        {/* Right: Conversation */}
        <Card className="p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">
              {active?.fullName || active?.username || "Khách hàng"}
            </h3>
          </div>

          {/* Messages area */}
          <div className="flex-1 min-h-[380px] rounded-xl border bg-background/40 p-4 overflow-y-auto">
            <div className="flex flex-col gap-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "staff" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[60%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                      m.sender === "staff"
                        ? "bg-ev-green text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.text}
                    <div className={`mt-1 text-[10px] ${m.sender === "staff" ? "text-white/80" : "text-muted-foreground"}`}>
                      {m.at}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          </div>

          {/* Composer */}
          <div className="mt-4 flex items-center gap-3">
            <Input
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              className="flex-1"
            />
            <Button onClick={send} className="bg-ev-green hover:bg-ev-green/90">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
