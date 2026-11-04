// Builds the result page data for one member from their answers, using the current engine for practice choice,
// reasons and safety, and the agreed plan structure on top:
//  - month 1: at most three practices, each traced back to an answer, within the lower end of their time;
//    if they chose areas that are in focus, month 1 starts there and any other focus area follows from month 3
//  - months 2 and 3 add practices one or two at a time, only while the weekly total stays within their time
//  - Movement waits while a symptom is not yet checked by a doctor
// Works in node (require) and in the browser (global buildResult).
(function (root) {
  const AREAS = ['Nutrition', 'Sleep', 'Movement', 'Mind', 'Connection', 'Prevention'];
  const AREA_TXT = { Nutrition: 'how you eat', Sleep: 'your sleep', Movement: 'your movement', Mind: 'your mental wellbeing', Connection: 'your connections with others', Prevention: 'your long-term health habits' };
  const MORE = { Nutrition: 'Work on how you eat', Sleep: 'Some attention to your sleep', Movement: 'A little more movement', Mind: 'Support for your mental wellbeing', Connection: 'A little more time with others', Prevention: 'Your long-term health habits' };
  const GOALQ = { Nutrition: 'q9', Sleep: 'q18', Movement: 'q27', Mind: 'q33', Connection: 'q38', Prevention: 'q52' };
  const WELL_LABEL = { Nutrition: 'Eating well', Sleep: 'Well supported', Movement: 'Staying active', Mind: 'Habits to protect', Connection: 'Staying connected', Prevention: 'Positive foundations' };
  const LOWER = { '45-60': 45, '1-2h': 60, '2-4h': 120, '4h+': 240, 'varies': 45 };
  const TIME_TXT = { '45-60': 'about 45–60 minutes', '1-2h': '1–2 hours', '2-4h': '2–4 hours', '4h+': 'more than 4 hours', 'varies': 'it varies' };
  const NAME = { 'Weekly cardio': 'Aerobic activity', 'Building up cardio': 'Aerobic activity' };
  const CURRENT = ['Weekly cardio', 'Building up cardio', 'Strength sessions'];   // minutes counted on top of what they already do
  const SAME_JOB = [['Slow breathing', 'Slow breathing to wind down', 'Progressive muscle relaxation'], ['Building up cardio', 'Weekly cardio', 'Activity for better sleep'], ['Balanced plate', 'Protein at meals'], ['Strength sessions', 'Strength volume']];
  const NONE = /^(Nothing in particular|None of these|Prefer not to say|Something else)$/;
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
  const voice = t => (t || '').replace(/\bmyself\b/g, 'yourself').replace(/\b(the time) I want\b/g, '$1 you want').replace(/^You picked “([^”]+)” as a goal, and this is a practical way to work on it\./, 'You told us $1 matters to you, and this is a practical way to work on it.')
    .replace(/^You picked “([^”]+)” and “([^”]+)” as goals\./, 'You told us $1 and $2 matter to you.').replace(/^You picked “([^”]+)” as a goal\./, 'You told us $1 matters to you.');


  // ---- "About you": the Personal Assessment Summary. A heading and two short paragraphs that reflect the member's
  // answers back to them: their lifestyle today, then what matters to them and where their Good Span starts.
  // buildResult writes a rule-based version so the section never depends on AI. The conversation sends storyFacts plus
  // the member's answers to /api/story, which asks Claude for a fuller reflection written to the brief in server/ai-story.js.
  const SENSITIVE = /anxious|\blow\b|depress|worr|alcohol|drink|smok|vap|pregnan|breastfeed|condition|blood pressure|doctor|symptom|pain|injur|\bfall|hearing|hot flush|night sweat|weight|medic|chest|dizz|breath|kidney|diabet|heart/i;
  const lcFirst = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  const PACE = { small: 'small, easy steps', mid: "a steady pace that isn't too gentle", big: 'a bigger challenge' };
  const HEAD = { 'doing-well': 'Building on the habits you already have', priority: 'Starting with what matters most to you', safety: 'A careful start, built around you',
    sensitive: 'Making more room for yourself', unexpected: 'A slightly different place to start', start: 'Where your answers point' };
  function storyFacts(name, A, p, r) {
    const line = x => `${x.area}: ${x.title || NAME[x.fam] || x.fam} (${x.action} ${x.freq}. Time: ${(x.time ? (x.time.startsWith(cap(x.freq) + '.') ? x.time.slice(x.freq.length + 1).trim() : x.time) : (x.min ? `about ${x.min} minutes a week` : 'no extra time')).replace(/\.$/, '') || 'no extra time'}${x.note ? '. ' + x.note : ''})`;
    const well = [];
    for (const a of r.focus) for (const w of ((r.foc[a] || {}).well || [])) if (!SENSITIVE.test(w)) well.push(w.replace(/\.$/, ''));
    return {
      name: name || '', situation: (r.opening && r.opening.situation) || 'start',
      time: r.timeTxt, pace: PACE[p.change] || '',
      enjoys: (A.q58 || []).filter(x => x !== 'None of these' && x !== 'Something else').map(x => lcFirst(x).replace(/\bmy\b/g, 'your')),
      avoid: (A.q57 || []).filter(x => x !== 'None of these' && x !== 'Something else').map(lcFirst),
      wants: (p.wish || []).map(a => AREA_TXT[a]),
      wellAreas: AREAS.filter(a => r.groups[a] === 'well'), improveAreas: AREAS.filter(a => r.groups[a] === 'improve'),
      goingWell: [...new Set(well)].slice(0, 5),
      focus: r.focus.slice(),
      firstPractices: r.prc.slice(0, 2).map(c => c.t),
      // the plan itself, so the summary can explain its direction: recommended now, if there's time, then months 2 and 3
      plan: { start: r.practices.filter(x => x.rec).map(line), ifTime: r.practices.filter(x => !x.rec).map(line),
        totals: r.maintain ? [`No recommended practices: all ${r.practices.length} are optional, about ${r.minsOpt} minutes a week if they try all of them.`] : [`${r.unsure ? 'Suggested practices' : 'Recommended practices'}: ${r.practices.filter(x => x.rec).length}, ${r.mins ? (r.act && r.act.build ? `about ${roundMin(r.act.extra)} additional minutes a week at first, building to up to ${r.mins} additional by the end of month 1` : `about ${r.mins} additional minutes a week`) : 'no extra time'}${r.act ? ` (activity: about ${r.act.base} minutes a week now, a weekly total of about ${r.act.total}${r.act.build ? ` at first and ${r.act.total2} by the end of month 1` : ''})` : ''}. Optional practices if they have time: ${r.practices.filter(x => !x.rec).length}${r.minsOpt ? `, about ${r.minsOpt} minutes a week more (about ${r.mins + r.minsOpt} additional minutes in all with them)` : r.practices.some(x => !x.rec) ? ', no extra time' : ''}.`],
        month2: r.steps.m2.map(x => x.area + ': ' + (NAME[x.fam] || x.fam)), month3: r.steps.m3.map(x => x.area + ': ' + (NAME[x.fam] || x.fam)),
        basics: (r.found || []).map(h => `${h.area}: ${h.text}`) },
      // health and safety, as flags only: the summary may acknowledge them in general terms, never name them
      checkFirst: !!r.safety, wellbeingNote: !!r.notice
    };
  }
  function storyOf(f) {
    const lc = a => a.toLowerCase();
    const strengths = f.wellAreas.length ? `You already have a lot in place: ${list(f.wellAreas.map(lc))} ${f.wellAreas.length > 1 ? 'are' : 'is'} in a good place${f.goingWell.length ? `, and habits such as ${list(f.goingWell.slice(0, 2).map(lcFirst))} give you a steady base` : ''}.` :
      f.goingWell.length ? `You already have some useful habits in place, such as ${list(f.goingWell.slice(0, 2).map(lcFirst))}.` : 'Your answers give a clear picture of where you are today.';
    const opps = ` Your answers suggest that ${list(f.focus.map(lc))} ${f.focus.length > 1 ? 'offer' : 'offers'} the clearest opportunities right now${f.improveAreas.length ? `, with some room to build in ${list(f.improveAreas.map(lc))} later on` : ''}.`;
    const want = f.wants.length ? `You'd most like to work on ${list(f.wants)}.` : "You weren't sure where to start, so we've let your answers lead.";
    const pref = [f.enjoys.length ? `you enjoy ${list(f.enjoys.slice(0, 3))}` : '', f.avoid.length ? `you'd rather not do ${list(f.avoid.slice(0, 2))}` : ''].filter(Boolean);
    const prefs = pref.length ? ` We've kept in mind that ${pref.join(', and that ')}.` : '';
    const pace = { 'small, easy steps': ', starting with small, easy steps', "a steady pace that isn't too gentle": ' at a steady pace', 'a bigger challenge': ", and ready for a bigger challenge" }[f.pace] || '';
    const how = ` With ${f.time} a week${pace}, your Good Span starts where your answers and your priorities meet${f.checkFirst ? ', and it takes into account what you told us about your health' : ''}.`;
    return { heading: HEAD[f.situation] || HEAD.start, paras: [strengths + opps, want + prefs + how] };
  }

  // ---- weekly time, from the practice's own frequency and duration (never a stored estimate when the instruction gives both)
  // "for 5 minutes on each of 3 days a week" = 15; "for 1–2 minutes, once a day" = about 10; "3 days a week at first, building to 5" = the starting amount
  function weekMin(row) {
    if (!row) return null;
    const d = String(row.d || ''), w = String(row.w || '');
    const tot = /(\d+) minutes a week/.exec(d); if (tot) return +tot[1];
    const DUR = /(\d+)(?:[–-](\d+))? minutes?\b(?! (?:before|after|earlier|later))/;   // "30 minutes before it" is a time, not a duration
    const dm = DUR.exec(d) || DUR.exec(w);
    if (!dm) return null;
    const dur = dm[2] ? (+dm[1] + +dm[2]) / 2 : +dm[1];
    let f = perWeek(d);
    if (/each main meal/.test(w + ' ' + d)) f *= 3;
    if (/twice (?:a day|each)/.test(d)) f *= 2;
    return Math.round(dur * f);
  }
  // how many times a week an instruction's frequency means
  function perWeek(d) {
    const n = /(\d+)(?:[–-]\d+)? (?:days|times|nights|evenings|of your main sleeps)\b(?! a month)/.exec(d);
    if (n) return +n[1];
    if (/every 2 weeks|fortnight/.test(d)) return 0.5;
    if (/month/.test(d)) return 0.25;
    if (/twice a week/.test(d)) return 2;
    if (/each working day|every weeknight|weekday|most nights/.test(d)) return 5;
    if (/once a day|every day|each day|every night|every morning|every time you|a day\b/.test(d)) return 7;
    return 1;
  }
  const roundMin = m => m >= 10 ? Math.round(m / 5) * 5 : m;

  function buildResult(name, A, env) {
    const { E, DATA, toFeatures, profile } = env;
    A = clone(A);
    const p = toFeatures(A), o = E.plan(clone(p));
    const g = (q, r) => (A[q] || {})[r];
    const held = !!(p.symptoms && !p.symptoms_cleared);
    const lower = LOWER[p.time] || 45;
    const goalsOf = a => (A[GOALQ[a]] || []).filter(x => !NONE.test(x)).map(x => low(x).replace(/\bmyself\b/g, 'yourself').replace(/\bmy\b/g, 'your').replace(/\bI\b/g, 'you').replace(/\bme\b/g, 'you'));
    // after "support with": "improve performance" reads as "improving performance"
    const GER = { improve: 'improving', build: 'building', increase: 'increasing', become: 'becoming', reduce: 'reducing', keep: 'keeping', make: 'making', eat: 'eating', stop: 'stopping', protect: 'protecting', drink: 'drinking', breathe: 'breathing', spend: 'spending', take: 'taking' };
    const ger = t => t.replace(/^(\w+)/, w => GER[w] || w);
    const glist = gl => { gl = gl.slice(0, 2); const w = gl.map(x => x.split(' ')[0]); return gl.length > 1 && w.every(v => v === w[0]) ? w[0] + ' ' + list(gl.map(x => x.split(' ').slice(1).join(' '))) : list(gl); };

    // ---- focus areas: the engine's priorities, without Movement while a safety flag is open
    const supported = a => (o.opp[a] >= 1 || p.wish.includes(a)) && !(held && a === 'Movement');
    let focus = o.pri.filter(a => !(held && a === 'Movement') && (supported(a) || a === o.pri[0])).slice(0, 2);
    for (const a of AREAS.slice().sort((x, y) => o.combined[y] - o.combined[x])) { if (focus.length >= (focus.length ? 2 : 1)) break; if (!focus.includes(a) && supported(a)) focus.push(a); }
    if (!focus.length) focus = [o.pri.find(a => !(held && a === 'Movement')) || AREAS.find(a => !(held && a === 'Movement'))];
    // the areas they chose come first, even where their answers already look fine (the engine ranks by need)
    focus = [...new Set([...p.wish.filter(a => AREAS.includes(a) && supported(a)), ...focus])].slice(0, 2);
    // no priority chosen: we don't infer a second priority from a minor signal (for example 6-7 hours of sleep with no difficulties)
    const unsure = !p.wish.length, clear = a => p.wish.includes(a) || o.opp[a] >= 2;
    // ...and sleep isn't put forward when they report no sleep difficulty and sleep 6 hours or more
    const sleepIssue = (A.q13 || []).some(x => !NONE.test(x)) || p.sleep_h < 6;
    if (unsure && !sleepIssue && focus.includes('Sleep')) {
      focus = focus.filter(a => a !== 'Sleep');
      if (!focus.length) { const b = AREAS.filter(a => a !== 'Sleep' && !(held && a === 'Movement') && (o.opp[a] || 0) >= 1).sort((x, y) => o.opp[y] - o.opp[x])[0]; focus = [b || AREAS.filter(a => a !== 'Sleep').sort((x, y) => o.combined[y] - o.combined[x])[0]]; }
    }
    if (unsure) focus = focus.filter((a, i) => i === 0 || clear(a));
    // nothing to fix anywhere and no priority: maintenance, everything optional
    const maintain = unsure && AREAS.every(a => (o.opp[a] || 0) < 1);

    // ---- candidates per area: the engine run with that area as the member's choice (same safety, opt-outs and 'never more of' checks)
    const exOf = (r, x) => CURRENT.includes(x.fam) ? Math.round(r.extraMinutes(x.row)) : (weekMin(x.row) ?? Math.round(r.extraMinutes(x.row)));
    const fromArea = a => { const q = clone(p); q.wish = [a]; const r = E.plan(q); return r.months[0].filter(x => x.area === a).map(x => Object.assign(x, { ex: exOf(r, x) })); };
    const full = (() => { const q = clone(p); q.__perPillar = 6; const r = E.plan(q); return r.months[0].map(x => Object.assign(x, { ex: exOf(r, x) })); })();
    const ALCOHOL = ['Alcohol and sleep', 'Alcohol-free swaps', 'Alcohol intake'];
    const alcAsked = (p.goals.Prevention || []).includes('alcohol') || (A.q19 || []).includes('Alcohol') || (p.sleep_disrupt || []).includes('Alcohol and sleep');
    const DEFICIT = ['Self-compassion', 'Reframing', 'Naming emotions', 'Using your own name', 'Problem-solving steps', 'Expressive writing', 'Feelings check-ins', 'Opening up'];
    // eating windows only when the answers point to them: they already keep one some of the time
    // screen-free evenings only when they told us screens affect their sleep or they spend a lot of time on social media
    const allowed = x => !(x.fam === 'Daily eating window' && g('q8', 'window') !== 'Sometimes')
      && !(x.fam === 'Screen-free wind-down' && !(A.q19 || []).includes('Screens or technology') && !p.sm_high)
      // hours that change from week to week: no practice built on a fixed bedtime and wake time (shift work is already excluded in the library)
      && !(p.irregular && x.fam === 'Consistent sleep timing')
      // early-morning activities ruled out: no morning-daylight practice
      && !(x.fam === 'Morning daylight' && (p.optout || []).includes('early'))
      // caring that interrupts their nights: no practice built on keeping to a fixed bedtime
      && !(p.carer && x.fam === 'Consistent sleep timing')
      // alcohol practices only when drinking is more than occasional and moderate, or they asked
      && !(ALCOHOL.includes(x.fam) && !alcAsked && (p.audit || 0) < 5)
      // walking for sleep only when they're below the activity guideline; otherwise it adds exercise without a reason
      && !(x.fam === 'Activity for better sleep' && p.mvpa >= 150)
      // maintenance: no practice framed around difficulty when nothing needs fixing
      // strength skipped in their answers: no strength gap inferred
      && !(p.strength_unknown && ['Strength sessions', 'Strength volume'].includes(x.fam) && !(p.goals.Movement || []).some(g => ['strength', 'fitness', 'performance'].includes(g)))
      && !(maintain && (DEFICIT.includes(x.fam) || ['Habit building', 'If-then planning'].includes(x.fam)));

    // the reason must come from what they told us
    function ownWhy(x) {
      if (x.whyFixed) return x.why;
      // a wind-down practice offered to someone whose difficulty isn't falling asleep: an optional way to settle, nothing more
      const onsetIssue = (A.q13 || []).includes('It takes me a long time to fall asleep') || (p.goals.Sleep || []).includes('fall_asleep');
      if (['Slow breathing to wind down', 'Progressive muscle relaxation', 'Bedtime music'].includes(x.fam) && !onsetIssue) {
        const enjoy = (((x.why || '') + ' ' + ((o.months[0].find(y => y.fam === x.fam) || {}).why || '')).match(/It(?:'s| is)? also [^.]+\./) || [''])[0];
        return `An optional way to wind down before sleep, if it suits you.${enjoy ? ' ' + enjoy : ''}`;
      }
      const same = o.months[0].find(y => y.fam === x.fam); if (same && same.why !== x.row.why) return voice(same.why);
      if (p.wish.includes(x.area)) {
        // "you'd like to work on your mental wellbeing" says less than what they actually asked for: use their goals
        const gl = goalsOf(x.area);
        if (gl.length && /^You said you'd like to work on [^;]+; this is a well-supported place to start\./.test(x.why || '')) return voice(x.why.replace(/^You said you'd like to work on [^;]+; this is a well-supported place to start\./, `You told us ${glist(gl.map(ger))} ${gl.length > 1 ? 'matter' : 'matters'} to you, and this is a well-supported place to start.`));
        return voice(x.why);
      }
      let w = (x.why || '').replace(/^You told us you want to work on [^,]+, and (.)/, (m, c) => c.toUpperCase());
      if (/^You said you'd like to work on/.test(w)) w = x.row.why;
      return voice(w) || x.row.why;
    }
    // traced = the reason names something from their answers, not only the library's general reason (a 'you can do it at home' ending doesn't count)
    const traced = x => { const w = ownWhy(x); return p.wish.includes(x.area) || !(w.startsWith(x.row.why) || /^A well-established habit/.test(w)); };

    // a practice can start at an easier level of the same family when the chosen level doesn't fit their time
    // (only a level with no safety exclusions beyond the chosen one's)
    const minOf = (fam, r) => fam === 'Strength sessions' ? Math.max(0, r.tg - 30 * p.strength) : CURRENT.includes(fam) ? Math.max(0, r.tg - p.mvpa) : (weekMin(r) ?? r.ex);
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
    // an area they chose, where the engine finds nothing because their answers there look fine: practices for the goals they picked
    // (easiest level, no health exclusions, nothing they already do, tried or opted out of)
    const OO_FAM = { meditation: /Meditation|Present-moment/, journalling: /writing|Three good things|to-do|Best possible/, early: /Morning daylight/, touch: /touch/ };
    const goalPool = a => (p.goals[a] || []).flatMap(g => ((DATA.goals[a] || {})[g] || []).map(f => [g, f]))
      .filter(([g, f], i, arr) => arr.findIndex(y => y[1] === f) === i && !(p.doing || []).includes(f) && !(p.tried || []).includes(f) && !(p.nofit || []).includes(f) && !(p.optout || []).some(k => OO_FAM[k] && OO_FAM[k].test(f))
        && !(p.not_working && /Time away from work|Micro-breaks|Focused work/.test(f)) && !(f === 'Time in nature' && A.q30 && A.q30 !== 'Less than 30 minutes'))
      .map(([g, f]) => { const row = DATA.lib.find(y => y.p === a && y.f === f && (y.l === 'Learning' || y.l === 'All levels')); if (!row || (row.x || []).length) return null;
        const label = (A[GOALQ[a]] || []).filter(x => !NONE.test(x))[(p.goals[a] || []).indexOf(g)] || '';
        return { area: a, fam: f, row, role: 'Priority', why: `You told us ${low(label).replace(/\bmyself\b/g, 'yourself').replace(/\bmy\b/g, 'your')} matters to you, and this is a practical way to work on it.`, ex: weekMin(row) ?? row.ex ?? 0 }; })
      .filter(x => x && allowed(x));
    const pools = Object.fromEntries(focus.map(a => { const all = fromArea(a).filter(allowed); const pri = all.filter(x => x.role === 'Priority'); all.filter(x => !pri.includes(x)).forEach(x => dropped.add(x.fam));
      if (!pri.length && p.wish.includes(a)) { const gp = goalPool(a); if (gp.length) return [a, gp]; }
      return [a, pri.length ? pri : all.slice(0, 1)]; }));
    const blocked = [];
    for (const a of Object.keys(pools)) if (!pools[a].length) { delete pools[a]; blocked.push(a); focus = focus.filter(z => z !== a); }
    for (const a of AREAS.slice().sort((x, y) => o.combined[y] - o.combined[x])) {
      if (focus.length >= 1) break; if (pools[a] || (held && a === 'Movement') || (unsure && a === 'Sleep' && !sleepIssue)) continue;
      const all = fromArea(a).filter(allowed), pri = all.filter(x => x.role === 'Priority'); if (pri.length) { pools[a] = pri; focus.push(a); }
    }
    // always two focus pillars: the next pillar with the most opportunity joins (never Movement while a symptom is unchecked)
    for (const a of AREAS.slice().sort((x, y) => o.combined[y] - o.combined[x])) {
      if (focus.length >= 2) break; if (focus.includes(a) || blocked.includes(a) || (held && a === 'Movement') || (unsure && !clear(a)) || (unsure && a === 'Sleep' && !sleepIssue)) continue;
      const all = fromArea(a).filter(allowed), pri = all.filter(x => x.role === 'Priority'); if (pri.length) { pools[a] = pri; focus.push(a); }
    }
    const wishF = focus.filter(a => p.wish.includes(a));
    const q0 = A.q0 || {}, firstAreas = q0.first && THEMES[q0.first] ? THEMES[q0.first].areas : [];
    const startAreas = (wishF.length ? wishF : focus).slice().sort((x, y) => (firstAreas.includes(y) ? 1 : 0) - (firstAreas.includes(x) ? 1 : 0));
    let moved = focus.filter(a => !startAreas.includes(a));
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
    // ---- fit the month-ahead practices to the person
    const libRow = (fam, l) => DATA.lib.find(y => y.f === fam && y.l === l);
    // the real opportunity: protein is already in most of their meals, so the plate practice works on vegetables and fruit instead
    const refine = x => { if (x.fam === 'Balanced plate' && p.protein_meals >= 2 && /protein/i.test(x.row.w)) { const r = libRow('Balanced plate', 'Learning'); if (r) return Object.assign({}, x, { row: r, ex: minOf(x.fam, r) }); } return x; };
    pr = pr.map(refine); extras.splice(0, extras.length, ...extras.map(refine));
    // an established exercise routine they didn't ask to change: movement stays optional ("if you have time"), never a recommended addition
    if (!p.wish.includes('Movement') && p.mvpa >= 150 && p.strength >= 2 && pr.some(x => x.area === 'Movement')) {
      const up = extras.filter(x => x.area !== 'Movement' && !x.over);
      if (up.length) {
        const down = pr.filter(x => x.area === 'Movement');
        const newPr = [...pr.filter(x => x.area !== 'Movement'), ...up].slice(0, 2);
        const newEx = [...down, ...extras.filter(x => !newPr.includes(x))].slice(0, 2);
        pr = newPr; extras.splice(0, extras.length, ...newEx);
      }
    }
    // ---- match each practice to the outcome they want, what they already do, and the difficulty they reported
    const has13 = t => (A.q13 || []).includes(t);
    const sGoals = p.goals.Sleep || [], mGoals = p.goals.Movement || [];
    const doingF = f => (p.doing || []).includes(f) || (p.tried || []).includes(f) || (p.nofit || []).includes(f);
    const inPlan = (f, self) => [...pr, ...extras].some(y => y !== self && y.fam === f);
    // Movement: more volume (walking, steps, more cardio) only when that is what they asked for, or they are below the guideline.
    // Someone already active, or training for strength or performance, gets a practice that changes how they train instead.
    const VOLUME = ['Walking after meals', 'Daily steps', 'Breaking up sitting', 'Active travel', 'Movement snacks', 'Building up cardio', 'Weekly cardio', 'Activity challenges', 'Walking with others', 'Balance'];
    const wantsVolume = mGoals.some(g => ['everyday', 'fitness', 'consistency', 'cardio'].includes(g)) || (!mGoals.length && p.mvpa < 150);
    const q25 = t => (A.q25 || []).includes(t);
    const goalTxt = list(goalsOf('Movement').slice(0, 2));
    function moveFor(x) {
      const mk = (fam, row, why, ex) => Object.assign({}, x, { fam, row, why, ex: ex == null ? minOf(fam, row) : ex, rec: x.rec });
      const opts = [];
      if (mGoals.includes('strength') || mGoals.includes('performance')) {
        if (p.strength >= 2) {
          const r = libRow('Strength sessions', 'Mastering');
          if (r) opts.push(Object.assign(mk('Strength sessions', Object.assign({}, r, { w: 'Make the strength sessions you already do progressive,', d: `in your usual ${p.strength >= 3 ? '3 or more' : '2'} sessions a week`, t: r.t + ' This changes how you train, not how much, so it uses the time you already spend.', tg: 0, ex: 0 }),
            `You'd like to ${goalTxt}, and you already do strength training ${p.strength >= 3 ? 'three or more times' : 'twice'} a week. Gradually increasing the load is how those sessions keep paying off.`, 0), { title: 'Progressive strength' }));
        } else { const r = easier('Movement', 'Strength sessions', libRow('Strength sessions', 'Learning'), 1e6); if (r) opts.push(mk('Strength sessions', r, `You'd like to ${goalTxt}, and regular strength sessions are the most direct way to get there.`)); }
      }
      if ((mGoals.includes('mobility') || mGoals.includes('performance') || (!mGoals.length && p.mvpa >= 150)) && !q25('Stretching or mobility work')) { const r = libRow('Stretching', 'Learning'); if (r) opts.push(mk('Stretching', r, mGoals.includes('mobility') ? "You'd like to improve your mobility and flexibility." : mGoals.length ? 'Mobility work supports recovery between harder sessions, alongside the training you already do.' : 'You already do plenty of activity, so this adds a different kind of movement rather than more of the same.')); }
      if (mGoals.includes('balance') && !q25('Balance exercises')) { const r = libRow('Balance', 'Learning'); if (r) opts.push(mk('Balance', r, "You'd like to improve your balance and coordination.")); }
      if (!mGoals.length && p.mvpa >= 150 && !doingF('Short intervals')) { const r = libRow('Short intervals', 'Learning'); if (r && !(r.x || []).length) opts.push(mk('Short intervals', r, 'You already do plenty of activity, so this changes the kind of effort in one session rather than adding more.', 0)); }
      return opts.find(y => !inPlan(y.fam, x)) || null;
    }
    // Sleep: more time in bed suits people who want more sleep. When the difficulty is falling asleep, staying asleep or waking too early,
    // and more sleep isn't one of their goals, the practice works on that difficulty instead.
    const hardNight = has13('It takes me a long time to fall asleep') || has13('I wake during the night and find it hard to get back to sleep') || p.wakes_early;
    function sleepFor(x) {
      const pickRow = (fam, l) => { const r = libRow(fam, l); return r && !((r.x || []).includes('Shift or night work') && p.shift) && !((r.x || []).includes('Wakes too early') && p.wakes_early) ? r : null; };
      const opts = [];
      if ((p.wakes_early || sGoals.includes('stay_asleep')) && !(p.tried || []).includes('Bed for sleep') && !(p.nofit || []).includes('Bed for sleep')) { const r = pickRow('Bed for sleep', 'Mastering'); if (r) opts.push(['Bed for sleep', r, p.wakes_early ? "You told us you often wake earlier than you want to and can't get back to sleep. Getting up rather than lying awake keeps your bed linked with sleep." : "You'd like to stay asleep through the night. Getting up rather than lying awake keeps your bed linked with sleep."]); }
      for (const f of ['Progressive muscle relaxation', 'Slow breathing to wind down', 'Bedtime to-do list']) if (!doingF(f)) { const r = pickRow(f, 'Learning'); if (r) opts.push([f, r, x.why]); }
      const o2 = opts.find(([f]) => !inPlan(f, x));
      return o2 ? Object.assign({}, x, { fam: o2[0], row: o2[1], why: o2[2], ex: minOf(o2[0], o2[1]) }) : null;
    }
    const misMove = x => x.area === 'Movement' && VOLUME.includes(x.fam) && !(x.fam === 'Balance' && (p.fall || mGoals.includes('balance'))) && (!wantsVolume || p.mvpa >= 150) && !(p.wish.includes('Movement') && wantsVolume);
    const misSleep = x => x.area === 'Sleep' && x.fam === 'Enough sleep' && hardNight && !sGoals.includes('more_sleep') && !(sGoals.includes('rested') && !p.wakes_early);
    const misfit = x => misMove(x) || misSleep(x);
    const matchGoal = x => misMove(x) ? moveFor(x) : misSleep(x) ? sleepFor(x)
      : x.area === 'Movement' && x.fam === 'Stretching' && !mGoals.includes('mobility') && (mGoals.includes('strength') || mGoals.includes('performance')) && p.mvpa >= 150 ? Object.assign({}, x, { why: 'Mobility work supports recovery between harder sessions, alongside the training you already do.' }) : x;
    pr = pr.map(matchGoal).filter(Boolean);
    extras.splice(0, extras.length, ...extras.map(matchGoal).filter(Boolean));
    while (pr.length < 2 && extras.some(x => !x.over)) { const x = extras.find(y => !y.over); extras.splice(extras.indexOf(x), 1); pr.push(x); }
    // caffeine late in the day and trouble falling asleep: moving the last caffeine is the most direct practice for what they reported,
    // so it is a practice in its own right (not only an everyday habit). After 6pm it is recommended; between 3 and 6pm it is optional.
    const hardOnset = has13('It takes me a long time to fall asleep') || sGoals.includes('fall_asleep');
    const cafH = (DATA.hyg || []).find(h => h.f === 'Caffeine timing');
    let cafPractice = null;
    if (cafH && p.caffeine_late && hardOnset && startAreas.includes('Sleep') && !held) {
      const late = A.q15 === 'After 6pm';
      const row = { f: 'Caffeine timing', l: 'Learning', w: 'Move your last caffeinated drink earlier, aiming for at least 6 hours before bed', d: 'every day', t: "How long caffeine affects sleep depends on how much you have and on you: some people clear it much faster than others. In one study a strong dose still shortened sleep when taken 6 hours before bed, and a review of studies estimated that a typical cup of coffee can affect sleep for up to about 9 hours. So treat 6 hours as a starting point, and try an earlier cut-off if you still find it hard to fall asleep. Tea, cola and energy drinks count too; decaffeinated or caffeine-free drinks are fine later on.", ref: cafH.ref, why: cafH.why, tg: 0, ex: 0, x: [] };
      if (p.shift) row.t += ' After a night shift, count back from when you go to sleep in the day.';
      cafPractice = { area: 'Sleep', fam: 'Caffeine timing', row, ex: 0, why: `Your last caffeine is usually ${p.caffeine_when}, and ${has13('It takes me a long time to fall asleep') ? 'you told us it often takes you a long time to fall asleep' : "you'd like to fall asleep more easily"}. Caffeine can keep you alert for many hours after your last drink.` };
      if (late) { pr.unshift(cafPractice); if (pr.length > 2) extras.unshift(pr.pop()); }
      else extras.unshift(cafPractice);
      if (extras.length > 2) extras.splice(2);
    }
    [...pr, ...extras].forEach(x => taken.add(x.fam));
    // they chose where to start: recommended practices come only from the areas they chose. A practice in an area we inferred from
    // their answers stays in month 1 as optional, so their priorities and our suggestions are never mixed up.
    if (p.wish.length && wishF.length) {
      const off = pr.filter(x => !p.wish.includes(x.area)), keep = { pr: pr.slice(), ex: extras.slice() };
      if (off.length) {
        pr = pr.filter(x => p.wish.includes(x.area));
        const inPlanF = f => [...pr, ...extras, ...off].some(y => y.fam === f);
        const cands = [...wishF.flatMap(a => pools[a] || []), ...full.filter(x => wishF.includes(x.area) && x.pass === 1 && allowed(x))];
        for (const x0 of cands) {
          if (pr.length >= 2) break;
          if (inPlanF(x0.fam) || misfit(x0) || SAME_JOB.some(gr => gr.includes(x0.fam) && gr.some(h => h !== x0.fam && inPlanF(h)))) continue;
          const r = easier(x0.area, x0.fam, x0.row, lower - pr.reduce((t, y) => t + y.ex, 0)); if (!r) continue;
          pr.push(r === x0.row ? x0 : Object.assign({}, x0, { row: r, ex: minOf(x0.fam, r) }));
        }
        while (pr.length < 2) { const e = extras.find(y => p.wish.includes(y.area) && !y.over); if (!e) break; extras.splice(extras.indexOf(e), 1); pr.push(e); }
        extras.splice(0, extras.length, ...off, ...extras.filter(y => !off.includes(y)));
        extras.splice(2);
        if (!pr.length) { pr = keep.pr; extras.splice(0, extras.length, ...keep.ex); }   // nothing they chose can start yet (for example a health check first)
      }
    }
    // optional practices beyond their time are shown as such, never counted as fitting it
    { let t = pr.reduce((a, x) => a + x.ex, 0); extras.forEach((x, i) => { if (x.over) return; if (t + x.ex <= lower) t += x.ex; else extras[i] = Object.assign({}, x, { over: true }); }); }
    // they tried avoiding screens before bed and it didn't help: keeping the phone out of bed is close to that, so it is never a core
    // practice; it stays only as an optional, conditional one (for those whose phone comes to bed and who haven't tried this change)
    if ((p.tried || []).includes('Screen-free wind-down') && g('q17', 'phone') !== "I've tried it, but it didn't help") {
      const ph = pr.find(x => x.fam === 'Bed for sleep' && x.row.l === 'Learning');
      if (ph && pr.length > 1) { pr = pr.filter(x => x !== ph); extras.unshift(Object.assign({}, ph, { noLift: true, whyFixed: true, why: "You told us avoiding screens before bed didn't help, so this is optional: only worth trying if your phone usually comes to bed with you and you haven't tried keeping it out." })); extras.splice(3); }
    }
    // maintenance: a short, optional plan (two practices to try and one more at most)
    if (maintain) extras.splice(1);
    // no priority chosen: the optional extras must come from something they told us, not from a general starting set
    if (unsure) extras.splice(0, extras.length, ...extras.filter(x => x === cafPractice || traced(x)));
    // an area that waits for a later month only if it really has nothing in month 1
    moved = moved.filter(a => ![...pr, ...extras].some(x => x.area === a));

    // ---- the instruction itself fits their life (not only a note under it)
    // changing hours: sleep practices follow their main sleep, whenever it falls, rather than a set bedtime or set nights
    const varies = p.shift || p.irregular, curDays = Number(A.q20) || 0;
    const ENOUGH_VAR = {
      Learning: { w: "Work out when you'd need to go to bed to sleep 7 hours before you have to get up, allowing time to fall asleep, and aim to be in bed by then", d: 'for 3 of your main sleeps a week', t: 'Count back from when you need to get up each time, rather than using a fixed bedtime, so the extra time goes to sleep.' },
      Developing: { w: 'Plan the hours before your main sleep so you can sleep at least 7 hours', d: 'for 5 of your main sleeps a week', t: p.shift ? 'Work back from when you need to get up: if you need to be up at 2pm after a night shift, aim to be asleep by 7am; with a 6:30am alarm before a day shift, aim to be asleep by 11:30pm.' : 'Work back from when you need to get up each time: with a 6:30am alarm, aim to be asleep by 11:30pm; if you can get up at 9am, by 2am.' },
      Mastering: { w: 'Protect a sleep window that allows 7 hours or more for your main sleep', d: 'for at least 6 of your main sleeps a week' } };
    const varTxt = t => (t || '').replace(/\bon (\d) (nights|evenings) a week/g, 'before $1 of your main sleeps a week').replace(/\b(\d) nights a week/g, '$1 times a week, before your main sleep')
      .replace(/\b(every|each) night\b/g, 'every time you sleep').replace(/\bbefore bed\b/g, 'before you go to sleep').replace(/\bfor bed\b/g, 'for sleep')
.replace(/\b[Ee]very morning\b/g, m => (m[0] === 'E' ? 'E' : 'e') + 'very time you get up').replace(/\bbedtime\b/g, 'sleep time');
    function adaptRow(area, fam, row) {
      if (!row) return row;
      let r = row;
      if (varies && area === 'Sleep') r = fam === 'Enough sleep' && ENOUGH_VAR[row.l] ? Object.assign({}, row, ENOUGH_VAR[row.l]) : (() => { const w = varTxt(row.w); let d = varTxt(row.d); if (/sleep/.test(w)) d = d.replace(/before (\d) of your main sleeps a week/, '$1 times a week').replace(/(\d) times a week, before your main sleep/, '$1 times a week'); return Object.assign({}, row, { w, d, t: varTxt(row.t) }); })();
      // more sleep is about the time in bed: no extra wind-down routine folded into it (a wind-down is a practice of its own, with its own time)
      if (fam === 'Enough sleep' && /start winding down 30 minutes before it/.test(r.w)) r = Object.assign({}, r, { w: "Work out what time you'd need to go to bed to sleep 7 hours, allowing time to fall asleep, and aim to be in bed by then" });
      if (fam === 'Enough sleep' && p.carer) r = Object.assign({}, r, { t: 'Count back from when you usually need to get up. After a night that caring interrupts, there is nothing to make up: just try again on a night that allows it.' });
      // we don't ask whether the phone or work comes to bed: the instruction is conditional, not an assumed habit
      if (fam === 'Bed for sleep' && row.l === 'Learning') r = Object.assign({}, r, { w: 'If your phone usually comes to bed with you, keep it out of your bed', t: 'Put it on a bedside table or across the room, not in the bed or under the pillow, so your bed stays a place for sleep. If it already stays out of bed, carry on as you are.' });
      if (fam === 'Bed for sleep' && row.l === 'Developing') r = Object.assign({}, r, { w: 'If you work, email or scroll in bed, move it somewhere else', t: 'Do emails, work and scrolling somewhere else, so your mind links your bed with sleep. If you already keep these out of bed, carry on as you are.' });
      // getting up when awake: they already keep a regular wake time, so the instruction doesn't repeat it
      if (fam === 'Bed for sleep' && row.l === 'Mastering' && (p.doing || []).includes('Bed for sleep')) r = Object.assign({}, r, { w: "If you wake and can't get back to sleep, get up rather than lying awake", d: 'whenever it happens' });
      if (fam === 'Bed for sleep' && row.l === 'Mastering' && (p.doing || []).includes('Consistent sleep timing')) r = Object.assign({}, r, { t: "If you wake and can't get back to sleep within about 20 minutes, get up and do something calm in another room until you feel sleepy again, then return to bed. Keep your usual wake-up time, as you do now." });
      // caring at night or not working to a weekly timetable: no Monday-to-Friday rule
      if ((p.carer || p.not_working) && /every weeknight, Monday to Friday/.test(r.d)) r = Object.assign({}, r, { d: 'on most nights of the week' });
      // caring interrupts their nights: a sleep practice is a target for the nights that allow it, never a nightly rule
      if (p.carer && area === 'Sleep' && /\b(\d) (nights|of your main sleeps|times) a week/.test(r.d))
        r = Object.assign({}, r, { d: r.d.replace(/\b(\d) (nights|of your main sleeps|times) a week/, 'up to $1 $2 a week') + ', when caring allows', care: true });
      // processed food, without assuming it comes as snacks (we don't ask about snacks)
      if (fam === 'Less processed food' && /snack/.test(r.w)) r = Object.assign({}, r, { w: "Swap one processed food you'd usually have, such as a ready meal, crisps, biscuits or processed meat, for a less processed option", t: 'To spot ultra-processed foods, check the ingredients for things rarely used in home kitchens (such as hydrogenated oils or high-fructose corn syrup) or additives like flavourings, colours, emulsifiers or sweeteners. Fresh, frozen or tinned whole foods, plain yoghurt, eggs and wholegrain bread are easy swaps.' });
      if (fam === 'Reducing sugar' && /sweet snack/.test(r.w)) r = Object.assign({}, r, { w: ['3–5 days a week', '6–7 days a week'].includes(g('q7', 'sugary')) ? 'Swap a sugary drink for an unsweetened option' : 'Swap one sugary drink or sweet food you would usually have for an unsweetened option' });
      // a weekly target well above what they do now: the instruction itself builds up to it
      const m = area === 'Movement' && /^(.*?)(\d) days a week(.*)$/.exec(r.d), n = m ? +m[2] : 0;
      const per0 = +((/(\d+) minutes/.exec(r.d) || [])[1] || 0), d0 = Math.min(n - 1, Math.max(2, curDays + 1, per0 ? Math.ceil((p.mvpa + 10) / per0) : 0));
      if (n >= 4 && curDays < n - 1) r = Object.assign({}, r, { d: `${m[1]}${d0} days a week at first, building to ${n} by the end of the month${m[3]}`, t: (r.t || '').replace(/^That's /, `Once you reach ${n} days, that's `), build: n });
      if (/whenever you shop for food, at least once a week/.test(r.d)) r = Object.assign({}, r, { d: r.d.replace('whenever you shop for food, at least once a week', 'once a week, when you shop for food') });
      // no duration in the instruction but it takes a little time: say how long each time, so the weekly time follows from it
      if (!/minute|hour/.test(r.w + ' ' + r.d) && (row.ex || 0) > 0 && !/once this month|first week/.test(r.d)) {
        const fq = perWeek(r.d), clearFq = /\d+ (?:days|times|nights|of your main sleeps)|twice|every|each (?!week)|a day\b|once a week|month/.test(r.d);
        const per = Math.max(1, Math.round(row.ex / fq));
        r = Object.assign({}, r, { d: `${r.d}, about ${per} minute${per === 1 ? '' : 's'} ${clearFq ? 'each time' : 'a week'}` });
      }
      // activity guideline practices count what they already do: the weekly total is the target, the sessions are only an example,
      // so their current sessions count towards it whatever their length
      if (area === 'Movement' && ['Building up cardio', 'Weekly cardio'].includes(fam) && p.mvpa > 0 && !/already do/.test(r.d)) {
        const tot1 = weekMin(r) || 0, dm = /(\d+) minutes/.exec(r.d), per = dm ? +dm[1] : 0;
        const k1 = (/(\d+) days a week at first/.exec(r.d) || /(\d+) (?:days|times) a week/.exec(r.d) || [])[1], tot2 = r.build && per ? per * r.build : tot1;
        if (per && k1 && !/minutes a week/.test(r.d)) r = Object.assign({}, r, { w: 'Do moderate cardio, such as a brisk walk, cycle or swim,',
          d: r.build ? `for about ${tot1} minutes a week in total at first (for example ${per} minutes on ${k1} days), building to about ${tot2} by the end of the month (for example ${per} minutes on ${r.build} days), counting the activity you already do`
            : `for about ${tot1} minutes a week in total (for example ${per} minutes on ${k1} days), counting the activity you already do`, actTot: tot1, actTot2: tot2 });
        else r = Object.assign({}, r, { d: r.d + ', counting the activity you already do' });
      }
      // "for 5 minutes, 3 days a week" reads as five minutes in total: say it is each time
      if (/^for (about )?[\d–-]+ minutes, (up to )?\d/.test(r.d)) r = Object.assign({}, r, { d: r.d.replace(/^for (about )?([\d–-]+) minutes, (up to )?(\d+) (days|nights|times)/, (m0, ab, n0, up, k, u) => u === 'times' ? `for ${ab || ''}${n0} minutes each time, ${up || ''}${k} times` : `for ${ab || ''}${n0} minutes on each of ${up || ''}${k} ${u}`) });
      return r;
    }
    // the time a practice actually asks for each week (its starting amount when it builds up); 0 when it uses time they already spend
    // activity that builds on what they already do: the baseline, the weekly total to aim for, and the extra time on top of today
    const CARDIO = ['Building up cardio', 'Weekly cardio'];
    const actOf = x => {
      if (!CARDIO.includes(x.fam) || !p.mvpa) return null;
      const total = x.row.actTot || weekMin(x.row) || 0, dur = +((/(\d+) minutes/.exec(x.row.d) || [])[1] || 0), total2 = x.row.actTot2 || (x.row.build && dur ? dur * x.row.build : total);
      return { base: p.mvpa, total, extra: Math.max(0, total - p.mvpa), total2, extra2: Math.max(0, total2 - p.mvpa), build: !!x.row.build };
    };
    // new time each week: for activity, only what goes beyond what they already do (by the end of the month when it builds up)
    const wkOf0 = x => { const a = actOf(x); return a ? roundMin(a.extra2) : null; };
    const wkOf = x => wkOf0(x) != null ? wkOf0(x) : x.title === 'Progressive strength' || /once this month|in the first week of this month/.test(x.row.d) ? 0 : roundMin(weekMin(x.row) ?? x.ex ?? 0);
    const adaptX = x => { const r = adaptRow(x.area, x.fam, x.row); return r === x.row ? x : Object.assign({}, x, { row: r }); };
    pr = pr.map(adaptX); extras.splice(0, extras.length, ...extras.map(adaptX));
    const inM1 = a => [...pr, ...extras].some(x => x.area === a);
    focus = [...new Set([...startAreas.filter(inM1), ...focus.filter(a => !startAreas.includes(a) && inM1(a)), ...moved])];

    // ---- what comes next in each focus area
    const NOT_AEROBIC = { 'Walking after meals': 'A gentle walk: it only counts towards your aerobic minutes if it is brisk.', 'Daily steps': 'Everyday steps: they only count towards your aerobic minutes when brisk.', 'Breaking up sitting': 'Separate from your aerobic minutes.', 'Movement snacks': 'Separate from your aerobic minutes.', Balance: 'Separate from your aerobic minutes.', Stretching: 'Separate from your aerobic minutes.', 'Strength sessions': 'Separate from your aerobic minutes.', 'Strength volume': 'Separate from your aerobic minutes.' };
    const aeroPlan = () => [...pr, ...extras].some(y => CARDIO.includes(y.fam));
    const toItem = x0 => { const x = adaptX(x0); return { area: x.area, fam: x.fam, action: x.row.w, freq: x.row.d, start: x.row.t, min: x.ex, wk: wkOf(x), opt: !!p.wish.length && !p.wish.includes(x.area), sep: aeroPlan() && x.area === 'Movement' ? NOT_AEROBIC[x.fam] || '' : '', sepShort: aeroPlan() && x.area === 'Movement' && NOT_AEROBIC[x.fam] ? (/walk|steps/i.test(x.fam) ? 'not counted towards your aerobic minutes unless brisk' : 'separate from your aerobic minutes') : '', refs: refsOf(x.row), row: x.row, why: x.why }; };
    const nextIn = a => {
      const fromPool = (pools[a] || []).filter(x => !taken.has(x.fam));
      const more = full.filter(x => x.area === a && x.pass === 1 && allowed(x));
      // the pillar's own next steps first; practices the engine added only as lighter-touch fillers go last
      const filler = dropped;
      const first = moved.includes(a) ? [...fromPool, ...more] : [...more, ...fromPool];
      const late = x => filler.has(x.fam) && !traced(x);
      const ord = [...first.filter(x => !late(x)), ...first.filter(late)].filter(x => !misfit(x));
      const outL = []; for (const x of ord) if (!taken.has(x.fam) && !sameJob(x.fam) && !outL.some(y => y.fam === x.fam)) outL.push(x);
      return outL;
    };
    const lineup = {};
    for (const a of focus) { lineup[a] = nextIn(a).slice(0, 3).map(toItem); lineup[a].forEach(x => taken.add(x.fam)); }
    const groups = {}; for (const a of AREAS) groups[a] = focus.includes(a) && p.wish.includes(a) ? 'focus' : unsure && a === 'Sleep' && !sleepIssue ? 'well' : focus.includes(a) && !p.wish.length && !unsure && (o.opp[a] >= 1 || held) ? 'focus' : (o.opp[a] >= 1 || (held && a === 'Movement') || blocked.includes(a)) ? 'improve' : 'well';
    // an area that looks fine from their habits but where they asked for help (for example stress): not a "strength", but partly in place
    const partly = AREAS.filter(a => groups[a] === 'well' && goalsOf(a).length && !p.wish.includes(a) && !maintain);
    partly.forEach(a => { groups[a] = 'improve'; });
    const laterArea = AREAS.filter(a => groups[a] === 'improve' && !unsure && !(held && a === 'Movement') && !blocked.includes(a)).map(a => { const x = nextIn(a)[0]; if (x) taken.add(x.fam); return x ? toItem(x) : null; }).filter(Boolean);

    // ---- months 2 and 3, within the lower end of their time; a step can start at an easier level to fit
    let total = pr.reduce((t, x) => t + x.ex, 0);
    function fit(x) {
      const r = easier(x.area, x.fam, x.row, lower - total); if (!r) return null;
      if (r === x.row) return x; const ra = adaptRow(x.area, x.fam, r);
      return Object.assign({}, x, { action: ra.w, freq: ra.d, start: ra.t, min: minOf(x.fam, r), wk: wkOf({ fam: x.fam, row: ra, ex: minOf(x.fam, r) }), opt: !!p.wish.length && !p.wish.includes(x.area), refs: refsOf(r), row: ra });
    }
    const startQ = [], movedQ = [];
    const L0 = [...startAreas, ...focus.filter(a => !startAreas.includes(a) && !moved.includes(a))].map(a => lineup[a] || []);
    for (let i = 0; i < 3; i++) for (const l of L0) if (l[i]) startQ.push(l[i]);
    // a goal they chose that no recommended practice serves yet: an optional practice that serves it becomes their next step (month 2),
    // so their own goals drive what is added, with the reason for the order stated
    const serves = (a, g, f) => ((DATA.goals[a] || {})[g] || []).includes(f) || (f === 'Caffeine timing' && g === 'fall_asleep');
    const lifts = [];
    for (const a of wishF) for (const g of (p.goals[a] || [])) {
      if (pr.some(x => x.area === a && serves(a, g, x.fam)) || lifts.some(x => serves(a, g, x.fam))) continue;
      const e = extras.find(x => x.area === a && serves(a, g, x.fam) && x !== cafPractice && !x.noLift);
      if (!e) continue;
      extras.splice(extras.indexOf(e), 1);
      const label = (A[GOALQ[a]] || []).filter(x => !NONE.test(x))[(p.goals[a] || []).indexOf(g)] || '';
      const first = pr.find(x => x.area === a);
      const it = toItem(Object.assign({}, e, { why: `You told us ${ger(low(label).replace(/\bmy\b/g, 'your'))} matters to you.${first ? ` ${NAME[first.fam] || first.fam} comes first because ${CARDIO.includes(first.fam) && p.mvpa < 150 ? `you're furthest from the activity guideline there (about ${p.mvpa} minutes a week against 150)` : 'it answers the difficulty you told us about most directly'}; this follows once that feels settled.` : ''}` }));
      it.goal = true; lifts.push(it);
    }
    startQ.unshift(...lifts);
    for (const a of moved) movedQ.push(...(lineup[a] || []));
    const m2 = [], m3 = [], later = [];
    // month 2 adds two at most, one with small steps or when another focus area is waiting, and never more than month 1 began with
    const n2 = Math.min((p.change === 'small' || movedQ.length) ? 1 : 2, pr.length);
    total += extras.filter(x => !x.over).reduce((t, x) => t + x.ex, 0);
    const take = (q, into, n) => { while (q.length && into.length < n) { const x = q.shift(), y = fit(x); if (y) { into.push(y); total += y.min; } else later.push(x); } };
    take(startQ, m2, n2);
    if (movedQ.length) take(movedQ, m3, 1); else take(startQ, m3, 1);
    later.push(...startQ, ...movedQ, ...laterArea);
    const mins1 = roundMin(pr.reduce((t, x) => t + wkOf(x), 0)), minsOpt = roundMin(extras.reduce((t, x) => t + wkOf(x), 0));

    // ---- copy
    const prof = profile(A, p);
    const sympt = list((p.symptoms_txt || []).map(s => low(s).replace('pain, tightness or pressure in your chest', 'chest discomfort')));
    const monthOf = a => m2.some(x => x.area === a) ? 2 : m3.some(x => x.area === a) ? 3 : 4;
    // an area they didn't choose but that has a practice in month 1: say so, as an opportunity from their answers, not their priority
    const alsoAreas = focus.filter(a => !p.wish.includes(a) && !moved.includes(a) && p.wish.length && [...pr, ...extras].some(x => x.area === a));
    const alsoLine = alsoAreas.length ? `Your answers also point to ${list(alsoAreas.map(a => AREA_TXT[a]))}, so your first month includes ${(() => { const xs = [...pr, ...extras].filter(x => alsoAreas.includes(x.area)), opt = xs.every(x => !pr.includes(x)); return xs.length > 1 ? (opt ? 'optional practices' : 'practices') : (opt ? 'an optional practice' : 'a practice'); })()} there too.` : '';
    const inPlanArea = a => [...pr, ...extras, ...m2, ...m3].some(x => x.area === a);
    const outOfFocus = a => { if (inPlanArea(a)) return ''; const nx = later.slice(0, 3).find(x => x.area === a); return ` That isn't part of your starting focus${startAreas.length ? `, which is ${list(startAreas.map(z => AREA_TXT[z]))}` : ''}, so this plan doesn't address it yet${nx ? `; a practice such as ${(NAME[nx.fam] || nx.fam).toLowerCase()} could follow later on` : ''}. You can raise it with your Pilot at any time.`; };
    const partlyLine = partly.map(a => { const h = wellOf(a, A, p)[0]; return `In ${AREA_TXT[a]}, you have ${h ? `routines such as ${low(h).replace(/\.$/, '')}` : 'some routines in place'}, and you'd also like help with ${glist(goalsOf(a).map(ger))}.${outOfFocus(a)}`; }).join(' ');
    let intro1;
    if (held) {
      const mg = goalsOf('Movement');
      intro1 = [`${p.wish.includes('Movement') ? `You told us you'd like to move more${mg.length ? ` and ${glist(mg)}` : ''}. ` : ''}Before we suggest any increase in activity, there's one important thing to discuss with a doctor first, explained just below.`,
        `In the meantime, your answers point to ${list(focus.map(low))}, where focusing now could make a real difference while movement waits.`];
    } else if (wishF.length) {
      const gl = wishF.flatMap(goalsOf);
      let t = `You told us you'd like support with ${list(wishF.map(a => AREA_TXT[a]))}${gl.length ? `, especially ${glist(gl.map(ger))}` : ''}. That's where your Good Span starts.`;
      if (alsoLine) t += ' ' + alsoLine;
      for (const a of moved) { const n = monthOf(a); t += ` ${MORE[a]} can follow ${n < 4 ? `from month ${n}` : 'later on'}${a === 'Movement' && p.mvpa >= 100 && p.mvpa < 150 ? ", since you're already close to the guideline" : ', once your first practices feel settled'}.`; }
      intro1 = [t];
    } else {
      const wishWell = p.wish.filter(a => groups[a] === 'well' && !blocked.includes(a)), wishBlocked = p.wish.filter(a => blocked.includes(a));
      intro1 = maintain ? ["You didn't pick an area to improve, and your answers show strong foundations across your everyday life. Nothing here needs fixing: the practices in your Good Span are optional suggestions, in case you'd like to explore something new."]
        : unsure ? [`You weren't sure where to start. Your answers point to ${list(focus.map(a => AREA_TXT[a]))} as an opportunity, if you'd like to begin there; it's a suggestion, not a priority.`]
        : [`${wishBlocked.length ? `You told us you'd like to work on ${list(wishBlocked.map(a => AREA_TXT[a]))}. With what you've told us about your health, the changes we'd usually suggest there need a health professional's input first. ` : ''}${wishWell.length ? `You told us you'd like to work on ${list(wishWell.map(a => AREA_TXT[a]))}, and your answers show ${wishWell.length > 1 ? "they're" : "it's"} already in a good place. ` : groupsWell(groups) ? 'You have already built some good habits across your everyday life. ' : ''}${list(focus)} ${focus.length > 1 ? 'are the areas' : 'is the area'} where your effort could make the biggest difference to your next steps.`];
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
    // "early-morning activities aren't for you": plural items take a plural verb
    const ooPl = relOO.length > 1 || /s$|fasting/.test(OO_TXT[relOO[0]] || '');
    const ooLine = relOO.length ? `You also told us ${list(relOO.map(k => OO_TXT[k]))} ${ooPl ? "aren't" : "isn't"} for you, so your starting practices don't rely on ${relOO.length === 2 ? 'either' : relOO.length > 2 ? 'any of them' : ooPl ? 'them' : 'it'}.` : '';
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
      if (alsoLine) paras.push(alsoLine);
      if (partlyLine) paras.push(partlyLine);
      if (ooLine) paras.push(ooLine);
      if (laterLine) paras.push(laterLine);
    } else if (wellAreas.length >= 3) {
      situation = 'doing-well';
      const small = pr[0] && CURRENT.slice(0, 2).includes(pr[0].fam) ? 'more aerobic movement' : SMALL[focus[0]];
      lead = hi("you're already doing a lot right.");
      paras = [maintain ? "Your answers show strong foundations across your everyday life, and you didn't pick anything you want to change. Rather than giving you more things to do, your Good Span offers a few optional ways to keep it going."
        : `Your answers show strong foundations across much of your everyday life. Rather than giving you more things to do, we'd suggest ${small}, if it suits you.`];
    } else {
      situation = 'start';
      lead = hi(unsure ? "you weren't sure where to start, so here's a suggestion." : "here's where we'd start.");
      paras = [unsure ? `Your answers point to ${list(focus.map(a => AREA_TXT[a]))} as the clearest opportunity. It's a suggestion rather than a priority, so you decide whether to start there.` : `The clearest opportunity we see is ${list(focus.map(low))}. That's where your effort will count most, and we'll build on what already works.`];
    }
    const actBuild = pr.map(actOf).find(a => a && a.build);
    const nPr = pr.length, mTxt = actBuild ? `about ${roundMin(actBuild.extra)} additional minutes a week at first, building to about ${mins1} by the end of the month` : mins1 >= 5 ? `about ${mins1} additional minutes a week` : mins1 > 0 ? 'a few minutes a week' : 'no extra time set aside';
    const opening = { situation, lead, paras, own,
      starts: [`${cap(NUMW[nPr])} practice${nPr === 1 ? '' : 's'}`, moved.length ? `${startAreas[0]} first` : list(startAreas), mTxt],
      after: "We'll build from there as you discover what works." };

    // Starting Position: a label and one short observation per pillar
    const firstOf = (a, n) => sentences(prof.pillars[a]).slice(0, n || 1).join(' ');
    const spc = {};
    // a 'going well' label needs enough answers behind it
    const rows = q => Object.keys(A[q] || {}).length;
    const thin = a => ({ Nutrition: rows('q7') < 4, Sleep: !A.q12, Movement: !A.q20, Mind: !A.q30 && !A.q31, Connection: rows('q36') < 2, Prevention: !A.q40 && !A.q43 })[a];
    for (const a of AREAS) {
      const gr = groups[a];
      if (gr === 'focus') { const gl = goalsOf(a); spc[a] = [unsure || !p.wish.includes(a) ? 'An opportunity' : 'Your focus', p.wish.includes(a) && gl.length ? `You'd like support with ${glist(gl.map(ger))}. ${firstOf(a)}` : firstOf(a)]; }
      else if (blocked.includes(a)) spc[a] = ['Worth discussing', `${p.wish.includes(a) ? `You'd like to work on ${AREA_TXT[a]}. ` : ''}With what you've told us about your health, the changes we'd usually suggest here need a health professional's input first.`];
      else if (held && a === 'Movement') spc[a] = ['On hold for now', `${p.wish.includes('Movement') ? "You'd like to move more. " : ''}Because of the ${sympt || 'symptom'} you mentioned, increasing your activity waits until you've spoken to a doctor.`];
      else if (partly.includes(a)) spc[a] = ['Partly in place', `${firstOf(a)} You'd also like help with ${glist(goalsOf(a).map(ger))}.${inPlanArea(a) ? '' : ' This isn\'t part of your starting focus yet.'}`];
      else if (gr === 'improve') spc[a] = ['Worth improving', ((o.reasons[a] || []).find(r => !r.startsWith('You picked')) || firstOf(a))];
      else if (thin(a)) spc[a] = ['Not enough answers yet', `You answered only part of this section, so we can't say much yet. ${firstOf(a)}`];
      else { const f = firstOf(a); spc[a] = [WELL_LABEL[a], f.length < 70 ? firstOf(a, 2) : f]; }
    }

    // section 3: why each focus area, and what already goes well in it
    const foc = {};
    for (const a of focus) {
      // one wording for how often they've felt anxious or low, so it never contradicts the notice above
      let rs = (o.reasons[a] || []).map(voice).map(t => t.replace(/^You've been feeling anxious or low on [^.]+\./, "Over the last two weeks, you've often felt anxious or low."));
      if (!rs.length) { const q = clone(p); q.wish = [a]; rs = (E.plan(q).reasons[a] || []).slice(); }
      const gl = goalsOf(a);
      if (p.wish.includes(a) && gl.length) rs = [`You'd like support with ${glist(gl.map(ger))}.`, ...rs.filter(r => !r.startsWith('You picked'))];
      const paras = rs.length > 1 ? [rs[0], rs.slice(1).join(' ')] : rs;
      if (moved.includes(a) && startAreas.length) { const n = monthOf(a); paras.push(`Because your priority is ${AREA_TXT[startAreas[0]]}, this joins your Good Span ${n < 4 ? `in month ${n}` : 'later on'}, once your first practices feel settled.`); }
      // nothing to fix here: say so, rather than presenting a next step as a need
      if (groups[a] === 'well') { paras.length = 0; paras.push(`Your answers here are already in a good place, so anything in this area is optional: a way to add variety or keep your habits going${a === 'Movement' && p.mvpa >= 150 ? ', not more of the same' : ''}.`); }
      foc[a] = { p: paras, well: wellOf(a, A, p).slice(0, 3) };
    }

    // section 4: practice cards
    // the instruction already follows their sleep and their week (adaptRow); the note only says why
    const adaptOf = x => { if (!varies) return '';
      if (x.area === 'Sleep' && x.fam !== 'Enough sleep' && /main sleep|every time you sleep|before you go to sleep|for sleep/.test(x.row.w + ' ' + x.row.d)) return 'Your hours change, so this follows your main sleep, whenever it falls.';
      if (/days a week|times a week|every day|each day|on \d days/.test(x.row.d) && x.area === 'Movement') return 'Your weeks vary, so choose the days that suit each week rather than fixed days.';
      return ''; };
    // caring responsibilities that break up the night: sleep practices are a target for most nights, not a rule for every night
    const careOf = x => p.carer && x.area === 'Sleep' && !x.row.care && x.fam !== 'Caffeine timing' && /night|bed|sleep/i.test(x.row.w + ' ' + x.row.d) ? (varies ? 'When caring for others interrupts your sleep, do what you can and pick it up again next time.' : 'On nights when caring for others interrupts your sleep, do what you can and pick it up again the next night.') : '';
    // an area where their answers show nothing to fix: the practice is enrichment or maintenance, and says so
    const enrichOf = x => (p.wish.includes(x.area) || (o.opp[x.area] || 0) >= 1) ? ''
      : x.area === 'Movement' && p.mvpa >= 150 ? "Optional. You're already active, so this is a way to vary what you do, and it can take the place of one of your usual sessions rather than add to them."
      : "Optional. Your answers show this area is already going well, so this is a way to add variety or keep it going, not something to fix.";
    const timeOf = x => {
      const wk = wkOf(x), d = cap(x.row.d), hasMin = /minute/.test(x.row.d), a = actOf(x);
      if (/once this month|in the first week of this month/.test(x.row.d)) return `${d}. A one-off, so it isn't counted in your weekly time.`;
      if (x.title === 'Progressive strength') return `${d}. It uses the time you already spend training.`;
      if (a) return `In total that's about ${roundMin(a.total)} minutes a week of moderate activity, including the ${a.base} you already do: about ${roundMin(a.extra)} more than now.`
        + (a.build ? ` By the end of the month, about ${roundMin(a.total2)} minutes a week in total, about ${roundMin(a.extra2)} more than now.` : '')
        + (a.total2 < 150 ? ` It's a step towards the 150 minutes a week that guidelines recommend.` : '');
      if (wk > 0) return `${d}. About ${roundMin(wk)} minutes a week in all.`;
      return hasMin ? `${d}.` : `${d}. It fits into your day without setting extra time aside.`;
    };
    // only moderate or vigorous activity counts towards an aerobic target
    const COUNTS = "Count only activity that makes you breathe harder but still lets you talk, such as a brisk walk, cycle or swim. Gentle walks, stretching, balance and strength work are worthwhile, but they don't count towards this total.";
    const prc = [...pr, ...extras].map(x => {
      const curr = CURRENT.includes(x.fam), wk = wkOf(x), d = cap(x.row.d), hasMin = /minute/.test(x.row.d);
      const dur = (/(\d+)(?:[–-](\d+))? minutes?/.exec(x.row.d) || [])[1];
      const target = x.row.build && dur ? roundMin(+dur * x.row.build) : 0;
      const time = timeOf(x);
      return { t: x.title || NAME[x.fam] || x.fam, a: `${x.row.w} ${x.row.d}.`, min: wk, time, make: [x.row.t, actOf(x) ? COUNTS : '', enrichOf(x), adaptOf(x), careOf(x)].filter(Boolean), why: ownWhy(x) };
    });

    const safety = held ? { title: 'One thing to check first', text: `You mentioned ${sympt}${p.symptoms_active ? ' during exercise' : ''}. Before we suggest increasing your activity, we'd like you to discuss this with a doctor. Your Good Span can still begin with ${list(focus.map(low))}${AREAS.some(a => groups[a] === 'well') ? ' and build on what already goes well' : ''}.` } : null;

    const found = o.foundations.filter(h => h.because && !(cafPractice && h.f === 'Caffeine timing') && !(h.f === 'Recovery' && !p.wish.includes('Movement') && !mGoals.includes('performance'))).slice(0, 3).map(h => (h.f === 'Caffeine timing' ? Object.assign({}, h, { t: 'Aim to have your last caffeinated drink at least 6 hours before bed, and earlier if you still find it hard to fall asleep: how long caffeine lasts varies from person to person.' }) : h)).map(h => ({ area: h.p, text: varies && h.p === 'Sleep' ? varTxt(h.t).replace(/\bbefore bed\b|before you go to sleep/, 'before your main sleep') + (p.shift && h.f === 'Caffeine timing' ? ' After a night shift, that includes the hours before you sleep in the day.' : '') : h.t, why: h.because }));
    const themes = o.themes.filter(t => focus.includes(t[0]) && !maintain && !(t[1] === 'Sleep Duration & Support' && hardNight && !sGoals.includes('more_sleep')) && !(p.strength_unknown && t[1] === 'Strength & Resistance') && !(unsure && t[0] === 'Sleep' && !sleepIssue)).slice(0, 2).map(t => [t[0], t[1], (DATA.themes || {})[t[1]] || '']);
    const strip = x => { const y = Object.assign({}, x); delete y.row; return y; };
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const rec = {
      gen: true, opening, name: name || 'You', date, prof, focus, groups, wish: p.wish, change: p.change, safety, notice, found, themes,
      intro1, spc, foc, prc,
      own: p.own_habit && p.own_habit[0] ? { text: p.own_habit[0], shared: p.own_habit[1] === 'share' } : null,   // the member's own practice (q54), private or shared
      practices: [...pr.map(x => Object.assign(x, { rec: !maintain })), ...extras].map(x => ({ rec: !!x.rec && !maintain,   // maintenance: nothing is recommended, everything is optional
        note: [enrichOf(x), adaptOf(x), careOf(x)].filter(Boolean).join(' '), area: x.area, fam: x.fam, title: x.title || NAME[x.fam] || x.fam, action: x.row.w, freq: x.row.d, start: x.row.t, why: ownWhy(x), refs: refsOf(x.row), min: wkOf(x), time: timeOf(x), act: actOf(x), budget: x.ex, over: !!x.over })),
      lineup: Object.fromEntries(Object.entries(lineup).map(([a, v]) => [a, v.map(strip)])), later: [],
      steps: { m2: m2.map(strip), m3: m3.map(strip), later: later.slice(0, 3).map(strip) }, add2: m2.map(x => x.fam), add3: m3.map(x => x.fam),
      act: (pr.map(actOf).find(Boolean)) || null,
      mins: maintain ? 0 : mins1, minsOpt: maintain ? roundMin(mins1 + minsOpt) : minsOpt, minsBudget: pr.reduce((t, x) => t + x.ex, 0), unsure, maintain, lower, upper: { '45-60': 60, '1-2h': 120, '2-4h': 240 }[p.time] || 0, timeTxt: TIME_TXT[p.time] || 'some time', pace: { small: 'Small, easy steps', mid: 'Something in between', big: 'A bigger challenge' }[p.change],
      reasons: Object.fromEntries(focus.map(a => [a, o.reasons[a] || []])), known: { Mind: !!p.mind_shown }
    };
    rec.storyFacts = storyFacts(name, A, p, rec);
    rec.story = Object.assign(storyOf(rec.storyFacts), { source: 'rules' });
    return rec;
  }
  function groupsWell(groups) { return AREAS.filter(a => groups[a] === 'well').length >= 3; }

  // what is already going well in an area, from their own answers
  function wellOf(a, A, p) {
    const g = (q, r) => (A[q] || {})[r], has = (q, o) => (A[q] || []).includes(o), now = k => g('q17', k) === 'I already do this', W = [];
    if (a === 'Nutrition') {
      if (g('q7', 'veg') === '5 or more portions') W.push('Eating 5 or more portions of vegetables and fruit a day.');
      if (['3–5', 'More than 5'].includes(g('q7', 'cooked'))) W.push(`Cooking ${g('q7', 'cooked') === '3–5' ? '3 to 5' : 'more than 5'} main meals a week at home.`);
      if (['Two', 'All of them'].includes(g('q7', 'protein'))) W.push(`Including protein in ${g('q7', 'protein') === 'Two' ? 'two' : 'all'} of your main meals.`);
      if (['3–5 days a week', '6–7 days a week'].includes(g('q7', 'grains'))) W.push('Eating whole grains on most days.');
      const occ = [['sugary drinks', 'sugary'], ['processed foods', 'processed'], ['more than 5 g of salt a day', 'salt']].filter(([, k]) => ['Rarely or never', '1–2 days a week'].includes(g('q7', k))).map(x => x[0]);
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
  buildResult.THEMES = THEMES; buildResult.themesOf = themesOf; buildResult.ownWords = ownWords; buildResult.storyOf = storyOf;
  if (typeof module !== 'undefined') module.exports = { buildResult };
  else root.buildResult = buildResult;
})(this);
