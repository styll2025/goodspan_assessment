// Turns a short spoken answer into text, using OpenAI Whisper.
// The page calls this only when the member spoke and the built-in rules could not place the answer.
// Typed answers are never sent. Health and safety questions are refused here and are tap-only in the page.
//
// Needs OPENAI_API_KEY on the server (never in the page). Optional: OPENAI_TRANSCRIBE_MODEL (default whisper-1).
// The model is chosen here, in the request. It is not chosen when the API key is created.

const DEFAULT_MODEL = 'whisper-1';
const ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';
// Keep this list in step with BLOCKED in server/ai-interpret.js.
const BLOCKED = new Set(['q4', 'q5', 'q5a', 'q5b', 'q6', 'q29', 'q32']);
const MAX_AUDIO = 3000000;
const MAX_B64 = Math.ceil(MAX_AUDIO / 3) * 4 + 8;
const MAX_PROMPT = 800;
const MIN_AUDIO = 200;
const MIME = {
  'audio/webm': 'webm', 'audio/mp4': 'mp4', 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3',
  'audio/wav': 'wav', 'audio/wave': 'wav', 'audio/x-wav': 'wav', 'audio/ogg': 'ogg'
};

function fromProcess(name) {
  try {
    if (typeof process === 'undefined' || !process.env) return '';
    return process.env[name] || '';
  } catch (e) { return ''; }
}

// Spoken, not already matched, and not a tap-only health question.
function shouldTranscribe({ spoken, matched, blocked } = {}) {
  return spoken === true && matched !== true && blocked !== true;
}

function whisperLanguage(code) {
  const c = String(code || '').trim().toLowerCase();
  if (!c) return '';
  if (c.startsWith('pt')) return 'pt';
  if (c.startsWith('en')) return 'en';
  const two = c.slice(0, 2);
  return /^[a-z]{2}$/.test(two) ? two : '';
}

function decodeAudio(audio) {
  if (typeof audio !== 'string') return { error: 'bad_request' };
  const b64 = audio.replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
  if (b64.length > MAX_B64) return { error: 'too_large' };
  if (b64.length < 16 || !/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) return { error: 'bad_request' };
  let bytes;
  try {
    const bin = atob(b64);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i) & 255;
  } catch (e) { return { error: 'bad_request' }; }
  if (bytes.length > MAX_AUDIO) return { error: 'too_large' };
  if (bytes.length < MIN_AUDIO) return { error: 'bad_request' };
  return { bytes };
}

async function handleTranscribe(body, { fetchImpl = fetch, apiKey = fromProcess('OPENAI_API_KEY'), model = '' } = {}) {
  const b = body || {};
  if (!apiKey) return { status: 503, json: { error: 'not_configured' } };
  // The page only calls this when shouldTranscribe says so. This still refuses a tap-only question if one is posted directly.
  if (BLOCKED.has(b.questionId)) return { status: 400, json: { error: 'question_not_allowed' } };
  if (typeof b.questionId !== 'string' || !/^q[a-z0-9]+$/i.test(b.questionId))
    return { status: 400, json: { error: 'bad_request' } };
  const decoded = decodeAudio(b.audio);
  if (decoded.error) return { status: decoded.error === 'too_large' ? 413 : 400, json: { error: decoded.error } };
  const mime = String(b.mime || 'audio/webm').split(';')[0].trim().toLowerCase();
  const ext = MIME[mime] || 'webm';
  const type = MIME[mime] ? mime : 'audio/webm';
  const lang = whisperLanguage(b.language);
  const prompt = typeof b.prompt === 'string' ? b.prompt.replace(/\s+/g, ' ').trim().slice(0, MAX_PROMPT) : '';
  const modelName = model || fromProcess('OPENAI_TRANSCRIBE_MODEL') || DEFAULT_MODEL;
  const form = new FormData();
  form.append('file', new Blob([decoded.bytes], { type }), 'answer.' + ext);
  form.append('model', modelName);
  form.append('response_format', 'json');
  if (lang) form.append('language', lang);
  if (prompt) form.append('prompt', prompt);
  let res;
  try {
    res = await fetchImpl(ENDPOINT, { method: 'POST', headers: { Authorization: 'Bearer ' + apiKey }, body: form });
  } catch (e) { return { status: 502, json: { error: 'upstream_unreachable' } }; }
  if (!res || !res.ok) return { status: 502, json: { error: 'upstream_error' } };
  let data;
  try { data = await res.json(); } catch (e) { return { status: 502, json: { error: 'upstream_error' } }; }
  const text = typeof data.text === 'string' ? data.text.trim().slice(0, 500) : '';
  return { status: 200, json: { text } };
}

module.exports = { handleTranscribe, shouldTranscribe, whisperLanguage, BLOCKED, DEFAULT_MODEL, ENDPOINT };
