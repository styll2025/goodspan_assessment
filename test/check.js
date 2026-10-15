// node test/check.js  → runs the generator on 100 test profiles and checks the plan rules hold
const fs = require('fs'); const { ROOT, env, buildResult } = require('../scripts/lib.js');
const people = JSON.parse(fs.readFileSync(ROOT + '/test/personas.json', 'utf8'));
const fails = [];
for (const x of people) {
  let r; try { r = buildResult(x.name, x.A, env); } catch (e) { fails.push(`${x.name}: crashed (${e.message})`); continue; }
  const steps = [...r.steps.m2, ...r.steps.m3], total = r.mins + r.practices.filter(y => !y.rec && !y.over).reduce((t, y) => t + (y.min || 0), 0) + steps.reduce((t, y) => t + (y.min || 0), 0);
  if (!r.practices.length) fails.push(`${x.name}: no first practice`);
  if (r.practices.length > 4) fails.push(`${x.name}: more than four practices in month 1`);
  if (r.practices.filter(y => y.rec).length !== 2) fails.push(`${x.name}: ${r.practices.filter(y => y.rec).length} recommended practices, not 2`);
  if (r.focus.length !== 2) fails.push(`${x.name}: ${r.focus.length} focus pillars, not 2`);
  if (total > r.lower) fails.push(`${x.name}: months 1–3 take ${total} min, over the ${r.lower} they have`);
  if (r.safety && [...r.practices, ...steps, ...r.steps.later].some(y => y.area === 'Movement')) fails.push(`${x.name}: Movement suggested before a doctor has checked a symptom`);
  if (/undefined|NaN/.test(JSON.stringify([r.intro1, r.spc, r.foc, r.prc, r.practices]))) fails.push(`${x.name}: missing text`);
}
console.log(`${people.length} profiles, ${fails.length} problems`); fails.forEach(f => console.log('  ' + f));
process.exit(fails.length ? 1 : 0);
