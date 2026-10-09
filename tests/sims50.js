// 50 new simulated members (U1–U50) through the real assessment logic and engine.
const __path = require('path'); require('fs').mkdirSync(__path.join(__dirname, 'out'), { recursive: true }); process.chdir(__path.join(__dirname, 'out'));
// Checks: all hard rules (simcore.check), Rules 15–18, Pilot notes for every trigger answer, accuracy of the "why" text,
// whether each practice is justified by the member's own answers, and the "Not right for me" rule for every practice.
const fs = require('fs');
const { M, AO, check, E, DATA, toFeatures, QUESTIONS } = require('./simcore.js');
const SM = "Small, easy steps. I'm not sure how much I can manage right now", BIG = "I'm ready for a bigger challenge";
const NOTRIED = { daylight: "I haven't tried it", dim: "I haven't tried it", regular: "I haven't tried it", alcohol: "I haven't tried it", winddown: "I haven't tried it", tasks: "I haven't tried it", cool: 'I do this now', dark: 'I do this now', quiet: 'I do this now', screens: "I haven't tried it", phone: "I haven't tried it", work: 'I do this now', naps: 'I do this now', pro: "I haven't tried it", share: "I haven't tried it" };
const U = [
  M('U1 Rosa, 29, nurse on nights, Sleep, tried wind-down', { q1: [AO('Sleep')], q3: 'Shift work, including nights', q12: '5-6', q17: Object.assign({}, NOTRIED, { winddown: "I've tried it, but it didn't help", screens: "I've tried it, but it didn't help" }), q18: ['Getting more sleep', 'Falling asleep more easily'] }),
  M('U2 Henrique, 67, retired, not working, Mind, enjoys outdoors', { q1: [AO('Mind')], q2: '60-69', q3: 'Not currently working', q33: ['Rest and recovery', 'Focus and concentration'], q58: ['Being outdoors', 'Quiet time on my own'] }),
  M('U3 Bea, 34, carer, 45–60 min, Sleep and Mind', { q1: [AO('Sleep'), AO('Mind')], q19: ['Caring or family responsibilities', 'Stress or feeling under pressure'], q55: 'About 45–60 minutes', q33: ['Managing stress'], q12: '5-6' }),
  M('U4 Ivo, 41, enjoys sport, Movement big', { q1: [AO('Movement')], q20: '2', q21: '30', q22: '0', q27: ['Build general fitness', 'Build strength'], q58: ['Sport'], q26: ['Sports facility or club'], q56: BIG }),
  M('U5 Clara, 52, enjoys writing, Mind emotions', { q1: [AO('Mind')], q33: ['Managing difficult emotions', 'A greater sense of purpose'], q58: ['Writing'], q34: ['None of these'] }),
  M('U6 Paulo, 48, already does yoga, wants stress', { q1: [AO('Mind')], q33: ['Managing stress', 'Switching off and relaxing'], q34: ['Yoga or Pilates', 'Breathing or relaxation practices'] }),
  M('U7 Sónia, 38, three Mind goals', { q1: [AO('Mind')], q33: ['Managing stress', 'Enjoyment and positive experiences', 'Building routines that stick'] }),
  M('U8 Tiago, 27, music lover, Sleep', { q1: [AO('Sleep')], q18: ['Falling asleep more easily'], q58: ['Listening to music'], q13: ['It takes me a long time to fall asleep'] }),
  M('U9 Marta, 45, cooks, Nutrition plants', { q1: [AO('Nutrition')], q9: ['Eating more plants and fibre', 'Meal planning and home cooking'], q58: ['Cooking'], q7: { veg: '1-2 portions', protein: 'Two', cooked: 'Fewer than 3', grains: 'Rarely or never', beans: 'Rarely or never', sugary: '1–2 days a week', processed: '3–5 days a week', nuts: 'Rarely or never', salt: '1–2 days a week' } }),
  M('U10 Nuno, 55, meals on screen, mindful eating', { q1: [AO('Nutrition')], q9: ['Eating more mindfully, with fewer distractions'], q8: { screen: 'Rarely', attention: 'Rarely', slow: 'Sometimes', variety: 'Sometimes', out: 'Sometimes', window: 'Rarely' } }),
  M('U11 Ana, 31, opts out of apps, steps low', { q1: [AO('Movement')], q24: 'Fewer than 5,000', q57: ['Using apps or devices to track things'], q20: '1', q21: '30' }),
  M('U12 Rui, 63, high BP, lung, inactive, Movement small', { q1: [AO('Movement')], q2: '60-69', q4: ['High blood pressure', 'A lung condition, such as asthma or COPD'], q20: '0', q22: '0', q56: SM }),
  M('U13 Leonor, 36, vegan, protein goal', { q1: [AO('Nutrition')], q11: ['Dietary restriction or preference (for example vegetarian, vegan, halal or kosher)'], q9: ['Getting enough protein'] }),
  M('U14 Pedro, 44, irregular hours, Connection', { q1: [AO('Connection')], q3: 'Irregular or changing hours', q38: ['More time with friends or family', 'Meeting new people'], q36: { phone: 'Once', meet: 'Once', group: 'Never', volunteer: 'Never' } }),
  M('U15 Inês, 24, social, enjoys group activity, Movement', { q1: [AO('Movement'), AO('Connection')], q58: ['Being active with other people'], q20: '1', q21: '30', q38: ['More shared activities'] }),
  M('U16 Carlos, 58, quiet type, PHQ positive, Mind', { q1: [AO('Mind')], q32: { anx1: 'More than half the days', anx2: 'Nearly every day', dep1: 'Several days', dep2: 'Several days' }, q58: ['Quiet time on my own'], q33: ['Managing stress'] }),
  M('U17 Filipa, 40, tried consistent timing and daylight', { q1: [AO('Sleep')], q17: Object.assign({}, NOTRIED, { regular: "I've tried it, but it didn't help", daylight: "I've tried it, but it didn't help" }), q18: ['Having a more consistent sleep schedule', 'Improving my morning routine'] }),
  M('U18 Duarte, 50, pain at night, Sleep', { q1: [AO('Sleep')], q19: ['Pain or physical symptoms'], q29: ['Ongoing pain'], q12: '6-7' }),
  M('U19 Catarina, 33, breastfeeding, Nutrition timing', { q1: [AO('Nutrition')], q6: 'Breastfeeding', q9: ['When I eat, such as late-evening eating'], q16: 'Less than 1 hour' }),
  M('U20 Miguel, 46, gym, performance, strength 1 day, 300 min cardio', { q1: [AO('Movement')], q20: '5', q21: '60', q22: '1', q26: ['Gym or studio'], q27: ['Improve performance'], q55: 'More than 4 hours' }),
  M('U21 Joana, 61, stretching lover, mobility goal', { q1: [AO('Movement')], q2: '60-69', q58: ['Stretching, yoga or Pilates'], q27: ['Improve mobility and flexibility'] }),
  M('U22 Vasco, 70+, fall, outdoors', { q1: [AO('Movement')], q2: '70 or over', q29: ['A fall in the past 12 months'], q58: ['Being outdoors'], q20: '2', q21: '20' }),
  M('U23 Teresa, 37, creative, not sure', { q1: ['I’m not sure yet'], q58: ['Making or creating things'], q30: 'Less than 30 minutes', q31: 'More than 2 hours' }),
  M('U24 André, 29, heavy social media, phone goal', { q1: [AO('Mind')], q31: 'More than 2 hours', q33: ['Spending less time on my phone or social media', 'Focus and concentration'] }),
  M('U25 Helena, 54, drinks a lot, not ready, Prevention', { q1: [AO('Prevention')], q43: '4 or more times a week', q44: '3-4', q45: 'Monthly', q52: ['Keeping up with check-ups'] }),
  M('U26 Gonçalo, 35, daily smoker, wants to stop', { q1: [AO('Prevention')], q40: { tobacco: 'Daily', vape: 'Never' }, q41: 'Yes, in the next month', q42: 'No' }),
  M('U27 Raquel, 42, vapes, not ready', { q1: [AO('Mind')], q40: { tobacco: 'Never', vape: 'Daily' }, q41: 'Not at the moment', q33: ['Managing stress'] }),
  M('U28 Fernando, 66, kidney, wants protein', { q1: [AO('Nutrition')], q4: ['Kidney disease'], q9: ['Getting enough protein'], q20: '3', q21: '60' }),
  M('U29 Lúcia, 30, pregnant, enjoys stretching, Mind stress', { q1: [AO('Mind')], q6: 'Pregnant', q58: ['Stretching, yoga or Pilates'], q33: ['Managing stress'] }),
  M('U30 Simão, 23, student, focus, not working', { q1: [AO('Mind')], q2: '18-29', q3: 'Not currently working', q33: ['Focus and concentration'] }),
  M('U31 Alice, 49, already does lots, Connection', { q1: [AO('Connection')], q37: ['Do small acts of kindness for others', 'Tell people what I appreciate about them', 'Ask follow-up questions and really listen', 'Share meals with others'], q38: ['More meaningful relationships'] }),
  M('U32 Hugo, 39, snores, sleeps <5h, wants Movement', { q1: [AO('Movement')], q12: 'Less than 5', q14: 'Yes' }),
  M('U33 Rita, 57, prefers not to say health', { q1: [AO('Sleep')], q4: ['Prefer not to say'], q29: ['Prefer not to say'], q11: ['Prefer not to say'] }),
  M('U34 Joaquim, 72, isolated widower, Connection', { q1: [AO('Connection')], q2: '70 or over', q3: 'Not currently working', q36: { phone: 'Never', meet: 'Never', group: 'Never', volunteer: 'Never' }, q37: ['None of these'], q38: ['A stronger sense of belonging', 'Helping others or contributing to my community'] }),
  M('U35 Patrícia, 26, sunbeds, Prevention sun', { q1: [AO('Prevention')], q48: ["I've been sunburnt, or used a sunbed, in the past 12 months"], q52: ['Protecting my skin from the sun'] }),
  M('U36 Mário, 59, hearing difficulty, Connection', { q1: [AO('Connection')], q48: ['I often find it hard to follow conversations, or ask people to repeat themselves'], q38: ['More time with friends or family'] }),
  M('U37 Diana, 44, diabetes inactive, Movement', { q1: [AO('Movement')], q4: ['Diabetes (including if you take insulin or other blood-sugar medicine)'], q20: '1', q21: '20', q22: '0' }),
  M('U38 Zé, 31, chest pain on effort, Movement big', { q1: [AO('Movement')], q5: ['Pain, tightness or pressure in your chest'], q56: BIG, q20: '2', q21: '30' }),
  M('U39 Margarida, 47, it varies, all goals Sleep', { q1: [AO('Sleep')], q55: 'It varies', q18: ['Falling asleep more easily', 'Staying asleep through the night', 'Waking feeling rested'], q13: ['It takes me a long time to fall asleep', 'I wake during the night and find it hard to get back to sleep'] }),
  M('U40 Bruno, 36, opts out of meditation and journalling, Mind', { q1: [AO('Mind')], q57: ['Meditation', 'Journalling or writing'], q33: ['Managing stress', 'Managing difficult emotions'], q58: ['Writing'] }),
  M('U41 Sara, 28, no caffeine, early riser, Sleep', { q1: [AO('Sleep')], q15: "I don't have caffeine", q13: ["I wake earlier than I want to and can't get back to sleep"], q18: ['Staying asleep through the night'] }),
  M('U42 Nádia, 50, 4h+, big, Nutrition and Movement', { q1: [AO('Nutrition'), AO('Movement')], q55: 'More than 4 hours', q56: BIG, q20: '1', q21: '30', q9: ['Reducing sugar', 'Reducing highly processed foods'], q7: { veg: '1-2 portions', protein: 'One', cooked: '3–5', grains: '1–2 days a week', beans: '1–2 days a week', sugary: '6–7 days a week', processed: '6–7 days a week', nuts: 'Rarely or never', salt: '6–7 days a week' } }),
  M('U43 Óscar, 64, learning, Prevention', { q1: [AO('Prevention')], q2: '60-69', q51: 'Rarely or never', q52: ['Keeping my mind active by learning new things', 'Knowing which vaccines are due'] }),
  M('U44 Eva, 32, walks everywhere, Movement strength', { q1: [AO('Movement')], q25: ['Walk or cycle to get places', 'Walk after meals'], q24: '10,000 or more', q27: ['Build strength'], q26: ['At home'] }),
  M('U45 Luís, 53, work desk, sits 10h+, enjoys nothing', { q1: [AO('Movement')], q23: 'More than 10', q26: ['At work'], q58: ['None of these'] }),
  M('U46 Graça, 45, shares own habit, Mind', { q1: [AO('Mind')], q54: { text: 'Read for 20 minutes before bed', choice: 'Share this with my Pilot so they can support me' }, q33: ['Making more time for myself'] }),
  M('U47 Tomás, 40, food relationship difficult, Nutrition goals timing and protein', { q1: [AO('Nutrition')], q11: ['A difficult relationship with food'], q9: ['When I eat, such as late-evening eating', 'Getting enough protein'] }),
  M('U48 Beatriz, 35, not sure, small, 45–60', { q1: ['I’m not sure yet'], q56: SM, q55: 'About 45–60 minutes' }),
  M('U49 Artur, 68, sleeps 9h+, low mood, Connection', { q1: [AO('Connection')], q12: 'More than 9', q36: { phone: 'Once', meet: 'Once', group: 'Never', volunteer: 'Never' } }),
  M('U50 Lia, 30, cyclist, outdoors, wants switch off', { q1: [AO('Mind'), AO('Movement')], q20: '5', q21: '60', q22: '2', q58: ['Being outdoors', 'Sport'], q33: ['Switching off and relaxing'], q27: ['Become more consistent with exercise'] }),
];
const src = fs.readFileSync(__path.join(__dirname, '../core/engine.js'), 'utf8');
const ev = n => new Function('return ' + src.slice(src.indexOf('const ' + n + ' = ') + n.length + 9, src.indexOf(';\n', src.indexOf('const ' + n + ' = '))))();
const ENJOY = ev('ENJOY'), WORK = ev('WORK_FAMS'), GOAL_TXT = ev('GOAL_TXT'), AREA_TXT = ev('AREA_TXT');
const CAT = {}; for (const r of DATA.lib) CAT[r.p + '|' + r.f] = r.c;
const R = ['time', 'routine', 'already', 'pillar', 'health', 'other'];
const out = []; let nIssues = 0, nWarn = 0, nr = 0;
for (const s of U) {
  const f = toFeatures(s.A), o = E.plan(JSON.parse(JSON.stringify(f))), o2 = E.plan(JSON.parse(JSON.stringify(f)));
  const det = JSON.stringify(o.months.map(m => m.map(x => [x.fam, x.row.l, x.why]))) === JSON.stringify(o2.months.map(m => m.map(x => [x.fam, x.row.l, x.why])));
  const issues = check(f, o), warn = [], m1 = o.months[0], pr = m1.filter(x => x.role === 'Priority');
  if (!det) issues.push('Not deterministic');
  // Rule 15 / 16
  if (f.not_working) for (const x of o.months.flat()) if (WORK.includes(x.fam)) issues.push('Rule 15: working-day practice for a non-worker: ' + x.fam);
  for (const x of m1) if ((f.tried || []).includes(x.fam)) issues.push("Rule 16: offered something they tried that didn't help: " + x.fam);
  for (const h of o.foundations) if ((f.hyg_tried || []).includes(h.f)) issues.push('Rule 16: foundation they tried: ' + h.f);
  // Rule 17
  for (let i = 0; i < pr.length; i++) for (let j = i + 1; j < pr.length; j++) if (pr[i].area === pr[j].area && CAT[pr[i].area + '|' + pr[i].fam] === CAT[pr[j].area + '|' + pr[j].fam]) warn.push(`Rule 17: two priorities from one theme (${CAT[pr[i].area + '|' + pr[i].fam]})`);
  // Rule 18: in a chosen area with 2+ goals and 2+ priority practices there, the first two goals are each covered (unless every practice for that goal is excluded)
  for (const a of f.wish) { const gs = f.goals[a] || [], inA = pr.filter(x => x.area === a);
    if (gs.length >= 2 && inA.length >= 2) for (const g of gs.slice(0, 2)) if (!inA.some(x => (DATA.goals[a][g] || []).includes(x.fam))) warn.push(`Rule 18: goal “${GOAL_TXT[g] || g}” has no practice`); }
  // accuracy of the why text
  for (const x of m1) {
    const w = x.why || '';
    const mg = w.match(/You picked “([^”]+)”/); if (mg) { const k = Object.keys(GOAL_TXT).find(k => GOAL_TXT[k] === mg[1]); if (!k || !(f.goals[x.area] || []).includes(k)) issues.push('Why text names a goal they did not pick: ' + x.fam); }
    if (/You told us you want to work on|You said you'd like to work on/.test(w) && !f.wish.includes(x.area)) issues.push('Why text says they chose an area they did not: ' + x.fam);
  }
  // justification: what in their answers put each practice there
  const just = m1.map(x => {
    const S = o.reasons; const r = [];
    if ((f.goals[x.area] || []).some(g => (DATA.goals[x.area][g] || []).includes(x.fam))) r.push('goal');
    if (o.signalFams && o.signalFams.includes(x.fam)) r.push('signal');
    if ((f.sleep_disrupt || []).includes(x.fam) || (f.meal_rare || []).includes(x.fam)) r.push('answer');
    if ((f.enjoy || []).some(k => (ENJOY[k] || []).includes(x.fam))) r.push('enjoys');
    if (x.fam === 'Balance' && f.fall) r.push('fall');
    return [x.fam, r];
  });
  // Pilot notes expected for trigger answers
  const P = new Set(o.pilot.map(n => n[0]));
  const exp = [[f.snore, 'Snoring'], [f.high_bp, 'Blood pressure'], [f.lung, 'Lung condition'], [f.pregnant || f.breastfeeding, 'Pregnancy'], [f.phq4_pos, 'PHQ-4 positive'], [(f.audit || 0) >= 8, 'AUDIT-C 8+'],
    [f.hearing_diff, 'Hearing'], [f.food_rel || (f.food_other || []).length, 'Food'], [f.diabetes_med, 'Medication'], [f.shift, 'Shift work'], [f.fall, 'Fall'], [(f.tried_txt || []).length, 'Tried before'], [f.carer, 'Caring'], [f.sleep_pain, 'Pain and sleep'],
    [f.own_habit && f.own_habit[1] === 'share' && f.own_habit[0], 'Own habit'], [f.symptoms, 'Exercise warning symptoms']];
  for (const [cond, k] of exp) if (cond && !P.has(k)) issues.push('Missing Pilot note: ' + k);
  // Not right for me
  const nrr = m1.map((x, i) => R.map(r => { nr++; const z = o.notRight(0, i, r); return [x.fam, r, z.action, (z.options || []).map(y => y.fam + ' (' + y.row.l + ')').join('; ')]; })).flat();
  for (const [fam, r, a, opts] of nrr) if (a === 'options') for (const o3 of opts.split('; ')) { const fn = o3.replace(/ \(.*/, ''); if (f.not_working && WORK.includes(fn)) issues.push('Rule 15 in Not right for me: ' + fn); if ((f.tried || []).includes(fn)) issues.push('Rule 16 in Not right for me: ' + fn); }
  nIssues += issues.length; nWarn += warn.length;
  out.push({ name: s.name, f, o, issues, warn, just, nrr, seen: QUESTIONS.filter(q => !q.show || q.show(s.A)).length });
}
// enjoy coverage
const withEnjoy = out.filter(r => (r.f.enjoy || []).length), enjoyHit = withEnjoy.filter(r => r.o.months[0].some(x => r.f.enjoy.some(k => (ENJOY[k] || []).includes(x.fam))));
for (const r of out) {
  console.log('\n==', r.name, '| pri', r.o.pri.join('+'), '| new', r.o.minutes.map(Math.round).join('/'), 'of', r.o.budget);
  r.o.months[0].forEach((x, i) => console.log('  ', x.role.padEnd(13), x.area.padEnd(10), (x.fam + ' (' + x.row.l + ')').padEnd(44), (r.o.months[1][i].change + '/' + r.o.months[2][i].change).padEnd(20), '|', (x.why || '').slice(0, 85), x.note ? '[' + x.note + ']' : ''));
  console.log('   foundations:', r.o.foundations.map(h => h.f).join(', '), '| pilot:', r.o.pilot.map(n => n[0]).join(', '));
  if (r.issues.length) console.log('   ISSUES:', r.issues); if (r.warn.length) console.log('   NOTES:', r.warn);
}
fs.writeFileSync('sims50.json', JSON.stringify(out.map(r => ({ name: r.name, seen: r.seen, issues: r.issues, warn: r.warn, just: r.just, nr: r.nrr, wish: r.f.wish, goals: r.f.goals, enjoy: r.f.enjoy, change: r.f.change, budget: r.o.budget, minutes: r.o.minutes, pri: r.o.pri, themes: r.o.themes, foundations: r.o.foundations.map(h => h.f), pilot: r.o.pilot,
  months: r.o.months.map(m => m.map(x => ({ role: x.role, area: x.area, fam: x.fam, level: x.row.l, ev: x.row.ev, text: x.row.w + ' ' + x.row.d + '.', why: x.why, change: x.change, note: x.note || '', extra: r.o.extraMinutes(x.row) }))) })), null, 1));
console.log('\nTOTAL rule issues', nIssues, '| notes', nWarn, '| not-right checks', nr, '| enjoy matched', enjoyHit.length, 'of', withEnjoy.length, '| avg questions seen', (out.reduce((t, r) => t + r.seen, 0) / out.length).toFixed(1));
