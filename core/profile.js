// "You, in brief": a written summary of the member's own answers, one short paragraph per pillar.
// Only what they told us; no scores, no conditions named; good news first within each paragraph.
const list = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const FQ = { 'Rarely or never': 'rarely', '1–2 days a week': 'on 1–2 days a week', '3–5 days a week': 'on 3–5 days a week', '6–7 days a week': 'almost every day' };
const GRID = (A, q, r) => (A[q] || {})[r];
const has = (A, q, o) => (A[q] || []).includes(o);
const lc = s => s.charAt(0).toLowerCase() + s.slice(1);

function profile(A, p) {
  const out = { intro: '', pillars: {} };
  // ---- opening: who they are right now, what they want, how they'd like to go about it
  const work = { 'Mostly regular daytime hours': 'work regular daytime hours', 'Shift work, including nights': 'work shifts, including nights', 'Irregular or changing hours': 'work irregular or changing hours', 'Not currently working': "aren't working at the moment" }[A.q3];
  const AREA = { Nutrition: 'how you eat', Sleep: 'your sleep', Movement: 'how much you move', Mind: 'your mental wellbeing', Connection: 'your connections with others', Prevention: 'your long-term health habits' };
  const time = { 'About 45–60 minutes': 'about 45–60 minutes', '1-2 hours': '1–2 hours', '2-4 hours': '2–4 hours', 'More than 4 hours': 'more than 4 hours', 'It varies': 'a varying amount of time' }[A.q55];
  const pace = { small: 'small, easy steps', mid: 'something in between: steady, but not too gentle', big: 'a bigger challenge' }[p.change];
  const want = p.wish.length ? `You'd like to work on ${list(p.wish.map(a => AREA[a]))}.` : "You weren't sure which area to start with, so we've let your answers lead.";
  const s1 = work ? `You ${work}, and you can give ${time} a week to your Good Span.` : `You can give ${time} a week to your Good Span.`;
  const s2 = p.change === 'big' ? `You're ready for ${pace}.` : `You'd like ${pace}.`;
  const caring = p.carer ? ' Caring or family responsibilities also shape your days, so short practices suit you best.' : '';
  out.intro = `${want} ${s1} ${s2}${caring}`;
  const health = [];
  if ((A.q4 || []).some(x => !['None of these', 'Prefer not to say'].includes(x))) health.push('a health condition');
  if ((A.q5 || []).some(x => x !== 'None of these')) health.push('a symptom we\'d like you to check with a doctor');
  if (A.q2a !== 'Male' && !['50-59', '60-69', '70 or over'].includes(A.q2) && (A.q6 === 'Pregnant' || A.q6 === 'Breastfeeding')) health.push(A.q6 === 'Pregnant' ? 'your pregnancy' : 'that you\'re breastfeeding');
  if ((A.q29 || []).some(x => !['Nothing in particular', 'Prefer not to say'].includes(x))) health.push('what affects how you move');
  if (health.length) out.intro += ` You've also told us about ${list(health)}, and your Good Span takes ${health.length > 1 ? 'these' : 'this'} into account.`;

  // ---- Nutrition
  { const g = r => GRID(A, 'q7', r), s = [];
    const veg = g('veg'), prot = { None: 'none', One: 'one', Two: 'two', 'All of them': 'all' }[g('protein')], cook = { 'Fewer than 3': 'fewer than 3', '3–5': '3 to 5', 'More than 5': 'more than 5' }[g('cooked')];
    if (veg) s.push(veg === 'None' ? "You don't usually eat vegetables or fruit on a typical day" : `You eat ${veg.replace(' portions', '').replace('-', '–')} portions of vegetables and fruit a day`);
    if (prot) s[s.length - 1] += `, and ${prot === 'all' ? 'all' : prot} of your main meals ${prot === 'one' ? 'includes' : 'include'} a source of protein.`;
    else if (s.length) s[s.length - 1] += '.';
    if (cook) s.push(`You cook ${cook} main meals a week at home.`);
    const good = [], less = [];
    if (['3–5 days a week', '6–7 days a week'].includes(g('grains'))) good.push(`whole grains ${FQ[g('grains')]}`); else if (g('grains')) less.push(`whole grains ${FQ[g('grains')]}`);
    if (['3–5 days a week', '6–7 days a week'].includes(g('beans'))) good.push(`beans or lentils ${FQ[g('beans')]}`); else if (g('beans')) less.push(`beans or lentils ${FQ[g('beans')]}`);
    if (good.length) s.push(`You have ${list(good)}${less.length ? `, and ${list(less)}` : ''}.`); else if (less.length) s.push(`You have ${list(less)}.`);
    const low = [['sugary drinks', 'sugary'], ['processed foods', 'processed'], ['added salt', 'salt']].filter(([, k]) => ['Rarely or never', '1–2 days a week'].includes(g(k))).map(x => x[0]);
    const hi = [['sugary drinks', 'sugary'], ['processed foods', 'processed'], ['added salt', 'salt']].filter(([, k]) => ['3–5 days a week', '6–7 days a week'].includes(g(k))).map(([n, k]) => `${n} ${FQ[g(k)]}`);
    if (low.length) s.push(`${cap(list(low))} ${low.length > 1 ? 'are' : 'is'} only an occasional part of your week${hi.length ? `, while you have ${list(hi)}` : ''}.`); else if (hi.length) s.push(`You have ${list(hi)}.`);
    const goals = (A.q9 || []).filter(x => x !== 'Nothing in particular');
    if (goals.length) s.push(`You'd like to work on ${list(goals.map(lc))}.`);
    out.pillars.Nutrition = s.join(' '); }

  // ---- Sleep
  { const s = []; const h = { 'Less than 5': 'less than 5', '5-6': '5 to 6', '6-7': '6 to 7', '7-8': '7 to 8', '8-9': '8 to 9', 'More than 9': 'more than 9' }[A.q12];
    const dif = (A.q13 || []).filter(x => x !== 'None of these').map(x => lc(x).replace(/^i /, 'you ').replace(/ me /, ' you ').replace("i can't", "you can't").replace('I wake', 'you wake'));
    if (h) s.push(`You sleep ${h} hours on a typical night${dif.length ? `, and on 3 or more nights a week ${list(dif.map(d => d.replace(/^it takes me/, 'it takes you')))}` : ', and sleep itself isn\'t usually a struggle'}.`);
    const now = ['daylight', 'dim', 'regular', 'cool', 'dark', 'quiet', 'screens', 'phone', 'work', 'naps', 'winddown', 'tasks'].filter(k => GRID(A, 'q17', k) === 'I do this now');
    const NOW = { daylight: 'morning daylight', dim: 'dimmed evening lights', regular: 'a regular bedtime and wake time', cool: 'a cool bedroom', dark: 'a dark bedroom', quiet: 'a quiet bedroom', screens: 'no screens in the last half hour', phone: 'no phone in bed', work: 'no work in bed', naps: 'short naps only', winddown: 'a relaxing wind-down', tasks: "writing down tomorrow's tasks" };
    if (now.length) s.push(`Already part of your routine: ${list(now.slice(0, 5).map(k => NOW[k]))}.`);
    const caf = { "I don't have caffeine": "You don't have caffeine", 'Before 12pm': 'Your last caffeine is before midday', '12-3pm': 'Your last caffeine is usually in the early afternoon', '3-6pm': 'Your last caffeine is usually between 3pm and 6pm', 'After 6pm': 'Your last caffeine is usually after 6pm' }[A.q15];
    const eat = { 'Less than 1 hour': 'less than an hour', '1-2 hours': '1 to 2 hours', '2-3 hours': '2 to 3 hours', '3 hours or more': '3 hours or more' }[A.q16];
    if (caf) s.push(`${caf}${eat ? `, and you finish eating ${eat} before bed` : ''}.`);
    const aff = (A.q19 || []).filter(x => x !== 'Nothing in particular');
    if (aff.length) s.push(`${cap(list(aff.map(lc)))} can affect your sleep.`);
    if (A.q2a !== 'Male' && ['40-49', '50-59', '60-69'].includes(A.q2) && ['Often', 'Sometimes'].includes(A.q19a)) s.push(`Hot flushes or night sweats ${A.q19a === 'Often' ? 'often' : 'sometimes'} affect your sleep.`);
    const goals = (A.q18 || []).filter(x => x !== 'Nothing in particular');
    if (goals.length) s.push(`You'd most like to work on ${list(goals.map(lc))}.`);
    out.pillars.Sleep = s.join(' '); }

  // ---- Movement
  { const s = []; const d = +(A.q20 || 0), m = A.q21;
    s.push(d ? `You're active on ${d} ${d === 1 ? 'day' : 'days'} a week, for about ${m === '150 or more' ? '150 minutes or more' : m + ' minutes'} each time: around ${p.mvpa} minutes a week in all.` : "You don't do moderate or vigorous exercise in a typical week at the moment.");
    const st = { '0': "You don't do strength exercise yet", '1': 'You do strength exercise on 1 day a week', '2': 'You do strength exercise on 2 days a week', '3 or more': 'You do strength exercise on 3 or more days a week' }[A.q22];
    const sit = { 'Less than 6': 'less than 6', '6-8': '6 to 8', '8-10': '8 to 10', 'More than 10': 'more than 10' }[A.q23];
    if (st) s.push(`${st}${sit ? `, and you sit for ${sit} hours on a typical day` : ''}.`);
    const steps = { 'Fewer than 5,000': 'fewer than 5,000', '5,000-7,999': '5,000 to 8,000', '8,000-9,999': '8,000 to 10,000', '10,000 or more': '10,000 or more' }[A.q24];
    if (steps) s.push(`You take ${steps} steps a day.`);
    const doNow = (A.q25 || []).filter(x => x !== 'None of these');
    const where = (A.q26 || []).filter(x => x !== 'Other').map(lc);
    if (doNow.length) s.push(`You already ${list(doNow.slice(0, 3).map(lc))}${where.length ? `, mostly ${list(where)}` : ''}.`); else if (where.length) s.push(`You usually move ${list(where.map(w => w.replace('gym or studio', 'at a gym or studio').replace('sports facility or club', 'at a sports club')))}.`);
    const goals = (A.q27 || []).filter(x => x !== 'Nothing in particular');
    if (goals.length) s.push(`You'd like to ${list(goals.map(lc))}.`);
    out.pillars.Movement = s.join(' '); }

  // ---- Mind
  { const s = [];
    const nat = { 'Less than 30 minutes': 'less than 30 minutes', '30 minutes to 2 hours': '30 minutes to 2 hours', '2 to 3 hours': '2 to 3 hours', 'More than 3 hours': 'more than 3 hours' }[A.q30];
    const sm = { 'Less than 30 minutes': 'less than 30 minutes a day on social media', '30-60 minutes': '30 to 60 minutes a day on social media', '1-2 hours': '1 to 2 hours a day on social media', 'More than 2 hours': 'more than 2 hours a day on social media', "I don't use social media": null }[A.q31];
    if (nat) s.push(`You spend ${nat} a week in green spaces or nature${sm ? `, and ${sm}` : A.q31 === "I don't use social media" ? ", and you don't use social media" : ''}.`);
    if (p.mind_shown && A.q32) {
      const sc = r => ({ 'Not at all': 0, 'Several days': 1, 'More than half the days': 2, 'Nearly every day': 3 }[GRID(A, 'q32', r)] || 0);
      const mx = Math.max(sc('anx1'), sc('anx2'), sc('dep1'), sc('dep2'));
      s.push(mx === 0 ? "Over the last two weeks, you haven't felt anxious or low." : `Over the last two weeks, you've felt anxious or low ${['', 'on several days', 'on more than half the days', 'nearly every day'][mx]}.`);
    }
    const prac = (A.q34 || []).filter(x => x !== 'None of these');
    if (prac.length) s.push(`Already part of your routine: ${list(prac.slice(0, 3).map(lc))}.`);
    const goals = (A.q33 || []).filter(x => x !== 'Nothing in particular');
    if (goals.length) s.push(`You'd like help with ${list(goals.map(lc))}.`);
    out.pillars.Mind = s.join(' '); }

  // ---- Connection
  { const s = []; const F = { Never: 'never', Once: 'about once a month', '2-3 times': '2 or 3 times a month', 'Weekly or more': 'every week' };
    const meet = GRID(A, 'q36', 'meet'), ph = GRID(A, 'q36', 'phone'), grp = GRID(A, 'q36', 'group'), vol = GRID(A, 'q36', 'volunteer');
    if (meet) s.push(`You see friends or family in person ${F[meet]}${ph ? ` and talk to them by phone or video ${F[ph]}` : ''}.`);
    if (grp) s.push(grp === 'Never' ? `You're not part of a group, club or class at the moment${vol && vol !== 'Never' ? `, though you volunteer ${F[vol]}` : ''}.` : `You take part in a group, club or class ${F[grp]}${vol && vol !== 'Never' ? ` and volunteer ${F[vol]}` : ''}.`);
    const hab = (A.q37 || []).filter(x => x !== 'None of these').map(x => lc(x).replace(/\bI\b/g, 'you').replace(/\bmy\b/g, 'your').replace("I’m", "you're").replace('i’m', "you're"));
    if (hab.length) s.push(`In a typical week you ${list(hab.slice(0, 3))}.`);
    const goals = (A.q38 || []).filter(x => x !== 'Nothing in particular');
    if (goals.length) s.push(`You'd like ${list(goals.map(lc))}.`);
    out.pillars.Connection = s.join(' '); }

  // ---- Prevention
  { const s = []; const tob = GRID(A, 'q40', 'tobacco'), vap = GRID(A, 'q40', 'vape');
    const smoke = tob === 'Daily' ? 'You smoke daily' : tob === 'Occasionally' ? 'You smoke occasionally' : vap === 'Daily' ? 'You vape daily' : vap === 'Occasionally' ? 'You vape occasionally' : [tob, vap].includes("I used to, but I've stopped") ? "You've stopped smoking or vaping" : "You don't smoke or vape";
    const alc = { Never: "you don't drink alcohol", 'Monthly or less': 'you drink alcohol once a month or less', '2-4 times a month': 'you drink alcohol 2 to 4 times a month', '2-3 times a week': 'you drink alcohol 2 or 3 times a week', '4 or more times a week': 'you drink alcohol 4 or more times a week' }[A.q43];
    s.push(`${smoke}${alc ? `, and ${alc}${A.q43 !== 'Never' && A.q44 ? `, usually ${A.q44.replace('-', ' to ')} drinks at a time` : ''}` : ''}.`);
    const bp = { 'In the past 12 months': 'in the past year', '1-2 years ago': '1 to 2 years ago', 'More than 2 years ago': 'more than 2 years ago', "Never, or I'm not sure": null }[A.q46];
    s.push(bp ? `Your blood pressure was last checked ${bp}.` : "You're not sure when your blood pressure was last checked.");
    const lrn = { 'Rarely or never': 'You rarely learn something new or take on a challenging hobby', 'A few times a month': 'You learn something new or practise a challenging hobby a few times a month', 'About once a week': 'You learn something new about once a week', 'Several times a week': 'You learn something new several times a week' }[A.q51];
    if (lrn) s.push(lrn + '.');
    if (has(A, 'q48', "I've been sunburnt, or used a sunbed, in the past 12 months")) s.push("You've been sunburnt or used a sunbed in the past year.");
    if (has(A, 'q48', 'I often find it hard to follow conversations, or ask people to repeat themselves')) s.push('You often find it hard to follow conversations.');
    if (['60-69', '70 or over'].includes(A.q2) && A.q48a === 'Yes') s.push('You already use hearing aids.');
    const goals = (A.q52 || []).filter(x => x !== 'Nothing in particular');
    if (goals.length) s.push(`You'd like to focus on ${list(goals.map(lc))}.`);
    out.pillars.Prevention = s.join(' '); }

  // ---- what suits them
  const EN = { 'Being outdoors': 'being outdoors', 'Listening to music': 'music', 'Making or creating things': 'making things', Writing: 'writing', 'Being active with other people': 'being active with others', 'Quiet time on my own': 'quiet time on your own', 'Stretching, yoga or Pilates': 'stretching, yoga or Pilates', Sport: 'sport', Cooking: 'cooking' };
  const OO = { 'Tracking or counting what I eat': 'tracking what you eat', 'Using apps or devices to track things': 'tracking apps or devices', 'Eating windows or fasting': 'eating windows or fasting', Meditation: 'meditation', 'Journalling or writing': 'journalling', 'Early-morning activities': 'early-morning activities', 'Practices involving physical affection or touch': 'practices involving touch' };
  const en = (A.q58 || []).map(x => EN[x]).filter(Boolean), oo = (A.q57 || []).map(x => OO[x]).filter(Boolean);
  out.suits = [en.length ? `You enjoy ${list(en)}` : '', oo.length ? `${en.length ? ', and you' : 'You'}'d rather not do ${list(oo)}` : ''].join('') + (en.length || oo.length ? '. We\'ve kept that in mind.' : '');
  return out;
}
if (typeof module !== "undefined") module.exports = { profile };
