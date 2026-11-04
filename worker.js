// These Pages functions stay on thegoodspan-assessment.pages.dev.
// A redirect would drop the POST body, so the evaluation host forwards the request and returns the answer.
// The 15:22 production deployment has no Pages secrets. This earlier deployment still has them.
// Switch this back to https://thegoodspan-assessment.pages.dev once that project’s production
// environment has OPENAI_API_KEY and ANTHROPIC_API_KEY and a new deployment has picked them up.
const PAGES_API = "https://66a351f1.thegoodspan-assessment.pages.dev";
const PAGES_API_PATHS = new Set(["/api/interpret", "/api/transcribe", "/api/story"]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    if (PAGES_API_PATHS.has(url.pathname)) {
      return forwardPagesApi(request, url);
    }

    if (request.method === "POST" && url.pathname === "/api/plans") {
      let body;
      try {
        body = await request.json();
      } catch {
        return cors(Response.json({ error: "Invalid JSON" }, { status: 400 }));
      }
      const html = typeof body.html === "string" ? body.html : "";
      if (!html) {
        return cors(Response.json({ error: "Missing html" }, { status: 400 }));
      }
      const requested = String(body.planId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
      const planId = requested || crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      await env.PLANS.put(planId, html);
      const planLink = `${url.origin}/plans/${planId}.html`;
      return cors(Response.json({ planId, planLink }));
    }

    if (request.method === "GET" && url.pathname.startsWith("/plans/") && url.pathname.endsWith(".html")) {
      const planId = url.pathname.slice("/plans/".length, -".html".length);
      const html = await env.PLANS.get(planId);
      if (!html) {
        return cors(new Response("Plan not found", { status: 404 }));
      }
      return cors(new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      }));
    }

    return env.ASSETS.fetch(request);
  },
};

async function forwardPagesApi(request, url) {
  const target = new URL(url.pathname + url.search, PAGES_API);
  const headers = new Headers();
  const contentType = request.headers.get("Content-Type");
  if (contentType) headers.set("Content-Type", contentType);
  try {
    const proxied = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      redirect: "manual",
    });
    const out = new Headers();
    const type = proxied.headers.get("Content-Type");
    if (type) out.set("Content-Type", type);
    out.set("Access-Control-Allow-Origin", "*");
    out.set("Cache-Control", "no-store");
    return new Response(proxied.body, { status: proxied.status, headers: out });
  } catch {
    return cors(Response.json({ error: "unavailable" }, { status: 502 }));
  }
}

function cors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, { status: response.status, headers });
}
