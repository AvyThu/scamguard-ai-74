import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Quản trị — ScamShield AI" }] }),
  component: Admin,
});

function Admin() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);
  const [reports, setReports] = useState<Array<{ id: string; category: string; description: string; cluster: string | null; status: string; created_at: string }>>([]);
  const [bl, setBl] = useState<Array<{ id: string; url_pattern: string; reason: string | null; cluster: string | null }>>([]);
  const [stats, setStats] = useState<Array<{ id: string; metric_key: string; label: string; value: string; source: string }>>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate({ to: "/auth" }); return; }
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      if (!r?.some((x: { role: string }) => x.role === "admin")) {
        toast.error("Bạn không có quyền quản trị. Liên hệ admin để được cấp quyền.");
        navigate({ to: "/" }); return;
      }
      setAllowed(true);
      reload();
    })();
  }, [navigate]);

  async function reload() {
    const [{ data: r }, { data: b }, { data: s }] = await Promise.all([
      supabase.from("scam_reports").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("url_blacklist").select("*"),
      supabase.from("cyber_stats").select("*"),
    ]);
    setReports((r ?? []) as never); setBl((b ?? []) as never); setStats((s ?? []) as never);
  }

  if (!allowed) return null;
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-bold">Trang quản trị</h1>
      <Tabs defaultValue="reports" className="mt-6">
        <TabsList>
          <TabsTrigger value="reports">Báo cáo</TabsTrigger>
          <TabsTrigger value="blacklist">Danh sách đen</TabsTrigger>
          <TabsTrigger value="stats">Thống kê</TabsTrigger>
        </TabsList>
        <TabsContent value="reports">
          <div className="space-y-2">
            {reports.map(r => (
              <Card key={r.id} className="p-3 text-sm">
                <div className="flex justify-between"><span className="font-medium">{r.category}</span><span className="text-xs">{r.cluster}</span></div>
                <p className="text-muted-foreground">{r.description}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={async () => { await supabase.from("scam_reports").delete().eq("id", r.id); reload(); }}>Xoá</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="blacklist">
          <Card className="mb-4 p-4">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await supabase.from("url_blacklist").insert({ url_pattern: String(fd.get("p")), reason: String(fd.get("r")), cluster: String(fd.get("c")) });
              (e.currentTarget as HTMLFormElement).reset(); reload();
            }} className="flex gap-2">
              <Input name="p" placeholder="domain.tld" required />
              <Input name="r" placeholder="Lý do" />
              <Input name="c" placeholder="A/B/C/D" className="w-20" />
              <Button>Thêm</Button>
            </form>
          </Card>
          <div className="space-y-2">
            {bl.map(b => (
              <Card key={b.id} className="flex items-center justify-between p-3 text-sm">
                <span><strong>{b.url_pattern}</strong> — {b.reason} ({b.cluster})</span>
                <Button size="sm" variant="ghost" onClick={async () => { await supabase.from("url_blacklist").delete().eq("id", b.id); reload(); }}>Xoá</Button>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="stats">
          <div className="space-y-2">
            {stats.map(s => (
              <Card key={s.id} className="p-3">
                <div className="text-xs text-muted-foreground">{s.metric_key}</div>
                <div className="flex items-center gap-2">
                  <Input defaultValue={s.label} onBlur={async (e) => { await supabase.from("cyber_stats").update({ label: e.target.value }).eq("id", s.id); }} />
                  <Input defaultValue={s.value} onBlur={async (e) => { await supabase.from("cyber_stats").update({ value: e.target.value, updated_at: new Date().toISOString() }).eq("id", s.id); }} />
                  <Input defaultValue={s.source} onBlur={async (e) => { await supabase.from("cyber_stats").update({ source: e.target.value }).eq("id", s.id); }} />
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
