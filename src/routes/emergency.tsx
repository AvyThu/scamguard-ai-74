import { createFileRoute } from "@tanstack/react-router";
import { Phone, AlertTriangle, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalEmergencyContacts, useElderlyMode } from "@/hooks/use-elderly";
import { useState } from "react";

export const Route = createFileRoute("/emergency")({
  head: () => ({ meta: [{ title: "Khẩn cấp & Đường dây nóng — ScamShield AI" }] }),
  component: Emergency,
});

const HOTLINES = [
  { num: "113", label: "Cảnh sát phản ứng nhanh", desc: "Khẩn cấp về tội phạm, lừa đảo nghiêm trọng" },
  { num: "1900561557", label: "Bộ Công an — An ninh mạng", desc: "Tư vấn, trình báo lừa đảo trực tuyến" },
  { num: "1900545481", label: "NCSC — Cảnh báo lừa đảo", desc: "Trung tâm Giám sát An toàn Không gian mạng Quốc gia" },
];

function Emergency() {
  const { contacts, add, remove } = useLocalEmergencyContacts();
  const { enabled, toggle } = useElderlyMode();
  const [form, setForm] = useState({ name: "", relationship: "", phone: "" });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold">Khẩn cấp & Đường dây nóng</h1>

      <Card className="shadow-cyber mt-6 border-2 border-destructive bg-destructive/5 p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <div>
            <div className="text-2xl font-bold">113 — Cảnh sát Khẩn cấp</div>
            <p className="text-sm">Trong trường hợp nghi ngờ lừa đảo nghiêm trọng hoặc có dấu hiệu tội phạm, hãy liên hệ cơ quan chức năng để được hỗ trợ.</p>
          </div>
        </div>
        <a href="tel:113" className="mt-4 block">
          <Button variant="destructive" size="lg" className="w-full text-xl"><Phone className="mr-2 h-6 w-6" /> Gọi 113 ngay</Button>
        </a>
      </Card>

      <h2 className="mt-10 text-xl font-semibold">Đường dây nóng quan trọng</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {HOTLINES.map((h) => (
          <Card key={h.num} className="p-4">
            <div className="text-2xl font-bold text-primary">{h.num}</div>
            <div className="font-medium">{h.label}</div>
            <p className="text-xs text-muted-foreground">{h.desc}</p>
            <a href={`tel:${h.num}`}><Button variant="outline" size="sm" className="mt-3 w-full"><Phone className="mr-2 h-3 w-3" />Gọi</Button></a>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between rounded-xl border border-border bg-accent p-4">
        <div>
          <div className="font-semibold">Chế độ Người cao tuổi</div>
          <p className="text-sm text-muted-foreground">Bật chữ to, nút lớn — phù hợp với người cao tuổi.</p>
        </div>
        <Button onClick={() => toggle()} variant={enabled ? "default" : "outline"}>{enabled ? "Đang bật" : "Bật"}</Button>
      </div>

      <h2 className="mt-10 text-xl font-semibold">Người thân khẩn cấp (lưu cục bộ)</h2>
      <p className="text-sm text-muted-foreground">Khi gặp URL/ảnh nguy hiểm, hãy xác minh với người thân trước khi thao tác.</p>

      <Card className="mt-4 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div><Label>Tên</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Quan hệ</Label><Input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="Con, cháu…" /></div>
          <div><Label>Số điện thoại</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} type="tel" /></div>
          <div className="flex items-end">
            <Button onClick={() => { if (!form.name || !form.phone) return; add(form); setForm({ name: "", relationship: "", phone: "" }); }} className="w-full">
              <Plus className="mr-2 h-4 w-4" />Thêm
            </Button>
          </div>
        </div>
      </Card>

      <div className="mt-4 space-y-2">
        {contacts.map((c) => (
          <Card key={c.id} className="flex items-center justify-between p-4">
            <div>
              <div className="font-semibold">{c.name} <span className="text-sm text-muted-foreground">({c.relationship})</span></div>
              <div className="text-sm">{c.phone}</div>
            </div>
            <div className="flex gap-2">
              <a href={`tel:${c.phone}`}><Button size="sm" variant="outline"><Phone className="h-4 w-4" /></Button></a>
              <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
