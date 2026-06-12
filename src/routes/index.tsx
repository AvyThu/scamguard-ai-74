import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle2, Search, Camera, Network, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { analyzeUrl, getPublicStats } from "@/lib/scam.functions";
import { useElderlyMode } from "@/hooks/use-elderly";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "ScamShield AI — Trang chủ" }] }),
  component: Home,
});

interface UrlResult {
  risk: "SAFE" | "SUSPICIOUS" | "DANGEROUS" | "UNKNOWN";
  score: number;
  url: string;
  reasons: string[];
  cluster: string;
  recommendations: string[];
}

function Home() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UrlResult | null>(null);
  const [stats, setStats] = useState<Array<{ metric_key: string; label: string; value: string; source: string; updated_at: string }>>([]);
  const run = useServerFn(analyzeUrl);
  const fetchStats = useServerFn(getPublicStats);
  const { enabled: elderly, toggle } = useElderlyMode();

  useEffect(() => {
    fetchStats({ data: undefined as never }).then((s) => setStats(s.cyberStats as never)).catch(() => {});
  }, [fetchStats]);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    try { setResult(await run({ data: { url: url.trim() } })); }
    catch { setResult(null); }
    finally { setBusy(false); }
  }

  const riskColor = result?.risk === "DANGEROUS" ? "destructive" : result?.risk === "SUSPICIOUS" ? "warning" : "success";

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-hero relative overflow-hidden text-white">
        <div className="scan-grid absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Powered by Lovable AI · Gemini Vision
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Lá chắn <span className="text-cyber">AI</span> chống lừa đảo
              <br />trên không gian mạng Việt Nam
            </h1>
            <p className="mt-5 text-lg text-white/80">
              Phân tích URL, ảnh chụp tin nhắn và phân loại theo Bộ Gen Lừa Đảo. Bảo vệ bạn và người thân khỏi các chiêu trò mạo danh, việc nhẹ lương cao, giả mạo sàn TMĐT và thu hồi vốn.
            </p>
            <form onSubmit={check} className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Dán URL nghi ngờ (vd: dichvucong-vn.net)"
                className="h-12 bg-white/95 text-foreground placeholder:text-muted-foreground"
              />
              <Button type="submit" disabled={busy} className="h-12 bg-cyber text-cyber-foreground hover:opacity-90">
                <Search className="mr-2 h-4 w-4" />
                {busy ? "Đang quét…" : "Phân tích"}
              </Button>
            </form>
            <button onClick={() => toggle()} className="mt-3 text-xs text-white/70 underline hover:text-white">
              {elderly ? "Tắt chế độ Người cao tuổi" : "Bật chế độ Người cao tuổi (chữ to)"}
            </button>
          </div>
        </div>
      </section>

      {/* URL Result */}
      {result && (
        <section className="mx-auto -mt-10 max-w-4xl px-4">
          <Card className={`shadow-cyber border-2 p-6 ${result.risk === "DANGEROUS" ? "border-destructive" : result.risk === "SUSPICIOUS" ? "border-warning" : "border-success"}`}>
            <div className="flex items-start gap-4">
              {result.risk === "DANGEROUS" ? <AlertTriangle className="h-10 w-10 text-destructive" />
                : result.risk === "SUSPICIOUS" ? <AlertTriangle className="h-10 w-10 text-warning" />
                : <CheckCircle2 className="h-10 w-10 text-success" />}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold">
                    {result.risk === "DANGEROUS" ? "NGUY HIỂM" : result.risk === "SUSPICIOUS" ? "NGHI NGỜ" : "AN TOÀN"}
                  </h3>
                  <span className={`rounded-full px-3 py-0.5 text-sm font-semibold text-${riskColor}-foreground bg-${riskColor}`}>
                    Điểm rủi ro: {result.score}/100
                  </span>
                </div>
                <p className="mt-1 break-all text-sm text-muted-foreground">{result.url}</p>
                {result.reasons.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-semibold">Lý do:</div>
                    <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                      {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
                <div className="mt-4 rounded-lg bg-accent p-4">
                  <div className="text-sm font-semibold">Khuyến nghị:</div>
                  <ul className="mt-1 list-inside list-disc text-sm">
                    {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
                {result.risk === "DANGEROUS" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a href="tel:113"><Button variant="destructive"><Phone className="mr-2 h-4 w-4" />Gọi 113 ngay</Button></a>
                    <Link to="/emergency"><Button variant="outline">Liên hệ người thân</Button></Link>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* National stats */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">Thống kê An ninh mạng Quốc gia</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Nguồn dữ liệu: Cơ quan chức năng Việt Nam · Cập nhật: {stats[0]?.updated_at ? new Date(stats[0].updated_at).toLocaleDateString("vi-VN") : "—"}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.metric_key} className="p-6">
              <div className="text-3xl font-bold text-primary">{s.value}</div>
              <div className="mt-1 text-sm font-medium">{s.label}</div>
              <div className="mt-2 text-xs text-muted-foreground">{s.source}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <h2 className="mb-8 text-center text-3xl font-bold">Bộ công cụ ScamShield</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard to="/dna-map" icon={<Network className="h-6 w-6" />} title="Bản đồ Bộ Gen Lừa Đảo" desc="Phân cụm 4 nhóm lừa đảo phổ biến tại Việt Nam dựa trên báo cáo cộng đồng." />
          <FeatureCard to="/screenshot-detector" icon={<Camera className="h-6 w-6" />} title="Quét ảnh chụp màn hình" desc="OCR + AI phân tích ảnh SMS, Zalo, Messenger, Email tìm dấu hiệu lừa đảo." />
          <FeatureCard to="/reports" icon={<Shield className="h-6 w-6" />} title="Báo cáo cộng đồng" desc="Gửi báo cáo lừa đảo ẩn danh, góp phần xây dựng cơ sở dữ liệu phòng chống." />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to}>
      <Card className="group h-full p-6 transition hover:border-primary hover:shadow-cyber">
        <div className="bg-gradient-cyber inline-flex h-12 w-12 items-center justify-center rounded-xl text-white">{icon}</div>
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </Card>
    </Link>
  );
}
