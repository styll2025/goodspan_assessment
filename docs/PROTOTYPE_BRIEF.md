# Prototype brief

## Users
- **Member** (adult, 18+; under-18s are excluded at sign-up). Launch market: Portugal.
- **Pilot** — a coach who reviews each plan at a 1:1 before the Span starts, at mid-Span and at the end, and can be messaged any time.

## Journey
1. **Sign-up & consent** (health data is special category under GDPR — explicit consent + privacy notice link).
2. **Assessment** (~15 min). Render from `data/assessment.json`:
   - One question per screen or grouped by section; grids (`grid_single`) as a table of radio buttons.
   - Respect `max_select`, `exclusive_options` (selecting one clears the others) and `free_text_options` (show a text box).
   - `show_if.depth_question_for`: show only if that pillar is a focus pillar, or the member chose "I'm not sure yet". Other `show_if` rules use the same expression format as `rules.json` (see `evaluate()` in the engine).
   - The eating-pattern grid in the Word document is split into four question IDs here; render them together.
3. **Draft plan page** (shown straight after the assessment). Call `build_plan(answers)`. Layout and styling: `design/plan_reference.html` + `design/brand_tokens.json`. Sections:
   - summary (focus pillars, other pillars, weekly time) and a "first draft" note;
   - Span timeline: assessment ✓ → pre-Span 1:1 → months 1–3 → mid-Span check-in → months 4–6 → end-of-Span check-in (check-ins marked "With your Pilot");
   - "Your Pilot is here whenever you need them" with a message link;
   - Months 1–3: six practice rows per month (pillar chip, role, headline, how-to, level bars, minutes, New / Level up / Continue);
   - How the plan adjusts; Months 4–6: four themes;
   - Your foundations: a tick-box checklist of `hygiene_priority` items (max 5). These are basics the member should be doing anyway, so they sit outside the plan. Placement is still to be decided: currently at the end of the plan; alternatives are the welcome/onboarding screen or a separate tab;
   - The science behind your plan: numbered list of `references` (APA, with DOI links) for every practice and foundation shown;
   - footer disclaimer.
   - Must also print/export cleanly to A4 PDF.
4. **Pilot view** (simple is fine for the prototype): member answers, draft plan, `pilot_flags`, `conditions`. The Pilot can set Pilot conditions (`non_drinker`, `higher_risk_drinking`, `low_mood_flag`, `fall_past_year`), release held practices (`rules.json → pilot_holds`), swap a practice for the next best-scoring one in the same pillar, change a level by one step, then **lock** the plan. Re-run `build_plan(answers, pilot=…)` after changes.
5. **Monthly check-in** (end of months 1 and 2): member marks each focus practice done / partly / not yet / not for me → `build_plan(answers, outcomes=[m1, m2], pilot=…)` gives the next month. Two or more "not yet / not for me" in a month → notify the Pilot.
6. **Mid-Span** (end of month 3): re-ask the baseline questions, Pilot 1:1, choose practices within the four themes for months 4–6 (the prototype can let the Pilot pick from the theme's families).
7. **End of Span**: summary and next steps (out of scope beyond a placeholder).

## Engine integration
- Treat `data/*.json` as configuration; the engine must not hard-code thresholds.
- The engine is deterministic: the same answers, outcomes and Pilot input always give the same plan (tested).
- Port or wrap `engine/goodspan_engine.py`; keep `tests/test_engine.py` passing (or port it).

## Out of scope for the prototype
Payments, community features, notifications delivery, analytics, localisation (English copy only for now; Portugal launch will need Portuguese).
