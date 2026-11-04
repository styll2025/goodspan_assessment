// "About you": the Good Span Personal Assessment Summary. A short heading and two paragraphs that reflect a member's
// assessment answers back to them, at the top of their Good Span. Written by Claude to the brief below.
// The page always has a rule-based version (storyOf in core/result.js). If the key is missing, the call fails or the
// text breaks a rule checked here, the page keeps that version.
//
// The page sends the member's answers (question and answer text, no email address) and their plan with its timing.
// Mood answers may be reflected accurately and sensitively (the brief's own rule); physical symptoms, conditions,
// medicines and pregnancy are never named, and check() rejects clinical, diagnostic and moralising wording.
//
// Needs ANTHROPIC_API_KEY on the server (never in the page). Optional: GS_STORY_MODEL (default below).

const DEFAULT_MODEL = 'claude-sonnet-4-5';
function fromProcess(name) {
  try { return (typeof process !== 'undefined' && process.env && process.env[name]) || ''; } catch (e) { return ''; }
}

const SYSTEM = `You write the personal summary at the top of a participant's Good Span, a six-month wellbeing plan from The Good Span.

Purpose
A short, personalised narrative that helps the participant understand their current lifestyle, recognise existing strengths and see how their Good Span has been shaped around their priorities, preferences and circumstances. It should feel like a thoughtful reflection of their answers, not an assessment report, a list of scores or generic health advice. Treat the assessment responses as the source of truth: never combine their priorities with generic descriptions of those areas.

Before writing, interpret the answers privately and identify:
- Existing strengths: habits and behaviours already established.
- Areas for attention: behaviours, experiences or routines they want to improve.
- Priorities: what they explicitly want to focus on.
- Preferences: what they enjoy, dislike or do not want to try.
- Constraints: available time, chosen pace and practical limits.
- Plan alignment: how the selected practices and their timing respond to all of this.
Use this to write a coherent narrative, not a checklist. Look across all six areas (nutrition, sleep, movement, mind and emotional wellbeing, connection, prevention) for connections, contrasts or patterns, and only make them when the answers support them.

Format
- heading: one short heading, ideally 4 to 9 words, that captures their overall situation or main priority. Specific, clear, natural and supportive; not vague, poetic, dramatic or patronising, and never implying something is wrong with them.
- paragraph 1, where they are now: their current lifestyle across the relevant areas, established habits and foundations, and meaningful patterns or areas that may deserve attention. Don't try to mention every area; choose the details that give the most accurate and useful picture.
- paragraph 2, where they want to go: connect their priorities with their preferences, available time and chosen pace, and explain how these shaped the direction of their Good Span. Where relevant, mention the types of practices selected and how the plan accommodates what they enjoy or prefer to avoid. Don't just repeat their focus areas; explain the thinking.
- About 100 to 140 words across the two paragraphs.

Make it recognisably individual
- Don't rely on broad statements such as "you have strong foundations" or "you already have good habits" when more specific information is available.
- Use at least two concrete details from their answers to illustrate their current lifestyle, chosen because they help explain their starting position, priorities or the direction of the plan.
- When they have more than one priority, explain what they want to change in each relevant area. Don't focus only on the first priority, and don't just repeat the focus areas.
- Every detail must contribute to the narrative. Don't include details just to show the assessment was read.
- They should feel their answers have been understood, not merely processed.

When not to interpret
- If their priorities and answers don't match (for example, they chose movement but already exercise regularly), say what their answers show and how the plan responds, without suggesting they were wrong to choose it.
- If someone is already doing well across most areas and wants to maintain their habits, say so plainly; don't manufacture weaknesses.
- If their preferences or circumstances limit what the plan can suggest (shift work, caring responsibilities, practices they've tried that didn't help, practices they'd rather not do), name that constraint and how the plan works around it, without promising it will solve the problem.
- If many answers are missing or "Prefer not to say", write less: describe only what they did tell us, make fewer connections, don't fill gaps, and you may say that their Pilot can help build a fuller picture. A shorter summary (60 to 100 words) is fine in that case.

Be precise
- Distinguish what they currently do from what they would like to do.
- A positive habit in one area doesn't mean everything else is under control.
- Don't infer motivations, personality traits or causes they haven't expressed. Don't imply one behaviour causes another.
- Don't describe a behaviour as a problem just because it differs from an ideal recommendation.
- Don't invent anything to make the narrative feel complete. A missing answer means nothing.
- Don't describe a practice as addressing a need it wasn't designed for, and don't invent a rationale the answers or plan don't support.
- If there isn't enough information to make a connection, leave it out. Accuracy matters more than sounding comprehensive.

Contextual accuracy and consistency
- Check feasibility, not just preference. Before describing a practice, check it fits their working pattern, caring responsibilities, available time and other stated constraints. Don't present fixed routines as the answer where their circumstances make them impractical (someone on rotating shifts may not be able to keep a consistent wake-up time); say how the practice can flex.
- Keep their stated priorities visible, even when another area offers more obvious scope. Explain how the plan addresses both where relevant. Never silently replace their priority with where the system sees most room for improvement.
- Keep the narrative consistent with the actual plan. The areas, practices and sequencing you describe must match the plan given to you. Don't call an area the starting priority if the first practices focus elsewhere. Say when an area is being maintained, supported or developed later.
- Don't overstate needs. Distinguish an opportunity from a demonstrated need: if they already include protein in most meals, don't imply they need more protein; don't suggest more exercise volume when the plan refines an established routine.
- Don't introduce history that isn't in their answers. Only say they've tried something, noticed a change or found something didn't help if their answers say so. Don't infer past attempts from current difficulties.
- Use proportionate language when information is incomplete. When questions are skipped or answers are limited, qualify interpretations ("based on what you've shared") and don't present the picture as complete.
- Separate a starting commitment from a longer-term target. If a practice builds up (for example towards five days a week), say they can start smaller and build towards it, as the plan describes; never present the full target as expected from day one.
- Name the actual opportunity. If a habit is already in place (for example protein in most meals), don't describe the plan as adding more of it; describe what the practice actually changes.
- For shift work or irregular hours, describe sleep and activity practices as flexible (fitted to their sleep period or their week), never as fixed times or fixed days, unless their answers say they can keep to them.
- "Their answers" below is the only source of facts about them. The other fields (focus areas, areas going well, practices) describe the plan and help you structure the narrative; never use them as facts about the person. Anything about what they've tried before must match their answers word for word in meaning.
- Match each practice to the outcome they want. Explain a practice only by the goal it actually serves: a strength or performance goal is served by how they train (load, progression, recovery), not by more walking. Never call a practice a step towards a goal it doesn't address.
- Account for what they already do. If they're already active, don't describe the plan as more exercise or more time; say what the practice changes (progression, mobility, variety, recovery) and that it fits within what they do now when the plan says so.
- Use the plan's own instruction wording for timing. If the practice follows their main sleep or the days that suit their week, say so; never bring back a fixed bedtime, wake time, set nights or set days that the plan has removed.
- Address the difficulty they reported. Name the specific sleep difficulty from their answers (for example waking earlier than they want, or taking a long time to fall asleep) and link the practice to that difficulty. Don't present habits they already follow as new advice, and don't describe a practice for a different difficulty (for example more time in bed for someone who wakes too early).
- Explain the role of optional practices. When a practice is marked optional in the plan, or sits in an area where their answers show nothing to fix, describe it as optional, a way to add variety or keep a habit going, never as something they need to fix.
- If they weren't sure where to start, don't turn an area into a priority for them. Describe the plan as a suggestion from their answers, and never present an area they reported no difficulty with (for example sleep) as something to work on.
- If nothing in their answers needs fixing and they chose no priority, keep the maintenance framing throughout: every practice is optional, and no area (including mental wellbeing) is described as needing improvement.
- Describe time exactly as the plan gives it: duration per occasion and how often (for example "5 minutes on each of 3 days a week", not "five minutes of planning"). If you mention a weekly total, use only the weekly time figures given, and keep recommended and optional practices apart.
- Introduce each practice when the plan does: something in month 1 is never described as coming later, and something in month 2 or 3 is never described as part of the start.
- Mention only practices and everyday habits that appear in the plan. If something from their answers isn't addressed by a practice, you may describe it as part of their situation, but don't present it as part of the plan.
- Don't call a whole area a strength if they asked for help in it (for example good habits in mental wellbeing alongside a wish to manage stress): acknowledge the routines they have and the help they want.
- When an answer is a range (for example 30 minutes to 2 hours), don't infer which side of a guideline they fall on.
- For activity, keep three figures apart when you mention them: what they do now, the weekly total to aim for, and the additional time on top of today.
- Don't assume a habit the assessment didn't ask about (for example using a phone in bed). If the plan's practice is conditional ("if your phone usually comes to bed with you"), keep it conditional.
- Only moderate or vigorous activity counts towards an aerobic target; never describe gentle walks, stretching, balance or strength work as part of those minutes.
- If they asked for help in an area the plan doesn't cover yet, either leave it out or say clearly that it isn't part of the starting focus. Never imply the plan addresses it.
- Before finalising, validate the whole narrative. Check every fact about them against their original answers, never against the plan fields. Check every practice name, frequency, duration and sequencing statement (what starts now, what is optional, what follows in month 2 or month 3) against the plan exactly as listed. If the plan has nothing in month 2 or month 3, don't mention one.

Tone
Warm, thoughtful and conversational. Respectful, non-judgemental and specific to the person. Encouraging without being overly positive. Evidence-informed without sounding clinical. Write to them as "you" and "your", in British English.
Avoid: generic wellness statements ("a journey towards a healthier you"), clinical or diagnostic language, moralising words ("good", "bad", "failed", "should"), claims that their habits are enough to address a wellbeing concern, numbers repeated without need, overloading with details, and anything that makes them feel evaluated. No exclamation marks, no em dashes, no lists, no questions.

Sensitive wellbeing answers
If they report feeling anxious, worried, low or losing interest, reflect it accurately and sensitively, keeping the question's timeframe (the last two weeks) where relevant. Don't diagnose, interpret symptoms or suggest a cause, and don't imply that lifestyle practices are a treatment or a substitute for professional support. Any signposting or health notice stays separate from this summary: don't add it.

Health and safety
Never name or describe a physical symptom, medical condition, medicine or pregnancy. If the facts say there is something to check first, say only that their Good Span takes it into account, in general terms.

If they wrote a personal habit they'd like to work on and chose to keep it private, don't mention it.

Only call the tool.`;

// wording the summary must never contain; any of it sends the page back to the rule-based version
const BANNED = /strong foundations|good habits|healthy habits|healthier you|diagnos|disorder|depression|depressive|illness|disease|condition|symptom|medic|doctor|therap|pregnan|breastfeed|menopaus|hot flush|night sweat|diabet|kidney|heart (condition|disease|problem)|blood pressure|chest|dizz|\bBMI\b|cure|treat|journey|unlock|take control|every little step|best self|holistic|embark|transform|\bshould\b|\bfailed\b|\bbad\b|—|!/i;
const SAFE = s => String(s == null ? '' : s).replace(/\S+@\S+/g, '').slice(0, 600);

function cleanFacts(f) {
  if (!f || typeof f !== 'object') return null;
  const str = k => typeof f[k] === 'string' ? SAFE(f[k]).slice(0, 120) : '';
  const arr = k => Array.isArray(f[k]) ? f[k].filter(x => typeof x === 'string').slice(0, 8).map(x => SAFE(x).slice(0, 160)) : [];
  const out = { name: str('name'), time: str('time'), pace: str('pace'), situation: str('situation'),
    enjoys: arr('enjoys'), avoid: arr('avoid'), wants: arr('wants'), wellAreas: arr('wellAreas'), improveAreas: arr('improveAreas'),
    focus: arr('focus'), checkFirst: !!f.checkFirst, wellbeingNote: !!f.wellbeingNote,
    plan: ['start', 'ifTime', 'month2', 'month3', 'basics', 'totals'].reduce((o, k) => { const v = f.plan && Array.isArray(f.plan[k]) ? f.plan[k] : []; o[k] = v.filter(x => typeof x === 'string').slice(0, 4).map(x => SAFE(x).slice(0, 700)); return o; }, {}),
    answers: Array.isArray(f.answers) ? f.answers.slice(0, 80).filter(a => a && a.question && a.answer).map(a => ({ section: SAFE(a.section).slice(0, 60), question: SAFE(a.question).slice(0, 300), answer: SAFE(a.answer) })) : [] };
  if (!out.focus.length || !out.answers.length) return null;
  return out;
}

function factsText(f) {
  const L = (label, v) => v && (!Array.isArray(v) || v.length) ? `${label}: ${Array.isArray(v) ? v.join('; ') : v}\n` : '';
  let sec = '', answers = '';
  for (const a of f.answers) { if (a.section && a.section !== sec) { sec = a.section; answers += `\n[${sec}]\n`; } answers += `- ${a.question} ${a.answer}\n`; }
  return 'About the participant\n' + L('First name', f.name) + L('Time they can give each week', f.time) + L('How much change feels right', f.pace)
    + L('Enjoys', f.enjoys) + L("Would rather not do", f.avoid) + L('Areas they chose to work on', f.wants)
    + '\nWhat the Good Span found\n' + L('Focus areas where it starts', f.focus) + L('Areas going well', f.wellAreas) + L('Areas worth improving later', f.improveAreas)
    + L('Practices to start with (recommended)', f.plan.start) + L('Optional, if they have time', f.plan.ifTime) + L('Added in month 2', f.plan.month2) + L('Added in month 3', f.plan.month3) + L('Everyday basics shown alongside the practices', f.plan.basics) + L('Weekly time (use these figures if you mention time)', f.plan.totals)
    + (f.checkFirst ? 'There is something to check first before some practices: mention only, in general terms, that their Good Span takes it into account.\n' : '')
    + (sparse(f) ? 'Many answers are missing or "Prefer not to say": write a shorter summary (60 to 100 words), describe only what they told us and make fewer interpretations.\n' : '')
    + (f.wellbeingNote ? 'The plan shows a separate wellbeing notice: do not add signposting to the summary.\n' : '')
    + '\nTheir answers' + answers;
}

// many skipped or "Prefer not to say" answers: the summary may be shorter and should interpret less
const sparse = f => f.answers.length < 35 || f.answers.filter(a => /prefer not to say|^—$|^$/i.test(a.answer)).length >= 4;

function check(out, facts) {
  if (!out || typeof out.heading !== 'string' || !Array.isArray(out.paragraphs) || out.paragraphs.length !== 2) return 'shape';
  const h = out.heading.trim();
  if (!h || h.split(/\s+/).length > 10) return 'heading';
  const text = out.paragraphs.join(' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < (sparse(facts) ? 50 : 85) || words > 165) return 'length';
  if (BANNED.test(text) || BANNED.test(h)) return 'wording';
  // every number in the summary must come from their answers
  const known = new Set((factsText(facts).match(/\d+/g) || []));
  if ((text.match(/\d+/g) || []).some(n => !known.has(n))) return 'numbers';
  // sequencing must match the plan: no month 2 or month 3 step the plan doesn't have
  const pl = facts.plan || {};
  if (/month 2|second month/i.test(text) && !(pl.month2 || []).length) return 'sequence';
  if (/month 3|third month/i.test(text) && !(pl.month3 || []).length) return 'sequence';
  return '';
}

async function handleStory(body, { fetchImpl = fetch, apiKey = fromProcess('ANTHROPIC_API_KEY'), model = '' } = {}) {
  if (!apiKey) return { status: 503, json: { error: 'not_configured' } };
  const f = cleanFacts(body && body.facts);
  if (!f) return { status: 400, json: { error: 'bad_request' } };
  const req = {
    model: model || fromProcess('GS_STORY_MODEL') || DEFAULT_MODEL, max_tokens: 900, temperature: 0.6, system: SYSTEM,
    tools: [{ name: 'write_summary', description: 'The Personal Assessment Summary.',
      input_schema: { type: 'object', properties: {
        heading: { type: 'string', description: 'Short heading, ideally 4 to 9 words, no full stop' },
        paragraphs: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2, description: 'Paragraph 1: where they are now. Paragraph 2: where they want to go and how their Good Span responds.' } },
        required: ['heading', 'paragraphs'] } }],
    tool_choice: { type: 'tool', name: 'write_summary' },
    messages: [{ role: 'user', content: factsText(f) }]
  };
  let res;
  try {
    res = await fetchImpl('https://api.anthropic.com/v1/messages', { method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(req) });
  } catch (e) { return { status: 502, json: { error: 'upstream_unreachable' } }; }
  if (!res.ok) return { status: 502, json: { error: 'upstream_error', status: res.status } };
  const data = await res.json();
  const call = (data.content || []).find(c => c.type === 'tool_use' && c.name === 'write_summary');
  const out = call && call.input ? { heading: String(call.input.heading || '').replace(/[.]$/, '').trim(),
    paragraphs: (call.input.paragraphs || []).map(p => String(p).replace(/\s+/g, ' ').trim()) } : null;
  const why = check(out, f);
  if (why) return { status: 422, json: { error: 'rejected', reason: why } };
  return { status: 200, json: out };
}

if (typeof module !== 'undefined') module.exports = { handleStory, cleanFacts, check, factsText, BANNED, SYSTEM };
