// Cloudflare Pages: POST /api/story
// Writes the "About you" story at the top of a member's Good Span. Same ANTHROPIC_API_KEY secret as /api/interpret.
import story from '../../server/ai-story.js';
const { handleStory } = story;

export async function onRequestPost({ request, env }) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > 20000) return Response.json({ error: 'bad_request' }, { status: 400 });
  let body = null;
  try { body = await request.json(); } catch (e) { body = null; }
  const out = await handleStory(body, {
    apiKey: (env && env.ANTHROPIC_API_KEY) || '',
    model: (env && env.GS_STORY_MODEL) || '',
  });
  return Response.json(out.json, { status: out.status });
}
