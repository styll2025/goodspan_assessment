// Checks the summary endpoint's guard rails with a stand-in for the Anthropic API (no key or network needed).
const assert = require('assert');
const { handleStory } = require('../server/ai-story.js');
const { env, buildResult } = require('../scripts/lib.js');
const ex = require('../examples/answers.json');
const r = buildResult('Marta', ex.Marta, env);
const facts = Object.assign({}, r.storyFacts, { answers: [
  { section: 'About you', question: 'What is your age?', answer: '18-29' },
  { section: 'Movement', question: 'On average, how many days a week do you do moderate or vigorous exercise?', answer: '3' },
  { section: 'Contact', question: 'Email', answer: 'marta@example.com' }] });
const reply = out => async () => ({ ok: true, json: async () => ({ content: [{ type: 'tool_use', name: 'write_summary', input: out }] }) });
const good = { heading: 'Steady foundations, a busier mind', paragraphs: [
  'A lot of your everyday life is already working well. You cook most of your meals, you sleep well, you see friends every week and you are active on 3 days a week, with time in nature and for hobbies built into your routine. Where your answers point is less about what you do and more about how stress sits with you at the moment.',
  'Managing stress and difficult moments is what you would most like to work on. You enjoy quiet time on your own and music, and you would rather not meditate or journal, so your Good Span starts with approaches that fit the way you already unwind, at a steady pace that suits the time you have.'] };
(async () => {
  const sent = [];
  let out = await handleStory({ facts }, { apiKey: 'k', fetchImpl: async (u, o) => { sent.push(JSON.parse(o.body)); return reply(good)(); } });
  assert.strictEqual(out.status, 200, JSON.stringify(out.json));
  assert.strictEqual(out.json.heading, good.heading);
  assert(!/marta@example\.com/.test(sent[0].messages[0].content), 'no email address sent');
  const bad = (p, why) => handleStory({ facts }, { apiKey: 'k', fetchImpl: reply(Object.assign({}, good, p)) }).then(o => assert.strictEqual(o.json.reason, why, JSON.stringify(o.json)));
  await bad({ paragraphs: [good.paragraphs[0], good.paragraphs[1] + ' Your depression should ease.'] }, 'wording');
  await bad({ paragraphs: [good.paragraphs[0]] }, 'shape');
  await bad({ paragraphs: [good.paragraphs[0].replace('3 days', '17 days'), good.paragraphs[1]] }, 'numbers');
  await bad({ heading: 'A heading that is far too long to be a short personalised heading' }, 'heading');
  assert.strictEqual((await handleStory({ facts }, { apiKey: '' })).status, 503, 'no key: not configured');
  assert.strictEqual((await handleStory({ facts: {} }, { apiKey: 'k' })).status, 400, 'empty facts: bad request');
  console.log('summary endpoint: all checks passed');
})().catch(e => { console.error(e); process.exit(1); });
