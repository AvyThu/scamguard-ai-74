import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { classifyScamText, CLUSTERS, type ClusterId } from "./scam-dna";
import {
  analyzeUrlStructure,
  detectBrandImpersonation,
  detectHomograph,
  classifyRisk,
  buildRecommendations,
  type RiskFactor,
} from "./url-intel";

// ---------- URL Risk Analysis V2 ----------
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
        host: "",
        factors: [],
        cluster: "UNKNOWN" as ClusterId,
        clusterName: "Không xác định",
        brandImpersonated: null as string | null,
        intelMatches: [] as Array<{ title: string; source_org: string; source_url: string | null }>,
        recommendations: ["URL không hợp lệ. Vui lòng kiểm tra lại địa chỉ."],
      };
    }
    const host = parsed.hostname.toLowerCase();
    const factors: RiskFactor[] = [];

    // 1) Structural heuristics
    factors.push(...analyzeUrlStructure(parsed));

    // 2) Homograph attack
    for (const r of detectHomograph(host)) {
      factors.push({ label: r, points: 22, category: "homograph" });
    }

    // 3) Brand impersonation + typosquatting
    const brand = detectBrandImpersonation(host);
    if (brand) {
      brand.reasons.forEach((r) =>
        factors.push({
          label: `Mạo danh ${brand.brand}`,
          detail: r,
          points: 25,
          category: "brand",
        }),
      );
    }

    // 4) Blacklist / Whitelist
    const intelMatches: Array<{ title: string; source_org: string; source_url: string | null }> = [];
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const [{ data: bl }, { data: wl }, { data: intel }] = await Promise.all([
        supabaseAdmin.from("url_blacklist").select("url_pattern, reason, cluster"),
        supabaseAdmin.from("url_whitelist").select("url_pattern"),
        supabaseAdmin
          .from("scam_intel_campaigns")
          .select("title, source_org, source_url, keywords, impersonated_brand"),
      ]);
      if (bl) {
        for (const row of bl as Array<{ url_pattern: string; reason: string | null }>) {
          if (host.includes(row.url_pattern.toLowerCase())) {
            factors.push({
              label: "Trùng khớp danh sách đen cộng đồng",
              detail: row.reason ?? "Đã được người dùng báo cáo lừa đảo.",
              points: 40,
              category: "blacklist",
            });
          }
        }
      }
      if (wl) {
        for (const row of wl as Array<{ url_pattern: string }>) {
          if (host.includes(row.url_pattern.toLowerCase())) {
            factors.push({
              label: "Tên miền nằm trong danh sách trắng đã xác minh",
              points: -50,
              category: "whitelist",
            });
          }
        }
      }
      // 5) Intel cross-reference
      if (intel) {
        const haystack = host + " " + parsed.pathname.toLowerCase();
        for (const row of intel as Array<{
          title: string;
          source_org: string;
          source_url: string | null;
          keywords: string[];
          impersonated_brand: string | null;
        }>) {
          const hit = row.keywords?.some((k) => haystack.includes(k.toLowerCase()));
          if (hit) {
            intelMatches.push({
              title: row.title,
              source_org: row.source_org,
              source_url: row.source_url,
            });
          }
        }
        if (intelMatches.length > 0) {
          factors.push({
            label: `Trùng khớp ${intelMatches.length} chiến dịch lừa đảo đã được cảnh báo`,
            detail: `Nguồn: ${[...new Set(intelMatches.map((i) => i.source_org))].join(", ")}`,
            points: 30,
            category: "intel",
          });
        }
      }
    } catch (e) {
      console.error("intel check failed", e);
    }

    // 6) Aggregate cluster
    const cls = classifyScamText(host + " " + parsed.pathname);
    if (cls.cluster !== "UNKNOWN") {
      factors.push({
        label: `Tương đồng nhóm lừa đảo: ${cls.clusterName}`,
        detail: `Từ khoá khớp: ${cls.matchedKeywords.slice(0, 4).join(", ")}`,
        points: 10,
        category: "keyword",
      });
    }

    const totalRaw = factors.reduce((s, f) => s + f.points, 0);
    const score = Math.max(0, Math.min(100, totalRaw));
    const risk = classifyRisk(score);
    const recommendations = buildRecommendations(risk, brand?.brand);
    // Append cluster-specific guidance for dangerous results
    if (risk === "DANGEROUS" && cls.cluster !== "UNKNOWN") {
      recommendations.push(
        ...CLUSTERS[cls.cluster as Exclude<ClusterId, "UNKNOWN">].recommendations,
      );
    }

    // Analytics
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("analytics_events").insert({
        event_type: "url_analysis",
        cluster: cls.cluster,
        risk_level: risk,
        metadata: { host, score, brand: brand?.brand ?? null, intelHits: intelMatches.length },
      });
    } catch {}

    return {
      url: data.url,
      host,
      score,
      risk,
      factors,
      cluster: cls.cluster,
      clusterName: cls.clusterName,
      brandImpersonated: brand?.brand ?? null,
      intelMatches,
      recommendations,
    };
  });

// ---------- Get Intel Campaigns (public list) ----------
export const getIntelCampaigns = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("scam_intel_campaigns")
    .select("*")
    .order("reported_date", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return { campaigns: data ?? [] };
});

// ---------- Text classification ----------
export const classifyText = createServerFn({ method: "POST" })
  .inputValidator(z.object({ text: z.string().min(1).max(5000) }))
  .handler(async ({ data }) => classifyScamText(data.text));

// ---------- Screenshot Analysis (vision via Gemini) ----------
export const analyzeScreenshot = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      imageDataUrl: z.string().min(20).max(8_000_000),
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

// ---------- Chat ----------
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
