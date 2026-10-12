// Cloudflare Pages: POST /api/transcribe
// Called only when a spoken answer could not be matched from the browser's transcript.
// The key is the OPENAI_API_KEY secret on the Pages project, never in this file.
// The request asks for whisper-1 unless OPENAI_TRANSCRIBE_MODEL is set.
import transcribe from '../../server/transcribe.js';
const { handleTranscribe } = transcribe;

export async function onRequestPost({ request, env }) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > 4500000) return Response.json({ error: 'too_large' }, { status: 413 });
  let body = null;
  try { body = await request.json(); } catch (e) { body = null; }
  const out = await handleTranscribe(body, {
    apiKey: (env && env.OPENAI_API_KEY) || '',
    model: (env && env.OPENAI_TRANSCRIBE_MODEL) || '',
  });
  return Response.json(out.json, { status: out.status });
}
