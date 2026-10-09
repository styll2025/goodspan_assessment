// Assessment audit: (1) does every question and option change the features or the plan? (2) are library exclusions producible?
const __path = require('path'); require('fs').mkdirSync(__path.join(__dirname, 'out'), { recursive: true }); process.chdir(__path.join(__dirname, 'out'));
// (3) fuzz 3,000 random members through the real assessment logic and the rule checks; (4) which families are ever used?
const fs = require('fs');
const C = require('./simcore.js');
const { BASE, AO, check, E, DATA, toFeatures, QUESTIONS } = C;
const clone = o => JSON.parse(JSON.stringify(o));
const sig = o => JSON.stringify([o.months.map(m => m.map(x => [x.fam, x.row.l, x.change, x.role])), o.themes, o.foundations.map(h => h.f), o.pilot, o.status, o.pri]);
const featSig = f => JSON.stringify(f);
// option generator per question
function optionsOf(q) {
  if (q.type === 'single') return q.options.map(o => o);
  if (q.type === 'multi') return q.options.map(o => [o]);
  if (q.type === 'habit') return q.options.map(o => ({ text: 'Read more books', choice: o })).concat([{ text: '', choice: '' }]);
  if (q.type === 'grid') { const out = []; for (const r of q.rows) { const cols = r[2] || q.cols; for (const c of cols) out.push({ row: r[0], val: c }); } return out; }
  return [];
}
const setAns = (A, q, v) => { if (q.type === 'grid') { A[q.id] = Object.assign({}, A[q.id] || {}, { [v.row]: v.val }); } else A[q.id] = v; };
// bases that make every question visible and relevant
const bases = {
  base: clone(BASE),
  allChosen: Object.assign(clone(BASE), { q1: [AO('Mind'), AO('Sleep')] }),
  inactiveSmokerDrinker: Object.assign(clone(BASE), { q1: [AO('Movement'), AO('Prevention')], q20: '1', q21: '20', q22: '0', q40: { tobacco: 'Daily', vape: 'Never' }, q41: 'Yes, in the next month', q43: '4 or more times a week' }),
  notSure: Object.assign(clone(BASE), { q1: ['I’m not sure yet'] }),
};
const report = [];
for (const q of QUESTIONS) {
  const res = { id: q.id, text: q.text, featureChange: false, planChange: false, options: [] };
  for (const v of optionsOf(q)) {
    let fch = false, pch = false;
    for (const [bn, B] of Object.entries(bases)) {
      if (q.show && !q.show(B)) continue;
      const A = clone(B); setAns(A, q, v);
      if (q.show && !q.show(A)) continue;
      const f0 = toFeatures(B), f1 = toFeatures(A);
      if (featSig(f0) !== featSig(f1)) fch = true;
      if (sig(E.plan(clone(f0))) !== sig(E.plan(clone(f1)))) pch = true;
    }
    res.options.push({ v: typeof v === 'string' ? v : JSON.stringify(v), fch, pch });
    res.featureChange ||= fch; res.planChange ||= pch;
  }
  report.push(res);
}
// exclusion tokens
const src = fs.readFileSync(__path.join(__dirname, '../core/engine.js'), 'utf8');
const conds = new Set([...src.matchAll(/c\.add\('((?:[^'\\]|\\.)*)'\)|c\.add\("([^"]*)"\)/g)].map(m => (m[1] || m[2]).replace(/\\'/g, "'")));
const tokens = {}; for (const r of DATA.lib) for (const t of r.x) (tokens[t] ||= []).push(r.f + ' (' + r.l + ')');
const deadTokens = Object.keys(tokens).filter(t => !conds.has(t));
// fuzz
let seed = 12345; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };   // mulberry32, fixed seed: repeatable
const pick = a => a[Math.floor(rnd() * a.length)];
function randomMember() {
  const A = {};
  for (const q of QUESTIONS) {
    if (q.show && !q.show(A)) continue;
    if (q.type === 'single') A[q.id] = pick(q.options);
    else if (q.type === 'multi') {
      const opts = q.options.filter(o => !/^(None of these|Nothing in particular|I’m not sure yet)$/.test(o));
      const none = q.options.find(o => /^(None of these|Nothing in particular|I’m not sure yet)$/.test(o));
      if (none && rnd() < 0.35) A[q.id] = [none];
      else { const n = 1 + Math.floor(rnd() * Math.min(q.max || 3, 3)); const s = new Set(); while (s.size < Math.min(n, opts.length)) s.add(pick(opts)); A[q.id] = [...s]; }
    } else if (q.type === 'grid') { A[q.id] = {}; for (const r of q.rows) A[q.id][r[0]] = pick(r[2] || q.cols); }
    else if (q.type === 'habit') A[q.id] = rnd() < 0.3 ? { text: 'Read more', choice: pick(q.options) } : { text: '', choice: '' };
  }
  return A;
}
const N = 3000, famUse = {}, issueCount = {}, ex = [], stats = { lt0: 0, pri3: 0, nd: 0, light: [0, 0, 0, 0], newMin: [], seen: [] , overBudget: 0, nr: 0, nrIssues: 0};
for (let i = 0; i < N; i++) {
  const A = randomMember(), f = toFeatures(A);
  const o = E.plan(clone(f)), o2 = E.plan(clone(f));
  if (sig(o) !== sig(o2)) stats.nd++;
  stats.seen.push(QUESTIONS.filter(q => !q.show || q.show(A)).length);
  for (const m of o.months) for (const x of m) famUse[x.area + '|' + x.fam] = (famUse[x.area + '|' + x.fam] || 0) + 1;
  const iss = check(f, o);
  for (const s of iss) { const k = s.replace(/: .*/, '').replace(/\d+/g, 'N'); issueCount[k] = (issueCount[k] || 0) + 1; if (ex.filter(e => e[2] === k).length < 4) ex.push([i, s, k, A]); }
  const pr = o.months[0].filter(x => x.role === 'Priority').length; if (pr === 3) stats.pri3++;
  stats.m1 = stats.m1 || {}; stats.m1[o.months[0].length] = (stats.m1[o.months[0].length]||0)+1; stats.th = stats.th || {}; stats.th[o.themes.length] = (stats.th[o.themes.length]||0)+1;
  stats.light[o.months[0].filter(x => x.role === 'Lighter touch').length]++;
  stats.newMin.push(o.minutes[0] / o.budget);
}
const allFams = [...new Set(DATA.lib.map(r => r.p + '|' + r.f))];
const unused = allFams.filter(k => !famUse[k]);
const out = { questions: report, deadTokens: deadTokens.map(t => [t, tokens[t]]), conds: [...conds], fuzz: { N, nondeterministic: stats.nd, issues: issueCount, examples: ex, pri3: stats.pri3, light: stats.light,
  seenAvg: stats.seen.reduce((a, b) => a + b) / N, seenMin: Math.min(...stats.seen), seenMax: Math.max(...stats.seen), useShareMedian: stats.newMin.sort((a, b) => a - b)[N >> 1] }, famUse, unused };
fs.writeFileSync('audit.json', JSON.stringify(out, null, 1));
console.log('Questions with no feature change:', report.filter(r => !r.featureChange).map(r => r.id));
console.log('Questions with no plan change:', report.filter(r => !r.planChange).map(r => r.id + ' ' + r.text.slice(0, 50)));
console.log('Options with no effect (feature or plan):'); for (const r of report) { const dead = r.options.filter(o => !o.fch && !o.pch).map(o => o.v.slice(0, 60)); if (dead.length) console.log('  ', r.id, dead.join(' || ')); }
console.log('Exclude-if values the assessment never produces:', deadTokens.map(t => t + ' [' + tokens[t].length + ']'));
console.log('Month-1 practice counts', stats.m1, 'theme counts', stats.th);
console.log('Fuzz', out.fuzz.N, 'nondet', stats.nd, 'issues', issueCount, 'pri3', stats.pri3, 'light dist', stats.light, 'seen', out.fuzz.seenAvg.toFixed(1), out.fuzz.seenMin, out.fuzz.seenMax);
console.log('Families never used in', N, 'random members:', unused.length, unused.join(', '));
