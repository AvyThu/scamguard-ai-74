import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const EMOJI = ["😞", "🙁", "😐", "🙂", "🤩"];
export function ExitFeedback() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = useRef(false);
  useEffect(() => {
    const timer = window.setTimeout(() => { ready.current = true; }, 15000);
    const exit = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget && ready.current && !sessionStorage.getItem("verisafe_feedback_seen")) {
        setOpen(true); sessionStorage.setItem("verisafe_feedback_seen", "1");
      }
    };
    document.addEventListener("mouseout", exit);
    return () => { clearTimeout(timer); document.removeEventListener("mouseout", exit); };
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!rating || busy) return; setBusy(true);
    const { error } = await supabase.from("app_feedback").insert({ rating, comment: comment.trim() || null });
    setBusy(false);
    if (error) { toast.error("Chưa gửi được đánh giá. Vui lòng thử lại sau."); return; }
    sessionStorage.setItem("verisafe_feedback_seen", "1"); setOpen(false); toast.success("Cảm ơn bạn đã góp ý cho VeriSafe!");
  }
  return <>
    <div className="flex justify-center border-t py-3"><Button variant="ghost" size="sm" onClick={() => setOpen(true)}><MessageSquare />Góp ý cho VeriSafe</Button></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>VeriSafe có giúp ích cho bạn không?</DialogTitle><DialogDescription>Đánh giá ẩn danh của bạn giúp cải thiện trải nghiệm.</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="space-y-4"><div role="group" aria-label="Mức độ hài lòng" className="flex justify-between gap-2">{EMOJI.map((emoji, i) => <Button key={emoji} type="button" variant={rating === i+1 ? "secondary" : "ghost"} className="h-14 w-14 text-3xl" aria-label={`${i+1} sao`} aria-pressed={rating === i+1} onClick={() => setRating(i+1)}>{emoji}</Button>)}</div>
      <Label htmlFor="feedback-comment">Ý kiến đóng góp</Label><Textarea id="feedback-comment" value={comment} onChange={e => setComment(e.target.value)} maxLength={2000} rows={4} /><Button type="submit" className="w-full" disabled={!rating || busy}><Send />{busy ? "Đang gửi…" : "Gửi đánh giá"}</Button></form>
    </DialogContent></Dialog>
  </>;
}