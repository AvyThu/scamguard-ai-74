import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { classifyScamText, CLUSTERS, type ClusterId } from "./scam-dna";

// ---------- URL Risk Analysis ----------
const SUSPICIOUS_TLDS = [".xyz", ".top", ".cn", ".tk", ".click", ".info"];
const SUSPICIOUS_HINTS = [
  "vneid", "dichvucong", "bocongan", "tongcucthue", "shopee-", "tiktok-",
  "thuhoivon", "laylaitien", "kiemtien", "hoahong", "trungthuong",
];

export const analyzeUrl = createServerFn({ method: "POST" })
  .inputValidator(z.object({ url: z.string().min(3).max(2048) }))
  .handler(async ({ data }) => {
    let parsed: URL | null = null;
    try {
      const u = data.url.startsWith("http") ? data.url : `https://${data.url}`;
      parsed = new URL(u);
    } catch {
      return {
        risk: "UNKNOWN" as const,
        score: 0,
        url: data.url,
        reasons: ["URL không hợp lệ"],
        cluster: "UNKNOWN" as ClusterId,
        recommendations: ["Kiểm tra lại địa chỉ URL"],
      };
    }
    const host = parsed.hostname.toLowerCase();
    const reasons: string[] = [];
    let score = 0;

    // Check blacklist
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: bl } = await supabaseAdmin.from("url_blacklist").select("url_pattern, reason, cluster");
      if (bl) {
        for (const row of bl as Array<{ url_pattern: string; reason: string | null; cluster: string | null }>) {
          if (host.includes(row.url_pattern.toLowerCase())) {
            score += 70;
            reasons.push(`Trong danh sách đen: ${row.reason ?? "đã được báo cáo"}`);
          }
        }
      }
      const { data: wl } = await supabaseAdmin.from("url_whitelist").select("url_pattern");
      if (wl) {
        for (const row of wl as Array<{ url_pattern: string }>) {
          if (host.includes(row.url_pattern.toLowerCase())) {
            score = Math.max(0, score - 50);
            reasons.push(`Tên miền nằm trong danh sách trắng đã xác minh`);
          }
        }
      }
    } catch (e) {
      console.error("blacklist check failed", e);
    }

    // Heuristics
    for (const tld of SUSPICIOUS_TLDS) {
      if (host.endsWith(tld)) { score += 15; reasons.push(`Đuôi tên miền đáng ngờ: ${tld}`); break; }
    }
    for (const hint of SUSPICIOUS_HINTS) {
      if (host.includes(hint)) { score += 20; reasons.push(`Chứa từ khoá lừa đảo phổ biến: "${hint}"`); }
    }
    if (host.split(".").length >= 4) { score += 10; reasons.push("Sub-domain phức tạp bất thường"); }
    if (/[0-9]{4,}/.test(host)) { score += 10; reasons.push("Tên miền chứa nhiều chữ số"); }
    if (parsed.protocol !== "https:") { score += 10; reasons.push("Không sử dụng HTTPS"); }
    if (host.includes("-vn") || host.includes("vn-")) { score += 10; reasons.push("Cố gắng giả mạo tên miền .vn"); }

    const cls = classifyScamText(host + " " + (parsed.pathname || ""));
    if (cls.cluster !== "UNKNOWN") {
      reasons.push(`Tương đồng với nhóm lừa đảo: ${cls.clusterName}`);
    }

    score = Math.min(100, score);
    const risk: "SAFE" | "SUSPICIOUS" | "DANGEROUS" =
      score >= 60 ? "DANGEROUS" : score >= 25 ? "SUSPICIOUS" : "SAFE";

    const recommendations =
      risk === "DANGEROUS"
        ? [
            "TUYỆT ĐỐI không nhập thông tin cá nhân, OTP, mật khẩu.",
            "Không tải hoặc cài đặt ứng dụng từ trang này.",
            "Báo cáo URL này tới cộng đồng ScamShield.",
            ...(cls.cluster !== "UNKNOWN" ? CLUSTERS[cls.cluster as Exclude<ClusterId, "UNKNOWN">].recommendations : []),
          ]
        : risk === "SUSPICIOUS"
        ? ["Hãy kiểm tra kỹ trước khi truy cập", "Xác minh với người thân hoặc cơ quan chức năng"]
        : ["Không phát hiện dấu hiệu nguy hiểm rõ ràng. Vẫn nên cảnh giác."];

    // Fire-and-forget analytics
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("analytics_events").insert({
        event_type: "url_analysis",
        cluster: cls.cluster,
        risk_level: risk,
        metadata: { host, score },
      });
    } catch {}

    return { risk, score, url: data.url, reasons, cluster: cls.cluster, recommendations };
  });

// ---------- Text classification ----------
export const classifyText = createServerFn({ method: "POST" })
  .inputValidator(z.object({ text: z.string().min(1).max(5000) }))
  .handler(async ({ data }) => classifyScamText(data.text));

// ---------- Screenshot Analysis (vision via Gemini) ----------
export const analyzeScreenshot = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      imageDataUrl: z.string().min(20).max(8_000_000), // data:image/png;base64,...
    }),
  )
  .handler(async ({ data }) => {
    const { callLovableAIJson } = await import("./ai-gateway.server");
    type AiResult = {
      ocr_text?: string;
      summary?: string;
      scam_category?: string;
      suspicious_phrases?: string[];
      risk?: "SAFE" | "SUSPICIOUS" | "DANGEROUS";
      raw?: string;
    };
    const result = await callLovableAIJson<AiResult>({
      model: "google/gemini-2.5-flash",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Bạn là chuyên gia phát hiện lừa đảo qua tin nhắn tại Việt Nam. Trả về JSON THUẦN với các trường: ocr_text (string), summary (string, tiếng Việt, 1-2 câu), scam_category (string), suspicious_phrases (array string), risk (SAFE|SUSPICIOUS|DANGEROUS).",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Phân tích ảnh chụp màn hình này để xác định dấu hiệu lừa đảo. Trích xuất văn bản (OCR), tìm cụm từ đáng ngờ và đánh giá rủi ro." },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
    });

    const ocrText = result.ocr_text ?? result.raw ?? "";
    const dnaResult = classifyScamText(ocrText + " " + (result.summary ?? ""));
    const risk = result.risk ?? (dnaResult.cluster !== "UNKNOWN" ? "DANGEROUS" : "SUSPICIOUS");

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("analytics_events").insert({
        event_type: "screenshot_analysis",
        cluster: dnaResult.cluster,
        risk_level: risk,
        metadata: { category: result.scam_category },
      });
    } catch {}

    return {
      ocr_text: ocrText,
      summary: result.summary ?? "Đã phân tích",
      scam_category: result.scam_category ?? dnaResult.clusterName,
      suspicious_phrases: result.suspicious_phrases ?? dnaResult.matchedKeywords,
      risk,
      dna: dnaResult,
    };
  });

// ---------- Public stats fetch ----------
export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: cs }, { data: reports }, { data: events }] = await Promise.all([
    supabaseAdmin.from("cyber_stats").select("*").order("metric_key"),
    supabaseAdmin.from("scam_reports").select("cluster, created_at, region"),
    supabaseAdmin.from("analytics_events").select("event_type, cluster, risk_level, created_at").order("created_at", { ascending: false }).limit(2000),
  ]);
  return { cyberStats: cs ?? [], reports: reports ?? [], events: events ?? [] };
});

// ---------- Submit Report ----------
export const submitReport = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      category: z.string().min(1).max(120),
      description: z.string().min(10).max(4000),
      url: z.string().max(2048).optional().nullable(),
      platform: z.string().max(80).optional().nullable(),
      incident_date: z.string().optional().nullable(),
      estimated_loss: z.number().int().nonnegative().optional().nullable(),
      region: z.string().max(80).optional().nullable(),
      is_anonymous: z.boolean().default(true),
      user_id: z.string().uuid().optional().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const cls = classifyScamText(data.description + " " + (data.url ?? ""));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("scam_reports")
      .insert({
        category: data.category,
        description: data.description,
        url: data.url ?? null,
        platform: data.platform ?? null,
        incident_date: data.incident_date ?? null,
        estimated_loss: data.estimated_loss ?? null,
        region: data.region ?? null,
        is_anonymous: data.is_anonymous,
        user_id: data.user_id ?? null,
        cluster: cls.cluster,
        status: "approved",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("analytics_events").insert({
      event_type: "report_submitted",
      cluster: cls.cluster,
      metadata: { region: data.region },
    });
    return { ok: true, id: (row as { id: string }).id, cluster: cls.cluster };
  });

// ---------- Chat (non-stream simple) ----------
export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator(z.object({ messages: z.array(z.object({ role: z.enum(["user","assistant","system"]), content: z.string().max(4000) })).min(1).max(40) }))
  .handler(async ({ data }) => {
    const { callLovableAI } = await import("./ai-gateway.server");
    const sys = {
      role: "system" as const,
      content:
        "Bạn là 'Trợ lý ScamShield AI' - chuyên gia chống lừa đảo tại Việt Nam. Trả lời ngắn gọn (3-6 câu) bằng tiếng Việt. Giải thích dấu hiệu lừa đảo, đánh giá URL/tin nhắn, hướng dẫn khi bị lừa (gọi 113, đến công an phường, không chuyển thêm tiền). Không bao giờ khuyến nghị dịch vụ thu hồi vốn tư nhân.",
    };
    const res = await callLovableAI({
      model: "google/gemini-3-flash-preview",
      messages: [sys, ...data.messages],
      temperature: 0.5,
    });
    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) return { reply: "Hệ thống đang tải cao, vui lòng thử lại sau giây lát.", error: "rate_limit" };
      if (res.status === 402) return { reply: "Hết tín dụng AI. Vui lòng liên hệ quản trị viên.", error: "credits" };
      throw new Error(t);
    }
    const j = await res.json();
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("analytics_events").insert({ event_type: "chat_question" });
    } catch {}
    return { reply: j.choices?.[0]?.message?.content ?? "(không có phản hồi)" };
  });
