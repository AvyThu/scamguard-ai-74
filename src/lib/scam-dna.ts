// Scam DNA Clustering Engine
// Vietnamese text normalization + keyword-based cluster classification.

export type ClusterId = "A" | "B" | "C" | "D" | "UNKNOWN";

export interface Cluster {
  id: ClusterId;
  name: string;
  description: string;
  keywords: string[];
  color: string;
  recommendations: string[];
}

export const CLUSTERS: Record<Exclude<ClusterId, "UNKNOWN">, Cluster> = {
  A: {
    id: "A",
    name: "Mạo danh Cơ quan Nhà nước",
    description:
      "Giả mạo công an, cán bộ thuế, dịch vụ công, VNeID và yêu cầu cài đặt ứng dụng APK độc hại.",
    keywords: [
      "vneid", "tongcucthue", "tong cuc thue", "dichvucong", "dich vu cong",
      "bocongan", "bo cong an", "canhsat", "canh sat", "chinhphu", "chinh phu",
      "apk", "cuc thue", "thue", "phat nguoi",
    ],
    color: "#1D4ED8",
    recommendations: [
      "TUYỆT ĐỐI KHÔNG cài đặt file APK lạ.",
      "Cơ quan nhà nước không yêu cầu chuyển tiền qua điện thoại.",
      "Gọi 113 hoặc đến công an phường gần nhất để xác minh.",
    ],
  },
  B: {
    id: "B",
    name: "Việc nhẹ lương cao",
    description:
      "Lừa đảo qua các nhóm Telegram tuyển cộng tác viên, làm nhiệm vụ nhận hoa hồng, kiếm tiền online.",
    keywords: [
      "nhiemvu", "nhiem vu", "congtacvien", "cong tac vien", "vieclam",
      "viec lam", "kiemtienonline", "kiem tien online", "hoahong", "hoa hong",
      "thunhap", "thu nhap", "telegram", "viec nhe", "luong cao",
    ],
    color: "#06B6D4",
    recommendations: [
      "Không có công việc nào yêu cầu nạp tiền trước.",
      "Cảnh giác với các nhóm Telegram/Zalo tuyển CTV nhận hoa hồng.",
      "Báo cáo nhóm lừa đảo qua Trung tâm Giám sát An toàn Không gian mạng Quốc gia.",
    ],
  },
  C: {
    id: "C",
    name: "Giả mạo thương hiệu và sàn TMĐT",
    description:
      "Mạo danh Shopee, TikTok Shop, đơn vị giao hàng, thông báo trúng thưởng và hoàn tiền.",
    keywords: [
      "shipper", "giaohang", "giao hang", "hoantien", "hoan tien",
      "trungthuong", "trung thuong", "nhanqua", "nhan qua", "shopee",
      "tiktok shop", "tiki", "lazada", "trang web shop",
    ],
    color: "#F59E0B",
    recommendations: [
      "Chỉ kiểm tra đơn hàng qua ứng dụng chính thức.",
      "Không bấm vào liên kết nhận thưởng/hoàn tiền bất thường.",
      "Không cung cấp OTP cho bất kỳ ai.",
    ],
  },
  D: {
    id: "D",
    name: "Thu hồi vốn lừa đảo",
    description:
      "Mạo danh luật sư, an ninh mạng cam kết giúp lấy lại tiền đã bị lừa.",
    keywords: [
      "thuhoivon", "thu hoi von", "laylaitien", "lay lai tien", "luatsu",
      "luat su", "anninhmang", "an ninh mang", "camket", "cam ket",
      "hoan tra", "lay lai von",
    ],
    color: "#EF4444",
    recommendations: [
      "Không có dịch vụ tư nhân nào lấy lại được tiền đã bị lừa.",
      "Chỉ cơ quan công an mới có thẩm quyền điều tra và thu hồi.",
      "Gọi 113 hoặc đến công an địa phương để trình báo.",
    ],
  },
};

const VIETNAMESE_MAP: Record<string, string> = {
  à: "a", á: "a", ạ: "a", ả: "a", ã: "a", â: "a", ầ: "a", ấ: "a", ậ: "a", ẩ: "a", ẫ: "a",
  ă: "a", ằ: "a", ắ: "a", ặ: "a", ẳ: "a", ẵ: "a",
  è: "e", é: "e", ẹ: "e", ẻ: "e", ẽ: "e", ê: "e", ề: "e", ế: "e", ệ: "e", ể: "e", ễ: "e",
  ì: "i", í: "i", ị: "i", ỉ: "i", ĩ: "i",
  ò: "o", ó: "o", ọ: "o", ỏ: "o", õ: "o", ô: "o", ồ: "o", ố: "o", ộ: "o", ổ: "o", ỗ: "o",
  ơ: "o", ờ: "o", ớ: "o", ợ: "o", ở: "o", ỡ: "o",
  ù: "u", ú: "u", ụ: "u", ủ: "u", ũ: "u", ư: "u", ừ: "u", ứ: "u", ự: "u", ử: "u", ữ: "u",
  ỳ: "y", ý: "y", ỵ: "y", ỷ: "y", ỹ: "y",
  đ: "d",
};

export function normalizeVi(text: string): string {
  const lower = text.toLowerCase();
  let out = "";
  for (const ch of lower) out += VIETNAMESE_MAP[ch] ?? ch;
  return out
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface ClassificationResult {
  cluster: ClusterId;
  clusterName: string;
  matchedKeywords: string[];
  confidence: number; // 0..1
  allScores: Record<Exclude<ClusterId, "UNKNOWN">, number>;
}

export function classifyScamText(text: string): ClassificationResult {
  const normalized = normalizeVi(text);
  const scores: Record<Exclude<ClusterId, "UNKNOWN">, number> = { A: 0, B: 0, C: 0, D: 0 };
  const matched: Record<Exclude<ClusterId, "UNKNOWN">, string[]> = { A: [], B: [], C: [], D: [] };

  for (const c of Object.values(CLUSTERS)) {
    for (const kw of c.keywords) {
      if (normalized.includes(kw)) {
        scores[c.id as Exclude<ClusterId, "UNKNOWN">] += 1;
        matched[c.id as Exclude<ClusterId, "UNKNOWN">].push(kw);
      }
    }
  }

  let best: Exclude<ClusterId, "UNKNOWN"> | null = null;
  let bestScore = 0;
  for (const k of Object.keys(scores) as Array<Exclude<ClusterId, "UNKNOWN">>) {
    if (scores[k] > bestScore) { bestScore = scores[k]; best = k; }
  }

  if (!best || bestScore === 0) {
    return {
      cluster: "UNKNOWN",
      clusterName: "Chưa phân loại",
      matchedKeywords: [],
      confidence: 0,
      allScores: scores,
    };
  }
  return {
    cluster: best,
    clusterName: CLUSTERS[best].name,
    matchedKeywords: matched[best],
    confidence: Math.min(1, bestScore / 4),
    allScores: scores,
  };
}

export function getCluster(id: ClusterId): Cluster | null {
  if (id === "UNKNOWN") return null;
  return CLUSTERS[id];
}
