import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  Shield, AlertTriangle, CheckCircle2, Search, Camera, Network, Phone, Sparkles,
  Lightbulb, ExternalLink, LifeBuoy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { analyzeUrl, getPublicStats } from "@/lib/scam.functions";
import { useElderlyMode } from "@/hooks/use-elderly";
import { RiskGauge } from "@/components/risk-gauge";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "ScamShield AI — Lá chắn AI chống lừa đảo Việt Nam" }] }),
  component: Home,
});

interface UrlFactor {
  label: string;
  detail?: string;
  points: number;
  category: string;
}
interface UrlResult {
  risk: "SAFE" | "SUSPICIOUS" | "DANGEROUS" | "UNKNOWN";
  score: number;
  url: string;
  host: string;
  factors: UrlFactor[];
  cluster: string;
  clusterName: string;
  brandImpersonated: string | null;
  intelMatches: Array<{ title: string; source_org: string; source_url: string | null }>;
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
    try { setResult(await run({ data: { url: url.trim() } }) as UrlResult); }
    catch { setResult(null); }
    finally { setBusy(false); }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-hero relative overflow-hidden text-white">
        <div className="scan-grid absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Smart URL Engine V2 · Powered by AI + Trusted Intel
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Phân tích URL <span className="text-cyber">thông minh</span>
              <br />đối chiếu chiến dịch lừa đảo Việt Nam
            </h1>
            <p className="mt-5 text-lg text-white/80">
              Đánh giá rủi ro URL theo 10+ yếu tố: cấu trúc, TLD, typosquatting, homograph, mạo danh thương hiệu, đối chiếu CSDL cảnh báo của Bộ Công an, NCSC và báo chí.
            </p>
            <form onSubmit={check} className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Dán URL nghi ngờ (vd: vietcombank-security.com)"
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
        <section className="mx-auto -mt-10 max-w-5xl px-4">
          <Card className={`shadow-cyber border-2 p-6 ${result.risk === "DANGEROUS" ? "border-destructive" : result.risk === "SUSPICIOUS" ? "border-warning" : "border-success"}`}>
            <div className="grid gap-6 md:grid-cols-[260px_1fr]">
              <div className="flex flex-col items-center justify-center gap-3 border-b pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-6">
                <RiskGauge score={result.score} risk={result.risk} />
                <p className="break-all text-center text-xs text-muted-foreground">{result.host || result.url}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold">Báo cáo phân tích chi tiết</h3>
                    {result.brandImpersonated && (
                      <Badge variant="destructive">Mạo danh: {result.brandImpersonated}</Badge>
                    )}
                    {result.cluster !== "UNKNOWN" && (
                      <Badge variant="outline">Nhóm: {result.clusterName}</Badge>
                    )}
                  </div>
                  {result.intelMatches.length > 0 && (
                    <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                        <div>
                          <p className="font-semibold">
                            Cảnh báo: Website này có đặc điểm tương tự các chiến dịch lừa đảo đã được cơ quan chức năng cảnh báo.
                          </p>
                          <ul className="mt-2 space-y-1">
                            {result.intelMatches.slice(0, 5).map((m, i) => (
                              <li key={i} className="flex items-center gap-1 text-xs">
                                <span className="font-medium">• {m.title}</span>
                                <span className="text-muted-foreground">— {m.source_org}</span>
                                {m.source_url && (
                                  <a href={m.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Factor breakdown */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Phân rã điểm rủi ro
                  </h4>
                  {result.factors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Không phát hiện yếu tố rủi ro nào. URL có vẻ an toàn theo các tiêu chí kỹ thuật.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {result.factors.map((f, i) => (
                        <li key={i} className="flex items-start gap-3 rounded-md border bg-card p-3">
                          <div
                            className={`mt-0.5 flex h-7 min-w-[60px] items-center justify-center rounded-md text-xs font-bold ${
                              f.points < 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                            }`}
                          >
                            {f.points > 0 ? `+${f.points}` : f.points}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{f.label}</div>
                            {f.detail && <div className="text-xs text-muted-foreground">{f.detail}</div>}
                          </div>
                        </li>
                      ))}
                      <li className="flex items-center justify-between rounded-md border-2 border-primary/40 bg-primary/5 p-3 font-semibold">
                        <span>Tổng điểm rủi ro</span>
                        <span className="text-lg">{result.score} / 100</span>
                      </li>
                    </ul>
                  )}
                </div>

                {/* Recommendations */}
                <div className="rounded-lg bg-accent p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Lightbulb className="h-4 w-4 text-cyber" /> AI khuyến nghị
                  </div>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                    {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>

                {result.risk === "DANGEROUS" && (
                  <div className="flex flex-wrap gap-2">
                    <a href="tel:113"><Button variant="destructive"><Phone className="mr-2 h-4 w-4" />Gọi 113 ngay</Button></a>
                    <Link to="/recovery"><Button variant="outline"><LifeBuoy className="mr-2 h-4 w-4" />Xử lí khi bị lừa</Button></Link>
                    <Link to="/emergency"><Button variant="ghost">Liên hệ người thân</Button></Link>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard to="/dna-map" icon={<Network className="h-6 w-6" />} title="Bản đồ Bộ Gen Lừa Đảo" desc="4 nhóm lừa đảo phổ biến tại Việt Nam." />
          <FeatureCard to="/screenshot-detector" icon={<Camera className="h-6 w-6" />} title="Quét ảnh chụp màn hình" desc="OCR + AI phân tích SMS, Zalo, Messenger." />
          <FeatureCard to="/reports" icon={<Shield className="h-6 w-6" />} title="Báo cáo cộng đồng" desc="Gửi báo cáo ẩn danh, đóng góp dữ liệu." />
          <FeatureCard to="/recovery" icon={<LifeBuoy className="h-6 w-6" />} title="Xử lí khi bị lừa" desc="Hướng dẫn khẩn cấp & ghi nhận thiệt hại." />
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
