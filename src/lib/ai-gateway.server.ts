// Server-only Lovable AI Gateway helper.
const BASE_URL = "https://ai.gateway.lovable.dev/v1";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<Record<string, unknown>>;
}

export async function callLovableAI(opts: {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  stream?: boolean;
}): Promise<Response> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "raw-fetch",
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-3-flash-preview",
      messages: opts.messages,
      temperature: opts.temperature ?? 0.4,
      stream: opts.stream ?? false,
    }),
  });
}

export async function callLovableAIJson<T = unknown>(opts: {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
}): Promise<T> {
  const res = await callLovableAI({ ...opts, stream: false });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 402) throw new Error("CREDITS_EXHAUSTED");
    throw new Error(`AI Gateway error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  // Try to extract JSON
  const match = content.match(/\{[\s\S]*\}/);
  const jsonStr = match ? match[0] : content;
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return { raw: content } as T;
  }
}
