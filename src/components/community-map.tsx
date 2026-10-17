import { useEffect, useRef, useState } from "react";
import { REGIONS, reportRegion } from "@/lib/regions";
export default function CommunityMap({ reports, region }: { reports: Array<{ region: string | null }>; region: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | undefined;
    async function init() {
      try {
        const L = await import("leaflet");
        if (disposed || !container.current) return;
        const center = REGIONS.find(r => r.name === region);
        map = L.map(container.current).setView(center ? [center.lat, center.lng] : [16.2, 106.5], center ? 10 : 5);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 18 }).addTo(map);
        const counts = new Map<string, number>();
        reports.forEach(r => { const area = reportRegion(r.region); if (area) counts.set(area.name, (counts.get(area.name) || 0)+1); });
        const css = getComputedStyle(document.documentElement);
        const danger = css.getPropertyValue("--destructive").trim();
        REGIONS.forEach(area => {
          const count = counts.get(area.name) || 0; if (!count || !map) return;
          const circle = L.circle([area.lat, area.lng], { radius: 1500 + Math.sqrt(count)*1500, color: danger, fillColor: danger, fillOpacity: 0.35, weight: 2 }).addTo(map);
          circle.bindTooltip(`${area.name}: ${count} báo cáo được duyệt`, { direction: "top" });
        });
      } catch { if (!disposed) setError("Bản đồ chưa tải được. Các báo cáo vẫn hiển thị bên dưới."); }
    }
    void init();
    return () => { disposed = true; map?.remove(); };
  }, [reports, region]);
  return <div className="relative"><div ref={container} role="img" aria-label="Bản đồ mật độ báo cáo lừa đảo theo khu vực" className="community-map h-80 w-full rounded-lg border md:h-96" />{error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}</div>;
}