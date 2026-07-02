import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Generates ONE contextual product shot per call using Google's image model
// (gemini-2.5-flash-image / "Nano Banana"), with the uploaded photo as reference.
// Admin-only. CORS allows the prod origin plus localhost for admin dev/testing.

const ALLOW_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

function corsFor(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const prod = Deno.env.get("SITE_URL") ?? "https://classy.aitems.dev";
  const allow =
    origin === prod ||
    origin === "https://classy.aitems.dev" ||
    /^http:\/\/localhost(:\d+)?$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
      ? origin
      : prod;
  return { "Access-Control-Allow-Origin": allow, "Access-Control-Allow-Headers": ALLOW_HEADERS, "Vary": "Origin" };
}

const GARNISH =
  "Garnish realism: any citrus wedge sits flush on the glass rim through a real cut-slit, slightly " +
  "tilted, never floating; any chilli rests inside the glass against the rim, on the drink surface, " +
  "or laid on the surface beside the glass, never balanced across the rim; garnishes at correct scale, " +
  "not overlapping, casting small contact shadows. Everything obeys gravity and looks physically placed.";

const FIDELITY =
  "Reproduce the product from the reference image EXACTLY: same shape, proportions, finish, materials, " +
  "label/branding, logos and colours. Do not alter, translate, or invent any text or logo. " +
  "Photorealistic premium product photography, vertical 4:5 framing, shallow depth of field.";

const REALISM =
  "Physical realism: every element sits naturally and obeys gravity, at correct real-world scale, with " +
  "proper contact shadows and surface contact — nothing floating, intersecting, or impossibly balanced. " +
  "Props must suit this product type (do not add food, drink or garnish to a non-beverage product). " +
  "Keep secondary props minimal and simple; do NOT include objects that image models commonly distort — " +
  "no watches, clock/watch dials, gauges, readable text on props, hands or faces. If a prop risks looking " +
  "malformed, omit it and keep the composition clean.";

// Fallback scene briefs only used if the caller sends no `prompt` (legacy / beverage default).
const SCENES: Record<string, string> = {
  bar:
    "Place the exact product from the reference on a dark polished marble bar in dim, moody light, " +
    "warm bokeh behind it, realistic reflections. Low-key, cinematic, editorial.",
  flatlay:
    "Overhead flatlay on a dark textured surface: the exact product from the reference centred, clean " +
    "props arranged around it, even soft studio light, organised premium editorial composition.",
  pour:
    "The exact product from the reference as a dynamic hero shot with motion and premium studio lighting.",
  lifestyle:
    "Lifestyle scene: the exact product from the reference in a real, in-use setting with soft " +
    "golden-hour ambient light and a blurred background. Authentic, premium, editorial.",
};

serve(async (req) => {
  const corsHeaders = corsFor(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const { data: roleRows } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin"]);
  if (!roleRows || roleRows.length === 0) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { public_url, context, prompt: scenePrompt } = await req.json();
    if (!public_url) throw new Error("public_url is required");
    // Prefer the model-authored, category-appropriate scene brief; fall back to a generic default.
    const scene =
      typeof scenePrompt === "string" && scenePrompt.trim()
        ? scenePrompt.trim()
        : SCENES[context as string] ?? SCENES.bar;

    // Copy branding from the reference as-is. Forcing/enlarging a wordmark makes the model
    // fabricate garbled letters — so keep it faithful to the reference, do not invent text.
    const brandingClause =
      "Keep any branding, logo or label exactly as it appears in the reference image — same position, size and " +
      "style. Do NOT add, enlarge, relocate, sharpen or invent any text or logo that is not clearly present in " +
      "the reference; if branding is small or unclear in the reference, leave it subtle rather than fabricating letters.";

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    // Fetch the reference image and base64-encode it for the model.
    const imgResp = await fetch(public_url);
    if (!imgResp.ok) throw new Error(`Could not fetch reference image (${imgResp.status})`);
    const mime = imgResp.headers.get("content-type") || "image/jpeg";
    const bytes = new Uint8Array(await imgResp.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const refB64 = btoa(bin);

    const finalPrompt = `${scene}\n\n${REALISM}\n\n${FIDELITY}\n\n${brandingClause}`;

    const model = "gemini-2.5-flash-image";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_AI_API_KEY}`;
    const reqBody = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: finalPrompt }, { inline_data: { mime_type: mime, data: refB64 } }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    });

    // gemini-2.5-flash-image returns transient 500/503 under load — retry with exponential backoff + jitter.
    let response: Response | null = null;
    const MAX_ATTEMPTS = 4;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: reqBody });
      if (response.ok) break;
      const retryable = response.status === 429 || response.status === 500 || response.status === 503;
      if (!retryable || attempt === MAX_ATTEMPTS) break;
      await response.body?.cancel();
      const wait = Math.min(9000, 800 * 2 ** attempt) + Math.floor(Math.random() * 400);
      console.log(`[${context}] model ${response.status}, retry ${attempt}/${MAX_ATTEMPTS - 1} in ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
    }

    if (!response || !response.ok) {
      const status = response?.status ?? 500;
      const errorText = response ? await response.text() : "no response from model";
      console.error("image gateway error:", status, errorText);
      const msg =
        status === 404
          ? "The image model is not available on this API key/plan."
          : status === 429
          ? "Rate limit exceeded — try again shortly."
          : status === 402
          ? "AI credits exhausted."
          : status === 503
          ? "Model overloaded after retries — try again in a moment."
          : `Image generation failed (${status})`;
      return new Response(JSON.stringify({ error: msg, detail: errorText.slice(0, 400) }), {
        status: status === 404 ? 400 : status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const parts = result?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find((p: any) => p.inlineData || p.inline_data);
    const inline = imgPart?.inlineData || imgPart?.inline_data;
    if (!inline?.data) {
      return new Response(JSON.stringify({ error: "Model returned no image", detail: JSON.stringify(result).slice(0, 400) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const outMime = inline.mimeType || inline.mime_type || "image/png";
    const dataUri = `data:${outMime};base64,${inline.data}`;

    return new Response(JSON.stringify({ data: { context, image: dataUri } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-case-study-images error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
