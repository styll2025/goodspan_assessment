// Builds the result page data for one member from their answers, using the current engine for practice choice,
// reasons and safety, and the agreed plan structure on top:
//  - month 1: at most three practices, each traced back to an answer, within the lower end of their time;
//    if they chose areas that are in focus, month 1 starts there and any other focus area follows from month 3
//  - months 2 and 3 add practices one or two at a time, only while the weekly total stays within their time
//  - Movement waits while a symptom is not yet checked by a doctor
// Works in node (require) and in the browser (global buildResult).
(function (root) {
  const AREAS = ['Nutrition', 'Sleep', 'Movement', 'Mind', 'Connection', 'Prevention'];
  const AREA_TXT = { Nutrition: 'how you eat', Sleep: 'your sleep', Movement: 'how much you move', Mind: 'your mental wellbeing', Connection: 'your connections with others', Prevention: 'your long-term health habits' };
  const MORE = { Nutrition: 'Work on how you eat', Sleep: 'Some attention to your sleep', Movement: 'A little more movement', Mind: 'Support for your mental wellbeing', Connection: 'A little more time with others', Prevention: 'Your long-term health habits' };
  const GOALQ = { Nutrition: 'q9', Sleep: 'q18', Movement: 'q27', Mind: 'q33', Connection: 'q38', Prevention: 'q52' };
  const WELL_LABEL = { Nutrition: 'Eating well', Sleep: 'Well supported', Movement: 'Staying active', Mind: 'Habits to protect', Connection: 'Staying connected', Prevention: 'Positive foundations' };
  const LOWER = { '45-60': 45, '1-2h': 60, '2-4h': 120, '4h+': 240, 'varies': 45 };
  const TIME_TXT = { '45-60': 'about 45–60 minutes', '1-2h': '1–2 hours', '2-4h': '2–4 hours', '4h+': 'more than 4 hours', 'varies': 'it varies' };
  const NAME = { 'Weekly cardio': 'Aerobic activity', 'Building up cardio': 'Aerobic activity' };
  const CURRENT = ['Weekly cardio', 'Building up cardio', 'Strength sessions'];   // minutes counted on top of what they already do
  const SAME_JOB = [['Slow breathing', 'Slow breathing to wind down', 'Progressive muscle relaxation'], ['Building up cardio', 'Weekly cardio', 'Activity for better sleep'], ['Balanced plate', 'Protein at meals'], ['Strength sessions', 'Strength volume']];
  const NONE = /^(Nothing in particular|None of these|Prefer not to say)$/;
  const list = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const low = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const refsOf = row => (row && row.ref ? row.ref.split(' | ').map(t => t.trim()).filter(Boolean) : []);
  const clone = o => JSON.parse(JSON.stringify(o));
  const sentences = t => (t || '').match(/[^.!?]+[.!?]+(\s|$)/g)?.map(s => s.trim()) || (t ? [t] : []);
  const NUMW = ['no', 'one', 'two', 'three'];
  // the opening question ("what would you most like to feel different?"): themes it can recognise, and the areas each points to
  const THEMES = {
    energy: { label: 'more energy', areas: ['Sleep', 'Movement'], re: /energ|tired|exhaust|fatigu|drained|sluggish/ },
    sleep: { label: 'better sleep', areas: ['Sleep'], re: /sleep|insomnia|waking|wake up|rested|bed ?time|night/ },
    stress: { label: 'less stress', areas: ['Mind'], re: /stress|overwhelm|pressure|burn ?out|busy|switch off|relax/ },
    mood: { label: 'feeling calmer and happier', areas: ['Mind'], re: /calm|anxi|worr|mood|low|happ|emotion|mental|down\b|peace/ },
    fitness: { label: 'feeling fitter and stronger', areas: ['Movement'], re: /fit|strong|strength|active|exercis|stamina|breath/ },
    ease: { label: 'moving more easily', areas: ['Movement'], re: /stiff|mobil|flexib|move more easily|moving more easily|balance/ },
    food: { label: 'eating better', areas: ['Nutrition'], re: /eat|food|diet|nutrition|cook|sugar|snack|veg|protein|weight/ },
    connection: { label: 'feeling more connected', areas: ['Connection'], re: /lonel|connect|friend|people|family|social|belong|isolat/ },
    health: { label: 'looking after your long-term health', areas: ['Prevention'], re: /health|check|long[- ]term|drink|alcohol|smok|vap|prevent|age well|ageing|aging|memory|sharp/ },
  };
  const themesOf = t => Object.keys(THEMES).filter(k => THEMES[k].re.test((t || '').toLowerCase()));
  // their own words are echoed back only when short and plain: nothing about health conditions, symptoms, medicines or self-harm
  const UNSAFE = /pain|ache|hurt|cancer|diabet|heart|chest|blood|pressure|cholesterol|pregnan|medic|pill|doctor|diagnos|depress|anxiety disorder|suicid|kill|die\b|death|self[- ]harm|eating disorder|anorex|bulimi|weight|fat\b|obes|alcoholi|addict|drug|sex|fuck|shit|damn|\d/i;
  function ownWords(t) {
    if (!t) return '';
    let w = String(t).trim().replace(/\s+/g, ' ').replace(/[.!]+$/, '');
    w = w.replace(/^(i'?d|i would|i want|i'd really|i really want|i would really) (like|love|want)? ?(to )?/i, '').replace(/^(to )/i, '');
    w = w.replace(/\bmy\b/gi, 'your').replace(/\bI'm\b/g, "you're").replace(/\bI am\b/g, 'you are').replace(/\bI\b/g, 'you').replace(/\bme\b/gi, 'you').replace(/\bmyself\b/gi, 'yourself');
    if (w.length < 4 || w.length > 80 || UNSAFE.test(w) || /[<>{}"“”]/.test(w)) return '';
    return w.charAt(0).toLowerCase() + w.slice(1);
  }
  const OO_TXT = { tracking_food: 'tracking what you eat', apps: 'tracking apps', fasting: 'eating windows or fasting', meditation: 'meditation', journalling: 'journalling', early: 'early-morning activities', touch: 'practices involving touch' };
  const OO_AREA = { tracking_food: ['Nutrition'], fasting: ['Nutrition'], meditation: ['Mind', 'Sleep'], journalling: ['Mind', 'Sleep'], early: ['Sleep', 'Movement'], touch: ['Connection'], apps: AREAS };
  const SMALL = { Nutrition: 'how you eat', Sleep: 'more attention to your sleep', Movement: 'more movement', Mind: 'more room for your mental wellbeing', Connection: 'more time with others', Prevention: 'one of your long-term health habits' };
  // goals in a member's own voice: “You picked ‘managing stress’ as a goal” becomes “You told us managing stress matters to you”
  const voice = t => (t || '').replace(/^You picked “([^”]+)” as a goal, and this is a practical way to work on it\./, 'You told us $1 matters to you, and this is a practical way to work on it.')
    .replace(/^You picked “([^”]+)” and “([^”]+)” as goals\./, 'You told us $1 and $2 matter to you.').replace(/^You picked “([^”]+)” as a goal\./, 'You told us $1 matters to you.');

  function buildResult(name, A, env) {
    const { E, DATA, toFeatures, profile } = env;
    A = clone(A);
    const p = toFeatures(A), o = E.plan(clone(p));
    const g = (q, r) => (A[q] || {})[r];
    const held = !!(p.symptoms && !p.symptoms_cleared);
    const lower = LOWER[p.time] || 45;
    const goalsOf = a => (A[GOALQ[a]] || []).filter(x => !NONE.test(x)).map(x => low(x).replace(/\bmy\b/g, 'your').replace(/\bI\b/g, 'you').replace(/\bme\b/g, 'you'));
    const glist = gl => { gl = gl.slice(0, 2); const w = gl.map(x => x.split(' ')[0]); return gl.length > 1 && w.every(v => v === w[0]) ? w[0] + ' ' + list(gl.map(x => x.split(' ').slice(1).join(' '))) : list(gl); };

    // ---- focus areas: the engine's priorities, without Movement while a safety flag is open
    const supported = a => (o.opp[a] >= 1 || p.wish.includes(a)) && !(held && a === 'Movement');
    let focus = o.pri.filter(a => !(held && a === 'Movement') && (supported(a) || a === o.pri[0])).slice(0, 2);
    for (const a of AREAS.slice().sort((x, y) => o.combined[y] - o.combined[x])) { if (focus.length >= (focus.length ? 2 : 1)) break; if (!focus.includes(a) && supported(a)) focus.push(a); }
    if (!focus.length) focus = [o.pri.find(a => !(held && a === 'Movement')) || AREAS.find(a => !(held && a === 'Movement'))];

    // ---- candidates per area: the engine run with that area as the member's choice (same safety, opt-outs and 'never more of' checks)
    const fromArea = a => { const q = clone(p); q.wish = [a]; const r = E.plan(q); return r.months[0].filter(x => x.area === a).map(x => Object.assign(x, { ex: Math.round(r.extraMinutes(x.row)) })); };
    const full = (() => { const q = clone(p); q.__perPillar = 6; const r = E.plan(q); return r.months[0].map(x => Object.assign(x, { ex: Math.round(r.extraMinutes(x.row)) })); })();
    // eating windows only when the answers point to them: they already keep one some of the time
    // screen-free evenings only when they told us screens affect their sleep or they spend a lot of time on social media
    const allowed = x => !(x.fam === 'Daily eating window' && g('q8', 'window') !== 'Sometimes')
      && !(x.fam === 'Screen-free wind-down' && !(A.q19 || []).includes('Screens or technology') && !p.sm_high);

    // the reason must come from what they told us
    function ownWhy(x) {
      const same = o.months[0].find(y => y.fam === x.fam); if (same && same.why !== x.row.why) return voice(same.why);
      if (p.wish.includes(x.area)) return voice(x.why);
      let w = (x.why || '').replace(/^You told us you want to work on [^,]+, and (.)/, (m, c) => c.toUpperCase());
      if (/^You said you'd like to work on/.test(w)) w = x.row.why;
      return voice(w) || x.row.why;
    }
    // traced = the reason names something from their answers, not only the library's general reason (a 'you can do it at home' ending doesn't count)
    const traced = x => { const w = ownWhy(x); return p.wish.includes(x.area) || !(w.startsWith(x.row.why) || /^A well-established habit/.test(w)); };

    // a practice can start at an easier level of the same family when the chosen level doesn't fit their time
    // (only a level with no safety exclusions beyond the chosen one's)
    const minOf = (fam, r) => fam === 'Strength sessions' ? Math.max(0, r.tg - 30 * p.strength) : CURRENT.includes(fam) ? Math.max(0, r.tg - p.mvpa) : r.ex;
    function easier(area, fam, row, room) {
      if (minOf(fam, row) <= room) return row;
      const L = ['Learning', 'Developing', 'Mastering'], xs = row.x || [];
      for (const l of L.slice(0, L.indexOf(row.l))) {
        const r = DATA.lib.find(y => y.p === area && y.f === fam && y.l === l);
        if (r && (r.x || []).every(e => xs.includes(e)) && minOf(fam, r) <= room) return r;
      }
      return null;
    }
    // ---- month 1
    const dropped = new Set();
    const pools = Object.fromEntries(focus.map(a => { const all = fromArea(a).filter(allowed); const pri = all.filter(x => x.role === 'Priority'); all.filter(x => !pri.includes(x)).forEach(x => dropped.add(x.fam)); return [a, pri.length ? pri : all.slice(0, 1)]; }));
    const blocked = [];
    for (const a of Object.keys(pools)) if (!pools[a].length) { delete pools[a]; blocked.push(a); focus = focus.filter(z => z !== a); }
    for (const a of AREAS.slice().sort((x, y) => o.combined[y] - o.combined[x])) {
      if (focus.length >= 1) break; if (pools[a] || (held && a === 'Movement')) continue;
      const all = fromArea(a).filter(allowed), pri = all.filter(x => x.role === 'Priority'); if (pri.length) { pools[a] = pri; focus.push(a); }
    }
    // always two focus pillars: the next pillar with the most opportunity joins (never Movement while a symptom is unchecked)
    for (const a of AREAS.slice().sort((x, y) => o.combined[y] - o.combined[x])) {
      if (focus.length >= 2) break; if (focus.includes(a) || blocked.includes(a) || (held && a === 'Movement')) continue;
      const all = fromArea(a).filter(allowed), pri = all.filter(x => x.role === 'Priority'); if (pri.length) { pools[a] = pri; focus.push(a); }
    }
    const wishF = focus.filter(a => p.wish.includes(a));
    const q0 = A.q0 || {}, firstAreas = q0.first && THEMES[q0.first] ? THEMES[q0.first].areas : [];
    const startAreas = (wishF.length ? wishF : focus).slice().sort((x, y) => (firstAreas.includes(y) ? 1 : 0) - (firstAreas.includes(x) ? 1 : 0)), moved = focus.filter(a => !startAreas.includes(a));
    let pr = [];
    // two recommended practices: one from each starting pillar, or two from the one they chose
    if (startAreas.length > 1) pr = [pools[startAreas[0]][0], pools[startAreas[1]][0]].filter(Boolean);
    else pr = pools[startAreas[0]].slice(0, 2);
    pr = pr.filter((x, i) => i === 0 || traced(x));
    { let t = 0; pr = pr.map(x => { const r = easier(x.area, x.fam, x.row, lower - t); if (!r) return null; if (r !== x.row) { x = Object.assign({}, x, { row: r, ex: minOf(x.fam, r) }); } t += x.ex; return x; }).filter(Boolean); }
    pr = pr.slice(0, 2);
    // fewer than two recommended (a pillar with only one priority practice): take the next priority practice from the other focus pillars
    for (const x0 of [...[...startAreas, ...moved].flatMap(a => pools[a] || []), ...full.filter(x => focus.includes(x.area) && x.pass === 1 && allowed(x))]) {
      if (pr.length >= 2) break; if (pr.some(y => y.fam === x0.fam) || SAME_JOB.some(gr => gr.includes(x0.fam) && gr.some(h => h !== x0.fam && pr.some(y => y.fam === h)))) continue;
      const r = easier(x0.area, x0.fam, x0.row, lower - pr.reduce((t, y) => t + y.ex, 0)); if (r) pr.push(r === x0.row ? x0 : Object.assign({}, x0, { row: r, ex: minOf(x0.fam, r) })); }
    const taken = new Set(pr.map(x => x.fam));
    const sameJob = f => SAME_JOB.some(gr => gr.includes(f) && gr.some(h => h !== f && taken.has(h)));
    // two more practices for the month ahead, optional ("if you have time"): from the starting pillars first, then any pillar waiting.
    // Each must trace back to an answer; ones that fit the remaining time come first, at an easier level if that helps.
    const extras = [];
    { let t = pr.reduce((a, x) => a + x.ex, 0);
      const cand = [...startAreas.flatMap(a => (pools[a] || [])), ...full.filter(x => startAreas.includes(x.area) && x.pass === 1 && allowed(x)), ...moved.flatMap(a => (pools[a] || []))];
      const ok = x => !taken.has(x.fam) && !sameJob(x.fam) && !extras.some(y => y.fam === x.fam);
      // 1) traced to an answer and fits their time; 2) chosen by the rules for that pillar and fits; 3) the rest, at its own time
      for (const pass of [1, 2, 3]) for (const x0 of cand) {
        if (extras.length >= 2) break; if (!ok(x0) || (pass === 1 && !traced(x0))) continue;
        let x = x0; const r = easier(x.area, x.fam, x.row, lower - t);
        if (r) { if (r !== x.row) x = Object.assign({}, x, { row: r, ex: minOf(x.fam, r) }); }
        else if (pass < 3) continue;
        if (!r) x = Object.assign({}, x, { over: true });   // optional and beyond their usual time: shown, but not counted in the plan's time
        extras.push(x); taken.add(x.fam); if (r) t += x.ex;
      } }
    focus = [...startAreas.filter(a => [...pr, ...extras].some(x => x.area === a)), ...moved];

    // ---- what comes next in each focus area
    const toItem = x => ({ area: x.area, fam: x.fam, action: x.row.w, freq: x.row.d + (CURRENT.includes(x.fam) && x.ex ? `. That's about ${x.ex} minutes a week more than you do now` : ''), start: x.row.t, min: x.ex, refs: refsOf(x.row), row: x.row, why: x.why });
    const nextIn = a => {
      const fromPool = (pools[a] || []).filter(x => !taken.has(x.fam));
      const more = full.filter(x => x.area === a && x.pass === 1 && allowed(x));
      // the pillar's own next steps first; practices the engine added only as lighter-touch fillers go last
      const filler = dropped;
      const first = moved.includes(a) ? [...fromPool, ...more] : [...more, ...fromPool];
      const late = x => filler.has(x.fam) && !traced(x);
      const ord = [...first.filter(x => !late(x)), ...first.filter(late)];
      const outL = []; for (const x of ord) if (!taken.has(x.fam) && !sameJob(x.fam) && !outL.some(y => y.fam === x.fam)) outL.push(x);
      return outL;
    };
    const lineup = {};
    for (const a of focus) { lineup[a] = nextIn(a).slice(0, 3).map(toItem); lineup[a].forEach(x => taken.add(x.fam)); }
    const groups = {}; for (const a of AREAS) groups[a] = focus.includes(a) ? 'focus' : (o.opp[a] >= 1 || (held && a === 'Movement') || blocked.includes(a)) ? 'improve' : 'well';
    const laterArea = AREAS.filter(a => groups[a] === 'improve' && !(held && a === 'Movement') && !blocked.includes(a)).map(a => { const x = nextIn(a)[0]; if (x) taken.add(x.fam); return x ? toItem(x) : null; }).filter(Boolean);

    // ---- months 2 and 3, within the lower end of their time; a step can start at an easier level to fit
    let total = pr.reduce((t, x) => t + x.ex, 0);
    function fit(x) {
      const r = easier(x.area, x.fam, x.row, lower - total); if (!r) return null;
      return r === x.row ? x : Object.assign({}, x, { action: r.w, freq: r.d + (CURRENT.includes(x.fam) && minOf(x.fam, r) ? `. That's about ${minOf(x.fam, r)} minutes a week more than you do now` : ''), start: r.t, min: minOf(x.fam, r), refs: refsOf(r), row: r });
    }
    const startQ = [], movedQ = [];
    const L0 = startAreas.map(a => lineup[a] || []);
    for (let i = 0; i < 3; i++) for (const l of L0) if (l[i]) startQ.push(l[i]);
    for (const a of moved) movedQ.push(...(lineup[a] || []));
    const m2 = [], m3 = [], later = [];
    // month 2 adds two at most, one with small steps or when another focus area is waiting, and never more than month 1 began with
    const n2 = Math.min((p.change === 'small' || movedQ.length) ? 1 : 2, pr.length);
    total += extras.filter(x => !x.over).reduce((t, x) => t + x.ex, 0);
    const take = (q, into, n) => { while (q.length && into.length < n) { const x = q.shift(), y = fit(x); if (y) { into.push(y); total += y.min; } else later.push(x); } };
    take(startQ, m2, n2);
    if (movedQ.length) take(movedQ, m3, 1); else take(startQ, m3, 1);
    later.push(...startQ, ...movedQ, ...laterArea);
    const mins1 = pr.reduce((t, x) => t + x.ex, 0);

    // ---- copy
    const prof = profile(A, p);
    const sympt = list((p.symptoms_txt || []).map(s => low(s).replace('pain, tightness or pressure in your chest', 'chest discomfort')));
    const monthOf = a => m2.some(x => x.area === a) ? 2 : m3.some(x => x.area === a) ? 3 : 4;
    let intro1;
    if (held) {
      const mg = goalsOf('Movement');
      intro1 = [`${p.wish.includes('Movement') ? `You told us you'd like to move more${mg.length ? ` and ${glist(mg)}` : ''}. ` : ''}Before we suggest any increase in activity, there's one important thing to discuss with a doctor first, explained just below.`,
        `In the meantime, your answers point to ${list(focus.map(low))}, where focusing now could make a real difference while movement waits.`];
    } else if (wishF.length) {
      const gl = wishF.flatMap(goalsOf);
      let t = `You told us you'd like support with ${list(wishF.map(a => AREA_TXT[a]))}${gl.length ? `, especially ${glist(gl)}` : ''}. That's where your Good Span starts.`;
      for (const a of moved) { const n = monthOf(a); t += ` ${MORE[a]} can follow ${n < 4 ? `from month ${n}` : 'later on'}${a === 'Movement' && p.mvpa >= 100 && p.mvpa < 150 ? ", since you're already close to the guideline" : ', once your first practices feel settled'}.`; }
      intro1 = [t];
    } else {
      const wishWell = p.wish.filter(a => groups[a] === 'well' && !blocked.includes(a)), wishBlocked = p.wish.filter(a => blocked.includes(a));
      intro1 = [`${wishBlocked.length ? `You told us you'd like to work on ${list(wishBlocked.map(a => AREA_TXT[a]))}. With what you've told us about your health, the changes we'd usually suggest there need a health professional's input first. ` : ''}${wishWell.length ? `You told us you'd like to work on ${list(wishWell.map(a => AREA_TXT[a]))}, and your answers show ${wishWell.length > 1 ? "they're" : "it's"} already in a good place. ` : groupsWell(groups) ? 'You have already built some good habits across your everyday life. ' : ''}${list(focus)} ${focus.length > 1 ? 'are the areas' : 'is the area'} where your effort could make the biggest difference to your next steps.`];
    }

    // something worth discussing: anxious or low on more than half the days
    const ph = ['anx1', 'anx2', 'dep1', 'dep2'].map(k => g('q32', k));
    const worst = ph.includes('Nearly every day') ? 'nearly every day' : ph.includes('More than half the days') ? 'on more than half the days' : '';
    const notice = worst ? { title: 'Something worth discussing', text: `You told us you've felt anxious or low ${worst} over the last two weeks. The practices in your Good Span can support you day to day, but they aren't a treatment. When feelings like these last, it's worth talking to your GP or another health professional, alongside your Good Span.` } : null;
    // ---- the opening of Your Good Span: the conclusion first, in one of five situations; the reasoning follows in the Starting Position
    const hi = t => name ? `${name}, ${t}` : cap(t);
    const wellAreas = AREAS.filter(a => groups[a] === 'well'), wellTxt = list(wellAreas.slice(0, 3).map(low));
    const own = ownWords(q0.text);
    const likeOwn = own ? `you'd like ${/^(more|less|fewer|better|a|an|the|some|to)\b/.test(own) ? '' : 'to '}“${own}”` : '';
    const relOO = (p.optout || []).filter(k => OO_TXT[k] && (OO_AREA[k] || []).some(a => startAreas.includes(a)));
    const ooLine = relOO.length ? `You also told us ${list(relOO.map(k => OO_TXT[k]))} ${relOO.length > 1 ? "aren't" : "isn't"} for you, so your starting practices don't rely on ${relOO.length === 2 ? 'either' : relOO.length > 2 ? 'any of them' : 'it'}.` : '';
    const laterLine = moved.map(a => { const n = monthOf(a); return `${MORE[a]} can follow ${n < 4 ? `from month ${n}` : 'later on'}${a === 'Movement' && p.mvpa >= 100 && p.mvpa < 150 ? ", since you're already close to the guideline" : ''}.`; }).join(' ');
    const wishWell = p.wish.filter(a => groups[a] === 'well' && !blocked.includes(a)), wishBlocked = p.wish.filter(a => blocked.includes(a));
    const mindGoals = goalsOf('Mind').map(g => g.replace(/^(managing|handling|dealing with|coping with) /, '')).filter(g => /stress|emotion|worr|anx|mood|low/.test(g));
    let situation, lead, paras;
    if (held) {
      situation = 'safety';
      const mg = goalsOf('Movement')[0];
      lead = hi(p.wish.includes('Movement') ? `you told us you want to ${mg ? mg.replace('cardiovascular ', '').replace(/^(\w+) (general )?(fitness|strength|mobility|balance|performance)/, '$1 your $3') : 'move more'}. One thing comes first.` : 'one thing comes first.');
      paras = [`Because you mentioned ${sympt}${p.symptoms_active ? ' during exercise' : ''}, we'd hold off on increasing your activity until you've discussed it with a doctor.`,
        "That doesn't mean your Good Span has to wait.", `Your answers point to ${list(focus.map(low))} as useful places to start now.`];
    } else if (notice) {
      situation = 'sensitive';
      if (startAreas.includes('Mind') && p.wish.includes('Mind')) {
        lead = hi('your Good Span starts with what matters most to you: feeling better day to day.');
        paras = [`${wellAreas.length ? `You already have strong foundations in ${wellTxt}. But you` : 'You'} told us ${own && (q0.areas || []).includes('Mind') ? `${likeOwn}` : `that ${mindGoals.length ? `${list(mindGoals.slice(0, 2))} ${mindGoals.length > 1 || /s$/.test(mindGoals[0]) && !/stress$/.test(mindGoals[0]) ? 'have' : 'has'} been taking up more space recently` : "you've been feeling anxious or low more often recently"}`}.`];
      } else {
        lead = hi('thank you for being open with us.');
        paras = [`You told us you've been feeling anxious or low more often recently, so your Good Span starts gently, with ${list(startAreas.map(low))}.`];
      }
      if (ooLine) paras.push(ooLine);
      if (laterLine) paras.push(laterLine);
    } else if (!wishF.length && (wishWell.length || wishBlocked.length)) {
      situation = 'unexpected';
      lead = hi('your answers point somewhere slightly different from where you might expect.');
      paras = [[wishWell.length ? `You told us you'd like to work on ${list(wishWell.map(a => AREA_TXT[a]))}, and you already have strong foundations there.` : '',
        wishBlocked.length ? `You told us you'd like to work on ${list(wishBlocked.map(a => AREA_TXT[a]))}. With what you've told us about your health, the changes we'd usually suggest there need a health professional's input first.` : ''].filter(Boolean).join(' '),
        `The clearest opportunity we see is ${list(focus.map(low))}. That's where your effort will count most.`];
    } else if (wishF.length) {
      situation = 'priority';
      const ownFits = own && (q0.areas || []).includes(startAreas[0]);
      lead = hi(`you told us ${ownFits ? likeOwn : `${list(wishF.map(a => AREA_TXT[a]))} ${wishF.length > 1 ? 'matter' : 'matters'} to you`}, so that's where we're starting.`);
      paras = [wellAreas.length ? `You already have strong foundations in ${wellTxt}, and we'll build on what already works.` : "We'll build on what already works, one step at a time."];
      if (wishWell.length) paras.unshift(`${cap(list(wishWell.map(a => AREA_TXT[a])))} already ${wishWell.length > 1 ? 'have' : 'has'} strong foundations, so we're starting with ${AREA_TXT[startAreas[0]]}.`);
      if (ooLine) paras.push(ooLine);
      if (laterLine) paras.push(laterLine);
    } else if (wellAreas.length >= 3) {
      situation = 'doing-well';
      const small = pr[0] && CURRENT.slice(0, 2).includes(pr[0].fam) ? 'more aerobic movement' : SMALL[focus[0]];
      lead = hi("you're already doing a lot right.");
      paras = [`Your answers show strong foundations across much of your everyday life. Rather than giving you more things to do, we think the best place to start is ${small}.`];
    } else {
      situation = 'start';
      lead = hi("here's where we'd start.");
      paras = [`The clearest opportunity we see is ${list(focus.map(low))}. That's where your effort will count most, and we'll build on what already works.`];
    }
    const nPr = pr.length, mTxt = mins1 >= 5 ? `about ${mins1} minutes a week` : mins1 > 0 ? 'a few minutes a week' : 'no extra time set aside';
    const opening = { situation, lead, paras, own,
      starts: [`${cap(NUMW[nPr])} practice${nPr === 1 ? '' : 's'}`, moved.length ? `${startAreas[0]} first` : list(startAreas), mTxt],
      after: "We'll build from there as you discover what works." };

    // Starting Position: a label and one short observation per pillar
    const firstOf = (a, n) => sentences(prof.pillars[a]).slice(0, n || 1).join(' ');
    const spc = {};
    for (const a of AREAS) {
      const gr = groups[a];
      if (gr === 'focus') { const gl = goalsOf(a); spc[a] = ['Your focus', p.wish.includes(a) && gl.length ? `You'd like support with ${glist(gl)}. ${firstOf(a)}` : firstOf(a)]; }
      else if (blocked.includes(a)) spc[a] = ['Worth discussing', `${p.wish.includes(a) ? `You'd like to work on ${AREA_TXT[a]}. ` : ''}With what you've told us about your health, the changes we'd usually suggest here need a health professional's input first.`];
      else if (held && a === 'Movement') spc[a] = ['On hold for now', `${p.wish.includes('Movement') ? "You'd like to move more. " : ''}Because of the ${sympt || 'symptom'} you mentioned, increasing your activity waits until you've spoken to a doctor.`];
      else if (gr === 'improve') spc[a] = ['Worth improving', ((o.reasons[a] || []).find(r => !r.startsWith('You picked')) || firstOf(a))];
      else { const f = firstOf(a); spc[a] = [WELL_LABEL[a], f.length < 70 ? firstOf(a, 2) : f]; }
    }

    // section 3: why each focus area, and what already goes well in it
    const foc = {};
    for (const a of focus) {
      // one wording for how often they've felt anxious or low, so it never contradicts the notice above
      let rs = (o.reasons[a] || []).map(voice).map(t => t.replace(/^You've been feeling anxious or low on [^.]+\./, "Over the last two weeks, you've often felt anxious or low."));
      if (!rs.length) { const q = clone(p); q.wish = [a]; rs = (E.plan(q).reasons[a] || []).slice(); }
      const gl = goalsOf(a);
      if (p.wish.includes(a) && gl.length) rs = [`You'd like support with ${glist(gl)}.`, ...rs.filter(r => !r.startsWith('You picked'))];
      const paras = rs.length > 1 ? [rs[0], rs.slice(1).join(' ')] : rs;
      if (moved.includes(a) && startAreas.length) { const n = monthOf(a); paras.push(`Because your priority is ${AREA_TXT[startAreas[0]]}, this joins your Good Span ${n < 4 ? `in month ${n}` : 'later on'}, once your first practices feel settled.`); }
      foc[a] = { p: paras, well: wellOf(a, A, p).slice(0, 3) };
    }

    // section 4: practice cards
    const prc = [...pr, ...extras].map(x => {
      const curr = CURRENT.includes(x.fam);
      const d = cap(x.row.d), hasMin = /minute/.test(x.row.d);
      const time = /once this month|in the first week of this month/.test(x.row.d) ? '' : curr && x.ex ? `${d}. That's about ${x.ex} minutes a week more than you do now.`
        : x.ex >= 5 ? (hasMin ? `${d}. About ${x.ex} minutes a week in all.` : `${d}, about ${x.ex} minutes a week.`)
        : hasMin ? `${d}.` : x.ex ? `${d}. It only takes a few minutes.` : `${d}. It fits into your day without setting extra time aside.`;
      return { t: NAME[x.fam] || x.fam, a: `${x.row.w} ${x.row.d}.`, min: x.ex, time, make: [x.row.t], why: ownWhy(x) };
    });

    const safety = held ? { title: 'One thing to check first', text: `You mentioned ${sympt}${p.symptoms_active ? ' during exercise' : ''}. Before we suggest increasing your activity, we'd like you to discuss this with a doctor. Your Good Span can still begin with ${list(focus.map(low))}${AREAS.some(a => groups[a] === 'well') ? ' and build on what already goes well' : ''}.` } : null;

    const found = o.foundations.filter(h => h.because).slice(0, 3).map(h => ({ area: h.p, text: h.t, why: h.because }));
    const themes = o.themes.filter(t => focus.includes(t[0])).slice(0, 2).map(t => [t[0], t[1], (DATA.themes || {})[t[1]] || '']);
    const strip = x => { const y = Object.assign({}, x); delete y.row; return y; };
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    return {
      gen: true, opening, name: name || 'You', date, prof, focus, groups, wish: p.wish, change: p.change, safety, notice, found, themes,
      intro1, spc, foc, prc,
      own: p.own_habit && p.own_habit[0] ? { text: p.own_habit[0], shared: p.own_habit[1] === 'share' } : null,   // the member's own practice (q54), private or shared
      practices: [...pr.map(x => Object.assign(x, { rec: true })), ...extras].map(x => ({ rec: !!x.rec, area: x.area, fam: x.fam, action: x.row.w, freq: x.row.d, start: x.row.t, why: ownWhy(x), refs: refsOf(x.row), min: x.ex, over: !!x.over })),
      lineup: Object.fromEntries(Object.entries(lineup).map(([a, v]) => [a, v.map(strip)])), later: [],
      steps: { m2: m2.map(strip), m3: m3.map(strip), later: later.slice(0, 3).map(strip) }, add2: m2.map(x => x.fam), add3: m3.map(x => x.fam),
      mins: mins1, lower, timeTxt: TIME_TXT[p.time] || 'some time', pace: { small: 'Small, easy steps', mid: 'Something in between', big: 'A bigger challenge' }[p.change],
      reasons: Object.fromEntries(focus.map(a => [a, o.reasons[a] || []])), known: { Mind: !!p.mind_shown }
    };
  }
  function groupsWell(groups) { return AREAS.filter(a => groups[a] === 'well').length >= 3; }

  // what is already going well in an area, from their own answers
  function wellOf(a, A, p) {
    const g = (q, r) => (A[q] || {})[r], has = (q, o) => (A[q] || []).includes(o), now = k => g('q17', k) === 'I do this now', W = [];
    if (a === 'Nutrition') {
      if (g('q7', 'veg') === '5 or more portions') W.push('Eating 5 or more portions of vegetables and fruit a day.');
      if (['3–5', 'More than 5'].includes(g('q7', 'cooked'))) W.push(`Cooking ${g('q7', 'cooked') === '3–5' ? '3 to 5' : 'more than 5'} main meals a week at home.`);
      if (['Two', 'All of them'].includes(g('q7', 'protein'))) W.push(`Including protein in ${g('q7', 'protein') === 'Two' ? 'two' : 'all'} of your main meals.`);
      if (['3–5 days a week', '6–7 days a week'].includes(g('q7', 'grains'))) W.push('Eating whole grains on most days.');
      const occ = [['sugary drinks', 'sugary'], ['processed foods', 'processed'], ['added salt', 'salt']].filter(([, k]) => ['Rarely or never', '1–2 days a week'].includes(g('q7', k))).map(x => x[0]);
      if (occ.length) W.push(`Keeping ${list(occ)} occasional.`);
    }
    if (a === 'Sleep') {
      if (['7-8', '8-9'].includes(A.q12)) W.push(`Sleeping ${A.q12 === '7-8' ? '7 to 8' : '8 to 9'} hours a night.`);
      if (now('daylight')) W.push('Getting daylight in the morning.');
      if (now('regular')) W.push('Keeping a regular bedtime and wake time.');
      const room = ['cool', 'dark', 'quiet'].filter(now); if (room.length) W.push(`Keeping your bedroom ${list(room)}.`);
      if (['Before 12pm', '12-3pm', "I don't have caffeine"].includes(A.q15)) W.push(A.q15 === "I don't have caffeine" ? 'Avoiding caffeine.' : 'Finishing caffeine by early afternoon.');
    }
    if (a === 'Movement') {
      if (['8,000-9,999', '10,000 or more'].includes(A.q24)) W.push(`Getting ${A.q24 === '10,000 or more' ? '10,000 or more' : '8,000–10,000'} steps on a typical day.`);
      if (p.strength >= 2) W.push(`Making time for strength training ${p.strength >= 3 ? 'three or more times' : 'twice'} a week.`);
      else if (+A.q20 >= 2) W.push(`Being active on ${A.q20} days a week.`);
      const where = (A.q26 || []).filter(x => x !== 'Other').map(low); if (where.length) W.push(`Staying active ${list(where.map(w => w.replace(/^at a /, 'at a ').replace(/^(outdoors|at home)$/, '$1')))}.`.replace('Staying active gym or studio', 'Staying active at a gym or studio'));
    }
    if (a === 'Mind') {
      if (has('q34', 'Time for hobbies or enjoyable activities')) W.push('Making time for hobbies and activities you enjoy.');
      if (has('q34', 'Time away from work')) W.push('Taking time away from work.');
      if (['2 to 3 hours', 'More than 3 hours'].includes(A.q30)) W.push(`Spending ${A.q30 === '2 to 3 hours' ? '2–3 hours' : 'more than 3 hours'} a week in nature.`);
      if (['Less than 30 minutes', '30-60 minutes', "I don't use social media"].includes(A.q31)) W.push(A.q31 === "I don't use social media" ? 'Staying off social media.' : 'Keeping social media to under an hour a day.');
    }
    if (a === 'Connection') {
      if (g('q36', 'meet') === 'Weekly or more') W.push('Seeing friends or family every week.');
      if (['2-3 times', 'Weekly or more'].includes(g('q36', 'group'))) W.push('Taking part in a group, club or class.');
      if (has('q37', 'Share meals with others')) W.push('Sharing meals with others.');
      if (g('q36', 'volunteer') && g('q36', 'volunteer') !== 'Never') W.push('Volunteering.');
    }
    if (a === 'Prevention') {
      if (!p.smokes && !p.vapes) W.push("Not smoking or vaping.");
      if ((p.audit || 0) < 5) W.push(p.drinks ? 'Keeping alcohol within lower-risk levels.' : 'Not drinking alcohol.');
      if (A.q46 === 'In the past 12 months') W.push('Having your blood pressure checked in the past year.');
    }
    return W;
  }

  // shared with the conversation, so the opening question and the plan read answers the same way
  buildResult.THEMES = THEMES; buildResult.themesOf = themesOf; buildResult.ownWords = ownWords;
  if (typeof module !== 'undefined') module.exports = { buildResult };
  else root.buildResult = buildResult;
})(this);
