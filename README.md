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
| `templates/conversation.tpl.html` | The conversational assessment. At the end, **See my Good Span** calls `buildResult` and shows the page in a full-screen frame. |
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

## Before launch

- Safety rules and notice wording need professional review.
- Fonts in `assets/` are the BST Bazaine **trial** files; swap in the licensed versions.
- Practice cards use library names (e.g. "Reframing") and library minute values; the hand-written titles and timings in the reviewed pages are not in the library yet.
- If you later add AI for free-text understanding or voice transcription, keep any API key on a server, and review privacy first: health answers currently go only to the Google Sheet.
