// Builds index.html (the member prototype served at the site root) as one self-contained page
// from src/app.html, src/base.css and core/*. Fonts and the logo load from design/assets/.
// Usage: npm run build   (or: node scripts/build.mjs)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
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
<!-- Built by scripts/build.mjs from src/ and core/. Edit those files, not this one. -->
</head>
<body>
${body}
</body>
</html>
`;
writeFileSync(join(root, 'index.html'), html);
console.log('Built index.html (' + Math.round(html.length / 1024) + ' KB)');
