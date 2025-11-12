import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useMemo, useRef, useState } from "react";

type Appointment = {
  id: string;
  customer: string;
  vehicle: string;
  date: string; // DD/MM/YYYY
};

type ChatMessage = {
  id: string;
  text: string;
  at: string; // HH:mm DD/MM/YYYY
  sender: "staff" | "customer";
};

export default function StaffChatPage() {
  const appointments: Appointment[] = useMemo(
    () => [
      { id: "1", customer: "Phương Nam", vehicle: "VinFast VF3", date: "04/10/2025" },
    ],
    []
  );

  const [activeId] = useState<string>(appointments[0]?.id ?? "1");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "m1", text: "hi", at: "13:20 13/10/2025", sender: "staff" },
  ]);

  const endRef = useRef<HTMLDivElement>(null);

  const active = appointments.find((a) => a.id === activeId) ?? appointments[0];

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const at = `${pad(now.getHours())}:${pad(now.getMinutes())} ${pad(now.getDate())}/${pad(
      now.getMonth() + 1
    )}/${now.getFullYear()}`;
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), text, at, sender: "staff" }]);
    setInput("");
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  return (
    <main className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Chat Với Khách Hàng</h1>
        <p className="text-muted-foreground">Trao đổi trực tiếp với khách hàng về lịch hẹn</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left: Appointments list */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Danh Sách Lịch Hẹn</h2>
          <div className="space-y-3">
            {appointments.map((a) => {
              const selected = a.id === activeId;
              return (
                <button
                  key={a.id}
                  className={`w-full text-left rounded-xl border transition shadow-sm px-4 py-3 ${
                    selected
                      ? "bg-ev-green text-white border-ev-green"
                      : "bg-white hover:bg-muted/50"
                  }`}
                >
                  <div className="font-medium leading-tight">{a.customer}</div>
                  <div className={`text-sm ${selected ? "opacity-90" : "text-muted-foreground"}`}>
                    {a.vehicle}
                  </div>
                  <div className={`text-xs ${selected ? "opacity-90" : "text-muted-foreground"}`}>{a.date}</div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Right: Conversation */}
        <Card className="p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">
              {active.customer} - {active.vehicle}
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
