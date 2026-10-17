import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ScanFace, Mic, Camera, Upload, Square, Video, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { pageHead } from "@/lib/page-head";
import { simulateMediaCheck, MAX_RECORDING_SECONDS, emitRiskAlert } from "@/lib/safety";
import { toast } from "sonner";
export const Route = createFileRoute("/deepfake")({
  head: () => pageHead("Kiểm tra Deepfake", "Kiểm tra hình ảnh và giọng nói với quy trình mô phỏng minh bạch, ghi âm tối đa 30 giây và khuyến nghị an toàn."),
  component: Deepfake,
});
function Deepfake() {
  const [kind, setKind] = useState<"image" | "audio">("image");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [capturing, setCapturing] = useState<"photo" | "audio" | "video" | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<Awaited<ReturnType<typeof simulateMediaCheck>> | null>(null);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const mounted = useRef(true);
  function clearTimers() {
    if (timer.current) clearInterval(timer.current);
    if (stopTimeout.current) clearTimeout(stopTimeout.current);
    timer.current = null; stopTimeout.current = null;
  }
  function stopStream() { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; }
  function stopRecording() { if (recorder.current?.state === "recording") recorder.current.stop(); clearTimers(); stopStream(); setCapturing(null); }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; generation.current++; clearTimers(); if (recorder.current?.state === "recording") recorder.current.stop(); stopStream(); };
  }, []);
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => { if (video.current && stream.current) video.current.srcObject = stream.current; }, [capturing]);
  function selectFile(next: File) {
    const allowed = kind === "image" ? /\.(png|jpe?g)$/i : /\.(mp3|wav|webm|mp4|ogg)$/i;
    if (!allowed.test(next.name)) { setError("Định dạng không được hỗ trợ."); return; }
    if (!next.size || next.size > 25 * 1024 * 1024) { setError("Tệp phải có nội dung và không vượt quá 25 MB."); return; }
    setError(""); setFile(next); setResult(null);
  }
  async function startCapture(mode: "photo" | "audio" | "video") {
    setError(""); setResult(null);
    if (!navigator.mediaDevices?.getUserMedia) { setError("Trình duyệt không hỗ trợ camera/microphone."); return; }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: mode !== "audio", audio: mode !== "photo" });
      if (!mounted.current) { media.getTracks().forEach(t => t.stop()); return; }
      stream.current = media; setCapturing(mode); setSeconds(0);
      if (mode === "photo") return;
      if (typeof MediaRecorder === "undefined") { stopStream(); setCapturing(null); setError("Trình duyệt không hỗ trợ ghi âm. Hãy tải tệp lên."); return; }
      const chunks: Blob[] = [];
      const rec = new MediaRecorder(media); recorder.current = rec;
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        clearTimers(); stopStream();
        if (!mounted.current) return;
        const mime = rec.mimeType || (mode === "video" ? "video/webm" : "audio/webm");
        const extension = mime.includes("mp4") ? "mp4" : mime.includes("ogg") ? "ogg" : "webm";
        const blob = new File(chunks, `ban-ghi.${extension}`, { type: mime });
        if (blob.size) { setFile(blob); setResult(null); } else setError("Bản ghi trống, hãy ghi lại.");
        setCapturing(null);
      };
      rec.start(250);
      timer.current = setInterval(() => setSeconds(s => Math.min(MAX_RECORDING_SECONDS, s+1)), 1000);
      stopTimeout.current = setTimeout(stopRecording, MAX_RECORDING_SECONDS * 1000);
    } catch { stopStream(); setCapturing(null); setError("Không truy cập được camera/microphone. Hãy cấp quyền hoặc tải tệp lên."); }
  }
  function takePhoto() {
    const v = video.current; if (!v?.videoWidth) return;
    const canvas = document.createElement("canvas"); canvas.width = v.videoWidth; canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    canvas.toBlob(blob => { if (blob && mounted.current) { setFile(new File([blob], "anh-camera.jpg", { type: "image/jpeg" })); stopStream(); setCapturing(null); } }, "image/jpeg", 0.9);
  }
  async function analyze() {
    if (!file || busy) return;
    const current = ++generation.current; setBusy(true); setResult(null);
    try { const next = await simulateMediaCheck(kind); if (mounted.current && generation.current === current) setResult(next); }
    catch { toast.error("Không chạy được bản mô phỏng."); }
    finally { if (mounted.current && generation.current === current) setBusy(false); }
  }
  function changeTab(value: string) {
    if (capturing || busy || (value !== "image" && value !== "audio")) return;
    setKind(value); setFile(null); setResult(null); setError("");
  }
  return <div className="mx-auto max-w-6xl px-4 py-10">
    <div className="mb-7 flex items-center gap-3"><ScanFace className="h-10 w-10 text-primary" /><div><h1 className="text-3xl font-bold">Kiểm tra Deepfake</h1><p className="mt-1 text-muted-foreground">Hình ảnh & giọng nói</p></div></div>
    <div role="status" className="mb-6 rounded-md border border-warning bg-warning/10 p-4 text-sm"><strong>BẢN MÔ PHỎNG</strong> — Chưa kết nối bộ phát hiện Deepfake thật. Các điểm số và chỉ báo dưới đây là dữ liệu minh họa, không phản ánh tệp của bạn và không xác nhận thật/giả. Tệp chỉ được xử lý trên thiết bị.</div>
    <Tabs value={kind} onValueChange={changeTab}><TabsList className="h-auto w-full justify-start gap-2"><TabsTrigger value="image" disabled={Boolean(capturing) || busy} className="min-h-12 flex-1 gap-2"><ScanFace className="h-4 w-4" />Hình ảnh</TabsTrigger><TabsTrigger value="audio" disabled={Boolean(capturing) || busy} className="min-h-12 flex-1 gap-2"><Mic className="h-4 w-4" />Giọng nói / Audio</TabsTrigger></TabsList></Tabs>
    <div className="mt-6 grid gap-8 lg:grid-cols-2">
      <section className="min-w-0 space-y-4"><h2 className="text-xl font-semibold">{kind === "image" ? "Ảnh cần kiểm tra" : "Âm thanh cần kiểm tra"}</h2>
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && !capturing && !busy) selectFile(f); }} className="flex min-h-60 flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center">
          {preview ? kind === "image" ? <img src={preview} alt="Ảnh bạn chọn" className="max-h-64 w-full object-contain" /> : file?.type.startsWith("video") ? <video src={preview} controls className="max-h-64 w-full" /> : <audio src={preview} controls className="w-full" /> : <><Upload className="mb-3 h-10 w-10 text-primary" /><p className="font-medium">Kéo thả tệp vào đây</p></>}
          <p className="mt-3 max-w-full break-all text-sm text-muted-foreground">{file?.name || (kind === "image" ? "PNG, JPG · Tối đa 25 MB" : "MP3, WAV · Bản ghi tối đa 30 giây")}</p>
          <Button variant="outline" className="mt-4" disabled={Boolean(capturing) || busy} onClick={() => input.current?.click()}><Upload />Chọn tệp</Button>
          <input aria-label="Tải tệp kiểm tra Deepfake" ref={input} type="file" accept={kind === "image" ? ".png,.jpg,.jpeg" : ".mp3,.wav"} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) selectFile(f); e.target.value = ""; }} />
        </div>
        {!capturing ? <div className="flex flex-wrap gap-2">{kind === "image" ? <Button variant="outline" disabled={busy} onClick={() => startCapture("photo")}><Camera />Chụp bằng camera</Button> : <><Button variant="outline" disabled={busy} onClick={() => startCapture("audio")}><Mic />Ghi âm</Button><Button variant="outline" disabled={busy} onClick={() => startCapture("video")}><Video />Quay video</Button></>}</div> : <div className="space-y-3 rounded-md border p-4">
          {capturing !== "audio" && <video ref={video} autoPlay muted playsInline className="aspect-video w-full rounded-md bg-muted object-contain" />}
          {capturing === "photo" ? <><Button onClick={takePhoto}><Camera />Chụp ảnh</Button><Button variant="ghost" onClick={() => { stopStream(); setCapturing(null); }}>Hủy</Button></> : <><p role="timer" className="font-semibold text-destructive">Đang ghi: {seconds} / {MAX_RECORDING_SECONDS} giây</p><Button variant="destructive" onClick={stopRecording}><Square />Dừng ghi</Button></>}
        </div>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button className="h-12 w-full" disabled={!file || busy || Boolean(capturing)} onClick={analyze}><ScanFace />{busy ? "Đang chạy mô phỏng…" : "Chạy kiểm tra mô phỏng"}</Button>
      </section>
      <section className="min-w-0 space-y-4"><h2 className="text-xl font-semibold">Kết quả minh họa</h2>
        {!result ? <div className="flex min-h-60 flex-col items-center justify-center border-y py-8 text-center text-muted-foreground"><ScanFace className="mb-3 h-12 w-12" /><p>{busy ? "Đang chuẩn bị báo cáo minh họa…" : "Chưa có kết quả"}</p></div> : <div className="space-y-5 border-y py-6">
          <div className="flex items-center justify-between gap-4"><div><Label>{kind === "image" ? "Điểm rủi ro mô phỏng" : "Tỉ lệ AI Voice mô phỏng"}</Label><p className="mt-2 text-5xl font-bold text-warning">{result.score}%</p></div><span className="rounded-md border border-warning bg-warning/10 p-2 text-sm font-semibold">Minh họa · Không chẩn đoán</span></div>
          <h3 className="font-semibold">Chỉ báo giả lập</h3><ul className="space-y-3">{result.indicators.map(t => <li key={t} className="flex gap-2 text-sm"><AlertTriangle className="h-4 w-4 shrink-0 text-warning" />{t}</li>)}</ul>
          <div className="border-l-4 border-primary bg-accent p-4"><h3 className="font-semibold">Khuyến nghị an toàn</h3><p className="mt-2 text-sm">Gọi lại qua số điện thoại đã biết. Hỏi câu hỏi riêng để xác minh danh tính. Không chuyển tiền, không cung cấp OTP chỉ dựa trên hình ảnh hoặc giọng nói.</p></div>
        </div>}
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => emitRiskAlert("SUSPICIOUS", true)}><Play />Thử cảnh báo vàng</Button><Button variant="destructive" onClick={() => emitRiskAlert("DANGEROUS", true)}><AlertTriangle />Thử cảnh báo đỏ</Button></div>
        <Button asChild variant="link"><Link to="/emergency">Cài đặt người thân khẩn cấp</Link></Button>
      </section>
    </div>
  </div>;
}