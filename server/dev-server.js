// Local test server: serves the conversation, /api/interpret and /api/transcribe.
//   ANTHROPIC_API_KEY=sk-... OPENAI_API_KEY=sk-... node server/dev-server.js
//   then open http://localhost:8787
// Without a key that part stays off and the page uses the built-in rules.
// Options: PORT, GS_AI_MODEL, OPENAI_TRANSCRIBE_MODEL, GS_SPEECH_LANG (e.g. pt-PT).
const http = require('http');
const { conversationPage } = require('../scripts/lib.js');
const { handleInterpret } = require('./ai-interpret.js');
const { handleTranscribe } = require('./transcribe.js');
const PORT = +process.env.PORT || 8787;

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > limit) { reject(new Error('too_large')); req.destroy(); } });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/interpret') {
    let raw = ''; try { raw = await readBody(req, 20000); } catch (e) { res.writeHead(413); res.end(); return; }
    let body; try { body = JSON.parse(raw); } catch (e) { body = null; }
    const t0 = Date.now(), out = await handleInterpret(body);
    console.log(`[interpret] ${body && body.questionId} "${body && body.answer}" -> ${JSON.stringify(out.json)} (${Date.now() - t0} ms)`);
    res.writeHead(out.status, { 'content-type': 'application/json' }); res.end(JSON.stringify(out.json));
    return;
  }
  if (req.method === 'POST' && req.url === '/api/transcribe') {
    let raw = ''; try { raw = await readBody(req, 4500000); } catch (e) { res.writeHead(413, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'too_large' })); return; }
    let body; try { body = JSON.parse(raw); } catch (e) { body = null; }
    const t0 = Date.now(), out = await handleTranscribe(body);
    console.log(`[transcribe] ${body && body.questionId} ${out.json.text ? JSON.stringify(out.json.text) : out.json.error} (${Date.now() - t0} ms)`);
    res.writeHead(out.status, { 'content-type': 'application/json' }); res.end(JSON.stringify(out.json));
    return;
  }
  if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/?'))) {
    const settings = `<script>window.GS_AI_URL = ${process.env.ANTHROPIC_API_KEY ? "'/api/interpret'" : "''"}; window.GS_TRANSCRIBE_URL = ${process.env.OPENAI_API_KEY ? "'/api/transcribe'" : "''"}; window.GS_SPEECH_LANG = ${JSON.stringify(process.env.GS_SPEECH_LANG || 'en-GB')};</script>`;
    const html = conversationPage().replace('<body>', '<body>' + settings);   // rebuilt on each load, so template edits show on refresh
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); return;
  }
  res.writeHead(404); res.end();
}).listen(PORT, () => console.log(`Good Span conversation on http://localhost:${PORT}  (AI matching ${process.env.ANTHROPIC_API_KEY ? 'on' : 'off'}, Whisper ${process.env.OPENAI_API_KEY ? 'on' : 'off'})`));
