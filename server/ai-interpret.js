// AI matching for the conversational assessment: turns what a member typed or said into one of the listed options.
// It is a narrow classifier, not a conversation: it can only choose from the options it is given, or say "unclear".
// The page calls it only when the built-in rules can't place an answer, and the member always confirms the result.
//
// Needs ANTHROPIC_API_KEY on the server (never in the page). Optional: GS_AI_MODEL (default below).
// Use handleInterpret(body) from any server or serverless function (Vercel, Netlify, Express…); see dev-server.js.

const MODEL = process.env.GS_AI_MODEL || 'claude-haiku-4-5';
// health, symptoms, pregnancy, movement limits and mood are tap-only and never sent here (also blocked in the page)
const BLOCKED = new Set(['q4', 'q5', 'q5a', 'q5b', 'q6', 'q29', 'q32']);
const MAX_TEXT = 500, MAX_OPTIONS = 40;

const SYSTEM = `You map a person's answer to a wellbeing questionnaire onto the answer options they were shown.
Rules:
- Choose only from the numbered options. Never invent, combine or reword an option.
- For "single", choose exactly one option. For "multi", choose every option the answer clearly states, up to the maximum.
- Use the meaning, not just the words: "on my feet all day at work" can mean a lot of steps; "a glass of wine most evenings" is a drinking frequency.
- The answer may come from speech recognition and contain misheard words ("for" for "four", "to" for "two"); use the alternative transcripts when helpful.
- The answer may be in English or Portuguese.
- If the answer is ambiguous, off-topic, a question, or could fit two single-choice options equally, set unclear to true and choose nothing.
- Do not give advice and do not comment. Only call the tool.`;

function buildRequest({ question, type, max, options, answer, alternatives }) {
  const list = options.map((o, i) => `${i + 1}. ${o}`).join('\n');
  const alt = (alternatives || []).filter(Boolean);
  return {
    model: MODEL, max_tokens: 200, temperature: 0, system: SYSTEM,
    tools: [{ name: 'record_answer', description: 'Record which listed options the answer matches.',
      input_schema: { type: 'object', properties: {
        options: { type: 'array', items: { type: 'integer', minimum: 1, maximum: options.length }, description: 'Numbers of the matching options' },
        unclear: { type: 'boolean', description: 'True if the answer cannot be matched with confidence' } },
        required: ['options', 'unclear'] } }],
    tool_choice: { type: 'tool', name: 'record_answer' },
    messages: [{ role: 'user', content: `Question: ${question}\nAnswer type: ${type}${type === 'multi' && max ? ` (up to ${max})` : ''}\nOptions:\n${list}\n\nWhat they said: "${answer}"${alt.length ? `\nOther possible transcripts: ${alt.map(a => `"${a}"`).join('; ')}` : ''}` }]
  };
}

async function handleInterpret(body, { fetchImpl = fetch, apiKey = process.env.ANTHROPIC_API_KEY } = {}) {
  const b = body || {};
  if (!apiKey) return { status: 503, json: { error: 'not_configured' } };
  if (BLOCKED.has(b.questionId)) return { status: 400, json: { error: 'question_not_allowed' } };
  if (typeof b.answer !== 'string' || !b.answer.trim() || !Array.isArray(b.options) || !b.options.length || b.options.length > MAX_OPTIONS || typeof b.question !== 'string')
    return { status: 400, json: { error: 'bad_request' } };
  const req = buildRequest({ question: b.question.slice(0, 400), type: b.type === 'multi' ? 'multi' : 'single', max: Number(b.max) || null,
    options: b.options.map(o => String(o).slice(0, 300)), answer: b.answer.slice(0, MAX_TEXT), alternatives: (b.alternatives || []).slice(0, 2).map(a => String(a).slice(0, MAX_TEXT)) });
  let res;
  try {
    res = await fetchImpl('https://api.anthropic.com/v1/messages', { method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(req) });
  } catch (e) { return { status: 502, json: { error: 'upstream_unreachable' } }; }
  if (!res.ok) return { status: 502, json: { error: 'upstream_error', status: res.status } };
  const data = await res.json();
  const call = (data.content || []).find(c => c.type === 'tool_use' && c.name === 'record_answer');
  if (!call) return { status: 200, json: { answer: [], unclear: true } };
  const idx = [...new Set((call.input.options || []).filter(n => Number.isInteger(n) && n >= 1 && n <= b.options.length))];
  let answer = idx.map(n => b.options[n - 1]);
  if (b.type !== 'multi') answer = answer.slice(0, 1); else if (b.max) answer = answer.slice(0, Number(b.max));
  const unclear = !!call.input.unclear || !answer.length;
  return { status: 200, json: { answer: unclear ? [] : answer, unclear } };
}

module.exports = { handleInterpret, buildRequest, BLOCKED };
