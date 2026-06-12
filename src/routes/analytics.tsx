import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getPublicStats } from "@/lib/scam.functions";
import { CLUSTERS } from "@/lib/scam-dna";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, Legend } from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Thống kê công khai — ScamShield AI" }] }),
  component: Analytics,
});

function Analytics() {
  const fetchStats = useServerFn(getPublicStats);
  const [data, setData] = useState<{ reports: Array<{ cluster: string | null; created_at: string; region: string | null }>; events: Array<{ event_type: string; created_at: string; cluster: string | null; risk_level: string | null }> }>({ reports: [], events: [] });

  useEffect(() => { fetchStats({ data: undefined as never }).then((s) => setData(s as never)); }, [fetchStats]);

  const byCluster = Object.values(CLUSTERS).map((c) => ({
    name: c.name.split(" ").slice(0, 3).join(" "),
    value: data.reports.filter((r) => r.cluster === c.id).length,
  }));

  // Monthly
  const monthly: Record<string, number> = {};
  for (const r of data.reports) {
    const k = r.created_at.slice(0, 7);
    monthly[k] = (monthly[k] || 0) + 1;
  }
  const monthlyData = Object.keys(monthly).sort().map((k) => ({ month: k, count: monthly[k] }));

  const totalReports = data.reports.length;
  const totalAnalyses = data.events.length;
  const dangerous = data.events.filter(e => e.risk_level === "DANGEROUS").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-bold">Thống kê công khai</h1>
      <p className="mt-2 text-sm text-muted-foreground">Dữ liệu cộng đồng và phân tích AI ScamShield</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Tổng báo cáo" value={totalReports} />
        <StatCard label="Tổng phân tích AI" value={totalAnalyses} />
        <StatCard label="Cảnh báo nguy hiểm" value={dangerous} accent />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Phân bố theo nhóm lừa đảo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byCluster}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis />
              <Tooltip /><Bar dataKey="value" fill="#06B6D4" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Tăng trưởng theo tháng</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis />
              <Tooltip /><Legend /><Line type="monotone" dataKey="count" stroke="#1D4ED8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <Card className="p-6">
      <div className={`text-4xl font-bold ${accent ? "text-destructive" : "text-primary"}`}>{value.toLocaleString("vi-VN")}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </Card>
  );
}
