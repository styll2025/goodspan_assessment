"""Property tests for the reference engine. Run: python -m pytest tests  (or: python tests/test_engine.py)"""
import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "engine"))
sys.path.insert(0, os.path.dirname(__file__))
from goodspan_engine import build_plan, Planner, FAMILIES, RULES, C, validate_answers
from random_answers import random_answers

N = int(os.environ.get("GS_CASES", "400"))

def check(a, outcomes=None):
    p = build_plan(a, outcomes)
    pl = Planner(a, outcomes)
    probs = []
    months = p["months"]
    for m in months:
        fams = [x["family_id"] for x in m["practices"]]
        if len(fams) != C["practices_per_month"]: probs.append(f"month {m['month']}: {len(fams)} practices")
        if len(set(fams)) != len(fams): probs.append(f"month {m['month']}: duplicate family")
        for x in m["practices"]:
            if x["practice_id"] in pl.X: probs.append(f"excluded practice {x['practice_id']}")
        share = set(RULES["sleep_sharing"]["families"])
        if any(f in share for f in fams) and not any(x["pillar"] == "sleep" for x in m["practices"]):
            probs.append(f"month {m['month']}: sleep sharing without a sleep practice")
        nonmicro = sum(x["minutes_per_week"] for x in m["practices"] if not x["micro"])
        if nonmicro > p["weekly_budget_minutes"] and not any(f["id"] == "time_conflict" for f in p["pilot_flags"]):
            probs.append(f"month {m['month']}: over budget without a Pilot flag")
    pillars = {x["pillar"] for m in months for x in m["practices"]}
    if len(pillars) != 5: probs.append(f"pillars covered: {sorted(pillars)}")
    for pil, g in p["top_goals"].items():
        if pil in p["focus_pillars"]:
            first = next(x for x in months[0]["practices"] if x["pillar"] == pil)
            if first["family_id"] not in pl.goal_families(pil, g) and any(pl.start_level(f) for f in pl.goal_families(pil, g)):
                probs.append(f"{pil}: first practice does not match top goal")
    if len(p["themes_months_4_6"]) != 4 or len({t["theme_id"] for t in p["themes_months_4_6"]}) != 4: probs.append("themes")
    n_hyg = len(p["hygiene_priority"])
    if n_hyg > C["hygiene_max_priority_items"]: probs.append("hygiene > max")
    if n_hyg < C.get("hygiene_min_priority_items", 0): probs.append("hygiene < min")
    if build_plan(a, outcomes) != p: probs.append("not deterministic")
    if a.get("change_size") == "small_steps":
        for x in months[0]["practices"]:
            if x["family_id"] not in pl.done and x["level"] != "gentle": probs.append(f"small steps: {x['practice_id']}")
    return probs

def test_random_members():
    bad = {}
    for seed in range(N):
        a = random_answers(seed)
        assert not validate_answers(a), validate_answers(a)
        pr = check(a)
        if pr: bad[seed] = pr
    assert not bad, json.dumps(dict(list(bad.items())[:5]), indent=1)

def test_outcomes_partly_repeats():
    a = random_answers(7)
    p0 = build_plan(a)
    focus = [x["family_id"] for x in p0["months"][0]["practices"] if x["role"] == "focus"]
    p = build_plan(a, outcomes=[{f: "partly" for f in focus}])
    m2 = {x["family_id"]: x["level"] for x in p["months"][1]["practices"] if x["role"] == "focus"}
    for x in p0["months"][0]["practices"]:
        if x["role"] == "focus":
            assert m2.get(x["family_id"]) == x["level"]

def test_not_for_me_switches_family():
    a = random_answers(11)
    p0 = build_plan(a)
    f = next(x["family_id"] for x in p0["months"][0]["practices"] if x["role"] == "focus")
    p = build_plan(a, outcomes=[{f: "not_for_me"}])
    assert all(x["family_id"] != f for m in p["months"][1:] for x in m["practices"])

def test_example_fixture():
    a = json.load(open(os.path.join(os.path.dirname(__file__), "fixtures", "example_member.json")))
    assert not check(a)

def test_cardio_builds_up_in_steps():
    a = random_answers(3)
    a.update({"focus": ["move"], "move_goals": ["improve_cardiovascular_fitness"], "activity_days": "0", "weekly_time": "more_than_4_hours",
              "change_size": "something_in_between", "move_considerations": ["nothing_in_particular"], "exercise_symptoms": ["none_of_these"],
              "health_conditions": ["none_of_these"], "avoid_types": ["none_of_these"]})
    a.pop("activity_minutes", None)
    p = build_plan(a)
    steps = [next((x["minutes_per_week"] for x in m["practices"] if x["family_id"] in ("building_up_cardio", "weekly_cardio")), None) for m in p["months"]]
    assert steps[0] == 30 and steps == sorted(steps), steps
    for x, y in zip(steps, steps[1:]):
        assert y <= 2 * x + 1, steps   # no jump bigger than about double

if __name__ == "__main__":
    for t in (test_random_members, test_outcomes_partly_repeats, test_not_for_me_switches_family, test_example_fixture, test_cardio_builds_up_in_steps):
        t(); print("PASS", t.__name__)
