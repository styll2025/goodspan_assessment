// Builds the pages the site serves.
// index.html is the conversational assessment at the site root, from templates/conversation.tpl.html.
// assessment.html is the section-by-section form, from src/app.html, src/base.css and core/*.
// Usage: npm run build   (or: node scripts/build.mjs)
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { conversationPage } = require('./lib.js');
const r = p => readFileSync(join(root, p), 'utf8');
const body = r('src/app.html')
  .replace('__BASECSS__', () => r('src/base.css'))
  .replace('__DATA_SCRIPT__', () => 'const DATA = ' + r('core/data.json') + ';')
  .replace('__ENGINE__', () => r('core/engine.js'))
  .replace('__QUESTIONS__', () => r('core/questions.js'));
const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>The Good Span: find your Good Span</title>
<!-- Built by scripts/build.mjs from src/ and core/. Edit those files, not this one. Served at /assessment.html. -->
</head>
<body>
${body}
</body>
</html>
`;
writeFileSync(join(root, 'assessment.html'), html);
// The public page calls /api/interpret and, when a spoken answer still needs a transcript, /api/transcribe.
// Keys stay in the Pages secrets ANTHROPIC_API_KEY and OPENAI_API_KEY.
// Completions go to the Google Apps Script web app in scripts/completions.gs. Paste its /exec URL here
// (and GS_SHEET_KEY if you set SHARED_KEY in the script). Leave empty to send nothing.
const GS_SHEET_URL = '';
const GS_SHEET_KEY = '';
const conversation = conversationPage().replace(
  '<body>',
  '<body><script>window.GS_AI_URL="/api/interpret";window.GS_TRANSCRIBE_URL="/api/transcribe";window.GS_SPEECH_LANG="en-GB";window.GS_SHEET_URL=' + JSON.stringify(GS_SHEET_URL) + ';window.GS_SHEET_KEY=' + JSON.stringify(GS_SHEET_KEY) + ';</script>'
);
writeFileSync(join(root, 'index.html'), conversation);
console.log('Built index.html (' + Math.round(conversation.length / 1024) + ' KB), assessment.html (' + Math.round(html.length / 1024) + ' KB)');
