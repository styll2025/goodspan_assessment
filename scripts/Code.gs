/**
 * The Good Span — assessment responses → Google Sheet
 *
 * Setup
 * 1. Open the Google Sheet that should collect responses.
 * 2. Extensions → Apps Script, paste this file, Save.
 * 3. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web app URL into web/app.js (SHEET_WEBHOOK_URL).
 * 5. If you edit this script later, Deploy → Manage deployments → Edit → New version.
 *
 * The first row becomes headers. New payload keys add new columns automatically.
 * Multi-selects and grids arrive as readable text (already labelled by the assessment).
 */
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const data = parseBody_(e);
  if (!data || typeof data !== "object") {
    return json_({ ok: false, error: "No JSON body" });
  }

  const incoming = flatten_(data);
  const keys = Object.keys(incoming);
  if (!keys.length) return json_({ ok: false, error: "Empty payload" });

  let headers = [];
  if (sheet.getLastColumn() > 0) {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    headers = headers.map(String);
  }
  if (!headers.length || headers.every(h => h === "")) {
    headers = keys;
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    const have = new Set(headers);
    const extra = keys.filter(k => !have.has(k));
    if (extra.length) {
      sheet.getRange(1, headers.length + 1, 1, extra.length).setValues([extra]);
      headers = headers.concat(extra);
    }
  }

  const row = headers.map(h => incoming.hasOwnProperty(h) ? incoming[h] : "");
  sheet.appendRow(row);
  return json_({ ok: true });
}

function doGet() {
  return json_({ ok: true, service: "goodspan-responses" });
}

function parseBody_(e) {
  const raw = (e && e.postData && e.postData.contents) || "";
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function flatten_(obj) {
  const out = {};
  Object.keys(obj).forEach(function (key) {
    const val = obj[key];
    if (val === null || val === undefined) {
      out[key] = "";
    } else if (Array.isArray(val)) {
      out[key] = val.map(function (item) {
        return typeof item === "object" ? JSON.stringify(item) : String(item);
      }).join(", ");
    } else if (typeof val === "object") {
      out[key] = JSON.stringify(val);
    } else if (typeof val === "boolean") {
      out[key] = val ? "Yes" : "No";
    } else {
      out[key] = val;
    }
  });
  return out;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
