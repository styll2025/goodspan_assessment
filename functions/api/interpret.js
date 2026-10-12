// Cloudflare Pages: POST /api/interpret
// The key is the ANTHROPIC_API_KEY secret on the Pages project, never in this file.
import interpret from '../../server/ai-interpret.js';
const { handleInterpret } = interpret;

export async function onRequestPost({ request, env }) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > 20000) return Response.json({ error: 'bad_request' }, { status: 400 });
  let body = null;
  try { body = await request.json(); } catch (e) { body = null; }
  const out = await handleInterpret(body, {
    apiKey: (env && env.ANTHROPIC_API_KEY) || '',
    model: (env && env.GS_AI_MODEL) || '',
  });
  return Response.json(out.json, { status: out.status });
}
