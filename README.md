# The Good Span: assessment and Good Span prototype

A member answers the assessment and gets a personalised six-month **Good Span**, built by a rule-based, deterministic engine from their own answers. This repository holds the live prototype, the engine, the assessment, the practice library and the complete rules.

**October 2026 update.** This version replaces the earlier Longevity Map prototype (48 questions, Python engine).

Start with [`docs/RULES.md`](docs/RULES.md) (how a plan is made) and [`docs/PROTOTYPE_BRIEF.md`](docs/PROTOTYPE_BRIEF.md) (what to build next).

## What's here

| Path | What it is |
|---|---|
| `index.html` | **The live member prototype.** Built from `src/` and `core/` by `npm run build`; don't edit it by hand. |
| `src/app.html`, `src/base.css` | The prototype's source: app shell and screens, design-system styles. |
| `core/engine.js` | The plan engine. `makeEngine(DATA).plan(features)` returns a member's Good Span. Runs in the browser and in Node. |
| `core/questions.js` | The assessment: `SECTIONS`, `QUESTIONS` (52 questions: ids, options, when each is shown) and `toFeatures(answers)`. |
| `core/data.json` | Data the engine reads: `lib` (298 practices, generated from the library workbook), `hyg` (foundations), `goals`, `goalLabels`. |
| `docs/RULES.md` | **The complete rules**: principle, plan structure, Rules 1–18, thresholds, signals and goals → practices, Pilot notes, "Not right for me", engine constants. |
| `docs/PROTOTYPE_BRIEF.md`, `docs/OPEN_ITEMS.md` | What to build next; open items before launch. |
| `source/GoodSpan_Longevity_Map_Assessment.docx` | The assessment (52 questions) with the internal rules, tables and revision notes. |
| `source/Practice_library_and_mapping.xlsx` | The practice library (Practices, Hygiene checklist, Themes, Pilot notes, Change Log). **Source of truth for practices.** |
| `source/Assessment_option_map.xlsx` | Every question and option: what it records, which rule uses it, what it does to the plan, how it personalises it. |
| `source/Simulations_50.xlsx`, `source/Mind_review.xlsx` | Latest simulation findings; the Mind review (batch 2 awaiting approval). |
| `data/` | JSON exports: `library.json` (every library column), `questions.json`, `goals.json`, `foundations.json`. |
| `tests/` | 20 + 30 + 50 simulated members, "Not right for me" checks, 3,000 random members, browser test. |
| `scripts/` | `build.mjs` (builds `index.html`), `library_to_json.py` (workbook → engine data), `Code.gs` (Google Sheet webhook). |
| `design/` | Brand tokens, fonts, logos, guidelines, contrast matrix. |
| `worker.js`, `wrangler.jsonc` | Cloudflare Worker: serves the site and saves plan copies (`POST /api/plans` → `/plans/<id>.html`). |
| `.cursor/rules/goodspan.mdc` | Ground rules for Cursor in this repo. |

## Run it

```bash
npm run build          # rebuild index.html after editing src/ or core/
npx serve .            # or: python3 -m http.server   → open http://localhost:3000 (or :8000)
npm test               # 100 simulated members + 360 "Not right for me" checks: must report 0 issues
npm run test:fuzz      # 3,000 random members through every rule (about 2 minutes)
npm run library        # after editing source/Practice_library_and_mapping.xlsx (needs: pip install openpyxl)
npm i -D playwright && npx playwright install chromium && npm run test:e2e   # full browser run, desktop and phone
```

Deploy as before with Wrangler (`wrangler deploy`): the Worker serves `index.html` at the site root.

## How it fits together

```
answers (A) ──► toFeatures(A) ──► features (p) ──► engine.plan(p) ──► plan (P) ──► screens (src/app.html)
             core/questions.js                    core/engine.js
```

- **Answers** `A` are keyed by question id (`q1`…`q58`; gaps are questions removed over time). Single = string, multi = array, grid = `{rowKey: answer}`, personal habit = `{text, choice}`.
- **Plan** `P` = `engine.plan(p)`: `status` (Starting Position), `pri` (priority pillars), `months[0..2]` (practices with role, level, text, `why`, change), `minutes`, `budget`, `themes`, `foundations`, **`pilot` (internal Pilot notes, never shown to members)**, `notRight(month, index, reason)` (Rule 13), `log`.

## Testing with members (what the prototype does)

- Welcome screen: optional first name, email and mobile. Each member gets a unique reference (for example `GS-8HW2-EM7B`) and their own plan. No example personas.
- The plan is built only when every shown question is answered (the personal habit question is optional).
- When the plan is built, the prototype:
  1. sends the answers, the plan summary and the Pilot notes to the team's **Google Sheet** (`scripts/Code.gs`; one row per member, columns named `v7 <section>: <question>`);
  2. saves a static copy of the plan through the Worker and shows "Open saved copy"; the link is added to the member's row.
- "Download my Good Span (JSON)" gives the answers and plan (no Pilot notes) for testing.
- Answers stay in that browser only (`localStorage`); clicking the logo starts again and clears them (after asking).

**Update the Apps Script:** paste the new `scripts/Code.gs` into the sheet's Apps Script and deploy a new version, so rows are matched by member reference rather than by name.

**Data protection:** answers include health information (special category data under GDPR). Keep the sheet restricted to the team and Pilots, and get explicit consent before testing with members.

## Before launch

- Safety rules (exclusions, holds, Pilot notes) reviewed by a qualified professional.
- BST Bazaine licence (trial fonts in `design/assets/`).
- Mind batch 2 (5 practice groups in `source/Mind_review.xlsx`) awaiting approval; not in the library yet.
- Accessibility test with a screen reader.
