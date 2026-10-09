# Prototype brief (October 2026)

## Users
- **Member**: adult (18+), launch market Portugal. Completes the assessment and follows their Good Span.
- **Pilot**: a coach who reviews each plan at a pre-Span 1:1, at mid-Span and at the end, and can be messaged any time.

## Journey and what exists today
| Step | Status in this repo |
|---|---|
| Sign-up and consent (health data is special category under GDPR) | To build. The prototype only asks for an optional name, email and mobile. |
| Assessment: 52 questions in 9 sections (two shown only when symptoms are reported), about 15 minutes; questions shown only when they apply | Built (`core/questions.js`, `src/app.html`). |
| Draft Good Span shown straight after: Starting Position, priorities, 3 priority practices + up to 3 lighter touches with "Why this is in your Good Span", weekly time, months 2–3 (provisional), months 4–6 themes, foundations, New Position, Your next Good Span, references, disclaimer | Built. |
| "Not right for me" on each practice (Rule 13) | Built (requests kept in the browser). |
| Responses to the team's Google Sheet; saved plan copy link | Built (`scripts/Code.gs`, `worker.js`). |
| Pilot view: answers, plan, `plan.pilot` notes, change requests; Pilot can confirm changes | To build. The engine already returns everything it needs. |
| Monthly check-ins: turn months 2–3 into real CONTINUE / LEVEL UP / SWAP decisions, with Pilot sign-off where the member has a Pilot | To build. |
| Mid-Span: choose practices within the six themes for months 4–6 | To build. |
| Journal for a private personal habit | To build. |
| End of Span: New Position reassessment and Your next Good Span | To build. |
| Accounts and storage per member; audit log of Pilot changes | To build. |

## Engine integration
- The engine is deterministic: same answers → same plan. Keep it that way; no randomness or LLMs in plan generation.
- `docs/RULES.md` is the specification; `core/engine.js` must match it; `npm test` must pass.
- The library workbook is the source of truth for practices; regenerate `core/data.json` with `npm run library`.
- Pilot notes (`plan.pilot`) must never reach a member-facing screen, export or message.

## Out of scope for the prototype
Payments, community features, notification delivery, analytics, localisation (English only for now; the Portugal launch needs Portuguese copy and validated translations of standard questionnaire items: PHQ-4, AUDIT-C).
