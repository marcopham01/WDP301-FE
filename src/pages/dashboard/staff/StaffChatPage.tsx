import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Paperclip, Smile, X, Image as ImageIcon } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext/useAuth";
import { initializeSocket } from "@/lib/socket";
import { getChatHistory, ChatMessageDTO, getChatPartners, AttachmentDTO, uploadChatFile, sendChatWithAttachments } from "@/lib/chatApi";
import { config } from "@/config/config";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


// Customer minimal shape for sidebar
type Customer = { _id: string; fullName?: string; username?: string; email?: string };

interface ChatMessageUI {
  id: string;
  text: string;
  at: string; // HH:mm DD/MM/YYYY
  sender: "staff" | "customer";
  attachments?: AttachmentDTO[];
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFilePreview, setAttachedFilePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      console.log("📨 New message received:", msg);
      
      // Nếu khách chưa có trong danh sách -> thêm vào đầu danh sách với thông tin đầy đủ
      setCustomers((prev) => {
        const exists = prev.some((c) => c._id === msg.sender);
        if (exists) return prev;
        
        // Thêm customer mới với thông tin từ senderInfo
        const newCustomer: Customer = {
          _id: msg.sender,
          fullName: msg.senderInfo?.fullName,
          username: msg.senderInfo?.username,
          email: msg.senderInfo?.email,
        };
        console.log("➕ Adding new customer to list:", newCustomer);
        return [newCustomer, ...prev];
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
        sender: "customer",
        attachments: msg.attachments,
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
        sender: m.sender === user.id ? "staff" : "customer",
        attachments: m.attachments,
      }));
      setMessages(mapped);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    }).catch(() => {});
  }, [otherId, accessToken, user?.id]);

  const send = useCallback(() => {
    const text = input.trim();
    if ((!text && !attachedFile) || !accessToken || !otherId) return;
    const flow = async () => {
      const attachments: AttachmentDTO[] = [];
      if (attachedFile) {
        try {
          setUploading(true);
          const uploaded = await uploadChatFile(attachedFile, accessToken);
          attachments.push(uploaded);
        } catch (e) {
          console.error("❌ Upload failed", e);
        } finally {
          setUploading(false);
        }
      }
      const saved = await sendChatWithAttachments({ receiver: otherId, content: text, attachments }, accessToken);
      setMessages(prev => [...prev, {
        id: saved._id || crypto.randomUUID(),
        text: saved.content,
        at: formatAt(new Date(saved.createdAt || Date.now())),
        sender: "staff",
        attachments: saved.attachments,
      }]);
      setInput("");
      setAttachedFile(null);
      setAttachedFilePreview("");
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    };
    flow();
  }, [input, accessToken, otherId, attachedFile]);

  const handleEmojiClick = (emoji: EmojiClickData) => {
    setInput((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      return;
    }
    setAttachedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setAttachedFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setAttachedFilePreview("");
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setAttachedFilePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
                    {m.attachments?.length ? (
                      <div className="mt-2 flex flex-col gap-2">
                        {m.attachments.map((att, i) => {
                          const href = att.url.startsWith('http') ? att.url : `${config.API_BASE_URL}${att.url}`;
                          return att.type.startsWith('image/') ? (
                            <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="block rounded overflow-hidden border w-40">
                              <img src={href} alt={att.name} className="w-full h-28 object-cover" />
                            </a>
                          ) : (
                            <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="underline text-xs">{att.name || 'Tệp đính kèm'}</a>
                          )
                        })}
                      </div>
                    ) : null}
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
          {/* File preview */}
          {attachedFile && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
              {attachedFilePreview ? (
                <img src={attachedFilePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{attachedFile.name}</p>
                <p className="text-xs text-gray-500">{(attachedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-8 w-8 text-gray-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10 rounded-full hover:bg-gray-100 text-gray-500"
              title="Đính kèm file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <div className="flex-1 relative">
              <Input
                placeholder="Nhập tin nhắn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                className="pr-10"
              />
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-gray-100 text-gray-500"
                    title="Chọn emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 border-0" align="end">
                  <EmojiPicker onEmojiClick={handleEmojiClick} width={320} height={400} />
                </PopoverContent>
              </Popover>
            </div>

            <Button
              onClick={send}
              disabled={uploading || (!input.trim() && !attachedFile)}
              className="bg-ev-green hover:bg-ev-green/90"
              title={uploading ? 'Đang upload...' : 'Gửi tin nhắn'}
            >
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
