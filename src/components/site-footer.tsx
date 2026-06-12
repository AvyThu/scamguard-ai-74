import { Shield, Mail, Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold">
            <span className="bg-gradient-cyber flex h-8 w-8 items-center justify-center rounded-lg">
              <Shield className="h-4 w-4 text-white" />
            </span>
            ScamShield <span className="text-cyber">AI</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Nền tảng AI phòng chống lừa đảo trên không gian mạng Việt Nam.
          </p>
        </div>
        <div>
          <h4 className="font-semibold">Tính năng</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/dna-map" className="hover:text-foreground">Bản đồ Bộ Gen</Link></li>
            <li><Link to="/screenshot-detector" className="hover:text-foreground">Quét ảnh chụp</Link></li>
            <li><Link to="/analytics" className="hover:text-foreground">Thống kê</Link></li>
            <li><Link to="/reports" className="hover:text-foreground">Báo cáo lừa đảo</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Khẩn cấp</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> <a href="tel:113" className="hover:text-foreground">113 — Cảnh sát</a></li>
            <li><Link to="/emergency" className="hover:text-foreground">Đường dây nóng</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Nghiên cứu khoa học</h4>
          <p className="mt-3 text-sm text-muted-foreground">
            Phần mềm được nghiên cứu và phát triển bởi <span className="font-semibold text-foreground">Huỳnh Anh Thư</span>.
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4" /> Hợp tác nghiên cứu</p>
        </div>
      </div>
      <div className="border-t border-border bg-background/60">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-foreground">
          © {new Date().getFullYear()} ScamShield AI. Phần mềm được nghiên cứu và phát triển bởi{" "}
          <span className="font-semibold">Huỳnh Anh Thư</span>.
        </div>
      </div>
    </footer>
  );
}
