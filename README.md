# The Good Span — Longevity Map prototype handoff

Everything needed to build a working prototype of the **Longevity Map**: a member completes an assessment, gets a personalised six-month plan (six practices a month for months 1–3, four themes for months 4–6, plus a short foundations checklist), a Pilot reviews it at a 1:1, and the plan adapts each month.

Start with `docs/PROTOTYPE_BRIEF.md` (what to build), then `docs/RULES.md` (how plans are made).

## What's in this folder

| Path | What it is | Use it for |
|---|---|---|
| `data/assessment.json` | The v6 assessment: 48 questions with stable question and option IDs, types, limits, exclusive options and show-if rules | Render the assessment; store answers by ID |
| `data/practices.json` | Practice library: 83 families × 3 levels (249 practices) in 27 themes, with how-to text, minutes per week, effort, equipment, exclusions and evidence | Plan content and plan logic |
| `data/hygiene_checklist.json` | 11 "foundations" checklist items (e.g. dark bedroom, caffeine cut-off) that sit beside the plan, not in it | Foundations section of the plan |
| `data/rules.json` | Every rule the engine applies: conditions, exclusions, level bands, goal/barrier maps, scoring weights, time budgets, progression, themes, Pilot flags | Engine configuration (don't hard-code these values) |
| `engine/goodspan_engine.py` | Reference engine (Python 3.9+, no dependencies) that turns answers into a plan using the data files | Port to your stack or call as a service |
| `tests/` | Property tests over 1,000 random valid members, outcome tests, a fixture member and its expected plan | Keep a port behaving the same |
| `design/` | Brand tokens, fonts, logos, guidelines, contrast matrix, and `plan_reference.html` (static plan page rendered from the engine's output) | UI build |
| `source/` | The original v6 assessment (Word) and the library + mapping workbook | Human-readable source of truth |
| `docs/` | Prototype brief, rules in plain English, open items | Read first |

## Quick start

```bash
python app.py                                                         # prototype UI at http://127.0.0.1:8899
python engine/goodspan_engine.py tests/fixtures/example_member.json   # prints a plan as JSON
python tests/test_engine.py                                           # runs all tests (GS_CASES=1000 for more)
python tests/random_answers.py 42                                     # a random valid answer set
python design/render_plan_reference.py                                # re-renders the plan page from engine output
```

The prototype (`app.py`) serves the member assessment from `data/assessment.json`, calls `build_plan()` for the draft plan, and includes a simple Pilot view and monthly check-in. No extra Python packages are required.

## Data contracts (summary)

**Answers** — keyed by question ID: `single` → `"option_id"`; `multi` → `["option_id"]`; `grid_single` → `{"row_id": "column_id"}`.

**Plan** (output of `build_plan`):
```json
{ "focus_pillars": ["eat","move"], "focus_suggested": false,
  "top_goals": {"eat": "heart_health"},
  "months": [{ "month": 1, "total_minutes_per_week": 85,
     "practices": [{ "practice_id": "salt.gentle", "family_id": "salt", "pillar": "eat", "role": "focus",
                     "top_goal": true, "level": "gentle", "headline": "…", "how_to": "…",
                     "minutes_per_week": 5, "micro": true, "change": "new" }] }],
  "themes_months_4_6": [{"theme_id": "heart_healthy_eating", "name": "Heart-Healthy Eating", "pillar": "eat"}],
  "hygiene_priority": [{"id": "bedroom_noise", "text": "…", "pillar": "sleep"}],
  "references": ["APA reference for every practice and foundation in the plan", "…"],
  "pilot_flags": [{"id": "snoring", "message": "…"}],
  "conditions": ["…"], "weekly_budget_minutes": 150, "notes": ["…"] }
```

**Monthly outcomes** (input for months 2–3): `[{family_id: "done" | "partly" | "not_yet" | "not_for_me"}, …]`.
**Pilot input**: `{"conditions": ["non_drinker", "low_mood_flag", …], "released": ["alcohol_and_sleep.deep", …]}`.

## Important notes

- The **Pilot guide** (pre-Span interview, safety questions, Portugal referral routes) lives as a Claude Doc: https://claude.ai/code/artifact/3d74d290-1cb3-403f-bb3c-6cb90d15a6aa — export it to Word or PDF from there.
- The **plan page design** lives at https://claude.ai/artifact/JTCUtBrMk3vrCEAG9pEF6j; `design/plan_reference.html` is a static, engine-driven version of it.
- Support services and safety messages are **never shown to members** — they go to the Pilot.
- See `docs/OPEN_ITEMS.md` before building anything final.
