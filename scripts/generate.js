// node scripts/generate.js  → builds a plan for each member in examples/answers.json and writes:
//   out/plans.json        the generated records (what the result page reads)
//   out/result_<name>.html one result page per member
//   out/conversation.html the conversational assessment, ending in the member's own plan
const fs = require('fs');
const { ROOT, env, buildResult, resultPage, conversationPage } = require('./lib.js');
const answers = JSON.parse(fs.readFileSync(ROOT + '/examples/answers.json', 'utf8'));
const recs = Object.entries(answers).map(([name, A]) => buildResult(name.split(' ')[0], A, env));
fs.mkdirSync(ROOT + '/out', { recursive: true });
fs.writeFileSync(ROOT + '/out/plans.json', JSON.stringify(recs, null, 1));
for (const r of recs) fs.writeFileSync(ROOT + `/out/result_${r.name.toLowerCase()}.html`, resultPage([r]));   // one page per member
fs.writeFileSync(ROOT + '/out/conversation.html', conversationPage());
for (const r of recs) console.log(`${r.name}: month 1 ${r.practices.map(x => x.fam).join(', ')} | month 2 ${r.add2.join(', ') || '–'} | month 3 ${r.add3.join(', ') || '–'} | ${r.mins} of ${r.lower} min`);
console.log('Wrote out/plans.json, out/result_<name>.html for each member, out/conversation.html');
