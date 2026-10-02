"""Render design/plan_reference.html from the engine's output for the example member.
Run: python design/render_plan_reference.py  (re-run after changing data or rules)."""
import json, os, sys, html
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "engine"))
from goodspan_engine import build_plan
T = json.load(open(os.path.join(HERE, "brand_tokens.json")))
col = T["colours"]
a = json.load(open(os.path.join(HERE, "..", "tests", "fixtures", "example_member.json")))
p = build_plan(a)
chip = {k: (col[v["bg"]], col[v["text"]]) for k, v in T["pillar_chips"].items()}
LV = {"gentle": 1, "moderate": 2, "deep": 3}
CH = {"new": "New", "level_up": "Level up", "continue": "Continue", "easier": "Easier"}
e = html.escape
def bars(n):
    return "".join(f'<span class="bar" style="height:{h}px;background:{col["plum"] if i < n else "#E5CFC4"}"></span>' for i, h in enumerate((8, 12, 16)))
rows = []
for m in p["months"]:
    rows.append(f'<div class="month"><div class="mhead"><span class="mtitle">Month {m["month"]}</span><span>About {m["total_minutes_per_week"]} minutes a week</span></div>')
    for x in m["practices"]:
        bg, fg = chip[x["pillar"]]
        role = "Focus · top goal" if x["top_goal"] else ("Focus" if x["role"] == "focus" else "Light touch")
        rows.append(f'''<div class="row"><div class="c1"><span class="chip" style="background:{bg};color:{fg}">{x["pillar"].title()}</span><span class="ui">{role}</span></div>
<div><div class="ptitle">{e(x["headline"])}</div><div class="small">{e(x["how_to"])}</div></div>
<div class="c3"><div class="lvl">{bars(LV[x["level"]])}<span>{x["level"].title()}</span></div><span class="small">{x["minutes_per_week"]} min a week</span><span class="tag tag-{x["change"]}">{CH[x["change"]]}</span></div></div>''')
    rows.append('</div>')
themes = "".join(f'<div class="theme" style="background:{chip[t["pillar"]][0]};color:{chip[t["pillar"]][1]}"><span class="ui">{t["pillar"].title()}{" · focus" if t["pillar"] in p["focus_pillars"] else ""}</span><div class="ttitle">{e(t["name"])}</div></div>' for t in p["themes_months_4_6"])
hyg = "".join(f'<li><span class="box"></span>{e(h["text"])}</li>' for h in p["hygiene_priority"]) or "<li>No foundations to add right now.</li>"
refs = "".join(f"<li>{e(r)}</li>" for r in p["references"])
focus = " · ".join(x.title() for x in p["focus_pillars"])
also = " · ".join(x.title() for x in ["eat","sleep","move","mind","connect"] if x not in p["focus_pillars"])
steps = [("✓","Done","Assessment complete","Your answers built this first draft of your plan.",False),
 ("1","Before you start · [Date]","Pre-Span 1:1 check-in","Review your plan together and agree your first month.",True),
 ("2","Months 1–3","Your practices","Six practices a month, with a quick progress update at the end of each month.",False),
 ("3","End of month 3 · [Date]","Mid-Span check-in","A short re-assessment and a 1:1 to see your progress and choose practices for months 4–6.",True),
 ("4","Months 4–6","Your themes","Practices within the four themes you agreed at mid-Span.",False),
 ("5","End of month 6 · [Date]","End-of-Span check-in","Look back on what changed and plan what comes next.",True)]
st = "".join(f'<li class="step"><span class="dot{" done" if n=="✓" else ""}">{n}</span><div><div class="srow"><span class="stitle">{t}</span><span class="ui">{w}</span>{"<span class=pilot>With your Pilot</span>" if pil else ""}</div><div>{x}</div></div></li>' for n,w,t,x,pil in steps)
doc = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Your personalised plan — reference</title><style>
@font-face{{font-family:'BST Bazaine';src:url(assets/BSTBazaineTrial-Thin.otf);font-weight:100}}
@font-face{{font-family:'BST Bazaine';src:url(assets/BSTBazaineTrial-Light.otf);font-weight:300}}
@font-face{{font-family:'BST Bazaine';src:url(assets/BSTBazaineTrial-Regular.otf);font-weight:400}}
@font-face{{font-family:'Archivo';src:url(assets/Archivo-Regular.ttf);font-weight:400}}
html,body{{margin:0;background:{col["cream"]}}}
.page{{width:794px;box-sizing:border-box;padding:72px;margin:0 auto;color:{col["plum"]};font:300 16px/1.55 'BST Bazaine','Helvetica Neue',sans-serif;display:flex;flex-direction:column;gap:44px}}
.ui{{font-family:Archivo,'Helvetica Neue',sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase}}
h1{{margin:0;font-weight:100;font-size:46px;line-height:1.08;max-width:520px}} h2{{margin:4px 0 0;font-weight:100;font-size:32px;line-height:1.15}}
header{{display:flex;justify-content:space-between;align-items:center;padding-bottom:18px;border-bottom:1px solid {col["plum"]}}}
.summary{{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}} .summary div{{background:#fff;border-radius:14px;padding:12px 14px}}
.note{{background:{col["light_blue"]};border-radius:16px;padding:16px 20px}}
ol{{list-style:none;margin:0;padding:0}} .step{{display:grid;grid-template-columns:44px 1fr;gap:14px;padding:12px 0;border-top:1px solid #E5CFC4}}
.dot{{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;border:1px solid {col["plum"]};font-family:Archivo,sans-serif;font-size:13px;box-sizing:border-box}} .dot.done{{background:{col["plum"]};color:{col["cream"]}}}
.srow{{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}} .stitle{{font-weight:400;font-size:18px}}
.pilot{{background:{col["orange"]};color:#000;border-radius:999px;padding:2px 10px;font-family:Archivo,sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase}}
.pilotbox{{border:1px solid {col["plum"]};border-radius:16px;padding:18px 20px;margin-top:16px}}
.month{{margin-top:28px}} .mhead{{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid {col["plum"]};padding-bottom:8px}} .mtitle{{font-weight:100;font-size:28px}}
.row{{display:grid;grid-template-columns:96px 1fr 128px;gap:14px;padding:12px 0;border-bottom:1px solid #E5CFC4}}
.c1{{display:flex;flex-direction:column;gap:6px;align-items:flex-start}} .c3{{display:flex;flex-direction:column;gap:6px;align-items:flex-end;text-align:right}}
.chip{{border-radius:999px;padding:3px 10px;font-family:Archivo,sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase}}
.ptitle{{font-weight:400;font-size:17px;line-height:1.35}} .small{{font-size:15px}} .lvl{{display:flex;align-items:center;gap:6px;font-weight:400;font-size:15px}}
.bar{{display:inline-block;width:5px;border-radius:3px;margin-right:3px;vertical-align:bottom}}
.tag{{border-radius:999px;padding:2px 10px;font-family:Archivo,sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase}}
.tag-new{{background:{col["light_blue"]}}} .tag-level_up{{background:{col["plum"]};color:{col["cream"]}}} .tag-continue,.tag-easier{{border:1px solid {col["plum"]};padding:1px 9px}}
.themes{{display:grid;grid-template-columns:1fr 1fr;gap:12px}} .theme{{border-radius:16px;padding:20px}} .ttitle{{font-weight:100;font-size:26px}}
ul.checks{{list-style:none;padding:0;margin:0}} ul.checks li{{display:flex;gap:12px;padding:10px 0;border-top:1px solid #E5CFC4}} .box{{flex:none;width:16px;height:16px;margin-top:3px;border:1.5px solid {col["plum"]};border-radius:4px}} ol.refs{{font-size:12px;line-height:1.45;padding-left:20px}} ol.refs li{{margin-bottom:6px;overflow-wrap:anywhere}}
.card{{background:#fff;border-radius:18px;padding:22px 24px}} footer{{border-top:1px solid {col["plum"]};padding-top:16px;font-size:13px}}
</style></head><body><div class="page">
<header><img src="assets/tgs-logo-one-line-black.png" alt="The Good Span" style="height:18px"><span class="ui">Your Longevity Map</span></header>
<section><h1>[Member name], here is your plan for the next six months</h1><p style="font-size:18px">Six practices a month for months 1 to 3, then four themes for months 4 to 6.</p>
<div class="summary"><div><div class="ui">Focus</div>{focus}</div><div><div class="ui">Also included</div>{also}</div><div><div class="ui">Your time</div>Budget {p["weekly_budget_minutes"]} min a week</div></div>
<p class="note"><b style="font-weight:400">This is your first draft.</b> Your Pilot will contact you to schedule a 1:1 before you start.</p></section>
<section><h2>Your Span at a glance</h2><ol>{st}</ol><div class="pilotbox"><b style="font-weight:400;font-size:18px">Your Pilot is here whenever you need them</b><br>Between check-ins, reach out to [Pilot name] at any time: [in-app message or email].</div></section>
<section><div class="ui">Months 1–3</div><h2>Your practices</h2>{"".join(rows)}</section>
<section class="card"><h2 style="font-size:26px">How your plan adjusts each month</h2><p>Done → it moves up a level. Partly done → you keep it. Not yet → we make it easier. Not for me → we swap it.</p></section>
<section><div class="ui">Months 4–6</div><h2>Your themes</h2><p>Practices within each theme are chosen with your Pilot at your mid-Span check-in.</p><div class="themes">{themes}</div></section>
<section class="card"><div class="ui">Alongside your plan</div><h2>Your foundations</h2><p>Simple everyday habits that support everything else. They aren't part of your six practices: tick them off when they're in place.</p><ul class="checks">{hyg}</ul></section>
<section><div class="ui">References</div><h2>The science behind your plan</h2><p>Every practice in your plan is based on published research. These are the main sources for the practices and foundations above.</p><ol class="refs">{refs}</ol></section>
<footer>Your Good Span plan is designed to support everyday wellbeing and healthy habits. It’s not a substitute for personalised medical care.</footer>
</div></body></html>'''
open(os.path.join(HERE, "plan_reference.html"), "w", encoding="utf-8").write(doc)
json.dump(p, open(os.path.join(HERE, "..", "tests", "fixtures", "example_member_plan.json"), "w"), indent=2, ensure_ascii=False)
print("wrote design/plan_reference.html and tests/fixtures/example_member_plan.json")
