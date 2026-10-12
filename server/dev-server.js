// Local test server: serves the conversation with AI matching switched on, and the /api/interpret endpoint.
//   ANTHROPIC_API_KEY=sk-... node server/dev-server.js        then open http://localhost:8787
// Without a key it still runs, using the built-in rules only.
// Options: PORT, GS_AI_MODEL, GS_SPEECH_LANG (e.g. pt-PT).
const http = require('http');
const { conversationPage } = require('../scripts/lib.js');
const { handleInterpret } = require('./ai-interpret.js');
const PORT = +process.env.PORT || 8787;

http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/interpret') {
    let raw = ''; req.on('data', c => { raw += c; if (raw.length > 20000) req.destroy(); });
    req.on('end', async () => {
      let body; try { body = JSON.parse(raw); } catch (e) { body = null; }
      const t0 = Date.now(), out = await handleInterpret(body);
      console.log(`[interpret] ${body && body.questionId} "${body && body.answer}" -> ${JSON.stringify(out.json)} (${Date.now() - t0} ms)`);
      res.writeHead(out.status, { 'content-type': 'application/json' }); res.end(JSON.stringify(out.json));
    });
    return;
  }
  if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/?'))) {
    const settings = `<script>window.GS_AI_URL = ${process.env.ANTHROPIC_API_KEY ? "'/api/interpret'" : "''"}; window.GS_SPEECH_LANG = ${JSON.stringify(process.env.GS_SPEECH_LANG || 'en-GB')};</script>`;
    const html = conversationPage().replace('<body>', '<body>' + settings);   // rebuilt on each load, so template edits show on refresh
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); return;
  }
  res.writeHead(404); res.end();
}).listen(PORT, () => console.log(`Good Span conversation on http://localhost:${PORT}  (AI matching ${process.env.ANTHROPIC_API_KEY ? 'on' : 'off: no ANTHROPIC_API_KEY'})`));
