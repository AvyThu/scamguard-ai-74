import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  AlertTriangle, Phone, ShieldCheck, FileText, Camera, MessageSquare, Mail,
  Link2, Receipt, Download, Trash2, Plus, CheckCircle2, Lock, CreditCard,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/recovery")({
  head: () => ({
    meta: [
      { title: "Xử lí khi bị lừa — ScamShield AI" },
      { name: "description", content: "Hướng dẫn khẩn cấp cho nạn nhân lừa đảo trực tuyến: checklist hành động, thu thập bằng chứng, báo cáo cơ quan chức năng và đánh giá thiệt hại." },
    ],
  }),
  component: Recovery,
});

interface EvidenceItem {
  id: string;
  type: "screenshot" | "message" | "email" | "url" | "receipt";
  content: string;
  note?: string;
  createdAt: string;
}
interface LossRecord {
  scamType: string;
  date: string;
  platform: string;
  amount: number;
  notes: string;
}

const CHECKLIST = [
  { key: "stop", label: "Ngừng ngay mọi liên lạc với đối tượng lừa đảo (chặn số, chặn tin nhắn).", icon: AlertTriangle },
  { key: "password", label: "Đổi mật khẩu tất cả tài khoản liên quan (email, ngân hàng, mạng xã hội).", icon: Lock },
  { key: "bank", label: "Liên hệ ngân hàng NGAY LẬP TỨC để báo cáo và yêu cầu phong toả giao dịch.", icon: CreditCard },
  { key: "card", label: "Khoá thẻ hoặc tài khoản thanh toán nếu thông tin đã bị lộ.", icon: ShieldCheck },
  { key: "evidence", label: "Lưu giữ toàn bộ bằng chứng: ảnh chụp, tin nhắn, biên lai chuyển khoản.", icon: Camera },
  { key: "report", label: "Trình báo công an phường/xã nơi cư trú và gọi 113 nếu khẩn cấp.", icon: Phone },
];

const REPORTING_CHANNELS = [
  { name: "113 — Cảnh sát phản ứng nhanh", contact: "tel:113", desc: "Khẩn cấp 24/7, mọi vụ lừa đảo nghiêm trọng." },
  { name: "Bộ Công an — An ninh mạng", contact: "tel:1900561557", desc: "Tư vấn, trình báo lừa đảo trực tuyến." },
  { name: "NCSC — Cảnh báo lừa đảo", contact: "https://khonggianmang.vn", desc: "Báo cáo URL lừa đảo cho Trung tâm GSAT KGMQG." },
  { name: "canhbao.khonggianmang.vn", contact: "https://canhbao.khonggianmang.vn", desc: "Cổng cảnh báo lừa đảo trực tuyến chính thức." },
  { name: "Cục An toàn thông tin", contact: "https://ais.gov.vn", desc: "Cục ATTT — Bộ Thông tin & Truyền thông." },
];

function Recovery() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [evForm, setEvForm] = useState<{ type: EvidenceItem["type"]; content: string; note: string }>({ type: "message", content: "", note: "" });
  const [loss, setLoss] = useState<LossRecord>({ scamType: "", date: new Date().toISOString().slice(0, 10), platform: "", amount: 0, notes: "" });

  useEffect(() => {
    try {
      const c = localStorage.getItem("ss_recovery_checked"); if (c) setChecked(JSON.parse(c));
      const e = localStorage.getItem("ss_recovery_evidence"); if (e) setEvidence(JSON.parse(e));
      const l = localStorage.getItem("ss_recovery_loss"); if (l) setLoss(JSON.parse(l));
    } catch {}
  }, []);
  useEffect(() => { localStorage.setItem("ss_recovery_checked", JSON.stringify(checked)); }, [checked]);
  useEffect(() => { localStorage.setItem("ss_recovery_evidence", JSON.stringify(evidence)); }, [evidence]);
  useEffect(() => { localStorage.setItem("ss_recovery_loss", JSON.stringify(loss)); }, [loss]);

  function addEvidence() {
    if (!evForm.content.trim()) return;
    setEvidence((arr) => [{ id: crypto.randomUUID(), type: evForm.type, content: evForm.content, note: evForm.note, createdAt: new Date().toISOString() }, ...arr]);
    setEvForm({ type: evForm.type, content: "", note: "" });
  }
  function removeEvidence(id: string) { setEvidence((arr) => arr.filter((e) => e.id !== id)); }

  function downloadReport() {
    const lines = [
      "BÁO CÁO SỰ CỐ LỪA ĐẢO TRỰC TUYẾN",
      "Tạo bởi: ScamShield AI",
      `Ngày lập báo cáo: ${new Date().toLocaleString("vi-VN")}`,
      "",
      "=== THÔNG TIN SỰ CỐ ===",
      `Loại lừa đảo: ${loss.scamType || "(chưa nhập)"}`,
      `Ngày xảy ra: ${loss.date}`,
      `Nền tảng: ${loss.platform || "(chưa nhập)"}`,
      `Thiệt hại ước tính: ${loss.amount.toLocaleString("vi-VN")} VND`,
      `Mô tả: ${loss.notes || "(chưa nhập)"}`,
      "",
      "=== CHECKLIST HÀNH ĐỘNG ===",
      ...CHECKLIST.map((c) => `${checked[c.key] ? "[x]" : "[ ]"} ${c.label}`),
      "",
      "=== BẰNG CHỨNG THU THẬP ===",
      ...evidence.map((e, i) => `${i + 1}. [${e.type.toUpperCase()}] ${e.content}${e.note ? ` — Ghi chú: ${e.note}` : ""}`),
      "",
      "=== KÊNH BÁO CÁO CHÍNH THỨC ===",
      ...REPORTING_CHANNELS.map((r) => `- ${r.name}: ${r.contact}`),
      "",
      "GHI CHÚ QUAN TRỌNG:",
      "- KHÔNG tiếp tục chuyển tiền để mong lấy lại số tiền đã mất.",
      "- KHÔNG sử dụng dịch vụ 'thu hồi vốn' tư nhân — đây là chiêu trò lừa đảo lần 2.",
      "- Chỉ cơ quan công an mới có thẩm quyền điều tra và thu hồi tài sản.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bao-cao-su-co-${Date.now()}.txt`;
    a.click();
  }

  const completedCount = CHECKLIST.filter((c) => checked[c.key]).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Header */}
      <div className="rounded-2xl border-2 border-destructive bg-destructive/5 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-destructive p-3 text-white"><AlertTriangle className="h-8 w-8" /></div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Xử lí khi bị lừa</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Hướng dẫn khẩn cấp cho nạn nhân lừa đảo trực tuyến. Hành động trong 24 giờ đầu giúp tăng khả năng thu hồi tài sản.
            </p>
            <a href="tel:113" className="mt-4 inline-block">
              <Button variant="destructive" size="lg"><Phone className="mr-2 h-5 w-5" />Gọi 113 ngay nếu khẩn cấp</Button>
            </a>
          </div>
        </div>
      </div>

      {/* Recovery scam warning */}
      <Card className="mt-6 border-2 border-warning bg-warning/5 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
          <div className="space-y-1 text-sm">
            <p className="font-bold text-base">⚠️ CẢNH BÁO LỪA ĐẢO LẦN 2</p>
            <p>• <strong>KHÔNG</strong> tiếp tục chuyển tiền để mong lấy lại số tiền đã mất.</p>
            <p>• <strong>CẢNH GIÁC</strong> với các dịch vụ "thu hồi vốn", "lấy lại tiền bị lừa", "luật sư cam kết hoàn tiền".</p>
            <p>• Chỉ <strong>cơ quan công an</strong> mới có thẩm quyền điều tra và thu hồi tài sản — hoàn toàn miễn phí.</p>
          </div>
        </div>
      </Card>

      {/* Checklist */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">1. Checklist hành động khẩn cấp</h2>
          <Badge variant="outline">{completedCount}/{CHECKLIST.length} đã hoàn thành</Badge>
        </div>
        <div className="space-y-2">
          {CHECKLIST.map((c) => {
            const Icon = c.icon;
            const done = !!checked[c.key];
            return (
              <Card key={c.key} className={`flex items-start gap-3 p-4 transition ${done ? "border-success bg-success/5" : ""}`}>
                <Checkbox
                  checked={done}
                  onCheckedChange={(v) => setChecked((s) => ({ ...s, [c.key]: !!v }))}
                  className="mt-0.5"
                />
                <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${done ? "text-success" : "text-muted-foreground"}`} />
                <div className={`text-sm ${done ? "line-through opacity-70" : ""}`}>{c.label}</div>
                {done && <CheckCircle2 className="ml-auto h-5 w-5 text-success" />}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Reporting channels */}
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">2. Kênh báo cáo & trợ giúp chính thức</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {REPORTING_CHANNELS.map((r) => (
            <Card key={r.name} className="p-4">
              <div className="font-semibold">{r.name}</div>
              <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
              <a href={r.contact} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline" className="mt-2 w-full">
                  {r.contact.startsWith("tel:") ? <Phone className="mr-2 h-3 w-3" /> : <Link2 className="mr-2 h-3 w-3" />}
                  {r.contact.replace("tel:", "")}
                </Button>
              </a>
            </Card>
          ))}
        </div>
      </section>

      {/* Evidence collection */}
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">3. Thu thập bằng chứng</h2>
        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-[160px_1fr_1fr_auto]">
            <div>
              <Label>Loại</Label>
              <select
                value={evForm.type}
                onChange={(e) => setEvForm({ ...evForm, type: e.target.value as EvidenceItem["type"] })}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="message">Tin nhắn</option>
                <option value="email">Email</option>
                <option value="url">URL</option>
                <option value="screenshot">Ảnh chụp (mô tả)</option>
                <option value="receipt">Biên lai chuyển khoản</option>
              </select>
            </div>
            <div><Label>Nội dung</Label><Input value={evForm.content} onChange={(e) => setEvForm({ ...evForm, content: e.target.value })} placeholder="Dán URL, nội dung tin nhắn, mô tả ảnh…" /></div>
            <div><Label>Ghi chú</Label><Input value={evForm.note} onChange={(e) => setEvForm({ ...evForm, note: e.target.value })} placeholder="Ngày, người gửi…" /></div>
            <div className="flex items-end"><Button onClick={addEvidence} className="w-full"><Plus className="mr-1 h-4 w-4" />Thêm</Button></div>
          </div>
        </Card>
        <div className="mt-3 space-y-2">
          {evidence.length === 0 && <p className="text-sm text-muted-foreground">Chưa có bằng chứng nào. Hãy lưu lại mọi tương tác với đối tượng lừa đảo.</p>}
          {evidence.map((e) => {
            const Icon = e.type === "screenshot" ? Camera : e.type === "message" ? MessageSquare : e.type === "email" ? Mail : e.type === "url" ? Link2 : Receipt;
            return (
              <Card key={e.id} className="flex items-start gap-3 p-3">
                <Icon className="mt-0.5 h-5 w-5 text-primary" />
                <div className="flex-1">
                  <div className="text-sm font-medium break-all">{e.content}</div>
                  {e.note && <div className="text-xs text-muted-foreground">{e.note}</div>}
                  <div className="mt-1 text-[10px] uppercase text-muted-foreground">{e.type} · {new Date(e.createdAt).toLocaleString("vi-VN")}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeEvidence(e.id)}><Trash2 className="h-4 w-4" /></Button>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Loss assessment */}
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">4. Đánh giá thiệt hại</h2>
        <Card className="p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Loại lừa đảo</Label><Input value={loss.scamType} onChange={(e) => setLoss({ ...loss, scamType: e.target.value })} placeholder="vd: Mạo danh công an, Việc nhẹ lương cao…" /></div>
            <div><Label>Ngày xảy ra</Label><Input type="date" value={loss.date} onChange={(e) => setLoss({ ...loss, date: e.target.value })} /></div>
            <div><Label>Nền tảng</Label><Input value={loss.platform} onChange={(e) => setLoss({ ...loss, platform: e.target.value })} placeholder="Zalo, Facebook, SMS, gọi điện…" /></div>
            <div><Label>Số tiền thiệt hại (VND)</Label><Input type="number" min={0} value={loss.amount} onChange={(e) => setLoss({ ...loss, amount: Number(e.target.value) || 0 })} /></div>
            <div className="md:col-span-2"><Label>Diễn biến chi tiết</Label><Textarea rows={4} value={loss.notes} onChange={(e) => setLoss({ ...loss, notes: e.target.value })} placeholder="Mô tả ngắn gọn cách đối tượng tiếp cận và hành vi lừa đảo…" /></div>
          </div>
          <Button onClick={downloadReport} size="lg" className="mt-4 w-full bg-gradient-cyber"><Download className="mr-2 h-5 w-5" />Tải báo cáo sự cố (.txt) để trình báo</Button>
          <p className="mt-2 text-xs text-muted-foreground">
            <FileText className="inline h-3 w-3" /> Tài liệu này lưu trên thiết bị của bạn. Mang theo khi đến công an phường để trình báo.
          </p>
        </Card>
      </section>
    </div>
  );
}
