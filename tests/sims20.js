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
const P = [
  M('S1 Inês, 31, healthy, not sure, 2–4h', { q1: ['I’m not sure yet'], q2: '30-39', q55: '2-4 hours' }),
  M('S2 Manuel, 72, fall and hearing, wants Movement', { q1: [AO('Movement')], q2: '70 or over', q3: 'Not currently working', q4: ['High blood pressure'], q29: ['A fall in the past 12 months'], q20: '2', q21: '20', q22: '0', q48: ['I often find it hard to follow conversations, or ask people to repeat themselves'], q27: ['Improve balance and coordination', 'Build strength'], q56: "Small, easy steps. I'm not sure how much I can manage right now" }),
  M('S3 Carla, 36, night-shift nurse, wants Sleep, small steps', { q1: [AO('Sleep')], q3: 'Shift work, including nights', q12: '5-6', q13: ['I wake feeling unrefreshed', 'It takes me a long time to fall asleep'], q18: ['Getting more sleep', 'Having a more consistent sleep schedule'], q55: 'About 45–60 minutes', q56: "Small, easy steps. I'm not sure how much I can manage right now" }),
  M('S4 Joana, 33, pregnant, Nutrition and Movement', { q1: [AO('Nutrition'), AO('Movement')], q6: 'Pregnant', q27: ['Build general fitness', 'Improve performance'], q9: ['When I eat, such as late-evening eating', 'Getting enough protein'], q56: "I'm ready for a bigger challenge" }),
  M('S5 Paulo, 52, heavy drinker, wants Prevention', { q1: [AO('Prevention')], q43: '4 or more times a week', q44: '5-6', q45: 'Weekly', q52: ['Drinking less alcohol'], q56: "I'm ready for a bigger challenge" }),
  M('S6 Rita, 45, daily smoker not ready to quit, wants Mind', { q1: [AO('Mind')], q40: { tobacco: 'Daily', vape: 'Never' }, q41: 'Not at the moment', q33: ['Managing stress', 'Rest and recovery'] }),
  M('S7 Leo, 22, vapes and wants to stop, wants Connection', { q1: [AO('Connection')], q2: '18-29', q40: { tobacco: 'Never', vape: 'Daily' }, q41: 'Yes, in the next month', q42: 'No', q38: ['Meeting new people'], q36: { phone: 'Weekly or more', meet: 'Once', group: 'Never', volunteer: 'Never' } }),
  M('S8 Fernanda, 55, diabetes on medicine, inactive desk job, 45–60', { q1: [AO('Nutrition')], q4: ['Diabetes (including if you take insulin or other blood-sugar medicine)'], q20: '0', q22: '0', q23: 'More than 10', q24: 'Fewer than 5,000', q7: Object.assign({}, BASE.q7, { veg: '1-2 portions', sugary: '6–7 days a week' }), q9: ['Reducing sugar', 'When I eat, such as late-evening eating'], q55: 'About 45–60 minutes' }),
  M('S9 Bruno, 38, marathon runner, no strength, gym, big', { q1: [AO('Movement')], q20: '6', q21: '90', q22: '0', q26: ['Outdoors', 'Gym or studio'], q25: ['Warm up before exercise', 'Interval training'], q27: ['Improve performance', 'Build strength'], q55: 'More than 4 hours', q56: "I'm ready for a bigger challenge" }),
  M('S10 Sara, 29, anxious, Mind, no meditation or journalling', { q1: [AO('Mind')], q2: '18-29', q32: { anx1: 'Nearly every day', anx2: 'More than half the days', dep1: 'Several days', dep2: 'Several days' }, q33: ['Managing stress', 'Managing difficult emotions'], q57: ['Meditation', 'Journalling or writing'], q31: 'More than 2 hours' }),
  M('S11 Alberto, 68, widower, isolated, Connection', { q1: [AO('Connection')], q2: '60-69', q3: 'Not currently working', q36: { phone: 'Once', meet: 'Never', group: 'Never', volunteer: 'Never' }, q37: ['None of these'], q38: ['More time with friends or family', 'A stronger sense of belonging'], q56: "Small, easy steps. I'm not sure how much I can manage right now" }),
  M('S12 Marta, 41, busy parent, Nutrition, no tracking or fasting', { q1: [AO('Nutrition')], q7: Object.assign({}, BASE.q7, { processed: '6–7 days a week', cooked: 'Fewer than 3' }), q9: ['Meal planning and home cooking', 'Reducing highly processed foods'], q57: ['Tracking or counting what I eat', 'Eating windows or fasting'], q55: 'About 45–60 minutes', q56: "Small, easy steps. I'm not sure how much I can manage right now" }),
  M('S13 Hugo, 57, chest symptoms, wants big cardio', { q1: [AO('Movement')], q5: ['Pain, tightness or pressure in your chest'], q20: '1', q21: '20', q27: ['Improve cardiovascular fitness'], q26: ['Gym or studio'], q56: "I'm ready for a bigger challenge" }),
  M('S14 Lia, 27, difficult relationship with food, wants Nutrition timing', { q1: [AO('Nutrition')], q2: '18-29', q11: ['A difficult relationship with food'], q9: ['When I eat, such as late-evening eating', 'Getting enough protein'] }),
  M('S15 Tomás, 49, nut allergy, heart health', { q1: [AO('Nutrition')], q11: ['Nut allergy'], q9: ['Heart health: less salt and more nuts'], q7: Object.assign({}, BASE.q7, { salt: '6–7 days a week' }) }),
  M('S16 Clara, 44, already doing everything, not sure', { q1: ['I’m not sure yet'], q7: Object.assign({}, BASE.q7, { veg: '5 or more portions', protein: 'All of them', grains: '6–7 days a week', beans: '3–5 days a week', processed: 'Rarely or never', sugary: 'Rarely or never' }), q20: '5', q21: '40', q22: '3 or more', q30: 'More than 3 hours', q31: 'Less than 30 minutes', q51: 'Several times a week', q34: ['Meditation or mindfulness', 'A gratitude practice', 'Time for hobbies or enjoyable activities'], q43: 'Never' }),
  M('S17 Duarte, 35, no social media, wants less phone time', { q1: [AO('Mind')], q31: "I don't use social media", q33: ['Spending less time on my phone or social media', 'Focus and concentration'] }),
  M('S18 Vera, 50, knee pain, wants intervals', { q1: [AO('Movement')], q29: ['A joint or mobility limitation'], q27: ['Improve cardiovascular fitness', 'Improve performance'], q20: '3', q21: '50' }),
  M('S19 Nuno, 46, it varies, big, Prevention and Sleep', { q1: [AO('Prevention'), AO('Sleep')], q55: 'It varies', q56: "I'm ready for a bigger challenge", q12: '6-7', q18: ['Waking feeling rested'], q48: ["I've been sunburnt, or used a sunbed, in the past 12 months"], q46: 'Never, or I\'m not sure', q52: ['Protecting my skin from the sun', 'Keeping up with check-ups'] }),
  M('S20 Beatriz, 39, own habit shared, Connection and Mind, no caffeine', { q1: [AO('Connection'), AO('Mind')], q15: "I don't have caffeine", q54: { text: 'Call my mother every Sunday', choice: 'Share this with my Pilot so they can support me' }, q38: ['More meaningful relationships'], q33: ['Enjoyment and positive experiences'] }),
];
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
fs.writeFileSync('personas20.json', JSON.stringify(P));
const out = [];
for (const s of P) {
  const f = toFeatures(s.A);
  const o1 = E.plan(JSON.parse(JSON.stringify(f))), o2 = E.plan(JSON.parse(JSON.stringify(f)));
  const sig = o => JSON.stringify(o.months.map(m => m.map(x => [x.fam, x.row.l, x.change, x.role, x.why])).concat([o.themes, o.foundations.map(h => h.f), o.pilot]));
  const deterministic = sig(o1) === sig(o2);
  const issues = check(f, o1);
  out.push({ name: s.name, f, o: o1, deterministic, issues });
  console.log('\n==', s.name, '| wish', f.wish.join('+') || 'not sure', '| pri', o1.pri.join('+'), '| light', o1.light.join('+'), '| new min', o1.minutes.map(Math.round).join('/'), 'of', o1.budget, '| det', deterministic);
  o1.months[0].forEach((x, i) => console.log('  ', x.role.padEnd(13), x.area.padEnd(10), (x.fam + ' (' + x.row.l + ', ' + x.row.ev + ')').padEnd(58), o1.months[1][i].change.padEnd(9), o1.months[2][i].change.padEnd(9), '|', x.why.slice(0, 80), x.note ? '[' + x.note + ']' : ''));
  console.log('   themes:', o1.themes.map(t => t[1]).join(', '), '| foundations:', o1.foundations.map(h => h.f).join(', '));
  console.log('   pilot:', o1.pilot.map(n => n[0]).join(', '));
  if (issues.length) console.log('   ISSUES:', issues);
}
fs.writeFileSync('sims20.json', JSON.stringify(out.map(r => ({ name: r.name, deterministic: r.deterministic, issues: r.issues, wish: r.f.wish, change: r.f.change, time: r.f.time, optout: r.f.optout,
  pri: r.o.pri, light: r.o.light, minutes: r.o.minutes, target: r.o.target, budget: r.o.budget, status: r.o.status, opp: r.o.opp, themes: r.o.themes, foundations: r.o.foundations.map(h => [h.p, h.t]), pilot: r.o.pilot,
  months: r.o.months.map(m => m.map(x => ({ role: x.role, area: x.area, fam: x.fam, level: x.row.l, ev: x.row.ev, text: x.row.w + ' ' + x.row.d + '. ' + x.row.t, why: x.why, change: x.change, note: x.note || '', extra: r.o.extraMinutes(x.row), target: x.row.tg }))) })), null, 1));
console.log('\nTOTAL issues', out.reduce((t, r) => t + r.issues.length, 0), '| all deterministic', out.every(r => r.deterministic));
