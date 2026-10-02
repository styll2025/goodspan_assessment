export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
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

function cors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, { status: response.status, headers });
}
