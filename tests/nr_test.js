// Tests rule 13 ("Not right for me") for every practice of every simulated member and every reason.
const __path = require('path'); require('fs').mkdirSync(__path.join(__dirname, 'out'), { recursive: true }); process.chdir(__path.join(__dirname, 'out'));
const fs = require('fs');
const { makeEngine } = require('../core/engine.js');
const DATA = require('../core/data.json');
eval(fs.readFileSync(__path.join(__dirname, '../core/questions.js'), 'utf8') + ';global.toFeatures=toFeatures;');
const E = makeEngine(DATA);
const OV = [['Slow breathing', 'Slow breathing to wind down'], ['Building up cardio', 'Weekly cardio', 'Activity for better sleep'], ['Harder cardio and long intervals', 'Short intervals'], ['Strength sessions', 'Strength volume'], ['Alcohol intake', 'Alcohol-free swaps', 'Alcohol and sleep'], ['Walking with others', 'Group activity'], ['Daily eating window', 'Gap between eating and bed'], ['Shared meals', 'Meals with new people'], ['Quitting with full support', 'Trying again to quit'], ['Three good things', 'Expressing gratitude']];
const g = f => OV.findIndex(x => x.includes(f));
const R = ['time', 'routine', 'already', 'pillar', 'health', 'other'];
let issues = 0, n = 0; const tally = {}; const rows = [];
for (const { name, A } of require('./out/personas20.json')) {
  const p = toFeatures(A), P = E.plan(p), P2 = E.plan(p), m = P.months[0];
  m.forEach((y, i) => R.forEach(r => {
    const o = P.notRight(0, i, r), o2 = P2.notRight(0, i, r); n++;
    const k = r + ':' + o.action; tally[k] = (tally[k] || 0) + 1;
    const bad = [];
    if (JSON.stringify(o, (key, v) => key === 'why' ? undefined : v) !== JSON.stringify(o2, (key, v) => key === 'why' ? undefined : v)) bad.push('not deterministic');
    if ((i === m.findIndex(x => x.role === 'Priority') || ['Quitting with full support','Trying again to quit','Stopping vaping','Smoke-free home'].includes(y.fam)) && !['health', 'other'].includes(r) && !o.locked) bad.push('first priority not locked');
    const others = m.filter(z => z !== y), used = others.reduce((t, z) => t + P.extraMinutes(z.row), 0);
    for (const z of o.options || []) {
      if (used + P.extraMinutes(z.row) > P.budget) bad.push('over time: ' + z.fam);
      if (y.role === 'Lighter touch' && P.extraMinutes(z.row) > 15) bad.push('lighter touch too long');
      if (others.some(x => x.fam === z.fam)) bad.push('duplicate ' + z.fam);
      if (g(z.fam) >= 0 && others.some(x => g(x.fam) === g(z.fam))) bad.push('overlap ' + z.fam);
      if (z.fam === y.fam && z.row.l === y.row.l) bad.push('same practice offered');
      const ez = P.extraMinutes(z.row), ey = P.extraMinutes(y.row);
      if (r === 'time' && !(ez < ey || (ez <= ey && z.row.tg < y.row.tg))) bad.push('time option not lighter: ' + z.fam);
      if (r === 'routine' && z.fam === y.fam) bad.push('routine: same family');
      if (r === 'pillar' && z.area === y.area) bad.push('pillar: same pillar');
      if (z.row.ev === 'Explore' && y.role === 'Priority' && !(p.goals[z.area] || []).some(gk => (DATA.goals[z.area][gk] || []).includes(z.fam))) bad.push('Explore without goal: ' + z.fam);
      if ((P.conditions.includes('Exercise warning symptoms') || P.conditions.includes('Heart, metabolic or kidney condition and inactive')) && z.area === 'Movement' && z.row.l !== 'Learning') bad.push('safety cap broken');
    }
    if (bad.length) { issues += bad.length; console.log(name, y.fam, r, bad); }
    rows.push({ name, fam: y.fam, level: y.row.l, role: y.role, reason: r, action: o.action, options: (o.options || []).map(z => `${z.area} · ${z.fam} (${z.row.l}, +${Math.round(P.extraMinutes(z.row))})`) });
  }));
}
fs.writeFileSync('nr20.json', JSON.stringify(rows));
console.log('checks', n, 'issues', issues); console.log(tally);
