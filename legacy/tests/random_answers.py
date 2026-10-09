"""Seeded generator of valid answer sets from data/assessment.json (for property tests and demos)."""
import random, json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "engine"))
from goodspan_engine import ASSESS, is_shown

def random_answers(seed):
    rng = random.Random(seed)
    a = {}
    for q in ASSESS["questions"]:
        if q["id"] == "focus":
            r = rng.random()
            a["focus"] = ["im_not_sure_yet"] if r < 0.15 else rng.sample(["eat", "sleep", "move", "mind", "connect"], 1 if r < 0.45 else 2)
            continue
        focus = [x for x in a.get("focus", []) if x != "im_not_sure_yet"]
        if not is_shown(q, a, focus, a.get("focus") == ["im_not_sure_yet"]):
            continue
        if q["type"] == "single":
            a[q["id"]] = rng.choice(q["options"])["id"]
        elif q["type"] == "multi":
            ex = set(q.get("exclusive_options", []))
            pool = [o["id"] for o in q["options"] if o["id"] not in ex]
            k = rng.randint(0, min(len(pool), q.get("max_select") or 3))
            a[q["id"]] = rng.sample(pool, k) if k else ([rng.choice(sorted(ex))] if ex else [])
        elif q["type"] == "grid_single":
            a[q["id"]] = {r["id"]: rng.choice(q["columns"])["id"] for r in q["rows"]}
    return a

if __name__ == "__main__":
    print(json.dumps(random_answers(int(sys.argv[1]) if len(sys.argv) > 1 else 1), indent=2))
