import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { MapPin, ThumbsUp, Shield, Send, LocateFixed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/page-head";
import { REGIONS, reportRegion, nearestRegion } from "@/lib/regions";
import { toast } from "sonner";
const MapView = lazy(() => import("@/components/community-map"));
const communityQuery = queryOptions({ queryKey: ["approved-community"], queryFn: async () => {
  const [reports, votes] = await Promise.all([
    supabase.from("scam_reports").select("id, category, description, region, created_at, cluster").eq("status", "approved").order("created_at", { ascending: false }).limit(200),
    supabase.rpc("community_vote_counts"),
  ]);
  if (reports.error) throw new Error("Không tải được báo cáo cộng đồng.");
  return { reports: reports.data || [], votes: votes.data || [] };
} });
export const Route = createFileRoute("/community")({
  head: () => pageHead("Cảnh báo cộng đồng", "Bản đồ mật độ báo cáo lừa đảo theo khu vực, bảng tin ẩn danh và cảnh báo hữu ích từ người dân."),
  // Browser publishable reads: public approved rows only, enforced by RLS.
  component: Community,
});
function Community() {
  return <ClientOnly fallback={<div className="mx-auto max-w-6xl p-10">Đang tải cảnh báo cộng đồng…</div>}><Suspense fallback={<div className="p-10">Đang tải…</div>}><CommunityContent /></Suspense></ClientOnly>;
}
function CommunityContent() {
  const { data, refetch } = useSuspenseQuery(communityQuery);
  const [region, setRegion] = useState("Tất cả khu vực");
  const [location, setLocation] = useState("");
  const [voted, setVoted] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  useEffect(() => { try { setVoted(JSON.parse(localStorage.getItem("verisafe_voted") || "[]")); } catch {} locate(); }, []);
  function locate() {
    if (!navigator.geolocation) { setLocation("Không hỗ trợ định vị. Bạn có thể chọn khu vực."); return; }
    setLocation("Đang xác định khu vực…");
    navigator.geolocation.getCurrentPosition(p => {
      const area = nearestRegion(p.coords.latitude, p.coords.longitude);
      if (area && Math.hypot(area.lat-p.coords.latitude, area.lng-p.coords.longitude) < 0.8) { setRegion(area.name); setLocation(`Khu vực gần nhất: ${area.name}`); }
      else setLocation("Chưa xác định khu vực phù hợp. Vui lòng chọn thủ công.");
    }, () => setLocation("Chưa có quyền vị trí. Vui lòng chọn khu vực."), { timeout: 10000, maximumAge: 600000 });
  }
  async function vote(id: string) {
    if (voted.includes(id) || voting) return; setVoting(id);
    let key = localStorage.getItem("verisafe_voter_key");
    if (!key) { key = crypto.randomUUID(); localStorage.setItem("verisafe_voter_key", key); }
    const { error } = await supabase.from("community_votes").insert({ report_id: id, voter_key: key });
    setVoting(null);
    if (error && error.code !== "23505") { toast.error("Chưa ghi nhận được cảnh báo hữu ích."); return; }
    const next = [...voted, id]; setVoted(next); localStorage.setItem("verisafe_voted", JSON.stringify(next)); await refetch();
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; const fd = new FormData(form); setBusy(true);
    const { error } = await supabase.from("scam_reports").insert({ category: String(fd.get("category")), description: String(fd.get("description")), region: String(fd.get("region")), is_anonymous: true, status: "pending" });
    setBusy(false);
    if (error) { toast.error("Không gửi được cảnh báo. Vui lòng thử lại sau."); return; }
    form.reset(); toast.success("Đã nhận cảnh báo ẩn danh. Nội dung sẽ hiển thị sau khi được duyệt.");
  }
  const filtered = data.reports.filter(r => region === "Tất cả khu vực" || reportRegion(r.region)?.name === region);
  const unmapped = data.reports.filter(r => !reportRegion(r.region)).length;
  return <div className="mx-auto max-w-6xl px-4 py-10">
    <div className="mb-6 flex items-center gap-3"><Shield className="h-10 w-10 text-primary" /><div><h1 className="text-3xl font-bold">Cảnh báo cộng đồng</h1><p className="mt-1 text-muted-foreground">Người dân cùng bảo vệ người dân</p></div></div>
    <div className="mb-4 flex flex-wrap items-end gap-3"><div className="flex-1"><Label htmlFor="community-region">Khu vực</Label><select id="community-region" value={region} onChange={e => setRegion(e.target.value)} className="mt-1 min-h-11 w-full rounded-md border bg-background px-3"><option>Tất cả khu vực</option>{REGIONS.map(r => <option key={r.name}>{r.name}</option>)}</select></div><Button variant="outline" onClick={locate}><LocateFixed />Vị trí của tôi</Button></div>
    <p role="status" className="mb-3 text-sm text-muted-foreground">{location}</p>
    <Suspense fallback={<div className="h-80 bg-muted" />}><MapView reports={data.reports} region={region} /></Suspense>
    <p className="mt-2 text-xs text-muted-foreground">Vùng màu biểu thị mật độ báo cáo tại trung tâm khu vực, không phải địa chỉ vụ việc. {unmapped > 0 ? `${unmapped} báo cáo chưa có khu vực phù hợp để đưa lên bản đồ.` : ""} Không có điểm màu khi chưa có báo cáo được duyệt.</p>
    <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]"><section className="min-w-0"><h2 className="mb-4 text-xl font-semibold">Bảng tin địa phương <span className="text-muted-foreground">({filtered.length})</span></h2>
      {filtered.length === 0 && <div className="border-y py-8 text-muted-foreground">Chưa có cảnh báo được duyệt trong khu vực này.</div>}
      {filtered.map(r => <article key={r.id} className="border-b py-5 first:border-t"><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary"><Shield className="h-5 w-5" /></div><div className="min-w-0"><p className="font-semibold">Người dân ẩn danh</p><p className="text-xs text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" />{r.region || "Chưa xác định khu vực"} · {new Date(r.created_at).toLocaleString("vi-VN")}</p></div></div><h3 className="mt-3 font-semibold">{r.category}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm">{r.description}</p><Button variant={voted.includes(r.id) ? "secondary" : "ghost"} size="sm" className="mt-3" disabled={voted.includes(r.id) || voting === r.id} onClick={() => vote(r.id)}><ThumbsUp />Cảnh báo hữu ích · {data.votes.find(v => v.report_id === r.id)?.votes || 0}</Button></article>)}
    </section><section><h2 className="mb-4 text-xl font-semibold">Đóng góp cảnh báo ẩn danh</h2><form onSubmit={submit} className="space-y-4 border-y py-5"><div><Label htmlFor="local-category">Hình thức lừa đảo</Label><Input id="local-category" name="category" required maxLength={120} placeholder="Mạo danh người thân, tuyển CTV…" /></div><div><Label htmlFor="local-area">Khu vực xảy ra</Label><Input id="local-area" name="region" required maxLength={80} placeholder="Ninh Kiều, Cần Thơ" defaultValue={region === "Tất cả khu vực" ? "" : region} /></div><div><Label htmlFor="local-description">Tin nhắn hoặc cách bạn bị tiếp cận</Label><Textarea id="local-description" name="description" required minLength={10} maxLength={4000} rows={5} placeholder="Không đăng tên, số điện thoại, số tài khoản hoặc thông tin riêng tư." /></div><p className="text-xs text-muted-foreground">Nội dung được duyệt trước khi xuất hiện công khai. Hãy ẩn thông tin nhận dạng trong mô tả.</p><Button type="submit" disabled={busy} className="h-12 w-full"><Send />{busy ? "Đang gửi…" : "Gửi cảnh báo ẩn danh"}</Button></form></section></div>
  </div>;
}