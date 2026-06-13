// URL Risk Intelligence Engine V2
// Pure functions — heuristic, brand-impersonation, typosquatting, homograph,
// keyword & structure analysis. Returns explainable factors with points.

export interface RiskFactor {
  label: string;
  detail?: string;
  points: number; // can be negative (whitelisting)
  category:
    | "structure"
    | "brand"
    | "keyword"
    | "tld"
    | "protocol"
    | "homograph"
    | "typo"
    | "blacklist"
    | "whitelist"
    | "intel"
    | "age"
    | "ssl";
}

export interface UrlAnalysis {
  url: string;
  host: string;
  score: number; // 0..100
  risk: "SAFE" | "SUSPICIOUS" | "DANGEROUS" | "UNKNOWN";
  factors: RiskFactor[];
  brandImpersonated?: string;
  recommendations: string[];
}

// Trusted Vietnamese brands & official domains
export const TRUSTED_BRANDS: Array<{ name: string; tokens: string[]; official: string[] }> = [
  { name: "Vietcombank", tokens: ["vietcombank", "vcb"], official: ["vietcombank.com.vn"] },
  { name: "BIDV", tokens: ["bidv"], official: ["bidv.com.vn"] },
  { name: "Techcombank", tokens: ["techcombank", "techcom"], official: ["techcombank.com.vn"] },
  { name: "MB Bank", tokens: ["mbbank", "mb-bank"], official: ["mbbank.com.vn"] },
  { name: "VPBank", tokens: ["vpbank"], official: ["vpbank.com.vn"] },
  { name: "Agribank", tokens: ["agribank"], official: ["agribank.com.vn"] },
  { name: "ACB", tokens: ["acb"], official: ["acb.com.vn"] },
  { name: "Shopee", tokens: ["shopee"], official: ["shopee.vn"] },
  { name: "TikTok Shop", tokens: ["tiktok", "tiktokshop"], official: ["tiktok.com", "shop.tiktok.com"] },
  { name: "Lazada", tokens: ["lazada"], official: ["lazada.vn"] },
  { name: "Tiki", tokens: ["tiki"], official: ["tiki.vn"] },
  { name: "VNeID", tokens: ["vneid"], official: ["vneid.gov.vn"] },
  { name: "Cổng Dịch vụ công", tokens: ["dichvucong", "dvcqg"], official: ["dichvucong.gov.vn"] },
  { name: "Tổng cục Thuế", tokens: ["tongcucthue", "gdt"], official: ["gdt.gov.vn"] },
  { name: "Bộ Công an", tokens: ["bocongan", "mps"], official: ["bocongan.gov.vn", "mps.gov.vn"] },
  { name: "EVN", tokens: ["evn"], official: ["evn.com.vn"] },
];

const SUSPICIOUS_TLDS = [".xyz", ".top", ".tk", ".click", ".info", ".cn", ".ru", ".buzz", ".gq", ".ml", ".cf"];
const SUSPICIOUS_MODIFIERS = [
  "security", "support", "login", "verify", "online", "update", "service",
  "hoantien", "hoan-tien", "khuyenmai", "khuyen-mai", "trungthuong", "trung-thuong",
  "nhanqua", "nhan-qua", "uudai", "uu-dai", "voucher", "rutgon", "rut-gon",
];
const SUSPICIOUS_KEYWORDS = [
  "apk", "download-apk", "thuhoivon", "thu-hoi-von", "laylaitien", "lay-lai-tien",
  "kiemtien", "kiem-tien", "vieclam", "viec-lam", "nhiemvu", "nhiem-vu",
  "congtacvien", "cong-tac-vien", "phatnguoi", "phat-nguoi",
];

// ---------- Levenshtein for typosquatting ----------
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function isOfficial(host: string, brand: typeof TRUSTED_BRANDS[number]) {
  return brand.official.some((d) => host === d || host.endsWith("." + d));
}

export function detectBrandImpersonation(host: string): { brand: string; reasons: string[] } | null {
  const reasons: string[] = [];
  for (const brand of TRUSTED_BRANDS) {
    if (isOfficial(host, brand)) return null; // legitimate
    for (const tok of brand.tokens) {
      if (host.includes(tok)) {
        // brand keyword in non-official domain → impersonation candidate
        const hasModifier = SUSPICIOUS_MODIFIERS.some((m) => host.includes(m));
        const fakeVn = host.includes("-vn") || host.includes("vn-") || host.endsWith(".vn") === false;
        if (hasModifier) reasons.push(`Chứa từ "${tok}" kết hợp với từ khoá đáng ngờ (${SUSPICIOUS_MODIFIERS.find((m) => host.includes(m))})`);
        else reasons.push(`Chứa tên thương hiệu "${tok}" nhưng KHÔNG phải tên miền chính thức (${brand.official.join(", ")})`);
        if (fakeVn) reasons.push("Cố gắng giả mạo tên miền Việt Nam");
        return { brand: brand.name, reasons };
      }
    }
    // Typosquatting: compare host root to official
    const root = host.split(".").slice(-2, -1)[0] ?? "";
    for (const off of brand.official) {
      const offRoot = off.split(".")[0];
      const d = levenshtein(root, offRoot);
      if (root.length >= 4 && d > 0 && d <= 2) {
        reasons.push(`Tên miền "${root}" gần giống "${offRoot}" (khoảng cách ${d}) — dấu hiệu typosquatting`);
        return { brand: brand.name, reasons };
      }
    }
  }
  return null;
}

export function detectHomograph(host: string): string[] {
  const reasons: string[] = [];
  if (host.startsWith("xn--")) reasons.push("Tên miền dạng Punycode (xn--) — có thể là tấn công homograph");
  if (/[^\x00-\x7F]/.test(host)) reasons.push("Tên miền chứa ký tự Unicode không phải ASCII");
  // Latin-Cyrillic look-alikes (basic check)
  if (/[а-яА-Я]/.test(host)) reasons.push("Tên miền chứa ký tự Cyrillic giả mạo Latin");
  return reasons;
}

export function analyzeUrlStructure(parsed: URL): RiskFactor[] {
  const factors: RiskFactor[] = [];
  const host = parsed.hostname.toLowerCase();
  const parts = host.split(".");

  // Protocol
  if (parsed.protocol !== "https:") {
    factors.push({
      label: "Không sử dụng HTTPS",
      detail: "Website không mã hoá kết nối — dữ liệu có thể bị đánh cắp.",
      points: 10,
      category: "ssl",
    });
  }

  // TLD
  for (const tld of SUSPICIOUS_TLDS) {
    if (host.endsWith(tld)) {
      factors.push({
        label: `Đuôi tên miền đáng ngờ: ${tld}`,
        detail: "Đuôi tên miền giá rẻ, thường được dùng cho website lừa đảo ngắn hạn.",
        points: 15,
        category: "tld",
      });
      break;
    }
  }

  // Subdomain count
  if (parts.length >= 4) {
    factors.push({
      label: `Có ${parts.length - 2} sub-domain phức tạp`,
      detail: "Cấu trúc nhiều sub-domain bất thường — kỹ thuật ẩn URL thật.",
      points: 10,
      category: "structure",
    });
  }

  // Length
  if (host.length > 40) {
    factors.push({
      label: `Tên miền rất dài (${host.length} ký tự)`,
      detail: "Tên miền dài bất thường thường nhằm đánh lừa người đọc lướt.",
      points: 8,
      category: "structure",
    });
  }

  // Digits
  if (/[0-9]{4,}/.test(host)) {
    factors.push({
      label: "Tên miền chứa nhiều chữ số liên tiếp",
      detail: "Pattern phổ biến của domain tự sinh hàng loạt.",
      points: 10,
      category: "structure",
    });
  }

  // Fake .vn
  if ((host.includes("-vn") || host.includes("vn-") || host.includes(".vn.")) && !host.endsWith(".vn") && !host.endsWith(".gov.vn") && !host.endsWith(".com.vn")) {
    factors.push({
      label: "Cố gắng giả mạo tên miền .vn",
      detail: "Sử dụng 'vn' trong tên miền nhưng không thuộc TLD .vn chính thức.",
      points: 12,
      category: "structure",
    });
  }

  // Path keywords
  const fullText = host + parsed.pathname;
  for (const kw of SUSPICIOUS_KEYWORDS) {
    if (fullText.includes(kw)) {
      factors.push({
        label: `Chứa từ khoá lừa đảo: "${kw}"`,
        points: 12,
        category: "keyword",
      });
    }
  }

  // IP literal
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    factors.push({
      label: "URL sử dụng địa chỉ IP thay vì tên miền",
      detail: "Website hợp pháp hiếm khi yêu cầu truy cập qua IP.",
      points: 20,
      category: "structure",
    });
  }

  // @ in URL
  if (parsed.href.includes("@")) {
    factors.push({
      label: "URL chứa ký tự '@'",
      detail: "Kỹ thuật ẩn host thật phía sau ký tự @.",
      points: 18,
      category: "structure",
    });
  }

  return factors;
}

export function classifyRisk(score: number): "SAFE" | "SUSPICIOUS" | "DANGEROUS" {
  if (score >= 60) return "DANGEROUS";
  if (score >= 25) return "SUSPICIOUS";
  return "SAFE";
}

export function buildRecommendations(risk: string, brand?: string): string[] {
  if (risk === "DANGEROUS") {
    return [
      "TUYỆT ĐỐI KHÔNG nhập mật khẩu, mã OTP hoặc thông tin cá nhân.",
      "Không cung cấp số CCCD, số tài khoản ngân hàng.",
      "Không chuyển tiền dưới bất kỳ lý do nào.",
      "Không tải hoặc cài đặt ứng dụng (APK) từ website này.",
      brand
        ? `Xác minh trực tiếp với ${brand} qua website/hotline chính thức.`
        : "Xác minh thông tin qua kênh chính thức của tổ chức liên quan.",
      "Báo cáo URL này tới NCSC tại khonggianmang.vn hoặc 113.",
    ];
  }
  if (risk === "SUSPICIOUS") {
    return [
      "Hãy kiểm tra kỹ trước khi nhập bất kỳ thông tin nào.",
      "Đối chiếu URL với website chính thức của tổ chức.",
      "Xác minh với người thân hoặc cơ quan chức năng nếu có nghi ngờ.",
      "Không cung cấp OTP qua điện thoại cho bất kỳ ai.",
    ];
  }
  return [
    "Không phát hiện dấu hiệu nguy hiểm rõ ràng.",
    "Vẫn nên cảnh giác khi nhập thông tin cá nhân hoặc thanh toán.",
  ];
}
