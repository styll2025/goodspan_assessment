/**
 * The Good Span: assessment completions → Google Sheet, and each member's plan as a web page.
 *
 * What it does
 * - The conversation (index.html) posts one completion when a member finishes: their contact details,
 *   every answer, a short plan summary and the full plan page (HTML).
 * - Each completion becomes one row in the "Completions" tab: fixed columns first, then one column
 *   per question. New questions add new columns automatically.
 * - The plan page is saved as an HTML file in a private Drive folder ("Good Span plans").
 *   The row's "Plan link" opens it through this web app: <web app URL>?plan=<id>.
 *
 * Setup (about 5 minutes)
 * 1. Create a Google Sheet for completions (or open the one you want to use).
 * 2. Extensions → Apps Script. Delete what's there, paste this file, Save.
 * 3. Run "setup" once from the toolbar (choose setup, then Run) and accept the permissions.
 *    It creates the "Completions" tab and the Drive folder.
 * 4. Deploy → New deployment → Select type: Web app
 *      Description: Good Span completions
 *      Execute as: Me
 *      Who has access: Anyone
 *    Copy the Web app URL (it ends in /exec).
 * 5. Put that URL in scripts/build.mjs (GS_SHEET_URL) and run npm run build.
 * 6. After any later change to this script: Deploy → Manage deployments → Edit (pencil) →
 *    Version: New version → Deploy. The URL stays the same.
 *
 * Privacy
 * - Plan links use a long random id, so they can't be guessed, but anyone who has a link can open
 *   that plan. Share links only with the member and their Pilot.
 * - The Drive folder stays private to you; only this web app reads from it.
 * - Answers include health information. Add consent wording to the assessment before real members use it.
 */

const CONFIG = {
  SHEET_NAME: 'Completions',
  FOLDER_NAME: 'Good Span plans',
  MAX_HTML_BYTES: 15 * 1024 * 1024,   // a plan page is about 1 MB
  // Optional: set the same text in the page (window.GS_SHEET_KEY) to ignore posts from anywhere else.
  // Leave empty to accept every post.
  SHARED_KEY: ''
};

// Columns that always come first, in this order. Question columns follow.
const FIXED_COLUMNS = ['Submitted', 'Reference', 'Name', 'Email', 'Plan link', 'Focus areas',
  'Recommended practices', 'Other practices', 'Own practice', 'Opening words', 'Version', 'Source'];

function setup() {
  sheet_();
  folder_();
  Logger.log('Ready. Now deploy this script as a web app (Deploy → New deployment → Web app).');
}

// ---------- receiving a completion ----------

function doPost(e) {
  let data;
  try { data = JSON.parse((e && e.postData && e.postData.contents) || ''); }
  catch (err) { return json_({ ok: false, error: 'Invalid JSON' }); }
  if (!data || typeof data !== 'object') return json_({ ok: false, error: 'No data' });
  if (CONFIG.SHARED_KEY && data.key !== CONFIG.SHARED_KEY) return json_({ ok: false, error: 'Not allowed' });

  const id = cleanId_(data.planId) || Utilities.getUuid().replace(/-/g, '');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    let planLink = '';
    if (typeof data.planHtml === 'string' && data.planHtml) {
      if (data.planHtml.length > CONFIG.MAX_HTML_BYTES) return json_({ ok: false, error: 'Plan too large' });
      savePlan_(id, data.planHtml);
      planLink = ScriptApp.getService().getUrl() + '?plan=' + id;
    }
    const row = rowFrom_(data, id, planLink);
    const where = upsert_(sheet_(), row);
    return json_({ ok: true, planId: id, planLink: planLink, row: where });
  } finally {
    lock.releaseLock();
  }
}

function rowFrom_(d, id, planLink) {
  const plan = d.plan || {};
  const row = {
    'Submitted': d.submittedAt ? new Date(d.submittedAt) : new Date(),
    'Reference': id,
    'Name': text_(d.name),
    'Email': text_(d.email),
    'Plan link': planLink,
    'Focus areas': list_(plan.focus),
    'Recommended practices': list_(plan.recommended),
    'Other practices': list_(plan.extras),
    'Own practice': text_(plan.own),
    'Opening words': text_(d.opening),
    'Version': text_(d.version),
    'Source': text_(d.source)
  };
  // one column per question: "Section · Question"
  (Array.isArray(d.answers) ? d.answers : []).forEach(function (a) {
    if (!a || !a.question) return;
    const key = (a.section ? a.section + ' · ' : '') + a.question;
    row[key] = text_(a.answer) + (a.how && a.how !== 'Tapped' ? ' (' + a.how.toLowerCase() + ')' : '');
  });
  return row;
}

// Adds missing headers, then updates the row with the same reference or appends a new one.
function upsert_(sh, row) {
  const keys = Object.keys(row);
  let headers = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String) : [];
  const missing = keys.filter(function (k) { return headers.indexOf(k) < 0; });
  if (missing.length) {
    sh.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
    headers = headers.concat(missing);
  }
  const values = headers.map(function (h) { return row.hasOwnProperty(h) ? row[h] : ''; });

  const refCol = headers.indexOf('Reference') + 1;
  const last = sh.getLastRow();
  if (refCol && last >= 2) {
    const refs = sh.getRange(2, refCol, last - 1, 1).getValues();
    for (let i = refs.length - 1; i >= 0; i--) {
      if (String(refs[i][0]) === String(row['Reference'])) {
        sh.getRange(i + 2, 1, 1, headers.length).setValues([values]);
        return i + 2;
      }
    }
  }
  sh.appendRow(values);
  const r = sh.getLastRow();
  const linkCol = headers.indexOf('Plan link') + 1;
  if (linkCol && row['Plan link']) {
    sh.getRange(r, linkCol).setFormula('=HYPERLINK("' + row['Plan link'] + '","Open plan")');
  }
  return r;
}

// ---------- serving a plan ----------

function doGet(e) {
  const id = cleanId_(e && e.parameter && e.parameter.plan);
  if (!id) return json_({ ok: true, service: 'goodspan-completions' });
  const files = folder_().getFilesByName(id + '.html');
  if (!files.hasNext()) {
    return HtmlService.createHtmlOutput('<p style="font-family:sans-serif;padding:24px">This plan could not be found.</p>').setTitle('The Good Span');
  }
  return HtmlService.createHtmlOutput(files.next().getBlob().getDataAsString('UTF-8'))
    .setTitle('Your Good Span')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function savePlan_(id, html) {
  const f = folder_();
  const old = f.getFilesByName(id + '.html');
  while (old.hasNext()) old.next().setTrashed(true);
  f.createFile(id + '.html', html, MimeType.HTML);
}

// ---------- helpers ----------

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.SHEET_NAME);
    sh.getRange(1, 1, 1, FIXED_COLUMNS.length).setValues([FIXED_COLUMNS]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.setFrozenColumns(3);
  }
  return sh;
}

function folder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('PLAN_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (err) { /* deleted: make a new one */ } }
  const f = DriveApp.createFolder(CONFIG.FOLDER_NAME);
  props.setProperty('PLAN_FOLDER_ID', f.getId());
  return f;
}

function cleanId_(s) { return String(s || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64); }
function text_(v) { return v == null ? '' : String(v).slice(0, 5000); }
function list_(v) { return Array.isArray(v) ? v.join(', ') : text_(v); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
