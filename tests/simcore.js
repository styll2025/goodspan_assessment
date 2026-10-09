// 20 new simulated members, answered through the real assessment, run through the prototype engine, checked against the rules.
const __path = require('path'); require('fs').mkdirSync(__path.join(__dirname, 'out'), { recursive: true }); process.chdir(__path.join(__dirname, 'out'));
const fs = require('fs');
const { makeEngine } = require('../core/engine.js');
const DATA = require('../core/data.json');
eval(fs.readFileSync(__path.join(__dirname, '../core/questions.js'), 'utf8') + ';global.QUESTIONS=QUESTIONS;global.toFeatures=toFeatures;global.AREA_OPTS=AREA_OPTS;global.SECTIONS=SECTIONS;');
const E = makeEngine(DATA);
const AO = n => AREA_OPTS.find(o => o.startsWith(n));
const BASE = { q2: '40-49', q3: 'Mostly regular daytime hours', q4: ['None of these'], q5: ['None of these'], q6: 'Neither',
  q7: { veg: '3-4 portions', protein: 'Two', cooked: '3–5', grains: '3–5 days a week', beans: '1–2 days a week', sugary: '1–2 days a week', processed: '1–2 days a week', nuts: '1–2 days a week', salt: '1–2 days a week' },
  q8: { screen: 'Sometimes', attention: 'Sometimes', slow: 'Sometimes', variety: 'Sometimes', out: 'Sometimes', window: 'Rarely' }, q9: ['Nothing in particular'], q11: ['Nothing in particular'],
  q12: '7-8', q13: ['None of these'], q14: 'No', q15: '12-3pm', q16: '2-3 hours',
  q17: { daylight: 'I do this now', dim: "I haven't tried it", regular: 'I do this now', alcohol: "I haven't tried it", winddown: "I haven't tried it", tasks: "I haven't tried it", cool: 'I do this now', dark: 'I do this now', quiet: 'I do this now', screens: "I haven't tried it", phone: "I haven't tried it", work: 'I do this now', naps: 'I do this now', pro: "I haven't tried it", share: "I haven't tried it" },
  q18: ['Nothing in particular'], q19: ['Nothing in particular'], q20: '3', q21: '40', q22: '2', q23: '6-8', q24: '8,000-9,999', q25: ['Warm up before exercise'], q26: ['Outdoors', 'At home'],
  q27: ['Nothing in particular'], q29: ['Nothing in particular'], q30: '2 to 3 hours', q31: '30-60 minutes', q32: { anx1: 'Not at all', anx2: 'Not at all', dep1: 'Not at all', dep2: 'Not at all' },
  q33: ['Nothing in particular'], q34: ['Time for hobbies or enjoyable activities', 'Time away from work'], q36: { phone: 'Weekly or more', meet: 'Weekly or more', group: '2-3 times', volunteer: 'Never' },
  q37: ['Share meals with others', 'Ask follow-up questions and really listen'], q38: ['Nothing in particular'], q40: { tobacco: 'Never', vape: 'Never' }, q43: '2-4 times a month', q44: '1-2', q45: 'Never',
  q46: 'In the past 12 months', q48: ['None of these'], q51: 'About once a week', q52: ['Nothing in particular'],
  q55: '1-2 hours', q56: 'Something in between', q57: ['None of these'], q58: ['None of these'] };
const M = (name, o) => ({ name, A: Object.assign(JSON.parse(JSON.stringify(BASE)), o) });
const LEVELS = ['Learning', 'Developing', 'Mastering'];
const OVER = [['Slow breathing', 'Slow breathing to wind down'], ['Building up cardio', 'Weekly cardio', 'Activity for better sleep'], ['Harder cardio and long intervals', 'Short intervals'], ['Strength sessions', 'Strength volume'], ['Alcohol intake', 'Alcohol-free swaps', 'Alcohol and sleep'], ['Walking with others', 'Group activity'], ['Daily eating window', 'Gap between eating and bed'], ['Shared meals', 'Meals with new people'], ['Quitting with full support', 'Trying again to quit'], ['Three good things', 'Expressing gratitude'], ['Safe listening', 'Hearing protection'], ['Air quality', 'Indoor air']];
const OPT = { meditation: ['Meditation'], journalling: ['Expressive writing', 'Three good things', 'Bedtime to-do list'], fasting: ['Daily eating window'], tracking_food: ['Daily eating window', 'Plant variety.Developing', 'Plant variety.Mastering', 'Salt.Mastering', 'Reducing sugar.Mastering', 'Protein at meals.Mastering'], touch: ['Affectionate touch'], early: ['Morning daylight.Mastering'], apps: ['Daily steps.Developing', 'Daily steps.Mastering'] };
function check(f, o) {
  const issues = [], cond = new Set(o.conditions), all = o.months.flat();
  o.months.forEach((m, i) => { if (o.minutes[i] > o.budget + 1e-9) issues.push(`Month ${i + 1} new time ${o.minutes[i]} over limit ${o.budget}`); });
  const m1 = o.months[0];
  if (m1.filter(x => x.role === 'Priority').length > 3) issues.push('More than 3 priority practices');
  if (m1.length > 6) issues.push('More than 6 practices in month 1');
  if (m1.length > 6) issues.push('More than 6 practices in month 1');
  if (m1.length < 6 && o.minutes[0] < o.budget - 15) issues.push('Fewer than 6 practices in month 1 with time to spare: ' + m1.length);
  if (o.themes.length !== 6) issues.push('Themes for months 4–6: ' + o.themes.length);
  for (const x of all) {
    for (const op of f.optout) for (const t of (OPT[op] || [])) if (t === x.fam || t === x.fam + '.' + x.row.l) issues.push(`Opted-out practice offered: ${x.fam} (${x.row.l})`);
    const ex = x.row.x.filter(t => cond.has(t)); if (ex.length) issues.push(`Excluded practice offered: ${x.fam} (${ex.join(', ')})`);
    if (f.doing.includes(x.fam)) issues.push(`Already-done practice offered: ${x.fam}`);
    if (x.row.eq && x.row.p === 'Movement' && !f.gym) issues.push(`Equipment practice without gym: ${x.fam}`);
  }
  if (cond.has('Exercise warning symptoms') || cond.has('Heart, metabolic or kidney condition and inactive'))
    for (const x of all) if (x.area === 'Movement' && x.row.l !== 'Learning') issues.push(`Movement above Learning despite safety hold: ${x.fam} ${x.row.l}`);
  if (f.change === 'small') {
    if (o.months[1].some(x => x.change === 'LEVEL UP')) issues.push('Level-up in month 2 despite small steps');
    if (o.months[2].filter(x => x.change === 'LEVEL UP').length > 1) issues.push('More than one level-up in month 3 despite small steps');
    if (m1.some(x => x.role === 'Priority' && x.row.l !== 'Learning' && x.row.l !== 'All levels' && !x.atBaseline)) issues.push('Priority practice above Learning despite small steps');
  }
  for (const x of m1) if (x.role === 'Priority' && x.row.ev === 'Explore' && !(f.goals[x.area] || []).flatMap(g => DATA.goals[x.area][g] || []).includes(x.fam)) issues.push(`Explore practice as priority without a matching goal: ${x.fam}`);
  for (const g of OVER) { const n = m1.filter(x => g.includes(x.fam)).length; if (n > 1) issues.push('Two practices from one overlap group: ' + g.join(' / ')); }
  const held = cond.has('Exercise warning symptoms') || cond.has('Heart, metabolic or kidney condition and inactive');
  if (!held && f.change !== 'small' && o.minutes[0] < o.budget / 3 && !m1.some(x => o.extraMinutes(x.row) >= 15)) issues.push(`Plan adds only ${Math.round(o.minutes[0])} of ${o.budget} minutes (minimum-time rule could not find a practice)`);
  return issues;
}

module.exports = { BASE, M, AO, check, E, DATA, toFeatures, QUESTIONS, AREA_OPTS };
