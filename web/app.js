const PILLARS = ["eat", "sleep", "move", "mind", "connect"];
const EAT_PATTERN = ["eat_vegetables_fruit", "eat_protein_meals", "eat_home_cooked", "eat_frequency"];
const CHIPS = {
  eat: { bg: "#CB863A", fg: "#000000" },
  sleep: { bg: "#D1E6E9", fg: "#4D2831" },
  move: { bg: "#FE600C", fg: "#000000" },
  mind: { bg: "#F5A4C2", fg: "#4D2831" },
  connect: { bg: "#4D2831", fg: "#FFF2EA" },
};
const CHANGE = { new: "New", level_up: "Level up", continue: "Continue", easier: "Easier" };
const KEY = "goodspan_session_v7";

const $ = (sel, el = document) => el.querySelector(sel);
const app = $("#app");
let ASSESS = null;
let META = null;
let QBY = {};
let SEC = {};
let state = loadSession();
let screenIndex = 0;
let progressCap = null;

function loadSession() {
  try { return JSON.parse(localStorage.getItem(KEY)) || blank(); }
  catch { return blank(); }
}
function blank() {
  return {
    memberName: "",
    email: "",
    mobile: "",
    answers: {},
    freeText: {},
    plan: null,
    pilot: { conditions: [], released: [] },
    outcomes: [],
    checkinDraft: {},
    locked: false,
    notifyPilot: false,
  };
}
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function route() {
  const hash = (location.hash || "#/").replace(/^#/, "") || "/";
  return hash.startsWith("/") ? hash : "/" + hash;
}

function weeklyActivityMinutes(a) {
  const days = parseInt(a.activity_days || "0", 10) || 0;
  if (!days) return 0;
  const m = a.activity_minutes || "10";
  return days * (m === "150_or_more" ? 150 : parseInt(m, 10) || 0);
}

function evaluate(expr, a, ctx = {}) {
  if (!expr) return false;
  if (expr.all) return expr.all.every(e => evaluate(e, a, ctx));
  if (expr.any) return expr.any.some(e => evaluate(e, a, ctx));
  if (expr.not) return !evaluate(expr.not, a, ctx);
  if (expr.always) return true;
  if (expr.condition) return (ctx.conditions || []).includes(expr.condition);
  if (expr.plan_includes_any) return expr.plan_includes_any.some(x => (ctx.plan_families || []).includes(x));
  if (expr.plan) return !!ctx[expr.plan];
  if (expr.computed) {
    const val = weeklyActivityMinutes(a);
    if ("lt" in expr) return val < expr.lt;
    if ("gte" in expr) return val >= expr.gte;
  }
  if (expr.q) {
    let v = a[expr.q];
    if (expr.row) v = (v || {})[expr.row];
    if ("is" in expr) return v === expr.is;
    if ("in" in expr) return expr.in.includes(v);
    if ("not_in" in expr) return v != null && !expr.not_in.includes(v);
    if ("has" in expr) return (v || []).includes(expr.has);
    if ("has_any" in expr) return expr.has_any.some(x => (v || []).includes(x));
  }
  return false;
}

function isShown(q, a) {
  return questionVisible(q, a, false);
}

function unanswered(v) {
  return v == null || v === "" || (Array.isArray(v) && !v.length);
}

function mayStillShow(q, a) {
  return questionVisible(q, a, true);
}

function questionVisible(q, a, includePossible) {
  const s = q.show_if;
  if (!s) return true;
  if (s.depth_question_for) {
    const focus = a.focus || [];
    const pillar = s.depth_question_for.toLowerCase();
    if (focus.includes("im_not_sure_yet") || focus.includes(pillar)) return true;
    if (!includePossible) return false;
    if (!focus.length) return true;
    const maxSelect = (QBY.focus && QBY.focus.max_select) || 2;
    return focus.length < maxSelect;
  }
  if (includePossible && s.q && unanswered(s.row ? (a[s.q] || {})[s.row] : a[s.q])) return true;
  return evaluate(s, a);
}

function screensFor(visible) {
  const skip = new Set();
  const out = [];
  for (const q of ASSESS.questions) {
    if (skip.has(q.id) || !visible(q, state.answers)) continue;
    if (q.id === "eat_vegetables_fruit") {
      const group = EAT_PATTERN.map(id => QBY[id]).filter(Boolean);
      out.push({ kind: "eat_pattern", id: "eat_pattern", questions: group, section: "eat" });
      group.forEach(g => skip.add(g.id));
    } else {
      out.push({ kind: "question", id: q.id, question: q, section: q.section });
    }
  }
  return out;
}

function screens() {
  return screensFor(isShown);
}

function progressTotal() {
  return screensFor(mayStillShow).length;
}

function displayProgressTotal(listLen) {
  const n = Math.max(listLen, progressTotal());
  if (progressCap == null) progressCap = n;
  else progressCap = Math.min(progressCap, n);
  return Math.max(progressCap, listLen);
}

function answered(screen) {
  if (screen.kind === "eat_pattern") return screen.questions.every(q => answeredQuestion(q));
  return answeredQuestion(screen.question);
}

function answeredQuestion(q) {
  const v = state.answers[q.id];
  if (q.type === "single") return typeof v === "string" && v.length > 0;
  if (q.type === "multi") {
    if (!Array.isArray(v) || !v.length) return false;
    const need = (q.free_text_options || []).some(id => v.includes(id));
    return !need || !!(state.freeText[q.id] || "").trim();
  }
  if (q.type === "grid_single") {
    const rows = q.rows || [];
    return rows.every(r => v && v[r.id]);
  }
  return false;
}

function pickSingle(qid, value) {
  state.answers[qid] = value;
  save();
  render();
}

function pickMulti(q, value) {
  const exclusive = new Set(q.exclusive_options || []);
  let sel = Array.isArray(state.answers[q.id]) ? state.answers[q.id].slice() : [];
  if (sel.includes(value)) {
    sel = sel.filter(x => x !== value);
  } else if (exclusive.has(value)) {
    sel = [value];
  } else {
    sel = sel.filter(x => !exclusive.has(x));
    if (q.max_select && sel.length >= q.max_select) return;
    sel.push(value);
  }
  state.answers[q.id] = sel;
  save();
  render();
}

function pickGrid(qid, row, col) {
  const cur = Object.assign({}, state.answers[qid] || {});
  cur[row] = col;
  state.answers[qid] = cur;
  save();
  render();
}

function optionButtons(q) {
  const v = state.answers[q.id];
  const sel = q.type === "multi" ? (Array.isArray(v) ? v : []) : [];
  return (q.options || []).map(o => {
    const on = q.type === "multi" ? sel.includes(o.id) : v === o.id;
    return `<button type="button" class="opt ${q.type === "multi" ? "multi" : ""} ${on ? "on" : ""}" data-act="opt" data-q="${esc(q.id)}" data-v="${esc(o.id)}">
      <span class="mark">${on ? "✓" : ""}</span><span>${esc(o.label)}</span>
    </button>`;
  }).join("");
}

function freeTextBox(q) {
  const v = state.answers[q.id];
  const selected = q.type === "multi" ? (v || []) : (v ? [v] : []);
  const need = (q.free_text_options || []).some(id => selected.includes(id));
  if (!need) return "";
  return `<div class="field"><label>Please tell us a little more</label>
    <textarea data-act="freetext" data-q="${esc(q.id)}" rows="3">${esc(state.freeText[q.id] || "")}</textarea></div>`;
}

function renderGrid(q) {
  const v = state.answers[q.id] || {};
  const head = `<tr><th></th>${q.columns.map(c => `<th>${esc(c.label)}</th>`).join("")}</tr>`;
  const rows = q.rows.map(r => `<tr>
    <td class="row-lab">${esc(r.label)}</td>
    ${q.columns.map(c => `<td class="cell"><input type="radio" name="${esc(q.id + "_" + r.id)}" ${v[r.id] === c.id ? "checked" : ""} data-act="grid" data-q="${esc(q.id)}" data-row="${esc(r.id)}" data-col="${esc(c.id)}"></td>`).join("")}
  </tr>`).join("");
  return `<div class="grid-wrap"><table class="grid">${head}${rows}</table></div>`;
}

function renderQuestion(q) {
  if (q.type === "grid_single") return renderGrid(q);
  return `<div class="options">${optionButtons(q)}</div>${freeTextBox(q)}`;
}

function renderWelcome() {
  app.innerHTML = `
    <section>
      <h1>Find Your Longevity Map</h1>
      <p class="lede">This assessment helps us understand where you are today across five pillars of longevity: Eat, Sleep, Move, Mind and Connect. There are no right or wrong answers.</p>
      <p class="lede">The aim is to understand what is already working, where you'd like to make changes, and which practices are likely to fit your life. Estimated time: about 15 minutes.</p>
      <p class="lede">We ask about all five areas, because your plan will touch on each of them, with extra depth in the one or two areas you choose to focus on. The Good Span asks you to set aside about 45-60 minutes a week for your practices.</p>
      <div class="card">
        <div class="field">
          <label>What should we call you?</label>
          <input type="text" id="name" value="${esc(state.memberName)}" placeholder="Your first name" autocomplete="given-name">
        </div>
        <div class="field">
          <label>Email</label>
          <input type="email" id="email" value="${esc(state.email)}" placeholder="you@example.com" autocomplete="email" inputmode="email">
        </div>
        <div class="field">
          <label>Mobile</label>
          <input type="tel" id="mobile" value="${esc(state.mobile)}" placeholder="Your mobile number" autocomplete="tel" inputmode="tel">
        </div>
        <div class="actions" style="justify-content:flex-end">
          <button class="btn btn-primary" type="button" data-act="start">Start the assessment</button>
        </div>
      </div>
    </section>`;
}

function renderAssess() {
  const list = screens();
  if (!list.length) { renderWelcome(); return; }
  screenIndex = Math.min(screenIndex, list.length - 1);
  const screen = list[screenIndex];
  const section = SEC[screen.section] || {};
  let body = "";
  let title = "";
  let help = "";
  if (screen.kind === "eat_pattern") {
    title = "How does your eating pattern typically look?";
    help = "Tell us about a typical week. There are no right answers.";
    body = screen.questions.map(q => {
      if (q.type === "grid_single") {
        return `<div class="mini-q">${esc(q.text)}</div>${renderGrid(q)}`;
      }
      return `<div class="mini-q">${esc(q.text)}</div><div class="options">${optionButtons(q)}</div>`;
    }).join('<div style="height:18px"></div>');
  } else {
    const q = screen.question;
    title = q.text;
    help = q.help && !q.help.startsWith("Part of") ? q.help : "";
    body = renderQuestion(q);
  }
  const last = screenIndex === list.length - 1;
  const total = displayProgressTotal(list.length);
  const pct = Math.round((screenIndex / Math.max(1, total - 1)) * 100);
  app.innerHTML = `
    <section>
      <div class="progress"><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <span class="ui">${screenIndex + 1} of ${total}</span></div>
      <div class="ui">${esc(section.title || "")}</div>
      <h1 style="font-size:clamp(26px,5vw,34px)">${esc(title)}</h1>
      ${help ? `<p class="help">${esc(help)}</p>` : ""}
      <div class="card">${body}
        <div class="error" id="q-error"></div>
        <div class="actions">
          <button class="btn btn-ghost" type="button" data-act="back">${screenIndex === 0 ? "← Home" : "← Back"}</button>
          <button class="btn btn-primary" type="button" data-act="next">${last ? "See my plan" : "Continue"}</button>
        </div>
      </div>
    </section>`;
}

function bars(level) {
  const n = { gentle: 1, moderate: 2, deep: 3 }[level] || 1;
  return [8, 12, 16].map((h, i) => `<span class="bar" style="height:${h}px;background:${i < n ? "#4D2831" : "#E5CFC4"}"></span>`).join("");
}

function practiceRow(x) {
  const chip = CHIPS[x.pillar] || CHIPS.eat;
  const role = x.role === "focus" ? "Focus" : "Light touch";
  return `<div class="row">
    <div class="c1"><span class="chip ui" style="background:${chip.bg};color:${chip.fg}">${esc(x.pillar)}</span><span class="ui">${role}</span></div>
    <div><div class="ptitle">${esc(x.headline)}</div><div class="small">${esc(x.how_to || "")}</div></div>
    <div class="c3"><div class="lvl">${bars(x.level)}<span>${esc(x.level)}</span></div>
      <span class="small">${x.minutes_per_week} min a week</span>
      <span class="tag ui tag-${esc(x.change)}">${CHANGE[x.change] || x.change}</span></div>
  </div>`;
}

function renderPlan() {
  const p = state.plan;
  if (!p) {
    app.innerHTML = `<section><h1>No plan yet</h1><p>Complete the assessment to build your first draft.</p>
      <a class="btn btn-primary" href="#/">Start</a></section>`;
    return;
  }
  const name = state.memberName || "There";
  const focus = p.focus_pillars.map(x => x[0].toUpperCase() + x.slice(1)).join(" · ");
  const also = PILLARS.filter(x => !p.focus_pillars.includes(x)).map(x => x[0].toUpperCase() + x.slice(1)).join(" · ");
  const months = (p.months || []).map(m => `
    <div class="month"><div class="mhead"><span class="mtitle">Month ${m.month}</span></div>
    ${m.practices.map(practiceRow).join("")}</div>`).join("");
  const themes = (p.themes_months_4_6 || []).map(t => {
    const chip = CHIPS[t.pillar] || CHIPS.eat;
    const label = t.pillar[0].toUpperCase() + t.pillar.slice(1) + (p.focus_pillars.includes(t.pillar) ? " · focus" : "");
    return `<div class="theme" style="background:${chip.bg};color:${chip.fg}"><span class="ui">${esc(label)}</span><div class="ttitle">${esc(t.name)}</div></div>`;
  }).join("");
  const hyg = (p.hygiene_priority || []).map(h => `<li><span class="box"></span>${esc(h.text)}</li>`).join("") || "<li>No foundations to add right now.</li>";
  const refs = (p.references || []).map(r => {
    const linked = esc(r).replace(/(https:\/\/doi\.org\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    return `<li>${linked}</li>`;
  }).join("");
  const steps = [
    ["✓", "Done", "Assessment complete", "Your answers built this first draft of your plan.", false],
    ["1", "Before you start", "Pre-Span 1:1 check-in", "Review your plan together and agree your first month.", true],
    ["2", "Months 1–3", "Your practices", "Six practices a month, with a quick progress update at the end of each month.", false],
    ["3", "End of month 3", "Mid-Span check-in", "A short re-assessment and a 1:1 to see your progress and choose practices for months 4–6.", true],
    ["4", "Months 4–6", "Your themes", "Practices within the four themes you agreed at mid-Span.", false],
    ["5", "End of month 6", "End-of-Span check-in", "Look back on what changed and plan what comes next.", true],
  ].map(([n, w, t, x, pil]) => `<li class="step"><span class="dot${n === "✓" ? " done" : ""}">${n}</span><div>
    <div class="srow"><span class="stitle">${t}</span><span class="ui">${w}</span>${pil ? '<span class="pilot ui">With your Pilot</span>' : ""}</div><div>${x}</div></div></li>`).join("");

  app.innerHTML = `
    <section>
      <h1>${esc(name)}, here is your plan for the next six months</h1>
      <div class="summary">
        <div><div class="ui">Focus</div>${esc(focus)}</div>
        <div><div class="ui">Also included</div>${esc(also)}</div>
      </div>
      <p class="note"><b style="font-weight:400">Your plan is ready for review.</b> Your Pilot will review it with you in a 1:1 and finalise it together with you before you start.</p>
    </section>
    <section>
      <h2>Your Span at a glance</h2>
      <ol style="list-style:none;margin:0;padding:0">${steps}</ol>
      <div class="pilotbox"><b style="font-weight:400;font-size:18px">Your Pilot is here when you need them.</b><br>
        You can reach out to your Pilot anytime between check-ins if you have a question, need some guidance, or want to talk through how things are going. <a href="mailto:pilot@thegoodspan.com">pilot@thegoodspan.com</a></div>
    </section>
    <section>
      <div class="ui">Months 1–3</div>
      <h2>Your practices</h2>
      ${months}
    </section>
    <section class="card">
      <h2 style="font-size:26px">How your plan evolves each month</h2>
      <p>Each month, you'll check in with your Pilot to review your progress and adjust your plan together. Keep what's working, adapt what isn't, and swap anything that doesn't feel right for you.</p>
    </section>
    <section>
      <div class="ui">Months 4–6</div>
      <h2>Your themes</h2>
      <p>Practices within each theme are chosen with your Pilot at your mid-Span check-in.</p>
      <div class="themes">${themes}</div>
    </section>
    <section class="card">
      <div class="ui">Alongside your plan</div>
      <h2>Your foundations</h2>
      <p>Simple everyday habits that support everything else. They aren't part of your six practices: tick them off when they're in place.</p>
      <ul class="checks">${hyg}</ul>
    </section>
    <section>
      <div class="ui">References</div>
      <h2>The science behind your plan</h2>
      <p>Every practice in your plan is based on published research. These are the main sources for the practices and foundations above.</p>
      <ol class="refs">${refs}</ol>
    </section>
    <div class="actions no-print">
      ${state.planLink ? `<a class="btn btn-secondary" href="${esc(state.planLink)}" target="_blank" rel="noopener">Open saved copy</a>` : ""}
      <button class="btn btn-secondary" type="button" onclick="window.print()">Print / save PDF</button>
    </div>
    <footer class="disc">Your Good Span plan is designed to support everyday wellbeing and healthy habits. It’s not a substitute for personalised medical care.</footer>`;
}

function labelFor(qid, value) {
  const q = QBY[qid];
  if (!q) return String(value);
  if (q.type === "grid_single") {
    return Object.entries(value || {}).map(([r, c]) => {
      const row = (q.rows || []).find(x => x.id === r);
      const col = (q.columns || []).find(x => x.id === c);
      return `${row ? row.label : r}: ${col ? col.label : c}`;
    }).join("; ");
  }
  const ids = Array.isArray(value) ? value : [value];
  return ids.map(id => {
    const o = (q.options || []).find(x => x.id === id);
    return o ? o.label : id;
  }).join(", ");
}

function renderPilot() {
  const p = state.plan;
  if (!p) {
    app.innerHTML = `<section><h1>Pilot view</h1><p>No member plan loaded.</p><a class="btn btn-primary" href="#/">Start</a></section>`;
    return;
  }
  const flags = (p.pilot_flags || []).map(f => `<li><b>${esc(f.id)}</b> — ${esc(f.message)}</li>`).join("") || "<li>None</li>";
  const conds = new Set(state.pilot.conditions || []);
  const released = new Set(state.pilot.released || []);
  const condRows = (META.pilot_conditions || []).map(c =>
    `<label class="checkrow"><input type="checkbox" data-act="pcond" data-v="${esc(c.id)}" ${conds.has(c.id) ? "checked" : ""}><span>${esc(c.label)}</span></label>`).join("");
  const holdRows = (META.pilot_holds || []).map(id =>
    `<label class="checkrow"><input type="checkbox" data-act="prelease" data-v="${esc(id)}" ${released.has(id) ? "checked" : ""}><span>${esc(id)}</span></label>`).join("");
  const answers = Object.keys(state.answers).map(qid => {
    const q = QBY[qid];
    return `<dt>${esc(q ? q.text : qid)}</dt><dd>${esc(labelFor(qid, state.answers[qid]))}${state.freeText[qid] ? " — " + esc(state.freeText[qid]) : ""}</dd>`;
  }).join("");
  app.innerHTML = `
    <section>
      <div class="ui">Pilot</div>
      <h1>${esc(state.memberName || "Member")} — review</h1>
      <p class="lede">Set interview conditions, release held practices, then regenerate and lock the plan. Support messages stay here — they are never shown to the member.</p>
      <div class="flags"><div class="ui">Pilot flags</div><ul>${flags}</ul>
        <div class="ui">Engine conditions</div><p>${esc((p.conditions || []).join(", ") || "None")}</p></div>
      <div class="card">
        <div class="ui">Pilot conditions</div>
        ${condRows}
        <div class="ui" style="margin-top:16px">Release held practices</div>
        ${holdRows || "<p>No holds configured.</p>"}
        <div class="actions">
          <button class="btn btn-secondary" type="button" data-act="rebuild">Regenerate plan</button>
          <button class="btn btn-primary" type="button" data-act="lock">${state.locked ? "Unlock" : "Lock plan"}</button>
        </div>
        <div class="error" id="pilot-error"></div>
      </div>
      <div class="card" style="margin-top:18px">
        <div class="ui">Member answers</div>
        <dl class="answer-list">${answers}</dl>
      </div>
      <div class="actions"><a class="btn btn-ghost" href="#/plan">← Back to plan</a><a class="btn btn-secondary" href="#/checkin">Monthly check-in</a></div>
    </section>`;
}

function renderCheckin() {
  const p = state.plan;
  if (!p) {
    app.innerHTML = `<section><h1>Monthly check-in</h1><p>No plan to update yet.</p></section>`;
    return;
  }
  const monthNum = Math.min(state.outcomes.length + 1, 2);
  const month = p.months.find(m => m.month === monthNum) || p.months[0];
  const focus = month.practices.filter(x => x.role === "focus");
  const current = state.checkinDraft[monthNum] || state.outcomes[monthNum - 1] || {};
  const rows = focus.map(x => {
    const val = current[x.family_id] || "";
    const opts = [["done", "Done"], ["partly", "Partly"], ["not_yet", "Not yet"], ["not_for_me", "Not for me"]];
    return `<div class="card" style="margin-bottom:12px">
      <div class="ui">${esc(x.pillar)} · ${esc(x.level)}</div>
      <div class="ptitle">${esc(x.headline)}</div>
      <div class="outcome">${opts.map(([id, lab]) =>
        `<label class="${val === id ? "on" : ""}"><input type="radio" name="${esc(x.family_id)}" data-act="outcome" data-f="${esc(x.family_id)}" data-v="${id}" ${val === id ? "checked" : ""}> ${lab}</label>`).join("")}</div>
    </div>`;
  }).join("");
  app.innerHTML = `
    <section>
      <div class="ui">End of month ${monthNum}</div>
      <h1>How did this month go?</h1>
      <p class="lede">Mark each focus practice. Two or more “not yet” or “not for me” will notify your Pilot.</p>
      ${state.notifyPilot ? `<p class="note"><b style="font-weight:400">Pilot notified.</b> Two or more practices were marked not yet or not for me.</p>` : ""}
      ${rows}
      <div class="actions">
        <a class="btn btn-ghost" href="#/plan">← Plan</a>
        <button class="btn btn-primary" type="button" data-act="submit-checkin">Update next month</button>
      </div>
      <div class="error" id="checkin-error"></div>
      <p class="help">Mid-Span (end of month 3) and the end-of-Span summary are placeholders in this prototype: your Pilot will choose practices within the four themes.</p>
    </section>`;
}

function render() {
  const r = route();
  if (r === "/assess") return renderAssess();
  if (r === "/plan") return renderPlan();
  if (r === "/pilot") return renderPilot();
  if (r === "/checkin") return renderCheckin();
  return renderWelcome();
}

const SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzpXkKREskdbihrlUqHZNde2WYYoZQLgzONj0RDXQzH-qLuB3FLzIF7p4MUV9iVk8kfrg/exec";

function submissionPayload(source) {
  const row = {
    submittedAt: new Date().toISOString(),
    memberName: state.memberName || "",
    email: state.email || "",
    mobile: state.mobile || "",
    source: source || "assessment",
  };
  for (const q of ASSESS.questions) {
    if (!(q.id in state.answers)) continue;
    row[q.id] = labelFor(q.id, state.answers[q.id]);
    if (state.freeText[q.id]) row[q.id + "Other"] = state.freeText[q.id];
  }
  if (state.plan) {
    row.focusPillars = (state.plan.focus_pillars || []).join(", ");
    row.weeklyBudgetMinutes = state.plan.weekly_budget_minutes;
    row.topGoals = Object.entries(state.plan.top_goals || {}).map(([p, g]) => p + ": " + g).join("; ");
  }
  if (state.planLink) row.planLink = state.planLink;
  return row;
}

async function sendToSheet(source) {
  if (!SHEET_WEBHOOK_URL) return;
  try {
    await fetch(SHEET_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(submissionPayload(source)),
    });
  } catch (e) {
    console.error("Could not reach the Google Sheet", e);
  }
}

function showBuilding(on) {
  let el = document.querySelector(".building");
  if (on) {
    if (!el) {
      el = document.createElement("div");
      el.className = "building";
      el.innerHTML = '<p class="ui">Building your plan</p><p>This can take a moment the first time.</p>';
      document.body.appendChild(el);
    }
    el.hidden = false;
  } else if (el) {
    el.hidden = true;
  }
}

async function buildPlan(extra = {}) {
  showBuilding(true);
  try {
    const data = await GoodSpanEngine.buildPlan({
      answers: state.answers,
      memberName: state.memberName || "",
      saveCopy: !!extra.saveCopy,
      outcomes: extra.outcomes !== undefined ? extra.outcomes : (state.outcomes.length ? state.outcomes : null),
      pilot: extra.pilot !== undefined ? extra.pilot : (state.pilot.conditions.length || state.pilot.released.length ? state.pilot : null),
    });
    state.plan = data.plan;
    if (data.planId) {
      state.planId = data.planId;
      state.planLink = data.planLink || new URL("plans/" + data.planId + ".html", document.baseURI).href;
    }
    save();
    return data.plan;
  } finally {
    showBuilding(false);
  }
}

function onClick(e) {
  const t = e.target.closest("[data-act]");
  if (!t) return;
  const act = t.dataset.act;
  if (act === "start") {
    const memberName = ($("#name") && $("#name").value || "").trim();
    const email = ($("#email") && $("#email").value || "").trim();
    const mobile = ($("#mobile") && $("#mobile").value || "").trim();
    state = blank();
    state.memberName = memberName;
    state.email = email;
    state.mobile = mobile;
    screenIndex = 0;
    progressCap = null;
    save();
    location.hash = "#/assess";
    if (route() === "/assess") render();
    return;
  }
  if (act === "opt") {
    const q = QBY[t.dataset.q];
    if (q.type === "multi") pickMulti(q, t.dataset.v);
    else pickSingle(q.id, t.dataset.v);
    return;
  }
  if (act === "grid") { pickGrid(t.dataset.q, t.dataset.row, t.dataset.col); return; }
  if (act === "back") {
    if (screenIndex === 0) { location.hash = "#/"; return; }
    screenIndex -= 1;
    render();
    window.scrollTo(0, 0);
    return;
  }
  if (act === "next") {
    const list = screens();
    const screen = list[screenIndex];
    if (!answered(screen)) {
      $("#q-error").textContent = "Please answer to continue.";
      return;
    }
    if (screenIndex >= list.length - 1) {
      buildPlan({ outcomes: null, saveCopy: true }).then(() => sendToSheet("assessment")).then(() => { location.hash = "#/plan"; })
        .catch(err => { $("#q-error").textContent = err.message; });
      return;
    }
    screenIndex += 1;
    render();
    window.scrollTo(0, 0);
    return;
  }
  if (act === "pcond") {
    const set = new Set(state.pilot.conditions);
    if (t.checked) set.add(t.dataset.v); else set.delete(t.dataset.v);
    state.pilot.conditions = [...set];
    save();
    return;
  }
  if (act === "prelease") {
    const set = new Set(state.pilot.released);
    if (t.checked) set.add(t.dataset.v); else set.delete(t.dataset.v);
    state.pilot.released = [...set];
    save();
    return;
  }
  if (act === "rebuild") {
    buildPlan().then(() => render()).catch(err => { $("#pilot-error").textContent = err.message; });
    return;
  }
  if (act === "lock") {
    state.locked = !state.locked;
    save();
    render();
    return;
  }
  if (act === "outcome") {
    const monthNum = Math.min(state.outcomes.length + 1, 2);
    const cur = Object.assign({}, state.checkinDraft[monthNum] || {});
    cur[t.dataset.f] = t.dataset.v;
    state.checkinDraft[monthNum] = cur;
    save();
    render();
    return;
  }
  if (act === "submit-checkin") {
    const monthNum = Math.min(state.outcomes.length + 1, 2);
    const cur = state.checkinDraft[monthNum] || {};
    const p = state.plan;
    const month = p.months.find(m => m.month === monthNum) || p.months[0];
    const focus = month.practices.filter(x => x.role === "focus");
    if (focus.some(x => !cur[x.family_id])) {
      $("#checkin-error").textContent = "Please mark every focus practice.";
      return;
    }
    const tough = focus.filter(x => cur[x.family_id] === "not_yet" || cur[x.family_id] === "not_for_me").length;
    state.notifyPilot = tough >= 2;
    state.outcomes[monthNum - 1] = cur;
    const outcomes = state.outcomes.slice(0, monthNum);
    buildPlan({ outcomes }).then(() => { location.hash = "#/plan"; })
      .catch(err => { $("#checkin-error").textContent = err.message; });
  }
}

function onInput(e) {
  const t = e.target;
  if (t.dataset.act === "freetext") {
    state.freeText[t.dataset.q] = t.value;
    save();
  }
}

async function init() {
  const [assess, meta] = await Promise.all([
    GoodSpanEngine.loadAssessment(),
    GoodSpanEngine.loadMeta(),
  ]);
  ASSESS = assess;
  META = meta;
  QBY = Object.fromEntries(assess.questions.map(q => [q.id, q]));
  SEC = Object.fromEntries(assess.sections.map(s => [s.id, s]));
  document.addEventListener("click", onClick);
  document.addEventListener("change", onClick);
  document.addEventListener("input", onInput);
  window.addEventListener("hashchange", render);
  render();
  GoodSpanEngine.preload();
}

init().catch(err => { app.innerHTML = `<p class="error">${esc(err.message)}</p>`; });
