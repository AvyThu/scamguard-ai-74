import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatWithAssistant } from "@/lib/scam.functions";

interface Msg { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Tôi có nên bấm vào liên kết này không?",
  "Tin nhắn này có phải lừa đảo không?",
  "Tôi bị mất tiền thì phải làm gì?",
  "URL này nguy hiểm ở điểm nào?",
];

export function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Xin chào! Tôi là Trợ lý ScamShield AI. Bạn có thể hỏi tôi về một URL, tin nhắn nghi ngờ, hoặc cách xử lý khi bị lừa đảo." },
  ]);
  const chat = useServerFn(chatWithAssistant);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setBusy(true);
    try {
      const res = await chat({ data: { messages: next.map(m => ({ role: m.role, content: m.content })) } });
      setMsgs([...next, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: "Xin lỗi, hệ thống AI tạm thời không phản hồi. Vui lòng thử lại." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Mở Trợ lý ScamShield AI"
          className="bg-gradient-cyber shadow-cyber fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white transition hover:scale-105"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}
      {open && (
        <div className="shadow-cyber fixed bottom-6 right-6 z-50 flex h-[560px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card">
          <div className="bg-gradient-cyber flex items-center justify-between px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <div>
                <div className="text-sm font-semibold">Trợ lý ScamShield AI</div>
                <div className="text-xs opacity-90">Powered by Lovable AI</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Đóng"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-background/60 p-4">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "max-w-[85%] rounded-2xl bg-muted px-3 py-2 text-sm text-foreground"
                }>
                  {m.content}
                </div>
              </div>
            ))}
            {busy && <div className="text-xs text-muted-foreground">Đang suy nghĩ…</div>}
            <div ref={endRef} />
          </div>
          {msgs.length <= 1 && (
            <div className="flex flex-wrap gap-1 border-t border-border bg-card px-3 pt-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-background px-2 py-1 text-xs hover:bg-accent">
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex items-center gap-2 border-t border-border bg-card p-3"
          >
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Hỏi về một URL, tin nhắn…" disabled={busy} />
            <Button type="submit" size="icon" className="bg-gradient-cyber" disabled={busy || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
