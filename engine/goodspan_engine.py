"""
The Good Span — reference plan engine (v6 assessment).

Pure Python 3.9+, no dependencies. Reads the three data files in ../data:
  assessment.json  questions, option IDs, show-if rules
  practices.json   practice library: families, levels, minutes, exclusions, evidence
  rules.json       every rule the engine applies (weights, bands, maps, holds, flags)

Main entry points
  build_plan(answers, outcomes=None, pilot=None) -> dict
  validate_answers(answers) -> list[str]

`answers` format (keys are question IDs from assessment.json):
  single       -> "option_id"
  multi        -> ["option_id", ...]
  grid_single  -> {"row_id": "column_id", ...}
`outcomes` (optional): list of up to 2 dicts, one per completed month (month 1, month 2),
  mapping family_id -> "done" | "partly" | "not_yet" | "not_for_me". Missing = "done"
  (the projection shown in the first draft assumes every practice is done).
`pilot` (optional): {"conditions": [...], "released": ["practice_id", ...], "add_families": [...]}
  — what the Pilot sets at the pre-Span interview (e.g. "non_drinker", "low_mood_flag").

Rule codes in comments (P3, P5 …) match docs/RULES.md and the Assessment mapping sheet.
This is a reference implementation for building the product; keep behaviour in sync with
rules.json rather than hard-coding values.
"""
from __future__ import annotations
import json, os, statistics
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "data")
LEVELS = ["gentle", "moderate", "deep"]
PILLARS = ["eat", "sleep", "move", "mind", "connect"]


def _load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)


ASSESS = _load("assessment.json")
LIB = _load("practices.json")
RULES = _load("rules.json")
HYG = _load("hygiene_checklist.json")

QUESTIONS = {q["id"]: q for q in ASSESS["questions"]}
FAMILIES = {f["id"]: f for f in LIB["families"]}
FAMILY_ORDER = [f["id"] for f in LIB["families"]]
THEMES = {t["id"]: t for t in LIB["themes"]}
C = RULES["constants"]


def practice(fid, lv):
    return FAMILIES[fid]["levels"][lv]


# ---------------------------------------------------------------- answers
def _get(a, q):
    return a.get(q)


def validate_answers(a):
    """Return a list of problems (unknown question/option IDs, too many selections)."""
    errs = []
    for qid, v in a.items():
        q = QUESTIONS.get(qid)
        if not q:
            errs.append(f"unknown question {qid}")
            continue
        if q["type"] == "single":
            if v not in {o["id"] for o in q["options"]}:
                errs.append(f"{qid}: unknown option {v}")
        elif q["type"] == "multi":
            ids = {o["id"] for o in q["options"]}
            for x in v:
                if x not in ids:
                    errs.append(f"{qid}: unknown option {x}")
            if q.get("max_select") and len(v) > q["max_select"]:
                errs.append(f"{qid}: more than {q['max_select']} selected")
            ex = set(q.get("exclusive_options", []))
            if ex & set(v) and len(v) > 1:
                errs.append(f"{qid}: exclusive option combined with others")
        elif q["type"] == "grid_single":
            rows = {o["id"] for o in q["rows"]}
            cols = {o["id"] for o in q["columns"]}
            for r, c in v.items():
                if r not in rows or c not in cols:
                    errs.append(f"{qid}: unknown row/column {r}/{c}")
    return errs


def weekly_activity_minutes(a):
    days = int(a.get("activity_days", "0") or 0)
    if days == 0:
        return 0
    m = a.get("activity_minutes", "10")
    return days * (150 if m == "150_or_more" else int(m))


def evaluate(expr, a, ctx=None):
    """Evaluate a rule expression from rules.json against answers (+ optional context)."""
    ctx = ctx or {}
    if expr is None:
        return False
    if "all" in expr:
        return all(evaluate(e, a, ctx) for e in expr["all"])
    if "any" in expr:
        return any(evaluate(e, a, ctx) for e in expr["any"])
    if "not" in expr:
        return not evaluate(expr["not"], a, ctx)
    if expr.get("always"):
        return True
    if "condition" in expr:
        return expr["condition"] in ctx.get("conditions", set())
    if "plan_includes_any" in expr:
        return bool(set(expr["plan_includes_any"]) & ctx.get("plan_families", set()))
    if "plan" in expr:
        return bool(ctx.get(expr["plan"]))
    if "computed" in expr:
        val = weekly_activity_minutes(a)
        if "lt" in expr:
            return val < expr["lt"]
        if "gte" in expr:
            return val >= expr["gte"]
    if "q" in expr:
        v = _get(a, expr["q"])
        if "row" in expr:
            v = (v or {}).get(expr["row"])
        if "is" in expr:
            return v == expr["is"]
        if "in" in expr:
            return v in expr["in"]
        if "not_in" in expr:
            return v is not None and v not in expr["not_in"]
        if "has" in expr:
            return expr["has"] in (v or [])
        if "has_any" in expr:
            return bool(set(expr["has_any"]) & set(v or []))
    raise ValueError(f"unsupported expression {expr}")


def is_shown(q, a, focus_pillars, not_sure):
    """Show-if logic for the assessment UI."""
    s = q.get("show_if")
    if not s:
        return True
    if "depth_question_for" in s:
        return not_sure or s["depth_question_for"].lower() in focus_pillars
    return evaluate(s, a)


# ---------------------------------------------------------------- derived facts
def conditions(a, pilot):
    out = set()
    for cid, c in RULES["conditions"].items():
        if cid.startswith("_"):
            continue
        if c["source"] == "assessment" and evaluate(c["when"], a):
            out.add(cid)
    out |= set(pilot.get("conditions", []))
    return out


def baseline(a):
    """Family -> starting level from baseline answers (gentle/moderate/deep/skip)."""
    B = {}
    ls = RULES["level_setting"]
    for r in ls["single"]:
        v = a.get(r["q"])
        if v in r["map"]:
            B[r["family"]] = r["map"][v]
    for r in ls["grid"]:
        v = (a.get(r["q"]) or {}).get(r["row"])
        if v in r["map"]:
            B[r["family"]] = r["map"][v]
    for r in ls["computed"]:
        if "activity_days" in a:
            m = weekly_activity_minutes(a)
            for band in r["bands"]:
                if ("lt" in band and m < band["lt"]) or ("gte" in band and m >= band["gte"]):
                    B[r["family"]] = band["level"]
                    break
    return {f: v for f, v in B.items() if f in FAMILIES}


def already_and_tried(a):
    ad = RULES["already_do"]
    done, tried, not_tried = set(), set(), set()
    for q, m in ad["multi"].items():
        for o in a.get(q, []):
            done |= set(m.get(o, []))
    for q, g in ad["grid"].items():
        for row, col in (a.get(q) or {}).items():
            fams = set(g["rows"].get(row, []))
            if col == g.get("now_column"):
                done |= fams
            elif col == g.get("tried_not_helped_column"):
                tried |= fams
            elif col == g.get("not_tried_column"):
                not_tried |= fams
    return done & set(FAMILIES), tried & set(FAMILIES), not_tried & set(FAMILIES)


def excluded_practices(a, conds, pilot):
    X = set()
    gym_ok = evaluate(RULES["equipment"]["allowed_if"], a)
    for fid, f in FAMILIES.items():
        for lv, p in f["levels"].items():
            if set(p["exclude_if"]) & conds:
                X.add(p["practice_id"])
            if p["equipment_needed"] and not gym_ok:
                X.add(p["practice_id"])
    for opt in a.get("avoid_types", []):
        for pat in RULES["avoid_types"]["excludes"].get(opt, []):
            fid, lv = pat.split(".")
            for l in (LEVELS if lv == "*" else [lv]):
                X.add(f"{fid}.{l}")
    released = set(pilot.get("released", []))
    X |= set(RULES["pilot_holds"]["practice_ids"]) - released
    return X


# ---------------------------------------------------------------- scoring (P5)
FIT = {"Direct": 3, "Reasonable translation": 2, "Indirect support": 1}
STRENGTH = {"Clinical guideline": 3, "Systematic review + meta-analysis": 3, "Meta-review / umbrella review": 3,
            "Systematic review / meta-analysis": 2}


class Planner:
    def __init__(self, a, outcomes=None, pilot=None):
        self.a = a
        self.pilot = pilot or {}
        self.outcomes = outcomes or []
        self.conds = conditions(a, self.pilot)
        self.X = excluded_practices(a, self.conds, self.pilot)
        self.B = baseline(a)
        self.B0 = dict(self.B)  # baselines from questions only (used to rank pillars)
        self.done, self.tried, not_tried = already_and_tried(a)
        if RULES["already_do"]["not_tried_counts_as_gentle_baseline"]:
            for f in not_tried:
                self.B.setdefault(f, "gentle")
        cs = a.get("change_size")
        self.small = cs == RULES["monthly_plan"]["small_steps"]["option"]
        self.bigger = cs == RULES["monthly_plan"]["bigger_challenge"]["option"]
        self.blocked = set()
        self.notes = []
        self.W = RULES["scoring"]
        self._prefs()
        self.top = {p: self._top_goal(p) for p in PILLARS}

    # --- helpers
    def _prefs(self):
        P = RULES["preferences"]
        self.pref = set()
        for q in ("activity_types", "move_places"):
            for o in self.a.get(q, []):
                self.pref |= set(P[q].get(o, []))
        self.wfh = set(P["work_location"].get(self.a.get("work_location"), []))

    def goal_families(self, pillar, option):
        q = RULES["goals"]["by_pillar"][pillar]
        return set(RULES["goals"]["map"].get(q, {}).get(option, []))

    def need(self, f):
        return self.W["room_to_improve"].get(self.B.get(f, "no_baseline"), self.W["room_to_improve"]["no_baseline"])

    def _top_goal(self, pillar):  # P4
        q = RULES["goals"]["by_pillar"][pillar]
        sel = [o for o in self.a.get(q, []) if self.goal_families(pillar, o)]
        if not sel:
            return None
        order = [o["id"] for o in QUESTIONS[q]["options"]]
        return sorted(sel, key=lambda o: (-max(self.need(f) for f in self.goal_families(pillar, o)), order.index(o)))[0]

    def score(self, f):
        W, a, fam = self.W, self.a, FAMILIES[f]
        p = fam["pillar"]
        s = self.need(f)
        for o in a.get(RULES["goals"]["by_pillar"][p], []):
            if f in self.goal_families(p, o):
                s += W["top_goal"] if o == self.top.get(p) else W["other_goal"]
        if p == "sleep":
            for o in a.get("sleep_problems", []):
                if f in RULES["sleep_problems"].get(o, []):
                    s += W["sleep_problem"]
            for o in a.get("sleep_disruptors", []):
                if f in RULES["sleep_disruptors"]["map"].get(o, []):
                    s += W["sleep_disruptor"]
        bq = RULES["barriers"]["by_pillar"].get(p)
        if bq:
            for o in a.get(bq, []):
                if f in RULES["barriers"]["map"].get(bq, {}).get(o, []):
                    s += W["barrier"]
        if f in self.pref:
            s += W["preference"]
        if f in self.wfh:
            s += W["work_from_home"]
        if f == "balance" and a.get("age") in ("60_69", "70_or_over"):
            s += W["age_60_plus_balance"]
        if f in self.tried:
            s += W["tried_not_helped"]
        return s

    def tiebreak(self, f, lv):
        ev = practice(f, lv)
        return (-FIT.get(ev["evidence"]["fit"], 0), -STRENGTH.get(ev["evidence"]["type"], 1), ev["minutes_per_week"], f)

    def pillar_default(self, pillar):
        lv = sorted(LEVELS.index(v) for f, v in self.B.items() if v in LEVELS and FAMILIES[f]["pillar"] == pillar)
        return LEVELS[min(lv[len(lv) // 2], 1)] if lv else "gentle"

    def start_level(self, f):  # P2, P3
        if f in self.blocked:
            return None
        lv = self.B.get(f, self.pillar_default(FAMILIES[f]["pillar"]))
        if lv == "skip":
            return None
        i = LEVELS.index(lv)
        if f in self.done:
            i = max(i, 1)
        if self.small and f not in self.done:
            i = 0
        if self.bigger and not self.small and f not in self.done:
            i = min(i + 1, 2)
        while i >= 0 and f"{f}.{LEVELS[i]}" in self.X:
            i -= 1
        if i < 0 or (f in self.done and i < 1):
            return None
        return LEVELS[i]

    def ranked(self, pillar, exclude=()):
        fs = [f for f in FAMILY_ORDER if FAMILIES[f]["pillar"] == pillar and f not in exclude and self.start_level(f)]
        return sorted(fs, key=lambda f: (-self.score(f),) + self.tiebreak(f, self.start_level(f)))

    def minutes(self, item):
        return practice(item["family_id"], item["level"])["minutes_per_week"]

    # --- focus pillars
    def focus_pillars(self):
        sel = [p.lower() for p in self.a.get("focus", []) if p.lower() in PILLARS]
        if sel:
            return sel[: C["max_focus_pillars"]], False

        def pillar_need(p):
            m = [self.need(f) for f in self.B0 if FAMILIES[f]["pillar"] == p and self.need(f) > 0]
            return (sum(m) / len(m) if m else 6) + 10 * len(self.a.get(RULES["goals"]["by_pillar"][p], []))
        ranked = sorted(PILLARS, key=lambda p: (-pillar_need(p), PILLARS.index(p)))
        return ranked[:2], True

    # --- build
    def build(self):
        focus, suggested = self.focus_pillars()
        others = [p for p in PILLARS if p not in focus]
        sleep_share = set(RULES["sleep_sharing"]["families"])
        used = set()
        slots = []
        for p in focus:  # month-1 focus practices
            r = [f for f in self.ranked(p) if f not in sleep_share]
            tg = self.top.get(p)
            if tg:
                match = [f for f in r if f in self.goal_families(p, tg)]
                if match:
                    r = [match[0]] + [f for f in r if f != match[0]]
            if len(r) > 1:
                t1 = FAMILIES[r[0]]["theme_id"]
                alt = next((f for f in r[1:] if FAMILIES[f]["theme_id"] != t1 and self.score(f) >= C["min_score_for_second_theme_slot"]), None)
                if alt:
                    r = [r[0], alt] + [f for f in r[1:] if f != alt]
            for k, f in enumerate(r[: C["focus_practices_per_focus_pillar"]]):
                slots.append({"pillar": p, "role": "focus", "family_id": f, "level": self.start_level(f), "top_goal": k == 0 and bool(tg)})
                used.add(f)
        n_light = C["practices_per_month"] - len(slots)
        budget = int(C["weekly_budget_minutes"].get(self.a.get("weekly_time"), 120) * C["time_flex"])
        months, flags_time = [], False
        prev = None
        for m in range(1, C["detailed_months"] + 1):
            if m == 1:
                month = [dict(s, change="new") for s in slots]
            else:
                month = []
                outc = self.outcomes[m - 2] if len(self.outcomes) >= m - 1 else {}
                for x in [y for y in prev if y["role"] == "focus"]:
                    month.append(self._next(x, outc.get(x["family_id"], "done"), used, month))
            rot = [others[((m - 1) * n_light + k) % len(others)] for k in range(n_light)] if others else []
            for p in rot:
                r = self.ranked(p, used | {y["family_id"] for y in month})
                if r:
                    f = r[0]
                    lv = self.start_level(f)
                    lt = "gentle" if f"{f}.gentle" not in self.X and f not in self.done else lv
                    used.add(f)
                    month.append({"pillar": p, "role": "light_touch", "family_id": f, "level": lt, "change": "new"})
            month = self._sleep_sharing(month, used)
            month, over = self._fit_time(month, budget, m, used)
            month = self._sleep_sharing(month, used)  # again: time fitting can swap practices
            flags_time |= over
            months.append(month)
            prev = month
        out_months = []
        for i, month in enumerate(months, 1):
            items = []
            for x in month:
                p = practice(x["family_id"], x["level"])
                items.append({"practice_id": p["practice_id"], "family_id": x["family_id"], "family": FAMILIES[x["family_id"]]["name"],
                              "pillar": x["pillar"], "role": x["role"], "top_goal": x.get("top_goal", False), "level": x["level"],
                              "headline": p["headline"], "how_to": p["how_to"], "minutes_per_week": p["minutes_per_week"],
                              "micro": p["minutes_per_week"] <= C["micro_minutes_per_week"], "change": x["change"]})
            out_months.append({"month": i, "practices": items, "total_minutes_per_week": sum(y["minutes_per_week"] for y in items)})
        plan_fams = {x["family_id"] for mm in months for x in mm}
        hyg = self._hygiene()
        refs = []
        for f in sorted(plan_fams):  # family-level evidence for every practice in months 1-3
            for p in FAMILIES[f]["levels"].values():
                refs += [r for r in p["evidence"]["references"] if r not in refs]
        hyg_ids = {h["id"] for h in hyg}
        for item in HYG["items"]:
            if item["id"] in hyg_ids:
                refs += [r for r in item["references"] if r not in refs]
        return {
            "focus_pillars": focus, "focus_suggested": suggested,
            "top_goals": {p: g for p, g in self.top.items() if g},
            "months": out_months,
            "themes_months_4_6": self._themes(focus, others, months),
            "hygiene_priority": hyg,
            "references": sorted(refs),
            "pilot_flags": self._flags(plan_fams, flags_time),
            "conditions": sorted(self.conds),
            "weekly_budget_minutes": budget,
            "notes": self.notes,
        }

    def _next(self, x, outcome, used, month):  # P6
        f, lv = x["family_id"], x["level"]
        i = LEVELS.index(lv)
        base = {"pillar": x["pillar"], "role": "focus", "top_goal": x.get("top_goal", False)}
        if outcome == "done":
            nxt = next((LEVELS[j] for j in range(i + 1, 3) if f"{f}.{LEVELS[j]}" not in self.X), None)
            if nxt:
                return dict(base, family_id=f, level=nxt, change="level_up", prev_level=lv)
            link = RULES["progression"].get("next_family", {}).get(f)  # e.g. building_up_cardio -> weekly_cardio
            if link and link in FAMILIES and link not in used and f"{link}.gentle" not in self.X:
                used.add(link)
                return dict(base, family_id=link, level="gentle", change="level_up", prev_level=lv, prev_family=f)
        elif outcome == "partly":
            return dict(base, family_id=f, level=lv, change="continue")
        elif outcome == "not_yet" and i > 0 and f"{f}.{LEVELS[i-1]}" not in self.X:
            return dict(base, family_id=f, level=LEVELS[i - 1], change="easier")
        if outcome in ("not_for_me", "not_yet"):
            self.blocked.add(f)
            self.tried.add(f)
        alt = next(iter(self.ranked(x["pillar"], used | {y["family_id"] for y in month} | set(RULES["sleep_sharing"]["families"]))), None)
        if alt:
            used.add(alt)
            return dict(base, family_id=alt, level=self.start_level(alt), change="new", top_goal=False)
        return dict(base, family_id=f, level=lv, change="continue")

    def _sleep_sharing(self, month, used):  # P9
        share = set(RULES["sleep_sharing"]["families"])
        if any(x["pillar"] == "sleep" for x in month):
            return month
        for k, x in enumerate(month):
            if x["family_id"] in share:
                alt = next(iter(self.ranked(x["pillar"], used | share | {y["family_id"] for y in month})), None)
                if alt:
                    used.add(alt)
                    month[k] = dict(x, family_id=alt, level="gentle" if f"{alt}.gentle" not in self.X and alt not in self.done else self.start_level(alt))
        return month

    def _fit_time(self, month, budget, m, used):  # P7
        micro = C["micro_minutes_per_week"]
        nonmicro = lambda: sum(self.minutes(x) for x in month if self.minutes(x) > micro)
        k = len(month) - 1
        while nonmicro() > budget and k >= 0:
            x = month[k]
            if self.minutes(x) > micro:
                if x.get("change") == "level_up" and x.get("prev_level"):
                    month[k] = dict(x, family_id=x.get("prev_family", x["family_id"]), level=x["prev_level"], change="continue")
                    self.notes.append(f"Month {m}: {x['family_id']} held at {x['prev_level']} to fit weekly time")
                elif x.get("top_goal") and x["level"] != "gentle" and f"{x['family_id']}.gentle" not in self.X and x["family_id"] not in self.done:
                    month[k] = dict(x, level="gentle")
                elif not x.get("top_goal") and x.get("change") != "continue":
                    alt = next((f for f in self.ranked(x["pillar"], used | {y["family_id"] for y in month} | set(RULES["sleep_sharing"]["families"]))
                                if practice(f, "gentle")["minutes_per_week"] <= micro and f"{f}.gentle" not in self.X and f not in self.done), None)
                    if alt:
                        used.add(alt)
                        month[k] = dict(x, family_id=alt, level="gentle", change="new")
                        self.notes.append(f"Month {m}: {x['family_id']} swapped for micro practice {alt} to fit weekly time")
            k -= 1
        over = nonmicro() > budget
        if not self.small:  # top-up
            k = 0
            while sum(self.minutes(x) for x in month) < C["top_up_below_minutes"] and k < len(month):
                x = month[k]
                i = LEVELS.index(x["level"])
                if x["role"] == "focus" and x.get("change") not in ("continue", "easier") and i < 2 and f"{x['family_id']}.{LEVELS[i+1]}" not in self.X:
                    cand = dict(x, level=LEVELS[i + 1])
                    if nonmicro() - (self.minutes(x) if self.minutes(x) > micro else 0) + self.minutes(cand) <= budget:
                        month[k] = cand
                        continue
                k += 1
        return month, over

    def _themes(self, focus, others, months):  # P14
        never = set(RULES["themes"]["never_theme"])
        def best(p, exclude):
            c = Counter(FAMILIES[x["family_id"]]["theme_id"] for mm in months for x in mm
                        if x["pillar"] == p and FAMILIES[x["family_id"]]["theme_id"] not in exclude)
            if c:
                return c.most_common(1)[0][0]
            r = [f for f in self.ranked(p) if FAMILIES[f]["theme_id"] not in exclude]
            return FAMILIES[r[0]]["theme_id"] if r else None
        out = []
        for p in (focus * 2 if len(focus) == 1 else focus):
            t = best(p, set(out) | never)
            if t:
                out.append(t)
        for p in others:
            if len(out) >= C["themes_months_4_6"]:
                break
            t = best(p, set(out) | never)
            if t:
                out.append(t)
        return [{"theme_id": t, "name": THEMES[t]["name"], "pillar": THEMES[t]["pillar"]} for t in out]

    def _hygiene(self):  # P13
        min_n = C.get("hygiene_min_priority_items", 4)
        max_n = C["hygiene_max_priority_items"]
        out, seen = [], set()
        for item in HYG["items"]:
            trig = RULES["hygiene"]["triggers"].get(item["id"])
            if not trig or trig.get("never_priority"):
                continue
            if evaluate(trig, self.a):
                out.append({"id": item["id"], "text": item["text"], "pillar": item["pillar"]})
                seen.add(item["id"])
                if len(out) >= max_n:
                    return out
        if len(out) < min_n:
            for item in HYG["items"]:
                if item["id"] in seen:
                    continue
                trig = RULES["hygiene"]["triggers"].get(item["id"]) or {}
                if trig.get("never_priority"):
                    continue
                out.append({"id": item["id"], "text": item["text"], "pillar": item["pillar"]})
                seen.add(item["id"])
                if len(out) >= min_n:
                    break
        return out[:max_n]

    def _flags(self, plan_fams, over):
        ctx = {"conditions": self.conds, "plan_families": plan_fams, "over_budget_after_adjustment": over}
        return [{"id": f["id"], "message": f["message"]} for f in RULES["pilot_flags"] if evaluate(f["when"], self.a, ctx)]


def build_plan(answers, outcomes=None, pilot=None):
    errs = validate_answers(answers)
    if errs:
        raise ValueError("; ".join(errs))
    return Planner(answers, outcomes, pilot).build()


if __name__ == "__main__":
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "tests", "fixtures", "example_member.json")
    with open(path, encoding="utf-8") as f:
        print(json.dumps(build_plan(json.load(f)), indent=2, ensure_ascii=False))
