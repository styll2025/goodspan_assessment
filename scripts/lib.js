// Shared helpers for the node scripts: load the generator and fill the page templates.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DATA = require(ROOT + '/data/library.json');
const { makeEngine } = require(ROOT + '/core/engine.js');
const { toFeatures } = require(ROOT + '/core/questions.js');
const { profile } = require(ROOT + '/core/profile.js');
const { buildResult } = require(ROOT + '/core/result.js');
const E = makeEngine(DATA);
const env = { E, DATA, toFeatures, profile };

const dataUri = (f, mime) => `data:${mime};base64,${fs.readFileSync(f).toString('base64')}`;
const A = ROOT + '/assets/';
const FONTS = { __F_THIN__: ['BSTBazaineTrial-Thin.otf', 'font/otf'], __F_LIGHT__: ['BSTBazaineTrial-Light.otf', 'font/otf'], __F_REG__: ['BSTBazaineTrial-Regular.otf', 'font/otf'], __F_UI__: ['Archivo-Regular.ttf', 'font/ttf'], __LOGO__: ['tgs-logo-one-line-black.png', 'image/png'], __LOGO_PLUM__: ['tgs-logo-one-line-plum.png', 'image/png'], __SYM_PLUM__: ['tgs-symbol-plum.png', 'image/png'] };
const PILLARS = ['Nutrition', 'Sleep', 'Movement', 'Mind', 'Connection', 'Prevention'];
// Browser tab: the two-arc symbol, not the wordmark.
const iconLinks = [
  '<link rel="icon" href="favicon.ico" sizes="any">',
  '<link rel="icon" href="favicon.svg" type="image/svg+xml">',
  '<link rel="apple-touch-icon" href="apple-touch-icon.png">',
  '<link rel="manifest" href="site.webmanifest">',
  '<meta name="theme-color" content="#4d2831">',
].join('');
// Google Analytics for the public evaluation pages.
const googleTag = '<!-- Google tag (gtag.js) --><script async src="https://www.googletagmanager.com/gtag/js?id=G-HMHPYN0VZE"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag(\'js\',new Date());gtag(\'config\',\'G-HMHPYN0VZE\');</script>';
const fill = (s, map) => { for (const k in map) s = s.split(k).join(map[k]); return s; };
const fontMap = () => Object.fromEntries(Object.entries(FONTS).map(([k, [f, m]]) => [k, dataUri(A + f, m)]));
const img = key => dataUri(A + 'img/' + key.toLowerCase() + '.jpg', 'image/jpeg');

// result page for one or more members (records from buildResult)
function resultPage(records) {
  let s = fill(fs.readFileSync(ROOT + '/templates/result_page.tpl.html', 'utf8'), fontMap());
  s = s.replace('__IMG__', () => JSON.stringify(Object.fromEntries([...PILLARS, 'Stretch'].map(k => [k, img(k)]))));
  s = s.replace('__DATA__', () => JSON.stringify(records).replace(/</g, '\\u003c'));
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + iconLinks + '</head><body>' + s + '</body></html>';
}

// the conversation, with the generator and the result page template inside it
function conversationPage() {
  const tpl = fill(fs.readFileSync(ROOT + '/templates/result_page.tpl.html', 'utf8'), fontMap());
  const js = [
    'const RESULT_TPL = ' + JSON.stringify(tpl).replace(/<\//g, '<\\/') + ';',
    'const GS_DATA = ' + fs.readFileSync(ROOT + '/data/library.json', 'utf8').replace(/<\//g, '<\\/') + ';',
    fs.readFileSync(ROOT + '/core/engine.js', 'utf8'),
    'const gsProfile = (function () {\n' + fs.readFileSync(ROOT + '/core/profile.js', 'utf8') + '\nreturn profile; })();',
    fs.readFileSync(ROOT + '/core/result.js', 'utf8'),
  ].join('\n');
  let s = fill(fs.readFileSync(ROOT + '/templates/conversation.tpl.html', 'utf8'), Object.assign(fontMap(), { __LOGO__: dataUri(A + 'tgs-logo-one-line-plum.png', 'image/png'), __SYM__: dataUri(A + 'tgs-symbol-plum.png', 'image/png') }));
  s = s.replace('__IMG__', () => JSON.stringify(Object.fromEntries(PILLARS.map(k => [k.toLowerCase(), img(k)]))));
  s = s.replace('__QUESTIONS__', () => fs.readFileSync(ROOT + '/core/questions.js', 'utf8'));
  s = s.replace('__RESULT_JS__', () => js);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + iconLinks + googleTag + '</head><body>' + s + '</body></html>';
}
module.exports = { ROOT, env, buildResult, resultPage, conversationPage, iconLinks, googleTag };
