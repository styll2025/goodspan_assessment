# Open items (testing phase)

These materials are prepared for testing. Items below are worth keeping in view; none blocks a prototype.

**Content**
- Fruit juice is not in the sugary-drinks question (team decision, deferred).
- Minutes per week are team estimates; review with Pilots during testing.
- English only; the Portugal launch will need Portuguese copy (and validated Portuguese versions of any standard questionnaire items reused).

**Safety review (when a clinician joins)**
"Clinical sign-off" means a qualified clinician reviewing the parts of the system that affect member safety, before it is used with real members outside a supervised test:
- the health-check questions (exercise symptoms, conditions, pregnancy) and the rule that removes vigorous practices;
- the exclusion rules in `practices.json` (`exclude_if`) and the Pilot holds (P11);
- the Pilot interview guide's "Ask every member" questions, safety table and referral routes;
- the wording of practices that touch health conditions (alcohol, eating windows, intervals).
For testing now: keep tests supervised by a Pilot, and route any safety concern to the Pilot as the guide describes.

**Evidence**
- Two sources need manual checks (Gollwitzer & Sheeran 2006 is not in PubMed; the "7 hours" figure in Watson 2015 is from the full statement). Huang 2017 and Vohs 2013 have a co-author later found to have committed research misconduct elsewhere; neither paper is retracted as far as known — confirm.

**Engine**
- The reference engine is a specification in code, not production code: add persistence, input validation at the API boundary and audit logging of Pilot changes.
