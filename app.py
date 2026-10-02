#!/usr/bin/env python3
"""The Good Span — Longevity Map prototype server.

Wraps engine/goodspan_engine.py and serves the member / Pilot UI.
Run: python app.py
"""
from __future__ import annotations

import json
import os
import secrets
import sys
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
PLANS = os.path.join(ROOT, "plans")
sys.path.insert(0, os.path.join(ROOT, "engine"))

from goodspan_engine import (  # noqa: E402
    QUESTIONS,
    RULES,
    build_plan,
    validate_answers,
)
from plan_html import render_plan_html  # noqa: E402

HOLD_IDS = RULES.get("pilot_holds", {}).get("practice_ids", [])
PILOT_CONDITIONS = [
    ("non_drinker", "Non-drinker"),
    ("higher_risk_drinking", "Higher-risk drinking"),
    ("low_mood_flag", "Low mood"),
    ("fall_past_year", "Fall in the past year"),
]


def _json(handler, code, payload):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(code)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(body)


def _clean_answers(raw):
    if not isinstance(raw, dict):
        raise ValueError("answers must be an object")
    return {k: v for k, v in raw.items() if k in QUESTIONS}


def _save_plan_copy(plan, member_name, answers):
    os.makedirs(PLANS, exist_ok=True)
    plan_id = secrets.token_urlsafe(8).replace("-", "").replace("_", "")[:12]
    html_path = os.path.join(PLANS, plan_id + ".html")
    json_path = os.path.join(PLANS, plan_id + ".json")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(render_plan_html(plan, member_name))
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "id": plan_id,
            "memberName": member_name,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "answers": answers,
            "plan": plan,
        }, f, ensure_ascii=False, indent=2)
    return plan_id


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def end_headers(self):
        path = urlparse(self.path).path
        if path.startswith(("/web/", "/data/")) or path in ("/", "/index.html"):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path in ("/", "/index.html"):
            return self._send_file(os.path.join(ROOT, "web", "index.html"), "text/html; charset=utf-8")
        if path.startswith("/web/"):
            return SimpleHTTPRequestHandler.do_GET(self)
        if path.startswith("/data/") or path.startswith("/design/"):
            return SimpleHTTPRequestHandler.do_GET(self)
        if path == "/api/meta":
            return _json(self, 200, {
                "pilot_holds": HOLD_IDS,
                "pilot_conditions": [{"id": i, "label": l} for i, l in PILOT_CONDITIONS],
                "version": "v6",
            })
        return SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length") or 0)
        try:
            data = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            return _json(self, 400, {"error": "Invalid JSON"})

        if path == "/api/validate":
            try:
                answers = _clean_answers(data.get("answers") or {})
            except ValueError as e:
                return _json(self, 400, {"error": str(e)})
            return _json(self, 200, {"errors": validate_answers(answers)})

        if path == "/api/plan":
            try:
                answers = _clean_answers(data.get("answers") or {})
            except ValueError as e:
                return _json(self, 400, {"error": str(e)})
            errs = validate_answers(answers)
            if errs:
                return _json(self, 400, {"error": "Invalid answers", "details": errs})
            try:
                plan = build_plan(answers, data.get("outcomes"), data.get("pilot"))
            except Exception as e:
                return _json(self, 400, {"error": str(e)})
            out = {"plan": plan}
            if data.get("saveCopy"):
                out["planId"] = _save_plan_copy(plan, data.get("memberName") or "", answers)
            return _json(self, 200, out)

        return _json(self, 404, {"error": "Not found"})

    def _send_file(self, path, content_type):
        try:
            with open(path, "rb") as f:
                body = f.read()
        except OSError:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


def main():
    port = int(os.environ.get("PORT", "8899"))
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"The Good Span prototype → http://127.0.0.1:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped")


if __name__ == "__main__":
    main()
