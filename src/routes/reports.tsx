import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { submitReport, getPublicStats } from "@/lib/scam.functions";
import { toast } from "sonner";
import { CLUSTERS } from "@/lib/scam-dna";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Báo cáo lừa đảo — ScamShield AI" }] }),
  component: Reports,
});

function Reports() {
  const submit = useServerFn(submitReport);
  const fetchStats = useServerFn(getPublicStats);
  const [recent, setRecent] = useState<Array<{ category: string; description: string; cluster: string | null; created_at: string }>>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchStats({ data: undefined as never }).then((s) => setRecent((s.reports as never[]).slice(-15).reverse()));
  }, [fetchStats]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const res = await submit({
        data: {
          category: String(fd.get("category") || "Khác"),
          description: String(fd.get("description") || ""),
          url: String(fd.get("url") || "") || null,
          platform: String(fd.get("platform") || "") || null,
          incident_date: String(fd.get("date") || "") || null,
          estimated_loss: Number(fd.get("loss") || 0) || null,
          region: String(fd.get("region") || "") || null,
          is_anonymous: fd.get("anon") === "on",
        },
      });
      toast.success(`Đã ghi nhận báo cáo (Cluster ${res.cluster})`);
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err) {
      toast.error("Không thể gửi báo cáo: " + (err as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">Hệ thống báo cáo cộng đồng</h1>
      <p className="mt-2 text-sm text-muted-foreground">Đóng góp báo cáo lừa đảo của bạn để bảo vệ cộng đồng. Có thể gửi ẩn danh.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Gửi báo cáo mới</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Loại lừa đảo</Label>
              <select name="category" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                {Object.values(CLUSTERS).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <Label>Mô tả (chi tiết tin nhắn, hành vi…)</Label>
              <Textarea name="description" rows={4} required minLength={10} maxLength={4000} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label>URL liên quan</Label><Input name="url" placeholder="https://..." /></div>
              <div><Label>Nền tảng</Label><Input name="platform" placeholder="Zalo, SMS, Email…" /></div>
              <div><Label>Ngày xảy ra</Label><Input name="date" type="date" /></div>
              <div><Label>Thiệt hại (VND)</Label><Input name="loss" type="number" min={0} /></div>
              <div><Label>Khu vực</Label><Input name="region" placeholder="Hà Nội, TP.HCM…" /></div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="anon" name="anon" defaultChecked />
              <Label htmlFor="anon" className="cursor-pointer">Gửi ẩn danh</Label>
            </div>
            <Button type="submit" disabled={busy} className="bg-gradient-cyber w-full">{busy ? "Đang gửi…" : "Gửi báo cáo"}</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Báo cáo gần đây</h2>
          <div className="space-y-3">
            {recent.length === 0 && <p className="text-sm text-muted-foreground">Chưa có báo cáo.</p>}
            {recent.map((r, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(r.created_at).toLocaleString("vi-VN")}</span>
                  {r.cluster && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Cluster {r.cluster}</span>}
                </div>
                <div className="mt-1 text-sm font-medium">{r.category}</div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
