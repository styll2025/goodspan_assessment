---
description: Ground rules for The Good Span codebase (assessment, plan engine, member app)
globs: ["**/*"]
alwaysApply: true
---

# The Good Span: rules for working in this repo

- The plan engine is **rule-based and deterministic**. Same answers → same plan, always. No randomness, no LLM, no probabilistic scoring in plan generation. Ties are broken by library and goal-list order.
- `docs/RULES.md` is the specification. `core/engine.js` must match it. Change both together, and run `npm test` (all simulations must report 0 issues and be deterministic).
- `docs/Practice_library_and_mapping.xlsx` is the single source of truth for practices. Never hand-edit the `lib` array in `core/data.json`: edit the workbook and run `npm run library`.
- `core/questions.js` holds the assessment (question ids, options, visibility) and `toFeatures(answers)`, which turns answers into the features the engine reads. Option text is matched exactly: if you reword an option, update `toFeatures` and the tests.
- **Pilot notes (`plan.pilot`) are internal.** Never render them, export them or send them anywhere a member can see them. Members only see the general disclaimer.
- Never show medical advice, never imply a member has a condition, never recommend therapy (including insomnia therapy) or specific vaccines. Safety exclusions and holds come before personalisation.
- The weekly time limit is a hard limit; opt-outs, health exclusions and safety holds are hard constraints applied before anything is proposed.
- The plan is the same for every membership tier.
- Member-facing copy: plain UK English, warm, short sentences, no jargon. Say "the research", never "evidence text". Each practice must keep its "Why this is in your Good Span" line.
- Design system: plum #4d2831, cream #fff2ea, orange #fe600c, light blue #d1e6e9, pink #f5a4c2, ochre #cb863a; display font BST Bazaine (trial licence: buy before launch), UI font Archivo. Tokens are in `src/base.css`.
- Each member gets their own assessment and plan. Do not reintroduce example personas or shared demo plans in the member app; test personas live only in `tests/`.
