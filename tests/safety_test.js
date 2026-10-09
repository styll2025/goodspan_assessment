// Exercise warning symptoms (question 5) and the two follow-ups (5a: during activity; 5b: seen a doctor).
const { BASE, M, AO, E, toFeatures, QUESTIONS } = require('./simcore.js');
const CP = ['Pain, tightness or pressure in your chest'];
const cases = [
  ['no follow-up answers', { q5: CP }, { held: true, note: 'Exercise warning symptoms' }],
  ['during activity, not seen a doctor', { q5: CP, q5a: 'Yes', q5b: 'No, not yet' }, { held: true, note: 'Exercise warning symptoms: during activity' }],
  ['not during activity, seen, not cleared', { q5: CP, q5a: 'No', q5b: "Yes, but I haven't been told it's OK to be more active yet" }, { held: true, note: 'Exercise warning symptoms' }],
  ['doctor has cleared them', { q5: CP, q5a: 'Yes', q5b: "Yes, and they're happy for me to be more active" }, { held: false, note: 'Exercise warning symptoms' }],
  ['cleared, bigger challenge', { q5: CP, q5b: "Yes, and they're happy for me to be more active", q56: "I'm ready for a bigger challenge" }, { held: false, note: 'Exercise warning symptoms', noRaise: true }],
  ['no symptoms', { q5: ['None of these'] }, { held: false, note: null }],
];
let bad = 0;
const shown = (A, id) => { const q = QUESTIONS.find(x => x.id === id); return !q.show || q.show(A); };
for (const [name, o, exp] of cases) {
  const s = M('Safety ' + name + ', 50', Object.assign({ q1: [AO('Movement')], q20: '1', q21: '20', q22: '0' }, o));
  const f = toFeatures(s.A), P = E.plan(JSON.parse(JSON.stringify(f))), mv = P.months.flat().filter(x => x.area === 'Movement');
  const issues = [];
  if (exp.held && mv.some(x => x.row.l !== 'Learning' && x.row.l !== 'All levels')) issues.push('Movement above Learning while held');
  if (exp.held && !P.months[0].filter(x => x.area === 'Movement').every(x => /check with your doctor/.test(x.note || ''))) issues.push('month-1 movement practice without the doctor note');
  if (!exp.held && P.months.flat().some(x => /for safety/.test(x.note || ''))) issues.push('still held after a doctor cleared them (or with no symptoms)');
  if (exp.held && P.months.slice(1).flat().some(x => x.area === 'Movement' && x.change === 'LEVEL UP')) issues.push('Movement levelled up while held');
  if (f.symptoms && mv.some(x => x.row.x.includes('Exercise warning symptoms'))) issues.push('vigorous practice offered with symptoms');
  if (exp.note && !P.pilot.some(n => n[0] === exp.note)) issues.push('missing Pilot note ' + exp.note);
  if (!exp.note && P.pilot.some(n => /Exercise warning/.test(n[0]))) issues.push('unexpected symptom note');
  if (f.symptoms !== (shown(s.A, 'q5a') && shown(s.A, 'q5b'))) issues.push('follow-up questions shown wrongly');
  if (exp.noRaise && P.months[0].some(x => x.area === 'Movement' && x.row.l === 'Mastering')) issues.push('bigger challenge raised Movement despite symptoms');
  bad += issues.length;
  console.log(name.padEnd(40), '|', P.months[0].filter(x => x.area === 'Movement').map(x => `${x.fam} (${x.row.l})`).join(', '), '|', P.pilot.filter(n => /Exercise/.test(n[0])).map(n => n[0]).join(', ') || '-', issues.length ? '| ISSUES ' + issues.join('; ') : '');
}
console.log('safety checks', cases.length, 'issues', bad);
process.exitCode = bad ? 1 : 0;
