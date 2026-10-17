export const REGIONS = [
  { name: "Hà Nội", lat: 21.0285, lng: 105.8542, aliases: ["hà nội", "ha noi"] },
  { name: "TP.HCM", lat: 10.7769, lng: 106.7009, aliases: ["tp.hcm", "hồ chí minh", "ho chi minh", "sài gòn"] },
  { name: "Cần Thơ", lat: 10.0452, lng: 105.7469, aliases: ["cần thơ", "can tho", "ninh kiều"] },
  { name: "Đà Nẵng", lat: 16.0544, lng: 108.2022, aliases: ["đà nẵng", "da nang"] },
  { name: "Hải Phòng", lat: 20.8449, lng: 106.6881, aliases: ["hải phòng", "hai phong"] },
  { name: "Huế", lat: 16.4637, lng: 107.5909, aliases: ["huế", "hue"] },
] as const;
export function reportRegion(value: string | null) {
  return REGIONS.find(r => r.aliases.some(a => value?.toLowerCase().includes(a)));
}
export function nearestRegion(lat: number, lng: number) {
  return [...REGIONS].sort((a,b) => Math.hypot(a.lat-lat,a.lng-lng)-Math.hypot(b.lat-lat,b.lng-lng))[0];
}