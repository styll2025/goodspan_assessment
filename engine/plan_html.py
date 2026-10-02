"""Render a standalone HTML copy of a member plan."""
from __future__ import annotations

import html
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TOKENS = json.load(open(os.path.join(ROOT, "design", "brand_tokens.json"), encoding="utf-8"))
COL = TOKENS["colours"]
CHIP = {k: (COL[v["bg"]], COL[v["text"]]) for k, v in TOKENS["pillar_chips"].items()}
PILLARS = ["eat", "sleep", "move", "mind", "connect"]
LV = {"gentle": 1, "moderate": 2, "deep": 3}
CH = {"new": "New", "level_up": "Level up", "continue": "Continue", "easier": "Easier"}
e = html.escape


def _bars(n):
    return "".join(
        f'<span class="bar" style="height:{h}px;background:{COL["plum"] if i < n else "#E5CFC4"}"></span>'
        for i, h in enumerate((8, 12, 16))
    )


def render_plan_html(plan, member_name="There"):
    rows = []
    for m in plan.get("months") or []:
        rows.append(
            f'<div class="month"><div class="mhead"><span class="mtitle">Month {m["month"]}</span></div>'
        )
        for x in m.get("practices") or []:
            bg, fg = CHIP.get(x["pillar"], (COL["plum"], COL["cream"]))
            role = "Focus" if x.get("role") == "focus" else "Light touch"
            rows.append(
                f'<div class="row"><div class="c1"><span class="chip" style="background:{bg};color:{fg}">{e(x["pillar"].title())}</span>'
                f'<span class="ui">{role}</span></div>'
                f'<div><div class="ptitle">{e(x.get("headline") or "")}</div><div class="small">{e(x.get("how_to") or "")}</div></div>'
                f'<div class="c3"><div class="lvl">{_bars(LV.get(x.get("level"), 1))}<span>{e((x.get("level") or "").title())}</span></div>'
                f'<span class="small">{x.get("minutes_per_week", 0)} min a week</span>'
                f'<span class="tag tag-{e(x.get("change") or "new")}">{CH.get(x.get("change"), x.get("change") or "")}</span></div></div>'
            )
        rows.append("</div>")
    themes = "".join(
        f'<div class="theme" style="background:{CHIP.get(t["pillar"], (COL["plum"], COL["cream"]))[0]};color:{CHIP.get(t["pillar"], (COL["plum"], COL["cream"]))[1]}">'
        f'<span class="ui">{e(t["pillar"].title())}{" · focus" if t["pillar"] in plan.get("focus_pillars", []) else ""}</span>'
        f'<div class="ttitle">{e(t["name"])}</div></div>'
        for t in plan.get("themes_months_4_6") or []
    )
    hyg = "".join(f'<li><span class="box"></span>{e(h["text"])}</li>' for h in plan.get("hygiene_priority") or []) or "<li>No foundations to add right now.</li>"
    refs = "".join(f"<li>{e(r)}</li>" for r in plan.get("references") or [])
    focus = " · ".join(x.title() for x in plan.get("focus_pillars") or [])
    also = " · ".join(x.title() for x in PILLARS if x not in (plan.get("focus_pillars") or []))
    steps = [
        ("✓", "Done", "Assessment complete", "Your answers built this first draft of your plan.", False),
        ("1", "Before you start", "Pre-Span 1:1 check-in", "Review your plan together and agree your first month.", True),
        ("2", "Months 1–3", "Your practices", "Six practices a month, with a quick progress update at the end of each month.", False),
        ("3", "End of month 3", "Mid-Span check-in", "A short re-assessment and a 1:1 to see your progress and choose practices for months 4–6.", True),
        ("4", "Months 4–6", "Your themes", "Practices within the four themes you agreed at mid-Span.", False),
        ("5", "End of month 6", "End-of-Span check-in", "Look back on what changed and plan what comes next.", True),
    ]
    st = "".join(
        f'<li class="step"><span class="dot{" done" if n == "✓" else ""}">{n}</span><div>'
        f'<div class="srow"><span class="stitle">{t}</span><span class="ui">{w}</span>'
        f'{"<span class=pilot>With your Pilot</span>" if pil else ""}</div><div>{x}</div></div></li>'
        for n, w, t, x, pil in steps
    )
    name = e(member_name or "There")
    cream, plum, blue, orange = COL["cream"], COL["plum"], COL["light_blue"], COL["orange"]
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{name} — Longevity Map</title>
<style>
@font-face{{font-family:'BST Bazaine';src:url(/design/assets/BSTBazaineTrial-Thin.otf);font-weight:100}}
@font-face{{font-family:'BST Bazaine';src:url(/design/assets/BSTBazaineTrial-Light.otf);font-weight:300}}
@font-face{{font-family:'BST Bazaine';src:url(/design/assets/BSTBazaineTrial-Regular.otf);font-weight:400}}
@font-face{{font-family:'Archivo';src:url(/design/assets/Archivo-Regular.ttf);font-weight:400}}
html,body{{margin:0;background:{cream};color:{plum}}}
.page{{width:min(794px,100%);box-sizing:border-box;padding:48px 24px;margin:0 auto;font:400 16px/1.55 Georgia,serif;display:flex;flex-direction:column;gap:44px}}
.ui{{font-family:Archivo,'Helvetica Neue',sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase}}
h1,h2,.ptitle,.ttitle,.mtitle,.stitle{{font-family:'BST Bazaine',Georgia,serif;word-spacing:.22em}}
h1{{margin:0;font-weight:100;font-size:clamp(32px,6vw,46px);line-height:1.08}}
h2{{margin:4px 0 0;font-weight:100;font-size:32px;line-height:1.15}}
header{{display:flex;justify-content:space-between;align-items:center;padding-bottom:18px;border-bottom:1px solid {plum}}}
.summary{{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}} .summary div{{background:#fff;border-radius:14px;padding:12px 14px}}
.note{{background:{blue};border-radius:16px;padding:16px 20px}}
ol{{list-style:none;margin:0;padding:0}} .step{{display:grid;grid-template-columns:44px 1fr;gap:14px;padding:12px 0;border-top:1px solid #E5CFC4}}
.dot{{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;border:1px solid {plum};font-family:Archivo,sans-serif;font-size:13px}} .dot.done{{background:{plum};color:{cream}}}
.srow{{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}} .stitle{{font-weight:400;font-size:18px}}
.pilot{{background:{orange};color:#000;border-radius:999px;padding:2px 10px;font-family:Archivo,sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase}}
.pilotbox{{border:1px solid {plum};border-radius:16px;padding:18px 20px;margin-top:16px}}
.month{{margin-top:28px}} .mhead{{display:flex;justify-content:space-between;align-items:baseline;gap:12px;border-bottom:1px solid {plum};padding-bottom:8px}} .mtitle{{font-weight:100;font-size:28px}}
.row{{display:grid;grid-template-columns:96px 1fr 128px;gap:14px;padding:12px 0;border-bottom:1px solid #E5CFC4}}
.c1{{display:flex;flex-direction:column;gap:6px;align-items:flex-start}} .c3{{display:flex;flex-direction:column;gap:6px;align-items:flex-end;text-align:right}}
.chip{{border-radius:999px;padding:3px 10px;font-family:Archivo,sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase}}
.ptitle{{font-weight:400;font-size:17px;line-height:1.35}} .small{{font-size:15px}} .lvl{{display:flex;align-items:center;gap:6px;font-weight:400;font-size:15px}}
.bar{{display:inline-block;width:5px;border-radius:3px;margin-right:3px;vertical-align:bottom}}
.tag{{border-radius:999px;padding:2px 10px;font-family:Archivo,sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase}}
.tag-new{{background:{blue}}} .tag-level_up{{background:{plum};color:{cream}}} .tag-continue,.tag-easier{{border:1px solid {plum};padding:1px 9px}}
.themes{{display:grid;grid-template-columns:1fr 1fr;gap:12px}} .theme{{border-radius:16px;padding:20px}} .ttitle{{font-weight:100;font-size:26px}}
ul.checks{{list-style:none;padding:0;margin:0}} ul.checks li{{display:flex;gap:12px;padding:10px 0;border-top:1px solid #E5CFC4}}
.box{{flex:none;width:16px;height:16px;margin-top:3px;border:1.5px solid {plum};border-radius:4px}}
ol.refs{{font-size:12px;line-height:1.45;padding-left:20px}} ol.refs li{{margin-bottom:6px;overflow-wrap:anywhere}}
.card{{background:#fff;border-radius:18px;padding:22px 24px}} footer{{border-top:1px solid {plum};padding-top:16px;font-size:13px}}
@media (max-width:700px){{.summary,.themes,.row{{grid-template-columns:1fr}} .c3{{align-items:flex-start;text-align:left}}}}
</style></head><body><div class="page">
<header><img src="/design/assets/tgs-logo-one-line-black.png" alt="The Good Span" style="height:18px"><span class="ui">Your Longevity Map</span></header>
<section><h1>{name}, here is your plan for the next six months</h1>
<div class="summary"><div><div class="ui">Focus</div>{e(focus)}</div><div><div class="ui">Also included</div>{e(also)}</div></div>
<p class="note"><b style="font-weight:400">Your plan is ready for review.</b> Your Pilot will review it with you in a 1:1 and finalise it together with you before you start.</p></section>
<section><h2>Your Span at a glance</h2><ol>{st}</ol>
<div class="pilotbox"><b style="font-weight:400;font-size:18px">Your Pilot is here when you need them.</b><br>You can reach out to your Pilot anytime between check-ins if you have a question, need some guidance, or want to talk through how things are going.</div></section>
<section><div class="ui">Months 1–3</div><h2>Your practices</h2>{"".join(rows)}</section>
<section class="card"><h2 style="font-size:26px">How your plan evolves each month</h2>
<p>Each month, you'll check in with your Pilot to review your progress and adjust your plan together. Keep what's working, adapt what isn't, and swap anything that doesn't feel right for you.</p></section>
<section><div class="ui">Months 4–6</div><h2>Your themes</h2>
<p>Practices within each theme are chosen with your Pilot at your mid-Span check-in.</p>
<div class="themes">{themes}</div></section>
<section class="card"><div class="ui">Alongside your plan</div><h2>Your foundations</h2>
<p>Simple everyday habits that support everything else. They aren't part of your six practices: tick them off when they're in place.</p>
<ul class="checks">{hyg}</ul></section>
<section><div class="ui">References</div><h2>The science behind your plan</h2>
<p>Every practice in your plan is based on published research. These are the main sources for the practices and foundations above.</p>
<ol class="refs">{refs}</ol></section>
<footer>Your Good Span plan is designed to support everyday wellbeing and healthy habits. It’s not a substitute for personalised medical care.</footer>
</div></body></html>'''
