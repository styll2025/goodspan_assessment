// The Good Span plan engine (port of the reference rules, v4). Works in the browser and in node.
(function (root) {
'use strict';
const AREAS = ['Nutrition', 'Sleep', 'Movement', 'Mind', 'Connection', 'Prevention'];
const LEVELS = ['Learning', 'Developing', 'Mastering'];
const BUDGET = { '45-60': 60, '1-2h': 120, '2-4h': 240, '4h+': 300, 'varies': 60 };
const DEFAULTS = {
  Sleep: ['Consistent sleep timing', 'Screen-free wind-down', 'Morning daylight', 'Slow breathing to wind down', 'Enough sleep', 'Bed for sleep', 'Bedtime to-do list'],
  Nutrition: ['Balanced plate', 'Protein at meals', 'Plant variety', 'Whole grains', 'Less processed food', 'Slow eating', 'Nuts'],
  Movement: ['Building up cardio', 'Strength sessions', 'Breaking up sitting', 'Balance', 'Stretching', 'Daily steps', 'Walking after meals'],
  Mind: ['Slow breathing', 'Three good things', 'Savouring', 'Time in nature', 'Meditation', 'Self-compassion', 'Micro-breaks', 'Present-moment attention', 'Habit building', 'Reframing'],
  Connection: ['Reaching out', 'Asking follow-up questions', 'Acts of kindness', 'Expressing gratitude', 'Shared meals', 'Group membership'],
  Prevention: ['Routine check-ups', 'Alcohol-free swaps', 'Daily sunscreen', 'Learning new skills', 'Air quality', 'Vaccination record'],
};
const OVERLAP = [['Slow breathing', 'Slow breathing to wind down'], ['Building up cardio', 'Weekly cardio', 'Activity for better sleep'],
  ['Harder cardio and long intervals', 'Short intervals'], ['Strength sessions', 'Strength volume'],
  ['Alcohol intake', 'Alcohol-free swaps', 'Alcohol and sleep'], ['Walking with others', 'Group activity'],
  ['Daily eating window', 'Gap between eating and bed'], ['Shared meals', 'Meals with new people'],
  ['Quitting with full support', 'Trying again to quit'], ['Three good things', 'Expressing gratitude'],
  ['Safe listening', 'Hearing protection'], ['Air quality', 'Indoor air']];
const ONE_OFF = new Set(['Vaccination record', 'Hearing check']);
const CAP_LEARNING = { Movement: ['Exercise warning symptoms', 'Heart, metabolic or kidney condition and inactive'] };
const NO_RAISE = { Movement: ['Pregnant', 'Fall in past 12 months', 'Pain, injury or joint limitation'], Mind: ['Positive PHQ-4 screen'],
  Nutrition: ['Difficult relationship with food', 'Pregnant'], Prevention: ['Higher-risk drinking (AUDIT-C 8+)'] };
const OPTOUT = { meditation: ['Meditation', 'Self-compassion.Mastering'], journalling: ['Expressive writing', 'Three good things', 'Bedtime to-do list', 'Best possible self', 'Self-compassion.Developing'],
  fasting: ['Daily eating window'],
  tracking_food: ['Daily eating window', 'Plant variety.Developing', 'Plant variety.Mastering', 'Salt.Mastering', 'Reducing sugar.Mastering', 'Protein at meals.Mastering'],
  touch: ['Affectionate touch'], early: ['Morning daylight.Mastering'], apps: ['Daily steps.Developing', 'Daily steps.Mastering'] };
const NEXTFAM = { 'Building up cardio': 'Weekly cardio', 'Strength sessions': 'Strength volume', 'Safe listening': 'Hearing protection', 'Air quality': 'Indoor air' };
const SLEEP_SHARE = ['Sharing sleep plans with others', 'Sharing sleep learnings with others', 'Celebrating sleep wins'];
const CESSATION = ['Quitting with full support', 'Trying again to quit', 'Stopping vaping'];
const MAX_UPS = { small: 1, mid: 2, big: 6 };
// Rule 14: practices that match what the member enjoys or where they like to be active (from "Which of these do you enjoy?" and "Where do you usually do your movement?")
const ENJOY = {
  outdoors: ['Time in nature', 'Daily steps', 'Walking after meals', 'Walking with others', 'Building up cardio', 'Weekly cardio', 'Morning daylight', 'Awe walks'],
  music: ['Music to unwind', 'Bedtime music'],
  making: ['Enjoyable leisure', 'Meal planning and home cooking'],
  writing: ['Expressive writing', 'Three good things', 'Best possible self', 'Bedtime to-do list', 'Problem-solving steps', 'Sense of purpose'],
  social: ['Walking with others', 'Group activity', 'Group membership', 'Shared meals', 'Meals with new people', 'Volunteering', 'Activity challenges', 'Talking to acquaintances', 'Reaching out'],
  quiet: ['Meditation', 'Slow breathing', 'Savouring', 'Present-moment attention', 'Time in nature', 'Progressive muscle relaxation', 'Slow breathing to wind down'],
  stretch: ['Yoga for stress', 'Stretching', 'Balance'],
  sport: ['Weekly cardio', 'Building up cardio', 'Harder cardio and long intervals', 'Short intervals', 'Activity challenges', 'Group activity', 'Strength sessions', 'Strength volume'],
  cooking: ['Meal planning and home cooking', 'Shared meals', 'Sharing recipes with others', 'Food memories', 'Plant variety', 'Beans and lentils', 'Whole grains'],
  home: ['Strength sessions', 'Stretching', 'Yoga for stress', 'Movement snacks'],
  gym: ['Strength sessions', 'Strength volume', 'Harder cardio and long intervals', 'Short intervals'],
  work: ['Breaking up sitting', 'Micro-breaks', 'Movement snacks', 'Walking after meals'],
};
// Rule 15: practices about the working day are not offered to members who aren't working
const ENJOY_TXT = { outdoors: "It's also a way to spend time outdoors, which you enjoy.", music: 'It also uses music, which you enjoy.', making: 'It also involves making things, which you enjoy.', writing: 'It also involves writing, which you enjoy.',
  social: 'You can also do it with other people, which you enjoy.', quiet: "It's also a chance for quiet time on your own, which you enjoy.", stretch: 'It also fits your love of stretching and yoga.', sport: 'It also fits your love of sport.', cooking: 'It also involves food and cooking, which you enjoy.',
  home: 'You can do it at home.', gym: 'You can do it at the gym.', work: 'You can do it at work.' };
const WORK_FAMS = ['Micro-breaks', 'Time away from work', 'Focused work'];
const WISH_WEIGHT = 2;
const AREA_TXT = { Nutrition: 'how you eat', Sleep: 'your sleep', Movement: 'how much you move', Mind: 'your mental wellbeing', Connection: 'your connections with others', Prevention: 'your long-term health habits' };
const GOAL_TXT = { protein: 'getting enough protein', plants: 'eating more plants and fibre', processed: 'eating less processed food', sugar: 'reducing sugar',
  heart: 'heart health', planning: 'meal planning and home cooking', out: 'eating well when out', timing: 'when I eat', mindful: 'eating mindfully',
  fall_asleep: 'falling asleep more easily', stay_asleep: 'staying asleep', more_sleep: 'getting more sleep', wake_time: 'waking at the time I want',
  rested: 'waking feeling rested', schedule: 'a more consistent sleep schedule', evening: 'a better evening routine', morning: 'a better morning routine',
  fitness: 'general fitness', strength: 'building strength', cardio: 'cardiovascular fitness', mobility: 'mobility and flexibility', balance: 'balance',
  everyday: 'more everyday movement', consistency: 'exercising more consistently', performance: 'improving performance',
  stress: 'managing stress', switch_off: 'switching off', focus: 'focus and concentration', emotions: 'handling difficult emotions', phone: 'less phone time',
  me_time: 'more time for myself', enjoyment: 'more enjoyment', rest: 'rest and recovery', purpose: 'a greater sense of purpose', routines: 'routines that stick',
  meaningful: 'more meaningful relationships', new_people: 'meeting new people', shared: 'more shared activities', belonging: 'a sense of belonging',
  time: 'more time with friends and family', far: 'staying in touch with people far away', meals: 'sharing meals', helping: 'helping others',
  alcohol: 'drinking less', smoking: 'stopping smoking or vaping', checkups: 'keeping up with check-ups', vaccines: 'knowing which vaccines are due',
  supplements: 'taking only the supplements I need', sun: 'protecting my skin', hearing: 'protecting my hearing', air: 'cleaner air', learning: 'learning new things' };

function makeEngine(DATA) {
  const FAM = new Map(), CAT = new Map();
  for (const r of DATA.lib) {
    const k = r.p + '|' + r.f;
    if (!FAM.has(k)) FAM.set(k, {});
    FAM.get(k)[r.l] = r; CAT.set(k, r.c);
  }
  const GOALMAP = DATA.goals;
  const famOf = (a, f) => FAM.get(a + '|' + f);

  function conditions(p) {
    const c = new Set();
    if (p.shift) c.add('Shift or night work');
    if (p.wakes_early) c.add('Wakes too early');
    if (p.drinks === 0) c.add("Doesn't drink alcohol");
    if (p.pregnant) c.add('Pregnant');
    if (p.breastfeeding) c.add('Breastfeeding');
    if ((p.audit || 0) >= 8) c.add('Higher-risk drinking (AUDIT-C 8+)');
    if (p.kidney) c.add('Kidney disease');
    if (p.diabetes_med) c.add('Diabetes or blood-sugar medicine');
    if (p.food_rel) c.add('Difficult relationship with food');
    if (p.nut_allergy) c.add('Nut allergy');
    if (p.symptoms) c.add('Exercise warning symptoms');
    if ((p.heart || p.diabetes || p.kidney) && p.mvpa < 150) c.add('Heart, metabolic or kidney condition and inactive');
    if (p.pain) c.add('Pain, injury or joint limitation');
    if (p.fall) c.add('Fall in past 12 months');
    if (p.no_sm) c.add("Doesn't use social media");
    if (p.phq4_pos) c.add('Positive PHQ-4 screen');
    if (!p.smokes) c.add("Doesn't smoke");
    if (p.smokes || p.vapes) c.add('Smokes or vapes');
    if (!p.vapes) c.add("Doesn't vape");
    return c;
  }
  const excluded = (row, c, p) => {
    const ex = row.x.filter(t => c.has(t));
    if (row.eq && row.p === 'Movement' && p && !p.gym) ex.push('Needs gym or club equipment');
    return ex;
  };

  function signals(p) {
    const a = {}; AREAS.forEach(x => a[x] = []);
    const add = (ar, w, t, f) => a[ar].push([w, t, f]);
    if (p.sleep_h < 6) add('Sleep', 'H', `You usually sleep ${p.sleep_txt} a night. Guidelines recommend 7 or more hours for adults.`, 'Enough sleep');
    else if (p.sleep_h < 7) add('Sleep', 'M', 'You usually sleep 6-7 hours a night, a little under the 7 or more hours guidelines recommend for adults.', 'Enough sleep');
    const ins = p.insomnia || [];
    if (ins.length >= 2) add('Sleep', 'H', 'On 3 or more nights a week, ' + ins.join(' and ') + '.', 'Slow breathing to wind down');
    else if (ins.length === 1) add('Sleep', 'M', 'On 3 or more nights a week, ' + ins[0] + '.', 'Screen-free wind-down');
    if (p.caffeine_late) add('Sleep', 'M', 'Your last caffeine is usually after 3pm, which can make it harder to fall asleep.', null);
    const v = p.veg;
    if (v === 0) add('Nutrition', 'H', "You don't usually eat vegetables or fruit. At least 5 portions a day are recommended.", 'Balanced plate');
    else if (v <= 2) add('Nutrition', 'M', 'You usually eat 1-2 portions of vegetables and fruit a day. At least 5 are recommended.', 'Balanced plate');
    if ((p.sugary || 0) >= 3) add('Nutrition', 'M', `You have sugary drinks on ${p.sugary_txt} days a week.`, 'Reducing sugar');
    if ((p.processed || 0) >= 3) add('Nutrition', 'M', `You eat packaged or processed foods on ${p.processed_txt} days a week.`, 'Less processed food');
    if (p.wholegrain_rare) add('Nutrition', 'M', 'You rarely eat whole grains.', 'Whole grains');
    if (p.beans_rare) add('Nutrition', 'M', 'You rarely eat beans, lentils or chickpeas.', 'Beans and lentils');
    if ((p.protein_meals ?? 3) <= 1) add('Nutrition', 'M', "Most of your main meals don't include a source of protein.", 'Protein at meals');
    if (p.salt_daily) add('Nutrition', 'M', 'You add salt to your food most days.', 'Salt');
    const m = p.mvpa;
    if (m < 60) add('Movement', 'H', `You do about ${m} minutes of moderate or vigorous activity a week. Guidelines recommend 150-300 minutes.`, 'Building up cardio');
    else if (m < 150) add('Movement', 'M', `You do about ${m} minutes of moderate or vigorous activity a week, a little under the 150 minutes guidelines recommend.`, m < 100 ? 'Building up cardio' : 'Weekly cardio');
    if (p.strength <= 1) add('Movement', 'M', `You do strength exercise on ${p.strength} ${p.strength === 1 ? 'day' : 'days'} a week. Guidelines recommend 2 or more.`, 'Strength sessions');
    if (p.fall) add('Movement', 'M', "You've had a fall in the past 12 months. Balance practice can help you stay steady on your feet.", 'Balance');
    if (p.sit8) add('Movement', 'M', 'You sit for 8 or more hours on a typical day.', 'Breaking up sitting');
    if (p.steps_low) add('Movement', 'M', 'You take fewer than 5,000 steps on a typical day.', 'Daily steps');
    if (p.phq4_pos) add('Mind', 'H', "You've been feeling anxious or low on several days recently.", 'Self-compassion');
    if (p.nature_low) add('Mind', 'M', 'You spend less than 2 hours a week in nature. People who spend at least 2 hours a week tend to report better health and wellbeing.', 'Time in nature');
    if (p.sm_high) add('Mind', 'M', 'You spend more than 2 hours a day on social media.', 'Social media limits');
    if (p.mind_none) add('Mind', 'M', 'None of the mind practices we asked about are part of your routine yet.', 'Slow breathing');
    if (p.isolated) add('Connection', 'H', 'You rarely see or speak to friends or family.', 'Reaching out');
    else if (p.meet_rare) add('Connection', 'M', 'You see friends or family in person once a month or less.', 'Reaching out');
    if (p.no_group) add('Connection', 'M', "You don't currently take part in a group, club or class.", 'Group membership');
    if (p.conn_none) add('Connection', 'M', 'None of the everyday connection habits we asked about are part of your week yet.', 'Acts of kindness');
    const qf = p.tried_quit ? 'Trying again to quit' : 'Quitting with full support';
    if (p.smokes === 'daily') add('Prevention', 'H', 'You smoke daily. Stopping brings real health benefits at any age, and support makes it much more likely to work.', p.want_quit ? qf : 'Smoke-free home');
    else if (p.smokes) add('Prevention', p.want_quit ? 'H' : 'M', p.want_quit ? "You smoke occasionally and you'd like to stop. Support makes stopping much more likely to work." : 'You smoke occasionally.', p.want_quit ? qf : 'Smoke-free home');
    else if (p.vapes) add('Prevention', p.want_quit ? 'H' : 'M', p.want_quit ? "You vape and you'd like to stop. Support makes stopping much more likely to work." : 'You vape.', p.want_quit ? 'Stopping vaping' : null);
    const au = p.audit || 0;
    if (au >= 8) add('Prevention', 'H', 'Your drinking is in the higher-risk range.', 'Alcohol intake');
    else if (au >= 5) add('Prevention', 'M', 'Your drinking is above lower-risk levels.', 'Alcohol intake');
    if (p.bp_old) add('Prevention', 'M', "Your blood pressure hasn't been checked in the past 2 years. All adults are advised to have it checked regularly.", 'Routine check-ups');
    if (p.sunburn) add('Prevention', 'M', "You've been sunburnt or used a sunbed in the past 12 months.", 'Avoiding sunburn');
    if (p.hearing_diff) add('Prevention', 'M', 'You often find it hard to follow conversations.', 'Hearing check');
    if (p.learn_rare) add('Prevention', 'M', 'You rarely learn new things or practise a challenging hobby, which helps keep the mind active.', 'Learning new skills');
    return a;
  }
  const score = s => s.reduce((t, x) => t + (x[0] === 'H' ? 2 : 1), 0);
  const nH = s => s.filter(x => x[0] === 'H').length;
  const status = s => s >= 2 ? 'Learning' : s === 1 ? 'Developing' : 'Mastering';

  function baseline(p, fam) {
    if (p.bl && p.bl[fam] !== undefined) return p.bl[fam] || undefined;
    const v = p.veg, m = p.mvpa, st = p.strength;
    const B = {
      'Balanced plate': v <= 2 ? 'Learning' : v <= 4 ? 'Developing' : 'Mastering',
      'Protein at meals': ['Learning', 'Learning', 'Developing', 'Mastering'][Math.min(p.protein_meals ?? 2, 3)],
      'Enough sleep': p.sleep_h < 6 ? 'Learning' : p.sleep_h < 7 ? 'Developing' : 'skip',
      'Strength sessions': ['Learning', 'Developing', 'Mastering', 'skip'][Math.min(st, 3)],
      'Building up cardio': m < 30 ? 'Learning' : m < 60 ? 'Developing' : m < 100 ? 'Mastering' : 'skip',
      'Weekly cardio': m < 100 ? 'skip' : m < 150 ? 'Learning' : m < 300 ? 'Developing' : 'skip',
      'Breaking up sitting': p.sit8 ? 'Learning' : 'Developing',
    };
    if (p.steps_low) B['Daily steps'] = 'Learning';
    [['nature_low', 'Time in nature'], ['sm_high', 'Social media limits'], ['wholegrain_rare', 'Whole grains'], ['beans_rare', 'Beans and lentils'], ['salt_daily', 'Salt'], ['isolated', 'Reaching out'], ['no_group', 'Group membership']]
      .forEach(([k, f]) => { if (p[k]) B[f] = 'Learning'; });
    if ((p.sugary || 0) >= 3) B['Reducing sugar'] = 'Learning';
    if ((p.processed || 0) >= 3) B['Less processed food'] = 'Learning';
    return B[fam];
  }
  function extraMinutes(p, row) {
    if (row.f === 'Weekly cardio' || row.f === 'Building up cardio') return Math.max(0, row.tg - p.mvpa);
    if (row.f === 'Strength sessions') return Math.max(0, row.tg - 30 * p.strength);
    if ((row.f === 'Harder cardio and long intervals' || row.f === 'Short intervals') && p.mvpa >= 150) return 0;
    return row.ex;
  }
  const optedOut = (fam, level, optout) => optout.some(o => (OPTOUT[o] || []).some(x => x === fam || x === fam + '.' + level));

  function why(p, S, x, wish) {
    let base = whyBase(p, S, x, wish); const f = x.fam;
    if (x.fill && base === x.row.why) base = 'A small, well-established habit to add alongside your priorities. ' + base;
    const ej = (p.enjoy || []).find(k => (ENJOY[k] || []).includes(f));
    return ej && ENJOY_TXT[ej] ? base + ' ' + ENJOY_TXT[ej] : base;
  }
  function whyBase(p, S, x, wish) {
    const a = x.area, f = x.fam, m = p.mvpa;
    if ((f === 'Strength sessions' || f === 'Strength volume') && m >= 150 && p.strength <= 1) return "You're already doing plenty of cardio but less strength work, so we're prioritising strength rather than adding more aerobic exercise.";
    if ((f === 'Building up cardio' || f === 'Weekly cardio') && m < 150) return m < 30
      ? "You're doing little moderate activity at the moment. Guidelines suggest 150–300 minutes a week; building up gradually is a realistic start, and even small increases are linked with better health."
      : `You do about ${m} minutes of moderate activity a week. Guidelines suggest 150–300 minutes, so a little more is a realistic next step, and being more active is linked with better long-term health.`;
    if ((f === 'Harder cardio and long intervals' || f === 'Short intervals') && m >= 150) return 'Your weekly cardio is already above the guidelines, so this changes how you train rather than adding more time.';
    if (f === 'Balance' && p.fall) return "You mentioned a fall in the past year, so we've included balance practice to help you stay steady on your feet.";
    for (const [w, t, ff] of S[a]) if (ff === f) return wish.includes(a) ? `You told us you want to work on ${AREA_TXT[a]}, and ${t[0].toLowerCase()}${t.slice(1)}` : t;
    for (const g of (p.goals[a] || [])) if ((GOALMAP[a][g] || []).includes(f)) return `You picked “${GOAL_TXT[g] || g}” as a goal, and this is a practical way to work on it.`;
    if ((p.why_ans || {})[f]) return (wish.includes(a) ? `You told us you want to work on ${AREA_TXT[a]}, and ` : '') + (wish.includes(a) ? p.why_ans[f][0].toLowerCase() + p.why_ans[f].slice(1) : p.why_ans[f]);
    if (wish.includes(a)) return `You said you'd like to work on ${AREA_TXT[a]}; this is a well-supported place to start.`;
    return x.row.why;
  }
  function pilotNotes(p, c) {
    const N = [], ins = p.insomnia || [];
    if (ins.length && (ins.length >= 2 || p.sleep_h < 6)) N.push(['Sleep difficulties', 'Sleep difficulties on 3+ nights a week. Ask how long; if 3 months or more, suggest they talk to their doctor. Not added to the plan.']);
    if (p.snore) N.push(['Snoring', 'Loud snoring or pauses in breathing. Suggest they mention it to their doctor.']);
    if (c.has('Exercise warning symptoms')) N.push(['Exercise warning symptoms', 'Movement held at Learning, no vigorous practices, until they have seen their doctor.']);
    if (c.has('Heart, metabolic or kidney condition and inactive')) N.push(['Condition and inactive', 'Movement held at Learning until their doctor has advised on activity.']);
    if (p.fall) N.push(['Fall', 'Fall in the past 12 months. Ask whether they have seen a doctor or physiotherapist.']);
    if (p.pregnant || p.breastfeeding) N.push(['Pregnancy', 'Check their midwife or doctor is happy with the plan.']);
    if (p.phq4_pos) N.push(['PHQ-4 positive', 'Check in gently; share local support options.']);
    if ((p.audit || 0) >= 8) N.push(['AUDIT-C 8+', "Talk about support; heavy daily drinkers shouldn't stop suddenly without medical advice."]);
    if ((p.smokes || p.vapes) && !p.want_quit) N.push(['Smokes, not ready to stop', 'Raise it gently at the pre-Span interview; support is there whenever they want it.']);
    if ((p.smokes || p.vapes) && p.want_quit) N.push(['Wants to quit', 'Help them connect with a stop-smoking service or quitline' + (p.tried_quit ? ' (has tried before).' : '.')]);
    if (p.hearing_diff) N.push(['Hearing', 'Finds conversations hard to follow. Suggest a hearing test.']);
    if (p.food_rel && !p.food_pns) N.push(['Food', 'Difficult relationship with food. Check they have support; no tracking, eating-window or eating-before-bed practices.']);
    if (p.food_rel && (p.goals.Nutrition || []).includes('timing')) N.push(['Food timing', "They'd like to work on when they eat. Practices about meal timing are left out for them; talk about it together and agree an approach that feels safe."]);
    if (p.food_pns) N.push(['Food', "Preferred not to say about food considerations. The plan leaves out tracking, eating-window and eating-before-bed practices to be safe; ask gently if there's anything to know."]);
    if ((p.tried_txt || []).length) N.push(['Tried before', "Tried and found it didn't help: " + p.tried_txt.join('; ') + '. Not offered as a priority; ask what got in the way.']);
    if (p.sleep_pro_tried) N.push(['Sleep support', "Has worked with a professional or a sleep programme before and it didn't help. Ask about it."]);
    if (p.sleep_pain) N.push(['Pain and sleep', 'Says pain or physical symptoms affect their sleep. Ask about it.']);
    if (p.carer) N.push(['Caring', 'Has caring or family responsibilities that affect their sleep. The plan prefers short practices; check the timing works.']);
    if (p.sleep_h >= 9) N.push(['Long sleep', 'Usually sleeps more than 9 hours. Ask how they feel during the day and whether anything has changed.']);
    if (p.kidney) N.push(['Kidney', 'Has kidney disease. Protein practices are left out; check any nutrition changes with their doctor.']);
    if (p.high_bp) N.push(['Blood pressure', 'Has high blood pressure. Check it is being monitored, and talk through any big changes in exercise.']);
    if (p.lung) N.push(['Lung condition', 'Has a lung condition, such as asthma or COPD. Check the movement plan suits them.']);
    if ((p.food_other || []).length) N.push(['Food', 'Mentioned: ' + p.food_other.join('; ').toLowerCase() + '. Check the nutrition practices suit them.']);
    if (p.diabetes_med) N.push(['Medication', 'Blood-sugar medicine: check with their doctor before changing meal timing.']);
    if (p.shift) N.push(['Shift work', 'No shift-work sleep practices yet; tailor sleep timing together.']);
    if (p.sleep_pro) N.push(['Sleep support', 'Already works with a professional or a sleep programme. Ask how it is going and keep the plan in step with it.']);
    if (p.health_other) N.push(['Health', 'They mentioned another health condition. Review it with them.']);
    if (!p.mind_shown) N.push(['Always ask', 'Ask about mood (the PHQ-4 was not shown), falls if 60+, and long-term sleep problems.']);
    return N;
  }

  function plan(p) {
    p = Object.assign({ goals: {}, optout: [], doing: [], hyg: [], hyg_done: [], wish: [] }, p);
    const c = conditions(p), S = signals(p), optout = p.optout;
    const opp = {}, st = {}; AREAS.forEach(a => { opp[a] = score(S[a]); st[a] = status(opp[a]); });
    const wish = p.wish.filter(a => AREAS.includes(a));
    const combined = {}; AREAS.forEach(a => combined[a] = opp[a] + (wish.includes(a) ? WISH_WEIGHT : 0));
    const order = AREAS.slice().sort((x, y) => (combined[y] - combined[x]) || ((wish.includes(y) ? 1 : 0) - (wish.includes(x) ? 1 : 0)) || (nH(S[y]) - nH(S[x])) || (AREAS.indexOf(x) - AREAS.indexOf(y)));
    const pri = [order[0]].concat(combined[order[1]] >= 2 ? [order[1]] : []);
    const light = order.filter(a => !pri.includes(a) && combined[a] >= 1).slice(0, 3);
    const budget = BUDGET[p.time] || 60;
    const cap = a => (CAP_LEARNING[a] || []).some(x => c.has(x)) ? 0 : 2;
    const startLevel = (a, f, role) => {
      const b = baseline(p, f);
      if (b === 'skip') return null;
      let i = b ? LEVELS.indexOf(b) : Math.min(LEVELS.indexOf(st[a]), 1);   // no baseline: area level, at most Developing
      if (role === 'Lighter touch') i = b ? LEVELS.indexOf(b) : 0;
      else if (p.change === 'small') i = 0;
      else if (p.change === 'big' && ![...(NO_RAISE[a] || []), ...(CAP_LEARNING[a] || [])].some(x => c.has(x))) i = Math.min(2, i + 1);
      return LEVELS[Math.min(i, cap(a))];
    };
    const goalsOf = a => (p.goals[a] || []).flatMap(g => GOALMAP[a][g] || []);
    // Rule 14: fit score. Inside each group (goals, High signals, Medium signals), practices are ordered by how well they fit this member.
    const fit = (a, f) => {
      const lv = famOf(a, f); if (!lv) return -99;
      const r = lv.Learning || lv['All levels'] || Object.values(lv)[0];
      let sc = 0;
      const hits = (p.goals[a] || []).filter(g => (GOALMAP[a][g] || []).includes(f)).length + (S[a].some(x => x[2] === f) ? 1 : 0) + ((a === 'Sleep' ? (p.sleep_disrupt || []) : a === 'Nutrition' ? (p.meal_rare || []) : []).includes(f) ? 1 : 0);
      if (hits >= 2) sc += 3;                                                    // answers two or more of their goals or answers at once
      if ((p.enjoy || []).some(k => (ENJOY[k] || []).includes(f))) sc += 2;      // something they enjoy, or where they like to be active
      sc += r.ev === 'Foundation' ? 1 : (r.ev === 'Explore' && !goalsOf(a).includes(f)) ? -1 : 0;   // strength of the research (an Explore practice the member asked for isn't marked down)
      const e = extraMinutes(p, r);
      if (e > budget / 2) sc -= 1;                                               // would take more than half their time
      if (p.change === 'small' && e > 15) sc -= 1;                               // small steps: prefer the shorter options
      if ((p.carer || p.irregular || p.schedule) && r.tg > 60) sc -= 1;          // caring, irregular hours or a busy schedule: prefer short practices
      return sc;
    };
    const byFit = (a, list) => list.map((f, i) => [f, i, fit(a, f)]).sort((x, y) => (y[2] - x[2]) || (x[1] - y[1])).map(x => x[0]);
    const ranked = (a, role, strict = false) => {
      const sig = S[a], H = byFit(a, sig.filter(x => x[0] === 'H' && x[2]).map(x => x[2])), M = byFit(a, sig.filter(x => x[0] === 'M' && x[2]).map(x => x[2]));
      const dis = byFit(a, a === 'Sleep' ? (p.sleep_disrupt || []) : a === 'Nutrition' ? (p.meal_rare || []) : []);
      // Rule 18: every goal counts. Take one practice from each chosen goal in turn before a second from any goal.
      const lists = (p.goals[a] || []).map(g => byFit(a, GOALMAP[a][g] || [])), gl = [];
      for (let k = 0; lists.some(l => l.length > k); k++) for (const l of lists) if (l[k] && !gl.includes(l[k])) gl.push(l[k]);
      // in an area the member chose: their first goal, then any High signal (a clear need), then their other goals
      let seq = (wish.includes(a) ? [...gl.slice(0, 1), ...H, ...gl.slice(1), ...dis, ...M] : [...H, ...M, ...gl, ...dis]).concat(strict ? [] : byFit(a, DEFAULTS[a]));
      if (a === 'Movement' && p.fall) seq = ['Balance', ...seq];
      if (a === 'Prevention' && p.ex_smoker) seq = [...seq, 'Staying nicotine-free'];
      if (a === 'Connection' && role === 'Lighter touch' && pri.includes('Sleep')) seq = [...SLEEP_SHARE, ...seq];
      if (a === 'Connection' && !pri.includes('Sleep')) seq = seq.filter(f => !SLEEP_SHARE.includes(f));
      if (a === 'Movement' && p.mvpa >= 150 && p.strength <= 1) seq = ['Strength sessions', ...seq];
      if (a === 'Prevention' && p.ex_smoker && strict) seq = [...seq, 'Staying nicotine-free'];
      if (!strict && (p.audit || 0) < 3) seq = seq.filter(f => !(f === 'Alcohol-free swaps' && !gl.includes(f)));   // no alcohol advice as a filler for people who drink little
      const out = [];
      for (const f of seq) if (!out.includes(f) && !p.doing.includes(f) && !(p.tried || []).includes(f) && !(p.not_working && WORK_FAMS.includes(f))) out.push(f);   // Rules 15 and 16
      return out;
    };
    const backed = (a, f) => (p.goals[a] || []).some(g => (GOALMAP[a][g] || []).includes(f)) || S[a].some(x => x[2] === f)
      || (a === 'Sleep' && (p.sleep_disrupt || []).includes(f)) || (a === 'Nutrition' && (p.meal_rare || []).includes(f)) || (a === 'Movement' && f === 'Balance' && p.fall)
      || (a === 'Movement' && f === 'Strength sessions' && p.mvpa >= 150 && p.strength <= 1) || (a === 'Prevention' && f === 'Staying nicotine-free' && p.ex_smoker);
    const grp = f => OVERLAP.findIndex(g => g.includes(f));
    const log = [];
    let longLT = false, variety = false, ltFill = false; const overTime = [];
    const pick = (a, role, chosen, exclude = [], force = null, strict = false, evMin = null) => {
      for (const f of ranked(a, role, strict || (role === 'Lighter touch' && !ltFill))) {
        if (exclude.includes(f) || chosen.some(x => x.fam === f)) continue;
        const newGoal = (p.goals[a] || []).some(g => (GOALMAP[a][g] || []).includes(f) && !chosen.some(x => x.area === a && (GOALMAP[a][g] || []).includes(x.fam)));
        if (variety && role === 'Priority' && !newGoal && chosen.some(x => x.role === 'Priority' && x.area === a && CAT.get(a + '|' + x.fam) === CAT.get(a + '|' + f))) continue;   // Rule 17 (never at the cost of a goal not yet covered)
        const g = grp(f); if (g >= 0 && chosen.some(x => grp(x.fam) === g)) continue;
        const lv = famOf(a, f); if (!lv) continue;
        // A starting-set practice (not from their goals or answers) is only offered where their own answer shows they're at the start:
        // never "more of" something they already do most days (for example whole grains on 3–5 days a week).
        if (!backed(a, f)) { const b1 = baseline(p, f); if (b1 && b1 !== 'Learning') { log.push([a, f, b1, 'starting set skipped: they already do this most of the time']); continue; } }
        let lvl = startLevel(a, f, role); if (lvl === null) continue;
        if (force) lvl = force;
        const b0 = baseline(p, f), minI = (b0 && cap(a) > 0) ? LEVELS.indexOf(b0) : 0;   // never offer a level below what they already do
        if (LEVELS.indexOf(lvl) < minI) lvl = LEVELS[minI];
        let tries;
        if (lv['All levels']) tries = ['All levels'];
        else { tries = LEVELS.slice(minI, LEVELS.indexOf(lvl) + 1).reverse().filter(l => lv[l]); if (!tries.length && !b0 && !(p.change === 'small' && role === 'Priority')) tries = LEVELS.filter(l => lv[l]).slice(0, 1); }   // small steps: no practice that has no easy level
        let stop = false;
        for (const l of tries) {
          const row = lv[l];
          if (optedOut(f, l, optout)) { log.push([a, f, l, 'opted out']); continue; }
          const ex = excluded(row, c, p); if (ex.length) { log.push([a, f, l, 'excluded: ' + ex.join('; ')]); continue; }
          if (role === 'Priority' && row.ev === 'Explore' && !goalsOf(a).includes(f)) { log.push([a, f, l, 'Explore evidence: lighter touch only']); stop = true; break; }
          if (evMin && row.ev !== evMin) { log.push([a, f, l, 'fallback practices must be Foundation']); stop = true; break; }
          if (role === 'Lighter touch' && !longLT && extraMinutes(p, row) > 15 && !CESSATION.includes(f)) { log.push([a, f, l, 'too much time for a lighter touch']); stop = true; break; }
          return { area: a, fam: f, row, role, fallback: !(strict || role === 'Lighter touch'), atBaseline: !!b0 && LEVELS.indexOf(l) === minI };
        }
      }
      return null;
    };
    let chosen = [];
    const slots = pri.length === 2 ? [pri[0], pri[0], pri[1]] : [pri[0], pri[0], pri[0]];
    // Priority practices: practices that answer this member's goals and answers first (strict); then the other priority area;
    // only then the area's starting set, and only Foundation-level practices. Fewer than 3 is better than an irrelevant one.
    for (const a of slots) {
      // Rule 17: variety. Try first for a practice from a different theme; only if there is none, allow the same theme.
      const strictPick = () => pick(a, 'Priority', chosen, [], null, true) || pri.filter(z => z !== a).map(z => pick(z, 'Priority', chosen, [], null, true)).find(Boolean);
      variety = true; let x = strictPick(); variety = false;           // their own answers, different theme
      if (!x) x = strictPick();                                         // their own answers, same theme
      if (!x) { variety = true; x = pick(a, 'Priority', chosen, [], null, false, 'Foundation'); variety = false; }   // starting set, Foundation only
      if (!x) x = pick(a, 'Priority', chosen, [], null, false, 'Foundation');
      if (!x && wish.includes(a) && !chosen.some(y => y.area === a)) x = pick(a, 'Priority', chosen, [], null, false, 'Targeted');   // an area they chose never ends up empty
      if (x) chosen.push(x);
    }
    // Still fewer than 3? Take the next areas by score (their own answers first, then Foundation practices only).
    for (const a of order.filter(z => !pri.includes(z))) {
      while (chosen.filter(x => x.role === 'Priority').length < 3) {
        const x = pick(a, 'Priority', chosen, [], null, true) || pick(a, 'Priority', chosen, [], null, false, 'Foundation');
        if (!x) break;
        chosen.push(x); if (!pri.includes(a)) pri.push(a);
      }
      if (chosen.filter(x => x.role === 'Priority').length >= 3) break;
    }
    // Lighter touches: up to 3, one per area, from areas the answers point to, each answering a specific answer or goal.
    for (const a of order.filter(z => !pri.includes(z) && combined[z] >= 1)) {
      if (chosen.filter(x => x.role === 'Lighter touch').length >= 3) break;
      const x = pick(a, 'Lighter touch', chosen); if (x) chosen.push(x);
    }
    // Rule 14 (enjoyment): if nothing in the plan matches what the member enjoys, one lighter touch may be swapped (or added) for one that does,
    // as long as it still answers one of their own answers or goals.
    const enjoyed = f => (p.enjoy || []).some(k => (ENJOY[k] || []).includes(f));
    if ((p.enjoy || []).length && !chosen.some(x => enjoyed(x.fam))) {
      for (const a of order.filter(z => !pri.includes(z) && combined[z] >= 1)) {
        const old = chosen.find(x => x.role === 'Lighter touch' && x.area === a), rest = chosen.filter(x => x !== old);
        if (!old && chosen.filter(x => x.role === 'Lighter touch').length >= 3) continue;
        let z = null; const tried = old ? [old.fam] : [];
        for (let k = 0; k < 20; k++) { const y = pick(a, 'Lighter touch', rest, tried); if (!y) break; if (enjoyed(y.fam)) { z = y; break; } tried.push(y.fam); }
        if (z) { z.note = 'chosen because you enjoy it'; if (old) chosen[chosen.indexOf(old)] = z; else chosen.push(z); log.push([a, z.fam, z.row.l, 'lighter touch matched to what they enjoy']); break; }
      }
    }
    const total = ch => ch.reduce((t, x) => t + (x.change === 'DONE' ? 0 : extraMinutes(p, x.row)), 0);
    let guard = 0;
    while (total(chosen) > budget && guard++ < 50) {
      const lt = chosen.filter(x => x.role === 'Lighter touch' && extraMinutes(p, x.row) > 0);
      if (lt.length) { const r = lt[lt.length - 1]; chosen = chosen.filter(x => x !== r); log.push([r.area, r.fam, '', 'removed: over your weekly time']); continue; }
      const pr = chosen.filter(x => x.role === 'Priority');
      // Protect the first priority practice and any that answers a High signal: adjust the others first.
      const keyF = new Set([pr[0] && pr[0].fam, ...AREAS.flatMap(ar => S[ar].filter(q => q[0] === 'H').map(q => q[2]))]);
      const pool = pr.filter(x => !keyF.has(x.fam) && extraMinutes(p, x.row) > 0).length ? pr.filter(x => !keyF.has(x.fam) && extraMinutes(p, x.row) > 0) : pr;
      const big = pool.reduce((b, x) => extraMinutes(p, x.row) > extraMinutes(p, b.row) ? x : b, pool[0]);
      const li = Math.max(0, LEVELS.indexOf(big.row.l)), lv = famOf(big.area, big.fam);
      const bb = baseline(p, big.fam), bI = (bb && cap(big.area) > 0) ? LEVELS.indexOf(bb) : 0;
      const down = LEVELS.slice(bI, li).reverse().filter(l => lv[l] && !excluded(lv[l], c, p).length && !optedOut(big.fam, l, optout) && (lv[l].ev !== 'Explore' || goalsOf(big.area).includes(big.fam)));
      if (down.length) { big.row = lv[down[0]]; big.note = 'started a level lower to fit your time'; continue; }
      const others = chosen.filter(x => x !== big);
      const z = pick(big.area, 'Priority', others, [big.fam], 'Learning');
      if (z && extraMinutes(p, z.row) < extraMinutes(p, big.row)) { z.note = `chosen instead of ${big.fam} to fit your time`; chosen[chosen.indexOf(big)] = z; continue; }
      chosen = others; log.push([big.area, big.fam, '', 'removed: over your weekly time']); overTime.push(big.fam);
    }
    // A priority practice was left out for time: fill the space with one that fits (their own answers first, then Foundation practices).
    if (overTime.length) {
      for (const a of [...pri, ...order.filter(z => !pri.includes(z))]) {
        for (let k = 0; k < 30 && chosen.filter(x => x.role === 'Priority').length < 3; k++) {
          const tried = [...overTime, ...chosen.map(x => x.fam)];
          let z = null;
          for (const [strict, ev] of [[true, null], [false, 'Foundation']]) {
            const t2 = tried.slice();
            for (let j = 0; j < 30; j++) { const y = pick(a, 'Priority', chosen, t2, null, strict, ev); if (!y) break; if (total(chosen) + extraMinutes(p, y.row) <= budget) { z = y; break; } t2.push(y.fam); }
            if (z) break;
          }
          if (!z) break;
          z.note = 'chosen to fit your time'; chosen.splice(chosen.filter(x => x.role === 'Priority').length, 0, z); if (!pri.includes(a)) pri.push(a);
        }
      }
    }
    // Rule 7b: minimum new time. Unless the member chose small steps, a plan that adds less than a third of their time
    // swaps one priority practice that adds no time for one that adds at least 15 minutes and still fits.
    if (p.change !== 'small' && total(chosen) < budget / 3 && !chosen.some(x => x.role === 'Priority' && extraMinutes(p, x.row) >= 15)) {
      const prio = chosen.filter(x => x.role === 'Priority');
      const keyFams = new Set([...S[prio[0] ? prio[0].area : 'Sleep'].filter(x => x[0] === 'H').map(x => x[2])]);
      AREAS.forEach(ar => S[ar].filter(x => x[0] === 'H').forEach(x => keyFams.add(x[2])));
      const victims = prio.filter((x, i) => i > 0 && !keyFams.has(x.fam))
        .sort((x, y) => ((y.fallback ? 1 : 0) - (x.fallback ? 1 : 0)) || (prio.indexOf(y) - prio.indexOf(x)));
      const victim = victims[0];
      if (victim) {
        const others = chosen.filter(x => x !== victim);
        let found = null;
        for (const [a, strictMode] of [[victim.area, true], ...pri.filter(z => z !== victim.area).map(z => [z, true]), ...order.filter(z => !pri.includes(z) && opp[z] >= 1).map(z => [z, true]), ...order.map(z => [z, false])]) {
          const tried = [victim.fam];
          for (let k = 0; k < 30 && !found; k++) {
            const z = pick(a, 'Priority', others, tried, null, strictMode, strictMode ? null : 'Foundation');
            if (!z) break;
            const e = extraMinutes(p, z.row);
            if (e >= 15 && total(others) + e <= budget) found = z; else tried.push(z.fam);
          }
          if (found) break;
        }
        if (found) { found.note = 'added so your Good Span uses some of the time you have'; chosen[chosen.indexOf(victim)] = found; if (!pri.includes(found.area)) pri.push(found.area); log.push([victim.area, victim.fam, '', 'swapped for a practice that adds time (minimum new time)']); }
      }
    }
    // Rule 7b (fallback): if no priority practice can be swapped, one lighter touch that answers the member's own answers may add more than 15 minutes.
    if (p.change !== 'small' && total(chosen) < budget / 3 && !chosen.some(x => extraMinutes(p, x.row) >= 15)) {
      longLT = true;
      for (const a of order.filter(z => !pri.includes(z) && combined[z] >= 1)) {
        const old = chosen.find(x => x.role === 'Lighter touch' && x.area === a), rest = chosen.filter(x => x !== old);
        if (!old && chosen.filter(x => x.role === 'Lighter touch').length >= 3) continue;
        const z = pick(a, 'Lighter touch', rest, old ? [old.fam] : []);
        if (z && extraMinutes(p, z.row) >= 15 && total(rest) + extraMinutes(p, z.row) <= budget) {
          z.note = 'added so your Good Span uses some of the time you have';
          if (old) chosen[chosen.indexOf(old)] = z; else chosen.push(z);
          log.push([a, z.fam, z.row.l, 'lighter touch over 15 minutes (minimum new time)']); break;
        }
      }
      longLT = false;
    }
    // Rule 4b: six practices in month 1 (3 priority + 3 lighter touches; if there are fewer priorities, more lighter touches). If the member's answers don't give enough lighter touches,
    // add one from their answers or goals in any pillar (one per pillar), then a small, well-established practice (Foundation or Targeted,
    // or something they enjoy), never "more of" something they already do. Lighter touches stay at 15 minutes or less.
    // Free time for a sixth practice: start the practice that adds the most time one level lower (never below what they already do,
    // never an Explore level they didn't ask for, never the first priority or one that answers a High signal while another can change).
    const freeTime = () => {
      const keyF = new Set([chosen[0] && chosen[0].fam, ...AREAS.flatMap(ar => S[ar].filter(q => q[0] === 'H').map(q => q[2]))]);
      const cand = chosen.filter(x => extraMinutes(p, x.row) > 15 && LEVELS.indexOf(x.row.l) > 0).sort((u, v) => (keyF.has(u.fam) - keyF.has(v.fam)) || (extraMinutes(p, v.row) - extraMinutes(p, u.row)));
      for (const x of cand) {
        const lv = famOf(x.area, x.fam), li = LEVELS.indexOf(x.row.l), b0 = baseline(p, x.fam), bI = (b0 && cap(x.area) > 0) ? LEVELS.indexOf(b0) : 0;
        const down = LEVELS.slice(bI, li).reverse().find(l => lv[l] && !excluded(lv[l], c, p).length && !optedOut(x.fam, l, optout) && (lv[l].ev !== 'Explore' || goalsOf(x.area).includes(x.fam)) && extraMinutes(p, lv[l]) < extraMinutes(p, x.row));
        if (down) { x.row = lv[down]; x.note = 'started a level lower to make room for your other practices'; log.push([x.area, x.fam, down, 'started lower to fit six practices']); return true; }
      }
      return false;
    };
    const TARGET_PRACTICES = 6, ltN = () => chosen.filter(x => x.role === 'Lighter touch').length;
    for (let g = 0; g < 12 && chosen.length < TARGET_PRACTICES; g++) {
      const usedA = new Set(chosen.filter(x => x.role === 'Lighter touch').map(x => x.area));
      let z = null;
      for (const a of order) { if (usedA.has(a)) continue; const tr = []; for (let k = 0; k < 30 && !z; k++) { const y = pick(a, 'Lighter touch', chosen, tr); if (!y) break; if (total(chosen) + extraMinutes(p, y.row) <= budget) z = y; else tr.push(y.fam); } if (z) break; }
      if (!z) {
        ltFill = true;
        // gather the candidates from every pillar and take the best fit: something they enjoy, then Foundation evidence, then the shortest
        const cands = [];
        for (const a of order) {
          if (usedA.has(a)) continue;
          const tried = [];
          for (let k = 0; k < 30; k++) { const y = pick(a, 'Lighter touch', chosen, tried); if (!y) break; tried.push(y.fam);
            if ((y.row.ev !== 'Explore' || enjoyed(y.fam)) && total(chosen) + extraMinutes(p, y.row) <= budget) cands.push(y); }
        }
        const sc = y => (enjoyed(y.fam) ? 4 : 0) + (y.row.ev === 'Foundation' ? 2 : 0) - extraMinutes(p, y.row) / 100;
        cands.sort((u, v) => (sc(v) - sc(u)) || (order.indexOf(u.area) - order.indexOf(v.area)));
        z = cands[0] || null;
        ltFill = false;
        if (z) z.fill = true;
      }
      if (!z && !freeTime()) break;   // no room left: try to free time by starting the biggest practice a level lower, then try again
      if (!z) continue;
      chosen.push(z); log.push([z.area, z.fam, z.row.l, z.fill ? 'lighter touch added to reach six practices (starting set)' : 'lighter touch added to reach six practices']);
    }
    chosen.forEach(x => { x.change = 'START'; x.why = why(p, S, x, wish); });
    const months = [chosen.map(x => Object.assign({}, x))];
    for (const m of [2, 3]) {
      const cur = months[months.length - 1].map(x => Object.assign({}, x));
      cur.forEach(y => { y.change = 'CONTINUE'; delete y.note; });
      const upsAllowed = (p.change === 'small' && m === 2) ? 0 : MAX_UPS[p.change] ?? 2;
      const cands = [];
      cur.forEach((y, i) => {
        const r = y.row, a = y.area;
        if (ONE_OFF.has(y.fam)) {
          const used = months.flat().map(q => q.fam), rest = cur.filter(q => q !== y), tried = [y.fam, ...used];
          for (const ar of [...new Set([a, ...pri, ...order])]) {   // same area first, then the other priority areas, then the next areas
            const t2 = tried.slice();
            for (let k = 0; k < 30; k++) {
              const z = pick(ar, y.role, rest, t2, null, ar !== a, ar !== a && y.role === 'Priority' ? null : null);
              if (!z) break;
              if (total(rest) + extraMinutes(p, z.row) <= budget) { Object.assign(z, { change: 'SWAP', note: `${y.fam} done` }); z.why = why(p, S, z, wish); cur[i] = z; return; }
              t2.push(z.fam);
            }
          }
          cur[i] = Object.assign({}, y, { change: 'DONE', note: `${y.fam} done; nothing else fits your time, so this space stays free` });
          return;
        }
        if (!LEVELS.includes(r.l) || y.role === 'Lighter touch') return;
        const li = LEVELS.indexOf(r.l);
        if (cap(a) === 0) { y.note = 'held at Learning for safety until the Pilot has discussed it'; return; }
        const lv = famOf(a, y.fam);
        const higher = LEVELS.slice(li + 1).filter(l => lv[l]);
        if (li === 2 || !higher.length) {
          const nf = NEXTFAM[y.fam], nl = nf && famOf(a, nf), nr = nl && LEVELS.map(l => nl[l]).find(Boolean);
          if (nr && !excluded(nr, c, p).length && !optedOut(nf, nr.l, optout) && !cur.some(q => q.fam === nf)) cands.push([extraMinutes(p, nr) - extraMinutes(p, r), i, { area: a, fam: nf, row: nr, role: y.role }, 'SWAP']);
          return;
        }
        const nxt = higher[0];
        if (optedOut(y.fam, nxt, optout) || excluded(lv[nxt], c, p).length) return;
        cands.push([extraMinutes(p, lv[nxt]) - extraMinutes(p, r), i, lv[nxt], 'LEVEL UP']);
      });
      let n = 0;
      cands.sort((u, v) => u[0] - v[0]).forEach(([d, i, nw, kind]) => {
        if (n >= upsAllowed) { cur[i].note = 'level up later: keeping to the pace you chose'; return; }
        if (total(cur) + d > budget) { cur[i].note = 'level up only if you agree to more time'; return; }
        if (kind === 'SWAP') { Object.assign(nw, { change: 'SWAP', note: `${cur[i].fam} mastered` }); nw.why = why(p, S, nw, wish); cur[i] = nw; }
        else { cur[i].row = nw; cur[i].change = 'LEVEL UP'; }
        n++;
      });
      months.push(cur);
    }
    const trig = DATA.hyg.filter(h => p.hyg.includes(h.f) && !(h.f === 'Step tracking' && optout.includes('apps'))).sort((x, y) => (pri.includes(x.p) ? 0 : 1) - (pri.includes(y.p) ? 0 : 1));
    const FILL = ['Evening light', 'Dark bedroom', 'Cool bedroom', 'Notifications', 'Bedroom noise', 'Caffeine timing'];   // broadly useful; never filler: warm-up, napping, recovery, music
    const fill = FILL.map(f => DATA.hyg.find(h => h.f === f)).filter(h => h && !trig.includes(h) && !(p.hyg_done || []).includes(h.f) && !(p.hyg_tried || []).includes(h.f) && !(h.f === 'Caffeine timing' && p.no_caffeine));
    const found = trig.concat(fill).slice(0, Math.max(4, Math.min(8, trig.length))).map(h => Object.assign({}, h, { because: (p.hyg_why || {})[h.f] || '' }));
    const THEMES_N = 6;   // Rule 11: six themes for months 4–6
    const used = new Set(), themes = [];
    for (const a of [...(pri.length === 1 ? [pri[0], pri[0]] : pri), ...light, ...order.filter(x => !pri.includes(x) && !light.includes(x))]) {
      if (themes.length >= THEMES_N) break;
      for (const f of ranked(a, 'Priority')) {
        const t = CAT.get(a + '|' + f), lv = famOf(a, f);
        if (t && !used.has(t) && t !== 'Sharing Sleep Progress' && lv && Object.values(lv).some(r => !excluded(r, c, p).length)) { themes.push([a, t, pri.includes(a) ? 'pri' : chosen.some(x => x.role === 'Lighter touch' && x.area === a) ? 'light' : (opp[a] >= 1 || (p.goals[a] || []).length) ? 'room' : 'next']); used.add(t); break; }
      }
    }
    for (const a of [...pri, ...chosen.filter(x => x.role === 'Lighter touch').map(x => x.area), ...order]) {
      if (themes.length >= THEMES_N) break;
      for (const f of ranked(a, 'Priority')) {
        const t = CAT.get(a + '|' + f), lv = famOf(a, f);
        if (t && !used.has(t) && t !== 'Sharing Sleep Progress' && lv && Object.values(lv).some(r => !excluded(r, c, p).length)) { themes.push([a, t, pri.includes(a) ? 'pri' : chosen.some(x => x.role === 'Lighter touch' && x.area === a) ? 'light' : (opp[a] >= 1 || (p.goals[a] || []).length) ? 'room' : 'next']); used.add(t); break; }
      }
    }
    const notes = pilotNotes(p, c);
    if (overTime.length) notes.push(['Over time', `${overTime.join(' and ')} didn't fit in their weekly time, so ${overTime.length > 1 ? 'they were' : 'it was'} left out. Ask whether they'd like to make room for ${overTime.length > 1 ? 'them' : 'it'}.`]);
    if (p.change !== 'small' && months[0] && total(months[0]) < budget / 3 && !months[0].some(x => extraMinutes(p, x.row) >= 15)) notes.push(['Low new time', `The plan adds about ${Math.round(total(months[0]))} of the ${budget} minutes a week they have. Ask whether they'd like to use more of it.`]);
    if (p.own_habit && p.own_habit[1] === 'share' && p.own_habit[0]) notes.push(['Own habit', `Member would like to work on: “${p.own_habit[0]}”. Shape it into a practice with them at the pre-Span 1:1.`]);
    const reasons = {}; AREAS.forEach(a => reasons[a] = S[a].slice().sort((x, y) => (x[0] === 'H' ? 0 : 1) - (y[0] === 'H' ? 0 : 1)).slice(0, 3).map(x => x[1]));
    const target = ms => ms.reduce((t, x) => t + (x.change === 'DONE' ? 0 : x.row.tg), 0);
    // Rule 13: "Not right for me". The member gives a reason from a fixed list; each reason has one rule.
    // Returns up to 2 options that pass every hard rule, or hands the decision to the Pilot. Changes apply at the next check-in.
    const notRight = (mi, i, reason) => {
      const cur = months[mi], y = cur && cur[i];
      if (!y) return null;
      const others = cur.filter(z => z !== y);
      const first = cur.find(x => x.role === 'Priority') === y;
      if (reason === 'health') return { action: 'pause', pilot: `Paused "${y.fam}" for a health or physical reason. Discuss before replacing it.` };
      if (reason === 'other') return { action: 'pilot', pilot: `Says "${y.fam}" isn't right for them (own words attached). Review together.` };
      if (first) return { action: 'pilot', locked: true, pilot: `Asked to change "${y.fam}", their first priority practice (reason: ${reason}). Talk it through before changing it.` };
      if (CESSATION.includes(y.fam) || y.fam === 'Smoke-free home') return { action: 'pilot', locked: true, pilot: `Asked to change "${y.fam}" (reason: ${reason}). Talk through their stop-smoking or vaping support before changing it.` };
      const room = budget - total(others), lv = famOf(y.area, y.fam), li = LEVELS.indexOf(y.row.l);
      const b0 = baseline(p, y.fam), minI = (b0 && cap(y.area) > 0) ? LEVELS.indexOf(b0) : 0;
      const opts = [];
      const ok = (f, row) => row && !optedOut(f, row.l, optout) && !excluded(row, c, p).length;
      const lighter = z => extraMinutes(p, z.row) < extraMinutes(p, y.row) || (extraMinutes(p, z.row) <= extraMinutes(p, y.row) && z.row.tg < y.row.tg);
      const add = (z, needLighter = false) => {
        if (!z || opts.length >= 2) return;
        const e = extraMinutes(p, z.row);
        if (e > room || (needLighter && !lighter(z))) return;
        if (y.role === 'Lighter touch' && e > 15) return;   // lighter touches stay light
        if (opts.some(o => o.fam === z.fam)) return;
        z.role = y.role; z.why = why(p, S, z, wish); opts.push(z);
      };
      const famAlts = (areas, needLighter = false, foundationOnly = false) => {
        for (const a of areas) {
          const tried = [y.fam];
          for (let k = 0; k < 30 && opts.length < 2; k++) {
            const z = (foundationOnly ? null : pick(a, y.role, others, tried, null, true)) || pick(a, 'Priority', others, tried, null, false, 'Foundation');
            if (!z) break;
            tried.push(z.fam); add(z, needLighter);
          }
          if (opts.length >= 2) break;
        }
      };
      if (reason === 'time') {
        const down = LEVELS.slice(minI, Math.max(0, li)).reverse().find(l => ok(y.fam, lv && lv[l]));
        if (down) add({ area: y.area, fam: y.fam, row: lv[down], note: 'same practice, one level lower' }, true);
        famAlts([y.area], true);
      } else if (reason === 'routine') {
        famAlts([y.area]);
        if (!opts.length) famAlts(pri.filter(a => a !== y.area));   // nothing else in this pillar: the other priority pillar
      } else if (reason === 'already') {
        const up = li >= 0 && LEVELS.slice(li + 1).find(l => ok(y.fam, lv && lv[l]) && cap(y.area) > 0);
        if (up) add({ area: y.area, fam: y.fam, row: lv[up], note: 'same practice, one level higher' });
        const nf = NEXTFAM[y.fam], nl = nf && famOf(y.area, nf);
        const nr = nl && LEVELS.map(l => nl[l]).find(Boolean);
        if (nr && ok(nf, nr)) add({ area: y.area, fam: nf, row: nr, note: 'the next step on from this practice' });
        famAlts([y.area]);
      } else if (reason === 'pillar') {
        const areas = [...pri.filter(a => a !== y.area), ...order.filter(a => a !== y.area && !pri.includes(a) && (opp[a] >= 1 || (p.goals[a] || []).length))];
        famAlts([...new Set(areas)]);
        if (!opts.length) famAlts(order.filter(a => a !== y.area && !areas.includes(a)), false, true);   // answers point nowhere else: Foundation practices only
      }
      if (!opts.length) return { action: 'none', pilot: `Asked to change "${y.fam}" (reason: ${reason}); no other practice passed the rules. Kept or paused until you talk.` };
      return { action: 'options', options: opts };
    };
    const lightUsed = [...new Set(chosen.filter(x => x.role === 'Lighter touch').map(x => x.area))];
    return { opp, status: st, wish, combined, pri, light: lightUsed, months, minutes: months.map(total), target: months.map(target), budget,
      foundations: found, themes, pilot: notes, log, reasons, conditions: [...c], extraMinutes: r => extraMinutes(p, r), notRight };
  }
  return { plan, AREAS, LEVELS };
}
if (typeof module !== 'undefined') module.exports = { makeEngine };
else root.makeEngine = makeEngine;
})(this);
