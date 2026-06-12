import { createFileRoute } from "@tanstack/react-router";
import { CLUSTERS } from "@/lib/scam-dna";
import { Card } from "@/components/ui/card";
import { useServerFn } from "@tanstack/react-start";
import { getPublicStats } from "@/lib/scam.functions";
import { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from "recharts";
import { Network } from "lucide-react";

export const Route = createFileRoute("/dna-map")({
  head: () => ({ meta: [{ title: "Bản đồ Bộ Gen Lừa Đảo — ScamShield AI" }] }),
  component: DnaMap,
});

function DnaMap() {
  const fetchStats = useServerFn(getPublicStats);
  const [counts, setCounts] = useState<Record<string, number>>({ A: 0, B: 0, C: 0, D: 0, UNKNOWN: 0 });
  useEffect(() => {
    fetchStats({ data: undefined as never }).then((s) => {
      const c: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, UNKNOWN: 0 };
      for (const r of s.reports as Array<{ cluster: string | null }>) c[r.cluster ?? "UNKNOWN"] = (c[r.cluster ?? "UNKNOWN"] ?? 0) + 1;
      for (const e of s.events as Array<{ cluster: string | null; event_type: string }>) {
        if (e.event_type === "url_analysis" || e.event_type === "screenshot_analysis")
          c[e.cluster ?? "UNKNOWN"] = (c[e.cluster ?? "UNKNOWN"] ?? 0) + 1;
      }
      setCounts(c);
    });
  }, [fetchStats]);

  const pieData = Object.values(CLUSTERS).map((c) => ({ name: `Nhóm ${c.id}`, value: counts[c.id] || 0, color: c.color }));
  const barData = Object.values(CLUSTERS).map((c) => ({ name: `${c.id}`, "Số lượng": counts[c.id] || 0 }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10 flex items-center gap-3">
        <div className="bg-gradient-cyber rounded-xl p-3 text-white"><Network className="h-6 w-6" /></div>
        <div>
          <h1 className="text-3xl font-bold">Bản đồ Bộ Gen Lừa Đảo</h1>
          <p className="text-sm text-muted-foreground">Scam DNA Clustering Engine — phân loại tự động báo cáo cộng đồng</p>
        </div>
      </div>

      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Phân bố cụm (DNA)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} label>
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Tần suất theo nhóm</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <XAxis dataKey="name" /><YAxis />
              <Tooltip />
              <Bar dataKey="Số lượng" fill="#1D4ED8" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Object.values(CLUSTERS).map((c) => (
          <Card key={c.id} className="overflow-hidden border-l-4 p-6" style={{ borderLeftColor: c.color }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">Cluster {c.id}</div>
                <h3 className="text-xl font-bold">{c.name}</h3>
              </div>
              <div className="text-3xl font-bold" style={{ color: c.color }}>{counts[c.id] || 0}</div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
            <div className="mt-3">
              <div className="text-xs font-semibold">Từ khoá nhận diện:</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {c.keywords.slice(0, 8).map((k) => (
                  <span key={k} className="rounded-full bg-muted px-2 py-0.5 text-xs">{k}</span>
                ))}
              </div>
            </div>
            <div className="mt-3 rounded-md bg-accent p-3">
              <div className="text-xs font-semibold">Khuyến nghị:</div>
              <ul className="mt-1 list-inside list-disc text-xs">
                {c.recommendations.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
