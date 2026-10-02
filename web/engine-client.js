/* Runs the Python plan engine in the browser when no local /api/plan is available. */
(function (global) {
  const PYODIDE_VERSION = "0.26.4";
  const PYODIDE_INDEX = "https://cdn.jsdelivr.net/pyodide/v" + PYODIDE_VERSION + "/full/";
  const FILES = [
    ["engine/goodspan_engine.py", "/home/pyodide/engine/goodspan_engine.py"],
    ["engine/plan_html.py", "/home/pyodide/engine/plan_html.py"],
    ["data/assessment.json", "/home/pyodide/data/assessment.json"],
    ["data/practices.json", "/home/pyodide/data/practices.json"],
    ["data/rules.json", "/home/pyodide/data/rules.json"],
    ["data/hygiene_checklist.json", "/home/pyodide/data/hygiene_checklist.json"],
    ["design/brand_tokens.json", "/home/pyodide/design/brand_tokens.json"],
  ];
  const FALLBACK_CONDITIONS = [
    { id: "non_drinker", label: "Non-drinker" },
    { id: "higher_risk_drinking", label: "Higher-risk drinking" },
    { id: "low_mood_flag", label: "Low mood" },
    { id: "fall_past_year", label: "Fall in the past year" },
  ];

  function assetUrl(path) {
    return new URL(String(path).replace(/^\//, ""), document.baseURI).href;
  }

  function assetBase() {
    return new URL("design/assets/", document.baseURI).href;
  }

  async function fetchJson(path) {
    const res = await fetch(assetUrl(path), { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load " + path);
    return res.json();
  }

  async function looksLikeApi(res) {
    const type = (res.headers.get("content-type") || "").toLowerCase();
    return res.ok && type.includes("application/json");
  }

  let pyodidePromise = null;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("Could not load the plan engine")); };
      document.head.appendChild(s);
    });
  }

  async function getPyodide() {
    if (pyodidePromise) return pyodidePromise;
    pyodidePromise = (async function () {
      if (!global.loadPyodide) {
        await loadScript(PYODIDE_INDEX + "pyodide.js");
      }
      const pyodide = await global.loadPyodide({ indexURL: PYODIDE_INDEX });
      pyodide.FS.mkdirTree("/home/pyodide/engine");
      pyodide.FS.mkdirTree("/home/pyodide/data");
      pyodide.FS.mkdirTree("/home/pyodide/design");
      for (const pair of FILES) {
        const res = await fetch(assetUrl(pair[0]), { cache: "no-store" });
        if (!res.ok) throw new Error("Could not load " + pair[0]);
        pyodide.FS.writeFile(pair[1], new Uint8Array(await res.arrayBuffer()));
      }
      await pyodide.runPythonAsync(
        "import sys\n" +
        "sys.path.insert(0, '/home/pyodide/engine')\n" +
        "from goodspan_engine import build_plan\n" +
        "from plan_html import render_plan_html\n"
      );
      return pyodide;
    })();
    return pyodidePromise;
  }

  async function buildWithPyodide(payload) {
    const pyodide = await getPyodide();
    pyodide.globals.set("_payload_json", JSON.stringify({
      answers: payload.answers || {},
      outcomes: payload.outcomes || null,
      pilot: payload.pilot || null,
      saveCopy: !!payload.saveCopy,
      memberName: payload.memberName || "",
    }));
    const raw = await pyodide.runPythonAsync(
      "import json\n" +
      "from goodspan_engine import build_plan\n" +
      "from plan_html import render_plan_html\n" +
      "payload = json.loads(_payload_json)\n" +
      "plan = build_plan(payload['answers'], payload.get('outcomes'), payload.get('pilot'))\n" +
      "out = {'plan': plan}\n" +
      "if payload.get('saveCopy'):\n" +
      "    out['html'] = render_plan_html(plan, payload.get('memberName') or '')\n" +
      "json.dumps(out, ensure_ascii=False)\n"
    );
    const data = JSON.parse(raw);
    if (data.html) {
      data.html = data.html.split("/design/assets/").join(assetBase());
    }
    return data;
  }

  const Engine = {
    assetUrl: assetUrl,
    hasLocalApi: false,
    preload: function () {
      if (Engine.hasLocalApi) return Promise.resolve();
      return getPyodide().catch(function () {});
    },
    metaFallback: async function () {
      const rules = await fetchJson("data/rules.json");
      return {
        pilot_holds: ((rules.pilot_holds || {}).practice_ids) || [],
        pilot_conditions: FALLBACK_CONDITIONS,
        version: "v6",
      };
    },
    loadMeta: async function () {
      try {
        const res = await fetch(assetUrl("api/meta"), { cache: "no-store" });
        if (await looksLikeApi(res)) {
          Engine.hasLocalApi = true;
          return res.json();
        }
      } catch (e) {}
      Engine.hasLocalApi = false;
      return Engine.metaFallback();
    },
    loadAssessment: function () {
      return fetchJson("data/assessment.json");
    },
    loadExample: function () {
      return fetchJson("tests/fixtures/example_member.json");
    },
    buildPlan: async function (payload) {
      try {
        const res = await fetch(assetUrl("api/plan"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const type = (res.headers.get("content-type") || "").toLowerCase();
        if (type.includes("application/json")) {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.details ? data.details.join("; ") : (data.error || "Could not build plan"));
          }
          return data;
        }
      } catch (err) {
        if (err && err.message && /Could not build plan|Invalid answers|unknown /.test(err.message)) throw err;
      }
      return buildWithPyodide(payload);
    },
  };

  global.GoodSpanEngine = Engine;
})(window);
