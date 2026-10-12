# Good Span plan generator

Turns a member's assessment answers into their Good Span result page. Everything runs on fixed rules in plain JavaScript: **no API key, no AI service and no server needed**. The same answers always give the same plan.

## How it fits together

```
answers (A)  ──►  toFeatures(A)  ──►  engine.plan()  ──►  buildResult()  ──►  result page template
 the chat or      core/questions.js    core/engine.js      core/result.js       templates/result_page.tpl.html
 the form                              + data/library.json + core/profile.js
```

| File | What it does |
|---|---|
| `core/questions.js` | The 52 questions, their conditions (`show(A)`) and `toFeatures(A)`, which turns answers into the features the engine reads. |
| `core/engine.js` | Chooses practices, applies the safety rules, opt-outs and time budget, and writes the reasons. Same output as the current repo engine (checked on 100 profiles); it also has a `__perPillar` mode that lists the next practices in every pillar. |
| `data/library.json` | The practice library: levels, minutes, safety exclusions, reasons and references. |
| `core/profile.js` | One short, factual paragraph per pillar from the member's own answers (used for the Starting Position). |
| `core/result.js` | **New.** `buildResult(name, answers, env)` applies the agreed plan structure and writes the page copy. |
| `templates/result_page.tpl.html` | The result page. Placeholders: `__DATA__` (array of records from `buildResult`), `__IMG__` (pillar photos), fonts and logo. It still contains the hand-written copy for Inês, Marta and Hugo; any record with `gen: true` uses its own generated copy instead. |
| `templates/conversation.tpl.html` | The conversational assessment: welcome, talk or type, the opening question, then the 52 questions with short acknowledgements. At the end, **See my Good Span** calls `buildResult` and shows the page in a full-screen frame. |
| `reference/` | The current built prototype and the hand-reviewed page for Inês, Marta and Hugo, for comparison. |

## Use

```js
const DATA = require('./data/library.json');
const { makeEngine } = require('./core/engine.js');
const { toFeatures } = require('./core/questions.js');
const { profile } = require('./core/profile.js');
const { buildResult } = require('./core/result.js');

const record = buildResult('Marta', answers, { E: makeEngine(DATA), DATA, toFeatures, profile });
```

In the browser the same files load as plain scripts (`makeEngine` and `buildResult` become globals; wrap `profile.js` as the conversation build does, because it declares top-level helpers).

`answers` uses the question ids as keys: single choice → string, multi → array, grids → `{ rowKey: option }`, q54 → `{ text, choice }`. See `examples/answers.json`.

## Scripts (Node 18+)

- `node scripts/generate.js`: builds plans for `examples/answers.json` and writes `out/plans.json`, `out/result_page.html` and `out/conversation.html`.
- `node test/check.js`: runs 100 test profiles and checks the rules below. It exits with an error if any fail. Run it after any change to the rules or the library.

## The plan rules in `result.js`

1. **Focus areas.** These are the engine's priorities. Movement is left out while a symptom hasn't been checked by a doctor. An area only counts if there is something safe to offer there.
2. **Month 1.** At most three practices, and each must trace back to an answer. Lighter-touch fillers are dropped. Month 1 must fit the lower end of the member's time; if a practice doesn't fit, it starts at an easier level of the same practice.
3. **The member's own choice comes first.** If they chose an area that is in focus, month 1 starts there (up to two practices per area). Other focus areas join from month 3.
4. **Months 2 and 3.**
   - Month 2 adds up to two practices. It adds only one if the member wants small steps or another focus area is waiting, and never more than month 1 started with.
   - Month 3 adds one.
   - Both months stay within the member's time. Anything else moves to months 4–5.
5. **Only when the answers point to it:**
   - eating windows, if they already keep one some of the time;
   - screen-free evenings, if screens affect their sleep or they use social media heavily.
6. **Notices:**
   - "One thing to check first", when a symptom hasn't been checked by a doctor;
   - "Something worth discussing", when they've felt anxious or low on more than half the days;
   - an area they asked for that needs a health professional's input first. The page never names a condition.

## The conversation layer (templates/conversation.tpl.html)

Controlled, not an open AI conversation: everything below is fixed rules and fixed wording.

1. **Welcome**: "Let's find your Good Span…", then first name and email.
2. **Talk or type**: the member chooses, and the microphone button switches at any point. Voice uses the browser's own speech recognition (Chrome, Edge and Safari; no key, no server). What it hears goes through exactly the same matching and "Is that right?" check as typing. If the browser has no voice support, or the microphone is blocked, it falls back to typing and says so.
3. **Opening question**: "If the next six months went really well, what would you most like to feel different?" The member taps suggestions or answers in their own words. Their words are matched to themes (`THEMES` in `core/result.js`: energy, sleep, stress, mood, fitness, ease, food, connection, health).
   - With two or more themes, the chat asks one follow-up: "If one of those improved first, which would make the biggest difference?"
   - The matching areas are pre-selected on q1, so the member can confirm or change them.
   - Stored as `A.q0 = { text, themes, areas, first }`; `toFeatures` ignores it, so the engine is unchanged.
4. **Acknowledgements**: one short line after selected answers (`ACK` in the template), only for what already works and the limits they set, e.g. "You're already doing strength work twice a week…". There are none on health or safety questions; the anxious-or-low questions only get "Thank you for telling us."
5. **Safety and health questions** (q4, q5, q5a, q5b, q6, q29, q32) can only be answered by tapping, never typed or spoken.

## The opening of Your Good Span

The opening gives the conclusion first and the reasoning later. `buildResult` returns `opening = { situation, lead, paras, starts, after, own }` in one of five situations:

| situation | when | lead |
|---|---|---|
| `safety` | a symptom not yet checked by a doctor | "Hugo, you told us you want to improve your fitness. One thing comes first." |
| `sensitive` | anxious or low on more than half the days | "Marta, your Good Span starts with what matters most to you: feeling better day to day." (or "thank you for being open with us") |
| `priority` | they chose an area that is in focus | "…you told us you'd like to “sleep through the night”, so that's where we're starting." |
| `unexpected` | what they chose is already going well, or needs a professional first | "…your answers point somewhere slightly different from where you might expect." |
| `doing-well` / `start` | no choice; three or more areas going well (or not) | "Inês, you're already doing a lot right." / "…here's where we'd start." |

Each opening uses a few variables: what matters to them, what already goes well, the main opportunity, one relevant opt-out ("You also told us meditation and journalling aren't for you…"), and when another focus area follows.

The "Your Good Span starts with" line (`starts`) is calculated from the plan, never typed in: the number of practices, the area that comes first, and the weekly minutes.

**Their own words** are quoted back only when:
- the text is 4–80 characters;
- it contains no numbers;
- it mentions no conditions, symptoms, medicines, weight or self-harm, and no swearing (`ownWords()` in `core/result.js`);
- it points to the area the plan starts with.

Otherwise the page uses our wording. Goal reasons also use the member's voice: "You told us managing stress matters to you", not "You picked …".

## Order of the result page

1. Opening
2. Starting Position
3. Where a small change could go a long way
4. First practices
5. Six-month journey
6. **Belonging and Meet your Pilot**: "Longevity is personal. It shouldn't be lonely." and **Book my Good Span Review**
7. **Ways to continue after your Review**: what's included, then Self, Core and Concierge, explained but with no "Choose" buttons. The tier is decided with the Pilot.
8. The science behind your plan

## Voice and AI matching

**How an answer is understood**, in order:
1. **Voice capture (browser).**
   - Listening continues until a 1.5-second pause, up to 20 seconds, so answers aren't cut off mid-sentence.
   - The browser's top three guesses are kept.
   - The language is set with `window.GS_SPEECH_LANG` (default `en-GB`; `pt-PT` for Portuguese).
   - While the member is talking, the page also keeps a short recording. That recording is only uploaded if step 3 is needed.
2. **Rules (in the page).** Each guess is tried against the options. "No idea" and "not sure" pick a matching option ("I don't track my steps") or ask again, and are never read as zero.
3. **Whisper, only when it is needed.** It runs when the member spoke and the rules could not place the answer (including when the browser heard nothing). The page sends the recording to `/api/transcribe`. That route calls OpenAI's transcriptions API with model `whisper-1`. You do not choose the model when you create the key; the route names it.
   - Typed answers are not sent.
   - The question wording and the option labels go with the recording as a hint, so words like "10,000" are easier to hear.
   - The new transcript is tried with the rules, then with AI matching if that is on.
   - If the secret is missing, the route answers `not_configured` and the page carries on without Whisper.
4. **AI matching (optional).** It runs only when the rules still cannot place the answer. The page sends the question, its options and the transcript to `/api/interpret`, which asks Claude Haiku to pick from the numbered options or answer "unclear".
   - The server and the page both reject anything that isn't on the list.
   - The member still confirms with "Is that right?".
   - The model can also read Portuguese answers.
5. **After two misses** on the same question, typing and talking pause for that question and the member taps an option.

Health and safety questions (q4, q5, q5a, q5b, q6, q29, q32) are tap-only. They are blocked from both `/api/interpret` and `/api/transcribe`. Contact details are never sent.

**Turn the keys on**
- On the published assessment (https://thegoodspan-assessment.pages.dev/): the page already calls both routes. Add each key in Cloudflare, not in GitHub and not in the page. Dashboard → Workers & Pages → **thegoodspan-assessment** → Settings → Variables and Secrets → Add. Type: Secret. Environment: Production (and Preview, if you use preview links). Save, then retry the latest deployment so the secret is picked up. Do not commit the key.
  - Name: `ANTHROPIC_API_KEY` for matching a transcript to an option.
  - Name: `OPENAI_API_KEY` for Whisper. Optional override: `OPENAI_TRANSCRIBE_MODEL` (leave it unset to use `whisper-1`).
- Locally, only if the project is on that computer: `ANTHROPIC_API_KEY=sk-... OPENAI_API_KEY=sk-... node server/dev-server.js`, then open http://localhost:8787. Each match and transcript is logged in the terminal. Without a key, that step stays off.
- In your app:
  1. Call `handleInterpret(body)` from `server/ai-interpret.js` for matching, and `handleTranscribe(body)` from `server/transcribe.js` for Whisper.
  2. Set `window.GS_AI_URL` and `window.GS_TRANSCRIBE_URL` to those routes before the conversation script loads.
- Keep both keys on the server only.
- Model for matching: set `GS_AI_MODEL` (default `claude-haiku-4-5`).
- `node test/ai-interpret.test.js` and `node test/transcribe.test.js` check the guard rails without a key.

**Not done yet**
- **Consent:** to be added once the prototype is agreed. When matching is on, the transcript passes through Claude. When Whisper is needed, the spoken recording passes through OpenAI. Tap-only health questions do neither.

## Before launch

- Safety rules and notice wording need professional review.
- Fonts in `assets/` are the BST Bazaine **trial** files; swap in the licensed versions.
- Voice: test speech recognition on the browsers your members use; when the app is hosted in a frame, the frame needs `allow="microphone"`.
- The acknowledgement lines and the opening wording are fixed copy; review them with the team like any other copy.
- Practice cards use library names (e.g. "Reframing") and library minute values; the hand-written titles and timings in the reviewed pages are not in the library yet.
- Keep `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` on the server. Health answers are tap-only and are not sent to either API. The Google Sheet still receives the assessment answers.
