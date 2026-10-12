// node scripts/generate.js  → builds a plan for each member in examples/answers.json and writes:
//   out/plans.json        the generated records (what the result page reads)
//   out/result_page.html  the result page, one tab per member
//   out/conversation.html the conversational assessment, ending in the member's own plan
const fs = require('fs');
const { ROOT, env, buildResult, resultPage, conversationPage } = require('./lib.js');
const answers = JSON.parse(fs.readFileSync(ROOT + '/examples/answers.json', 'utf8'));
const recs = Object.entries(answers).map(([name, A]) => buildResult(name.split(' ')[0], A, env));
fs.mkdirSync(ROOT + '/out', { recursive: true });
fs.writeFileSync(ROOT + '/out/plans.json', JSON.stringify(recs, null, 1));
fs.writeFileSync(ROOT + '/out/result_page.html', resultPage(recs));
fs.writeFileSync(ROOT + '/out/conversation.html', conversationPage());
for (const r of recs) console.log(`${r.name}: month 1 ${r.practices.map(x => x.fam).join(', ')} | month 2 ${r.add2.join(', ') || '–'} | month 3 ${r.add3.join(', ') || '–'} | ${r.mins} of ${r.lower} min`);
console.log('Wrote out/plans.json, out/result_page.html, out/conversation.html');
