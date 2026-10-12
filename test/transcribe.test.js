// node test/transcribe.test.js → checks when Whisper is called, and that the request is formed, with a fake API
const { handleTranscribe, shouldTranscribe, ENDPOINT, DEFAULT_MODEL } = require('../server/transcribe.js');
const audio = Buffer.alloc(250, 7).toString('base64');
const Q = { questionId: 'q24', language: 'en-GB', mime: 'audio/webm', prompt: 'How many steps do you take on a typical day? Fewer than 5,000, 10,000 or more', audio };

(async () => {
  const fails = [], ok = (c, m) => c || fails.push(m);
  ok(shouldTranscribe({ spoken: true, matched: false, blocked: false }) === true, 'spoken and unmatched: call Whisper');
  ok(shouldTranscribe({ spoken: false, matched: false, blocked: false }) === false, 'typed answers are not sent');
  ok(shouldTranscribe({ spoken: true, matched: true, blocked: false }) === false, 'a rules match is not sent');
  ok(shouldTranscribe({ spoken: true, matched: false, blocked: true }) === false, 'tap-only questions are not sent');

  let seen = null;
  const fake = text => async (url, init) => {
    seen = { url, init };
    return { ok: true, json: async () => ({ text }) };
  };
  let calls = 0;
  const counting = async (url, init) => { calls++; seen = { url, init }; return { ok: true, json: async () => ({ text: 'ten thousand steps' }) }; };

  let r = await handleTranscribe(Q, { apiKey: 'sk-test', fetchImpl: fake('  ten thousand steps  ') });
  ok(r.status === 200 && r.json.text === 'ten thousand steps', 'returns the transcript');
  ok(seen && seen.url === ENDPOINT, 'calls the Whisper transcriptions endpoint');
  ok(seen.init.headers.Authorization === 'Bearer sk-test', 'sends the key only as the bearer token');
  const form = seen.init.body;
  ok(form.get('model') === DEFAULT_MODEL, 'asks for whisper-1');
  ok(form.get('language') === 'en', 'maps en-GB to en');
  ok(String(form.get('prompt')).includes('10,000 or more'), 'passes the question wording as a hint');
  const file = form.get('file');
  ok(file && file.name === 'answer.webm' && file.type === 'audio/webm', 'sends the recording as an audio file');
  ok((await file.arrayBuffer()).byteLength === 250, 'sends the recording bytes');
  ok(!JSON.stringify(r.json).includes('sk-test'), 'the reply does not contain the key');

  r = await handleTranscribe(Object.assign({}, Q, { questionId: 'q5' }), { apiKey: 'sk-test', fetchImpl: counting });
  ok(r.status === 400 && r.json.error === 'question_not_allowed' && calls === 0, 'health questions are refused before any call');
  r = await handleTranscribe(Q, { apiKey: '', fetchImpl: counting });
  ok(r.status === 503 && r.json.error === 'not_configured' && calls === 0, 'no key: switched off');
  r = await handleTranscribe(Object.assign({}, Q, { audio: '%%%' }), { apiKey: 'sk-test', fetchImpl: counting });
  ok(r.status === 400 && calls === 0, 'rejects audio that is not a recording');
  r = await handleTranscribe(Object.assign({}, Q, { audio: 'A'.repeat(4100000) }), { apiKey: 'sk-test', fetchImpl: counting });
  ok(r.status === 413 && r.json.error === 'too_large' && calls === 0, 'rejects a recording that is too long');
  r = await handleTranscribe(Object.assign({}, Q, { questionId: '' }), { apiKey: 'sk-test', fetchImpl: counting });
  ok(r.status === 400 && calls === 0, 'refuses a call with no question');
  r = await handleTranscribe(Object.assign({}, Q, { language: 'pt-PT' }), { apiKey: 'sk-test', model: 'whisper-1', fetchImpl: fake('oito horas') });
  ok(seen.init.body.get('language') === 'pt' && seen.init.body.get('model') === 'whisper-1', 'Portuguese uses pt and the requested model');
  r = await handleTranscribe(Q, { apiKey: 'sk-test', fetchImpl: async () => { throw new Error('down'); } });
  ok(r.status === 502 && r.json.error === 'upstream_unreachable', 'a network failure stays on our side');
  r = await handleTranscribe(Q, { apiKey: 'sk-test', fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'bad key' } }) }) });
  ok(r.status === 502 && r.json.error === 'upstream_error' && !JSON.stringify(r.json).includes('bad key'), 'upstream errors are not passed through');

  console.log(`Whisper endpoint checks: ${fails.length ? fails.length + ' failed' : 'all passed'}`);
  fails.forEach(f => console.log('  ' + f));
  process.exit(fails.length ? 1 : 0);
})();
