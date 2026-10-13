// node test/ai-interpret.test.js  → checks the AI endpoint's guard rails with a fake API (no key or network needed)
const { handleInterpret, buildRequest } = require('../server/ai-interpret.js');
const fake = input => async () => ({ ok: true, json: async () => ({ content: [{ type: 'tool_use', name: 'record_answer', input }] }) });
const Q = { questionId: 'q24', question: 'How many steps do you take on a typical day?', type: 'single', options: ['Fewer than 5,000', '5,000-7,999', '8,000-9,999', '10,000 or more', "I don't track my steps"], answer: "I'm on my feet all day at work" };
(async () => {
  const fails = [], ok = (c, m) => c || fails.push(m);
  let r = await handleInterpret(Q, { apiKey: 'x', fetchImpl: fake({ options: [4], unclear: false }) });
  ok(r.json.answer[0] === '10,000 or more', 'maps a listed option');
  r = await handleInterpret(Q, { apiKey: 'x', fetchImpl: fake({ options: [9], unclear: false }) });
  ok(r.json.unclear && !r.json.answer.length, 'ignores an option number outside the list');
  r = await handleInterpret(Q, { apiKey: 'x', fetchImpl: fake({ options: [1, 2], unclear: false }) });
  ok(r.json.answer.length === 1, 'single choice returns one option');
  r = await handleInterpret(Q, { apiKey: 'x', fetchImpl: fake({ options: [2], unclear: true }) });
  ok(r.json.unclear && !r.json.answer.length, 'unclear returns nothing');
  r = await handleInterpret(Object.assign({}, Q, { questionId: 'q5' }), { apiKey: 'x', fetchImpl: fake({ options: [1], unclear: false }) });
  ok(r.status === 200 && r.json.answer[0] === 'Fewer than 5,000', 'a health question can be matched, and only to a listed option');
  r = await handleInterpret(Q, { apiKey: '', fetchImpl: fake({}) });
  ok(r.status === 503, 'no key: switched off');
  const req = buildRequest({ question: Q.question, type: 'single', max: null, options: Q.options, answer: 'I work nine to five', alternatives: [], model: '' });
  ok(/wording/.test(req.system) && /nine to five/.test(req.system), 'the instructions match meaning when the wording differs');
  ok(req.messages[0].content.includes('I work nine to five'), 'the paraphrase is sent with the options');
  console.log(`AI endpoint checks: ${fails.length ? fails.length + ' failed' : 'all passed'}`); fails.forEach(f => console.log('  ' + f));
  process.exit(fails.length ? 1 : 0);
})();
