import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Phone, MapPin, Send, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { voiceWarning, type AlertRisk } from "@/lib/safety";

export function SafetyAlert() {
  const [open, setOpen] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState<string>("");
  const [locationStatus, setLocationStatus] = useState("");
  const [warning, setWarning] = useState("");
  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN"; utterance.rate = 0.9; utterance.volume = 1;
    const vietnamese = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("vi"));
    if (vietnamese) utterance.voice = vietnamese;
    window.speechSynthesis.speak(utterance);
  }
  useEffect(() => {
    function onRisk(event: Event) {
      const detail = (event as CustomEvent<{ risk: AlertRisk; simulated?: boolean }>).detail;
      let savedPhone = "";
      try { savedPhone = JSON.parse(localStorage.getItem("scamshield_emergency_contacts") || "[]")[0]?.phone || ""; } catch {}
      const text = voiceWarning(detail.risk, savedPhone);
      setPhone(savedPhone); setWarning(text); setSimulated(Boolean(detail.simulated));
      if (text) speak(detail.simulated ? `Đây là cảnh báo mô phỏng của VeriSafe. ${text}` : text);
      setOpen(detail.risk === "DANGEROUS"); setPosition("");
      if (detail.risk !== "DANGEROUS") return;
      // A demo must not request sensitive location automatically.
      if (detail.simulated) { setLocationStatus("Chưa chia sẻ vị trí trong bản mô phỏng."); return; }
      locate();
    }
    window.addEventListener("verisafe:risk", onRisk);
    return () => { window.removeEventListener("verisafe:risk", onRisk); window.speechSynthesis?.cancel(); };
  }, []);
  function locate() {
    if (!navigator.geolocation) { setLocationStatus("Thiết bị không hỗ trợ định vị."); return; }
    setLocationStatus("Đang xác định vị trí…");
    navigator.geolocation.getCurrentPosition(p => {
      setPosition(`https://www.google.com/maps?q=${p.coords.latitude},${p.coords.longitude}`);
      setLocationStatus("Đã xác định vị trí. Chỉ gửi khi bạn chọn chia sẻ.");
    }, () => setLocationStatus("Không lấy được vị trí. Bạn có thể cấp quyền và thử lại."), { timeout: 12000, maximumAge: 60000 });
  }
  async function share() {
    const text = `Tôi cần người thân hỗ trợ xác minh dấu hiệu lừa đảo. Vị trí của tôi: ${position}`;
    try {
      if (navigator.share) await navigator.share({ title: "VeriSafe — cần hỗ trợ", text });
      else window.location.href = `sms:${phone}?body=${encodeURIComponent(text)}`;
    } catch { /* Share cancellation is not a failure. */ }
  }
  function close() { setOpen(false); window.speechSynthesis?.cancel(); }
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow; document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", key); };
  }, [open]);
  if (!open) return null;
  return <div role="dialog" aria-modal="true" aria-labelledby="panic-title" className="panic-alert fixed inset-0 z-[1000] flex overflow-y-auto bg-destructive text-destructive-foreground">
    <div className="m-auto w-full max-w-2xl px-6 py-10 text-center">
      <Button variant="ghost" size="icon" onClick={close} aria-label="Đóng cảnh báo" className="absolute right-4 top-4"><X /></Button>
      {simulated && <p className="mb-4 rounded-md border p-2 font-bold">TÌNH HUỐNG MÔ PHỎNG — KHÔNG PHẢI KẾT QUẢ PHÂN TÍCH</p>}
      <AlertTriangle className="mx-auto mb-4 h-16 w-16" />
      <h2 id="panic-title" className="text-3xl font-bold">VeriSafe: Cảnh báo rủi ro cao</h2>
      <p className="my-5 text-xl">Không chuyển tiền. Không cung cấp mật khẩu hoặc mã OTP. Hãy xác minh ngay với người thân.</p>
      <div className="flex flex-col gap-3">
        {phone ? <Button asChild size="lg" variant="secondary" className="h-auto min-h-14 whitespace-normal text-lg"><a href={`tel:${phone}`}><Phone />Gọi ngay cho người thân — {phone}</a></Button> : <Button asChild size="lg" variant="secondary" className="min-h-14"><Link to="/emergency" onClick={close}><Phone />Thêm số người thân</Link></Button>}
        <Button size="lg" variant="secondary" className="min-h-14" onClick={position ? share : locate}><Send />{position ? "Gửi vị trí khẩn cấp" : "Lấy vị trí để gửi khẩn cấp"}</Button>
        <p className="text-sm"><MapPin className="mr-1 inline h-4 w-4" />{locationStatus}</p>
        <Button variant="ghost" onClick={() => speak(simulated ? `Cảnh báo mô phỏng. ${warning}` : warning)}><Volume2 />Đọc lại cảnh báo</Button>
        <Button asChild variant="secondary" className="min-h-12"><Link to="/recovery" onClick={close}>Xử lí khi bị lừa</Link></Button>
        <Button variant="ghost" onClick={close}>Tôi đã hiểu, xem báo cáo chi tiết</Button>
      </div>
    </div>
  </div>;
}