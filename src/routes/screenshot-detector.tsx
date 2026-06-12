import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import { Camera, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { analyzeScreenshot } from "@/lib/scam.functions";

export const Route = createFileRoute("/screenshot-detector")({
  head: () => ({ meta: [{ title: "Quét ảnh chụp — ScamShield AI" }] }),
  component: ScreenshotDetector,
});

function ScreenshotDetector() {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<Awaited<ReturnType<typeof run>> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const run = useServerFn(analyzeScreenshot);

  async function onFile(f: File) {
    if (!f) return;
    if (f.size > 6_000_000) { alert("Ảnh quá lớn (>6MB)"); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      setPreview(dataUrl);
      setBusy(true); setResult(null); setStep(1);
      try {
        await new Promise(r => setTimeout(r, 300)); setStep(2);
        await new Promise(r => setTimeout(r, 200)); setStep(3);
        const res = await run({ data: { imageDataUrl: dataUrl } });
        setStep(4);
        setResult(res);
      } catch (e) {
        alert("Lỗi phân tích: " + (e as Error).message);
      } finally { setBusy(false); }
    };
    reader.readAsDataURL(f);
  }

  const steps = ["Tải ảnh", "Trích xuất văn bản (OCR)", "Phân tích mẫu", "Phân loại lừa đảo", "Đánh giá rủi ro"];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-gradient-cyber rounded-xl p-3 text-white"><Camera className="h-6 w-6" /></div>
        <div>
          <h1 className="text-3xl font-bold">Quét ảnh chụp màn hình</h1>
          <p className="text-sm text-muted-foreground">Hỗ trợ SMS, Messenger, Zalo, Telegram, Email</p>
        </div>
      </div>

      <Card
        className="cursor-pointer border-2 border-dashed p-10 text-center transition hover:border-primary"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
      >
        <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
        <div className="mt-3 font-semibold">Kéo thả ảnh hoặc bấm để chọn</div>
        <div className="text-sm text-muted-foreground">PNG, JPG (tối đa 6MB)</div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      </Card>

      {(busy || result) && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card className="p-4">
            {preview && <img src={preview} alt="preview" className="max-h-96 w-full rounded object-contain" />}
            <div className="mt-4 space-y-2">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2 text-sm">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step > i ? "bg-success text-success-foreground" : step === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                  <span className={step > i ? "text-foreground" : "text-muted-foreground"}>{s}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            {!result && <div className="text-sm text-muted-foreground">Đang phân tích…</div>}
            {result && (
              <>
                <div className={`flex items-center gap-2 text-2xl font-bold ${result.risk === "DANGEROUS" ? "text-destructive" : result.risk === "SUSPICIOUS" ? "text-warning" : "text-success"}`}>
                  {result.risk === "DANGEROUS" ? <AlertTriangle /> : result.risk === "SUSPICIOUS" ? <AlertTriangle /> : <CheckCircle2 />}
                  {result.risk}
                </div>
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Nhóm lừa đảo</div>
                  <div className="text-base font-medium">{result.scam_category}</div>
                </div>
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Tóm tắt</div>
                  <p className="text-sm">{result.summary}</p>
                </div>
                {result.suspicious_phrases?.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-semibold uppercase text-muted-foreground">Cụm từ đáng ngờ</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {result.suspicious_phrases.map((p, i) => <span key={i} className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">{p}</span>)}
                    </div>
                  </div>
                )}
                {result.ocr_text && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs font-semibold uppercase text-muted-foreground">Văn bản OCR</summary>
                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">{result.ocr_text}</pre>
                  </details>
                )}
                {result.risk === "DANGEROUS" && (
                  <div className="mt-4 rounded-lg border-2 border-destructive bg-destructive/5 p-4">
                    <div className="font-bold text-destructive">Cảnh báo nguy hiểm cao</div>
                    <p className="mt-1 text-sm">Hãy xác minh với người thân trước khi thao tác. Trong trường hợp khẩn cấp, gọi <a href="tel:113" className="font-bold underline">113</a>.</p>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
