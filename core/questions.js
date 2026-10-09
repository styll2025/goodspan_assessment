// Assessment spec (v7). Each question: id, section, type, text, options; grids have rows and cols (or per-row options).
const NONE_WORDS = /^(None of these|Nothing in particular|I haven't found it particularly difficult|Prefer not to say|I'm not currently looking for more connection)$/;
const FREQ4 = ['Rarely or never', '1–2 days a week', '3–5 days a week', '6–7 days a week'];
const SECTIONS = [
  { id: 'focus', title: 'Your focus', intro: "This assessment helps us understand where you are today across six pillars of longevity: Nutrition, Sleep, Movement, Mind, Connection and Prevention. There are no right or wrong answers. You tell us what you'd like to improve, and your answers show us where the greatest opportunity is. Your Good Span comes from both, and we'll explain why each practice is in it. It takes about 15 minutes." },
  { id: 'about', title: 'About you', intro: 'These questions help us suggest practices that are safe and suitable for you.' },
  { id: 'nutrition', title: 'Nutrition', intro: 'Think about a typical week over the past month.' },
  { id: 'sleep', title: 'Sleep', intro: 'Think about the past month.' },
  { id: 'movement', title: 'Movement', intro: 'Think about a typical week over the past month.' },
  { id: 'mind', title: 'Mind', intro: 'Think about a typical week over the past month.' },
  { id: 'connection', title: 'Connection', intro: 'Think about a typical month.' },
  { id: 'prevention', title: 'Prevention', intro: 'Everyday choices that protect your health over time. There are no right or wrong answers, and your answers are private.' },
  { id: 'life', title: 'Your life and your practices', intro: 'Last few questions. These set the limits your Good Span will respect.' },
];
const AREA_OPTS = ['Nutrition - how you eat and your everyday food habits', 'Sleep - your sleep and sleep routines', 'Movement - your physical activity and movement', 'Mind - your mental and emotional wellbeing', 'Connection - your relationships and social connections', 'Prevention - everyday choices that protect your health over time, such as alcohol, smoking, check-ups and sun protection', 'I’m not sure yet'];
const chosen = (A, area) => (A.q1 || []).some(x => x.startsWith(area)) || (A.q1 || []).includes('I’m not sure yet');
const QUESTIONS = [
  { id: 'q1', s: 'focus', type: 'multi', max: 2, exclusive: ['I’m not sure yet'], text: 'Which one or two areas would you most like to improve?', hint: "We'll still ask about every area. Your Good Span may also include practices from other areas where your answers show the greatest opportunity. We'll always explain why.", options: AREA_OPTS },
  { id: 'q2', s: 'about', type: 'single', text: 'What is your age?', options: ['18-29', '30-39', '40-49', '50-59', '60-69', '70 or over', 'Prefer not to say'] },
  { id: 'q3', s: 'about', type: 'single', text: 'Which best describes your working pattern?', options: ['Mostly regular daytime hours', 'Shift work, including nights', 'Irregular or changing hours', 'Not currently working', 'Prefer not to say'] },
  { id: 'q4', s: 'about', type: 'multi', text: 'Has a doctor or other healthcare professional ever told you that you have any of these?', options: ['A heart condition', 'High blood pressure', 'Diabetes (including if you take insulin or other blood-sugar medicine)', 'Kidney disease', 'A lung condition, such as asthma or COPD', 'Something else', 'None of these', 'Prefer not to say'] },
  { id: 'q5', s: 'about', type: 'multi', text: 'In the past 3 months, have you experienced any of the following?', options: ['Pain, tightness or pressure in your chest', 'Shortness of breath with very little effort', 'Feeling dizzy, light-headed or fainting', 'Your heart racing, fluttering or beating irregularly', 'Swollen ankles', 'Pain in your calves when walking', 'None of these'] },
  { id: 'q5a', s: 'about', type: 'single', show: A => (A.q5 || []).some(x => x !== 'None of these'), text: 'Did any of these happen during or just after physical activity?', options: ['Yes', 'No', 'Not sure'] },
  { id: 'q5b', s: 'about', type: 'single', show: A => (A.q5 || []).some(x => x !== 'None of these'), text: 'Have you talked to a doctor about them?', options: ["Yes, and they're happy for me to be more active", "Yes, but I haven't been told it's OK to be more active yet", 'No, not yet'] },
  { id: 'q6', s: 'about', type: 'single', text: 'Are you currently pregnant or breastfeeding?', options: ['Pregnant', 'Breastfeeding', 'Neither', 'Prefer not to say'] },
  { id: 'q7', s: 'nutrition', type: 'grid', text: 'How does your eating pattern typically look?', rows: [
      ['veg', 'Vegetables and fruit on a typical day', ['None', '1-2 portions', '3-4 portions', '5 or more portions']],
      ['protein', 'Main meals that include a source of protein', ['None', 'One', 'Two', 'All of them']],
      ['cooked', 'Home-cooked main meals in a typical week', ['Fewer than 3', '3–5', 'More than 5']],
      ['grains', 'Whole grains, such as oats, wholegrain bread or brown rice', FREQ4],
      ['beans', 'Beans, lentils or chickpeas', FREQ4],
      ['sugary', 'Sugary drinks, such as soft drinks, energy drinks or sweetened coffee or tea', FREQ4],
      ['processed', 'Packaged or processed foods, such as ready meals, packaged snacks or processed meats', FREQ4],
      ['nuts', 'A handful of unsalted nuts', FREQ4],
      ['salt', 'Adding salt to your food, at the table or when cooking', FREQ4]] },
  { id: 'q8', s: 'nutrition', type: 'grid', text: 'How often do you do these at meals?', cols: ['Rarely', 'Sometimes', 'Most days'], rows: [
      ['screen', 'Eat without a screen'], ['attention', 'Pay attention to the taste and smell of my food'], ['slow', 'Eat slowly, putting my fork down between bites'],
      ['variety', 'Eat a wide variety of plant foods'], ['out', "Have a plan for eating well when I'm out or travelling"], ['window', 'Eat within a set daily time window']] },
  { id: 'q9', s: 'nutrition', type: 'multi', max: 3, goals: 'Nutrition', text: 'What would you most like to improve about how you eat?', options: ['Getting enough protein', 'Eating more plants and fibre', 'Reducing highly processed foods', 'Reducing sugar', 'Heart health: less salt and more nuts', 'Meal planning and home cooking', "Eating well when I'm out or travelling", 'When I eat, such as late-evening eating', 'Eating more mindfully, with fewer distractions', 'Nothing in particular'] },
  { id: 'q11', s: 'nutrition', type: 'multi', text: 'Are there any health, dietary or other considerations we should take into account?', options: ['Nothing in particular', 'Nut allergy', 'Other food allergy or intolerance', 'Dietary restriction or preference (for example vegetarian, vegan, halal or kosher)', 'A health condition that affects what or how I eat', 'A difficult relationship with food', 'Something else', 'Prefer not to say'] },
  { id: 'q12', s: 'sleep', type: 'single', text: 'On a typical night, how many hours of actual sleep do you get?', options: ['Less than 5', '5-6', '6-7', '7-8', '8-9', 'More than 9'] },
  { id: 'q13', s: 'sleep', type: 'multi', text: 'Which of these happen to you on 3 or more nights a week?', options: ['It takes me a long time to fall asleep', 'I wake during the night and find it hard to get back to sleep', "I wake earlier than I want to and can't get back to sleep", 'I wake feeling unrefreshed', 'None of these'] },
  { id: 'q14', s: 'sleep', type: 'single', text: 'Has anyone told you that you snore loudly or seem to stop breathing while you sleep?', options: ['Yes', 'No', 'I don’t know'] },
  { id: 'q15', s: 'sleep', type: 'single', text: 'When do you usually have your last drink containing caffeine?', hint: 'Include coffee, tea, cola and energy drinks.', options: ["I don't have caffeine", 'Before 12pm', '12-3pm', '3-6pm', 'After 6pm'] },
  { id: 'q16', s: 'sleep', type: 'single', text: 'How long before bed do you usually finish eating?', options: ['Less than 1 hour', '1-2 hours', '2-3 hours', '3 hours or more'] },
  { id: 'q17', s: 'sleep', type: 'grid', text: 'Which of these sleep habits do you have now, and which have you tried?', cols: ['I do this now', "I've tried it, but it didn't help", "I haven't tried it"], rows: [
      ['daylight', 'Get outside in daylight in the morning'], ['dim', 'Dim the lights in the evening'], ['regular', 'Keep a regular bedtime and wake time'],
      ['alcohol', 'Cut down on alcohol in the evening'], ['winddown', 'Follow a relaxing wind-down routine, such as breathing, relaxation or calm music'],
      ['tasks', "Write down tomorrow's tasks before bed"], ['cool', 'Keep my bedroom cool'], ['dark', 'Keep my bedroom dark'], ['quiet', 'Keep my bedroom quiet, for example with earplugs'],
      ['screens', 'Avoid screens in the 30 minutes before bed'], ['phone', 'Keep my phone out of bed'], ['work', 'Keep work out of bed'], ['naps', 'Avoid long naps (over 30 minutes)'],
      ['pro', 'Work with a professional or a sleep programme such as CBT-I'], ['share', 'Share sleep goals or progress with others']] },
  { id: 'q18', s: 'sleep', type: 'multi', max: 3, goals: 'Sleep', text: 'Which aspects of your sleep would you most like to improve?', options: ['Falling asleep more easily', 'Staying asleep through the night', 'Getting more sleep', 'Waking at the time I want', 'Waking feeling rested', 'Having a more consistent sleep schedule', 'Improving my evening routine', 'Improving my morning routine', 'Nothing in particular'] },
  { id: 'q19', s: 'sleep', type: 'multi', text: 'Which of these currently affect your sleep?', options: ['Stress or feeling under pressure', 'Work or schedule', 'Screens or technology', 'Caffeine', 'Alcohol', 'Light in my bedroom', 'Noise', 'Bedroom temperature', 'Caring or family responsibilities', 'Pain or physical symptoms', 'Nothing in particular'] },
  { id: 'q20', s: 'movement', type: 'single', text: 'On average, how many days a week do you do moderate or vigorous exercise, such as a brisk walk, that makes you breathe harder?', options: ['0', '1', '2', '3', '4', '5', '6', '7'] },
  { id: 'q21', s: 'movement', type: 'single', show: A => A.q20 && A.q20 !== '0', text: 'On those days, on average, how many minutes do you exercise at this level?', options: ['10', '20', '30', '40', '50', '60', '90', '120', '150 or more'] },
  { id: 'q22', s: 'movement', type: 'single', text: 'On how many days a week do you do strength or resistance exercise, such as weights, bodyweight exercises or resistance bands?', options: ['0', '1', '2', '3 or more'] },
  { id: 'q23', s: 'movement', type: 'single', text: 'On a typical day, how many hours do you spend sitting, including at work, travelling and watching TV?', options: ['Less than 6', '6-8', '8-10', 'More than 10'] },
  { id: 'q24', s: 'movement', type: 'single', text: 'If you track your steps, roughly how many do you take on a typical day?', options: ['Fewer than 5,000', '5,000-7,999', '8,000-9,999', '10,000 or more', "I don't track my steps"] },
  { id: 'q25', s: 'movement', type: 'multi', text: 'Which of these do you already do regularly?', options: ['Warm up before exercise', 'Stretching or mobility work', 'Balance exercises', 'Take breaks from sitting', 'Walk after meals', 'Short bursts of vigorous activity, such as taking stairs fast', 'Interval training', 'Exercise with others or in a group', 'Take part in activity challenges', 'Listen to music while exercising', 'Plan rest or lighter days', 'Walk or cycle to get places', 'Yoga or Pilates', 'None of these'] },
  { id: 'q26', s: 'movement', type: 'multi', text: 'Where do you usually do your movement or exercise?', options: ['Outdoors', 'At home', 'Gym or studio', 'Sports facility or club', 'At work', 'Other'] },
  { id: 'q27', s: 'movement', type: 'multi', max: 3, goals: 'Movement', text: 'What would you most like to improve?', options: ['Build general fitness', 'Build strength', 'Improve cardiovascular fitness', 'Improve mobility and flexibility', 'Improve balance and coordination', 'Increase everyday movement', 'Become more consistent with exercise', 'Improve performance', 'Nothing in particular'] },
  { id: 'q29', s: 'movement', type: 'multi', text: 'Is there anything we should take into account when suggesting movement or exercise?', options: ['Nothing in particular', 'Ongoing pain', 'A recent injury', 'A joint or mobility limitation', 'A fall in the past 12 months', 'A health condition that affects movement or exercise', 'Something else', 'Prefer not to say'] },
  { id: 'q30', s: 'mind', type: 'single', text: 'How much time a week do you spend in green spaces or nature, such as parks, woodland, gardens or beaches?', options: ['Less than 30 minutes', '30 minutes to 2 hours', '2 to 3 hours', 'More than 3 hours'] },
  { id: 'q31', s: 'mind', type: 'single', text: 'On a typical day, how much time do you spend on social media?', options: ['Less than 30 minutes', '30-60 minutes', '1-2 hours', 'More than 2 hours', "I don't use social media"] },
  { id: 'q32', s: 'mind', type: 'grid', show: A => chosen(A, 'Mind'), hint: "These four questions help us suggest practices that suit how you're feeling right now. They are not a diagnosis.", text: 'Over the last 2 weeks, how often have you been bothered by the following?', cols: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'], rows: [
      ['anx1', 'Feeling nervous, anxious or on edge'], ['anx2', 'Not being able to stop or control worrying'], ['dep1', 'Little interest or pleasure in doing things'], ['dep2', 'Feeling down, depressed or hopeless']] },
  { id: 'q33', s: 'mind', type: 'multi', max: 3, goals: 'Mind', text: 'What would you most like to improve in this area?', options: ['Managing stress', 'Switching off and relaxing', 'Focus and concentration', 'Managing difficult emotions', 'Spending less time on my phone or social media', 'Making more time for myself', 'Enjoyment and positive experiences', 'Rest and recovery', 'A greater sense of purpose', 'Building routines that stick', 'Nothing in particular'] },
  { id: 'q34', s: 'mind', type: 'multi', text: 'Which of these are currently part of your routine?', options: ['Meditation or mindfulness', 'Journalling or reflection', 'Breathing or relaxation practices', 'Time for hobbies or enjoyable activities', 'Limits on social media use', 'A gratitude practice', 'Reframing stressful thoughts', 'Naming my feelings', 'Setting aside focused work time', 'Keeping notifications turned off', 'Time away from work', 'Working towards goals that matter to me', 'Tools for building habits, such as if-then plans', 'Yoga or Pilates', 'Listening to music to relax', 'Creative hobbies, such as drawing, crafts or playing an instrument', 'Short breaks during the day', 'None of these'] },
  { id: 'q36', s: 'connection', type: 'grid', text: 'In a typical month, how often do you…', cols: ['Never', 'Once', '2-3 times', 'Weekly or more'], rows: [
      ['phone', 'Talk to friends or family by phone or video'], ['meet', 'Meet friends or family in person'], ['group', 'Take part in a group, club or class'], ['volunteer', 'Volunteer']] },
  { id: 'q37', s: 'connection', type: 'multi', text: 'Which of these do you already do in a typical week?', options: ['Do small acts of kindness for others', 'Tell people what I appreciate about them', 'Respond with enthusiasm when others share good news', 'Ask follow-up questions and really listen', 'Share how I’m really feeling with someone I trust', 'Get in touch with people I haven’t seen for a while', 'Chat with people I don’t know well, such as neighbours', 'Share meals with others', 'Cook or share food traditions with others', 'Hug or share affection with people close to me', 'None of these'] },
  { id: 'q38', s: 'connection', type: 'multi', max: 3, goals: 'Connection', text: 'What, if anything, would you like from your connections with other people?', options: ['More meaningful relationships', 'Meeting new people', 'More shared activities', 'A stronger sense of belonging', 'More time with friends or family', 'Staying in touch with people who live far away', 'Sharing meals with others', 'Helping others or contributing to my community', 'Nothing in particular'] },
  { id: 'q40', s: 'prevention', type: 'grid', text: 'Do you currently smoke or vape?', cols: ['Never', "I used to, but I've stopped", 'Occasionally', 'Daily'], rows: [['tobacco', 'Cigarettes, cigars, rolling tobacco or other tobacco'], ['vape', 'Vapes or e-cigarettes']] },
  { id: 'q41', s: 'prevention', type: 'single', show: A => ['Occasionally', 'Daily'].includes((A.q40 || {}).tobacco) || ['Occasionally', 'Daily'].includes((A.q40 || {}).vape), text: 'Would you like to stop smoking or vaping?', options: ['Yes, in the next month', 'Yes, but not right now', 'Not at the moment', "I'm not sure"] },
  { id: 'q42', s: 'prevention', type: 'single', show: A => (A.q41 || '').startsWith('Yes') && QUESTIONS.find(x => x.id === 'q41').show(A), text: 'Have you tried to stop smoking or vaping before?', options: ['Yes', 'No'] },
  { id: 'q43', s: 'prevention', type: 'single', hint: 'One drink means a small beer (250 ml), a small glass of wine (100 ml) or a single measure of spirits (30 ml).', text: 'How often do you have a drink containing alcohol?', options: ['Never', 'Monthly or less', '2-4 times a month', '2-3 times a week', '4 or more times a week'] },
  { id: 'q44', s: 'prevention', type: 'single', show: A => A.q43 && A.q43 !== 'Never', text: 'On a typical day when you drink, how many drinks do you have?', options: ['1-2', '3-4', '5-6', '7-9', '10 or more'] },
  { id: 'q45', s: 'prevention', type: 'single', show: A => A.q43 && A.q43 !== 'Never', text: 'How often do you have 6 or more drinks on one occasion?', options: ['Never', 'Less than monthly', 'Monthly', 'Weekly', 'Daily or almost daily'] },
  { id: 'q46', s: 'prevention', type: 'single', text: 'When did you last have your blood pressure checked?', options: ['In the past 12 months', '1-2 years ago', 'More than 2 years ago', "Never, or I'm not sure"] },
  { id: 'q48', s: 'prevention', type: 'multi', text: 'Which of these apply to you?', options: ["I've been sunburnt, or used a sunbed, in the past 12 months", 'I often find it hard to follow conversations, or ask people to repeat themselves', 'None of these'] },
  { id: 'q51', s: 'prevention', type: 'single', text: 'How often do you learn something new or practise a mentally challenging hobby, such as a language, an instrument or a craft?', options: ['Rarely or never', 'A few times a month', 'About once a week', 'Several times a week'] },
  { id: 'q52', s: 'prevention', type: 'multi', max: 3, goals: 'Prevention', text: 'What would you most like to improve in this area?', options: ['Drinking less alcohol', 'Stopping smoking or vaping', 'Keeping up with check-ups', 'Knowing which vaccines are due', 'Taking only the supplements I need', 'Protecting my skin from the sun', 'Protecting my hearing', 'Breathing cleaner air at home and outdoors', 'Keeping my mind active by learning new things', 'Nothing in particular'] },
  { id: 'q54', s: 'life', type: 'habit', optional: true, text: "Is there one personal habit or practice you'd particularly like to work on during your Good Span that we haven't covered?", hint: "Optional. Something you'd like to start, strengthen, reduce or stop. It could be health-related or more personal: drinking less, reading again, learning a language, using your phone less, calling family more often, stopping smoking or volunteering.", options: ['Keep this private in my Journal', 'Share this with my Pilot so they can support me'] },
  { id: 'q58', s: 'life', type: 'multi', text: 'Which of these do you enjoy?', hint: "Select all that apply. We'll use this to suggest practices you're more likely to enjoy.", options: ['Being outdoors', 'Listening to music', 'Making or creating things', 'Writing', 'Being active with other people', 'Quiet time on my own', 'Stretching, yoga or Pilates', 'Sport', 'Cooking', 'None of these'] },
  { id: 'q55', s: 'life', type: 'single', text: 'The Good Span asks for about 45-60 minutes a week. How much time could you realistically give to your practices in a typical week?', hint: "Your Good Span will never ask for more new time than this. Things you already do don't count.", options: ['About 45–60 minutes', '1-2 hours', '2-4 hours', 'More than 4 hours', 'It varies'] },
  { id: 'q56', s: 'life', type: 'single', text: 'How big a change feels right for you to start with?', options: ["Small, easy steps. I'm not sure how much I can manage right now", 'Something in between', "I'm ready for a bigger challenge"] },
  { id: 'q57', s: 'life', type: 'multi', text: "Are there any types of practice you'd rather not do?", hint: "We'll never suggest these.", options: ['Tracking or counting what I eat', 'Using apps or devices to track things', 'Eating windows or fasting', 'Meditation', 'Journalling or writing', 'Early-morning activities', 'Practices involving physical affection or touch', 'None of these'] },
];
const GOAL_KEYS = {
  Nutrition: ['protein', 'plants', 'processed', 'sugar', 'heart', 'planning', 'out', 'timing', 'mindful'],
  Sleep: ['fall_asleep', 'stay_asleep', 'more_sleep', 'wake_time', 'rested', 'schedule', 'evening', 'morning'],
  Movement: ['fitness', 'strength', 'cardio', 'mobility', 'balance', 'everyday', 'consistency', 'performance'],
  Mind: ['stress', 'switch_off', 'focus', 'emotions', 'phone', 'me_time', 'enjoyment', 'rest', 'purpose', 'routines'],
  Connection: ['meaningful', 'new_people', 'shared', 'belonging', 'time', 'far', 'meals', 'helping'],
  Prevention: ['alcohol', 'smoking', 'checkups', 'vaccines', 'supplements', 'sun', 'hearing', 'air', 'learning'],
};

// answers -> engine features (the internal rules in the assessment document)
function toFeatures(A) {
  const has = (q, opt) => (A[q] || []).includes(opt);
  const g = (q, r) => (A[q] || {})[r];
  const p = { goals: {}, doing: [], hyg: [], optout: [] };
  const AREAS = ['Nutrition', 'Sleep', 'Movement', 'Mind', 'Connection', 'Prevention'];
  p.wish = AREAS.filter(a => (A.q1 || []).some(x => x.startsWith(a)));
  p.age = A.q2; p.shift = A.q3 === 'Shift work, including nights';
  p.not_working = A.q3 === 'Not currently working'; p.irregular = A.q3 === 'Irregular or changing hours';
  p.heart = has('q4', 'A heart condition');
  p.diabetes = p.diabetes_med = has('q4', 'Diabetes (including if you take insulin or other blood-sugar medicine)');
  p.kidney = has('q4', 'Kidney disease'); p.health_other = has('q4', 'Something else');
  p.high_bp = has('q4', 'High blood pressure'); p.lung = has('q4', 'A lung condition, such as asthma or COPD');
  p.symptoms = (A.q5 || []).some(x => x !== 'None of these');
  p.symptoms_active = p.symptoms && A.q5a === 'Yes';   // during or just after activity
  p.symptoms_cleared = p.symptoms && A.q5b === "Yes, and they're happy for me to be more active";   // a doctor has said it's OK to be more active
  p.symptoms_txt = (A.q5 || []).filter(x => x !== 'None of these');
  p.pregnant = A.q6 === 'Pregnant'; p.breastfeeding = A.q6 === 'Breastfeeding';
  const veg = g('q7', 'veg'); p.veg = { 'None': 0, '1-2 portions': 1.5, '3-4 portions': 3.5, '5 or more portions': 5 }[veg] ?? 3;
  p.protein_meals = { 'None': 0, 'One': 1, 'Two': 2, 'All of them': 3 }[g('q7', 'protein')] ?? 2;
  const fq = v => ({ 'Rarely or never': 0, '1–2 days a week': 1.5, '3–5 days a week': 4, '6–7 days a week': 6.5 }[v] ?? 0);
  const ftxt = v => v === '6–7 days a week' ? '6-7' : '3-5';
  p.sugary = fq(g('q7', 'sugary')); p.sugary_txt = ftxt(g('q7', 'sugary'));
  p.processed = fq(g('q7', 'processed')); p.processed_txt = ftxt(g('q7', 'processed'));
  p.wholegrain_rare = g('q7', 'grains') === 'Rarely or never';
  p.beans_rare = g('q7', 'beans') === 'Rarely or never';
  p.salt_daily = g('q7', 'salt') === '6–7 days a week';
  const MEAL = { screen: ['Screen-free meals'], attention: ['Attention to food'], slow: ['Slow eating'], variety: ['Plant variety'], out: ['Eating out and on the move'], window: ['Daily eating window'] };
  for (const k in MEAL) if (g('q8', k) === 'Most days') p.doing.push(...MEAL[k]);
  // 'Rarely' points to that practice within Nutrition (ranked after the signals; it doesn't raise the Nutrition score). Eating windows are not a goal in themselves.
  p.meal_rare = ['screen', 'attention', 'slow', 'variety', 'out'].filter(k => g('q8', k) === 'Rarely').map(k => MEAL[k][0]);
  if (A.q16 === '3 hours or more') p.doing.push('Gap between eating and bed');
  p.nut_allergy = has('q11', 'Nut allergy');
  p.food_other = (A.q11 || []).filter(o => !['Nut allergy', 'A difficult relationship with food', 'Prefer not to say', 'Nothing in particular'].includes(o));
  p.food_rel = has('q11', 'A difficult relationship with food') || has('q11', 'Prefer not to say');
  p.food_pns = has('q11', 'Prefer not to say') && !has('q11', 'A difficult relationship with food');
  const SH = { 'Less than 5': [4.5, 'less than 5 hours'], '5-6': [5.5, '5-6 hours'], '6-7': [6.5, '6-7 hours'], '7-8': [7.5, '7-8 hours'], '8-9': [8.5, '8-9 hours'], 'More than 9': [9.5, 'more than 9 hours'] }[A.q12] || [7.5, '7-8 hours'];
  p.sleep_h = SH[0]; p.sleep_txt = SH[1];
  const INS = { 'It takes me a long time to fall asleep': 'it takes you a long time to fall asleep', 'I wake during the night and find it hard to get back to sleep': 'you wake during the night and find it hard to get back to sleep', "I wake earlier than I want to and can't get back to sleep": "you wake earlier than you want to and can't get back to sleep", 'I wake feeling unrefreshed': 'you wake feeling unrefreshed' };
  p.insomnia = (A.q13 || []).filter(x => INS[x]).map(x => INS[x]);
  p.wakes_early = has('q13', "I wake earlier than I want to and can't get back to sleep");
  p.snore = A.q14 === 'Yes';
  p.caffeine_late = ['3-6pm', 'After 6pm'].includes(A.q15); p.caffeine_when = A.q15 === 'After 6pm' ? 'after 6pm' : 'between 3pm and 6pm';
  const now = r => g('q17', r) === 'I do this now';
  const SL = { daylight: ['Morning daylight'], regular: ['Consistent sleep timing'], alcohol: ['Alcohol and sleep'], winddown: ['Slow breathing to wind down', 'Progressive muscle relaxation', 'Bedtime music'], tasks: ['Bedtime to-do list'], screens: ['Screen-free wind-down'], share: ['Sharing sleep plans with others', 'Sharing sleep learnings with others', 'Celebrating sleep wins'] };
  for (const k in SL) if (now(k)) p.doing.push(...SL[k]);
  if (now('phone') || now('work')) p.doing.push('Bed for sleep');
  // Rule 16: tried it and it didn't help -> not offered as a priority; the Pilot is told
  const triedNo = r => g('q17', r) === "I've tried it, but it didn't help";
  const SL2 = Object.assign({}, SL, { phone: ['Bed for sleep'], work: ['Bed for sleep'] });
  p.tried = []; p.tried_txt = [];
  for (const [r, lab] of (QUESTIONS.find(x => x.id === 'q17').rows)) if (triedNo(r)) { p.tried.push(...(SL2[r] || [])); p.tried_txt.push(lab.toLowerCase()); }
  p.hyg_tried = [['dim', 'Evening light'], ['cool', 'Cool bedroom'], ['dark', 'Dark bedroom'], ['quiet', 'Bedroom noise'], ['naps', 'Napping']].filter(([r]) => triedNo(r)).map(x => x[1]);
  p.sleep_pro_tried = triedNo('pro');
  if (now('phone') && now('work')) p.doing.push('Bed for sleep');
  p.sleep_pro = now('pro');
  p.sleep_disrupt = [];
  if (has('q19', 'Stress or feeling under pressure')) p.sleep_disrupt.push('Slow breathing to wind down', 'Bedtime to-do list', 'Progressive muscle relaxation');
  if (has('q19', 'Screens or technology')) p.sleep_disrupt.push('Screen-free wind-down');
  if (has('q19', 'Alcohol')) p.sleep_disrupt.push('Alcohol and sleep');
  p.carer = has('q19', 'Caring or family responsibilities'); p.schedule = has('q19', 'Work or schedule'); p.sleep_pain = has('q19', 'Pain or physical symptoms');
  p.hyg_why = {};
  if (has('q19', 'Light in my bedroom') && !now('dark')) { p.hyg.push('Dark bedroom'); p.hyg_why['Dark bedroom'] = 'You said light in your bedroom affects your sleep.'; }
  if (has('q19', 'Noise') && !now('quiet')) { p.hyg.push('Bedroom noise'); p.hyg_why['Bedroom noise'] = 'You said noise affects your sleep.'; }
  if (has('q19', 'Bedroom temperature') && !now('cool')) { p.hyg.push('Cool bedroom'); p.hyg_why['Cool bedroom'] = 'You said bedroom temperature affects your sleep.'; }
  if (p.caffeine_late || has('q19', 'Caffeine')) { p.hyg.push('Caffeine timing'); p.hyg_why['Caffeine timing'] = p.caffeine_late ? `Your last caffeine is usually ${p.caffeine_when}.` : 'You said caffeine affects your sleep.'; }
  if (has('q19', 'Screens or technology') && !now('dim')) { p.hyg.push('Evening light'); p.hyg_why['Evening light'] = 'You said screens affect your sleep.'; }
  p.hyg_done = [];
  [['dim', 'Evening light'], ['cool', 'Cool bedroom'], ['dark', 'Dark bedroom'], ['quiet', 'Bedroom noise'], ['naps', 'Napping']].forEach(([r, f]) => { if (now(r)) p.hyg_done.push(f); });
  if (["I don't have caffeine", 'Before 12pm'].includes(A.q15)) p.hyg_done.push('Caffeine timing');
  p.no_caffeine = A.q15 === "I don't have caffeine";
  const days = +(A.q20 || 0), mins = days ? (A.q21 === '150 or more' ? 150 : +(A.q21 || 0)) : 0;
  p.mvpa = days * mins;
  p.strength = { '0': 0, '1': 1, '2': 2, '3 or more': 3 }[A.q22] ?? 0;
  if (p.strength >= 3) p.doing.push('Strength volume');   // already does strength 3 or more days a week
  p.sit8 = ['8-10', 'More than 10'].includes(A.q23);
  p.steps_low = A.q24 === 'Fewer than 5,000';
  const MV = { 'Yoga or Pilates': ['Stretching', 'Yoga for stress'], 'Stretching or mobility work': ['Stretching'], 'Balance exercises': ['Balance'], 'Take breaks from sitting': ['Breaking up sitting'], 'Walk after meals': ['Walking after meals'], 'Short bursts of vigorous activity, such as taking stairs fast': ['Movement snacks'], 'Interval training': ['Harder cardio and long intervals', 'Short intervals'], 'Exercise with others or in a group': ['Group activity', 'Walking with others'], 'Take part in activity challenges': ['Activity challenges'], 'Walk or cycle to get places': ['Active travel'] };
  for (const o of (A.q25 || [])) if (MV[o]) p.doing.push(...MV[o]);
  [['Warm up before exercise', 'Warm-up'], ['Listen to music while exercising', 'Music and enjoyment in exercise'], ['Plan rest or lighter days', 'Recovery']].forEach(([o, f]) => { if (has('q25', o)) p.hyg_done.push(f); });
  if (A.q24 && A.q24 !== "I don't track my steps") p.hyg_done.push('Step tracking');
  if (has('q34', 'Keeping notifications turned off')) p.hyg_done.push('Notifications');
  p.gym = has('q26', 'Gym or studio') || has('q26', 'Sports facility or club');
  // Rule 14: what the member enjoys and where they like to move
  const EJ = { 'Being outdoors': 'outdoors', 'Listening to music': 'music', 'Making or creating things': 'making', 'Writing': 'writing', 'Being active with other people': 'social', 'Quiet time on my own': 'quiet', 'Stretching, yoga or Pilates': 'stretch', 'Sport': 'sport', 'Cooking': 'cooking' };
  p.enjoy = (A.q58 || []).map(o => EJ[o]).filter(Boolean); p.likes = p.enjoy.slice();   // likes: what they said they enjoy; enjoy also includes where they like to be active
  if (has('q26', 'Outdoors')) p.enjoy.push('outdoors'); if (has('q26', 'At home')) p.enjoy.push('home'); if (has('q26', 'At work')) p.enjoy.push('work');
  if (has('q26', 'Sports facility or club')) p.enjoy.push('sport'); if (has('q26', 'Gym or studio')) p.enjoy.push('gym');
  p.enjoy = [...new Set(p.enjoy)];
  p.pain = ['Ongoing pain', 'A recent injury', 'A joint or mobility limitation'].some(o => has('q29', o));
  p.fall = has('q29', 'A fall in the past 12 months');
  if (has('q29', 'A health condition that affects movement or exercise') || has('q29', 'Something else')) p.health_other = true;
  p.nature_low = ['Less than 30 minutes', '30 minutes to 2 hours'].includes(A.q30);
  if (['2 to 3 hours', 'More than 3 hours'].includes(A.q30)) p.doing.push('Time in nature');   // already meets the 2 hours a week: not offered as 'more of'
  p.sm_high = A.q31 === 'More than 2 hours'; p.no_sm = A.q31 === "I don't use social media";
  p.mind_shown = !!QUESTIONS.find(q => q.id === 'q32').show(A);
  if (p.mind_shown && A.q32) {
    const sc = r => ({ 'Not at all': 0, 'Several days': 1, 'More than half the days': 2, 'Nearly every day': 3 }[g('q32', r)] || 0);
    p.phq4_pos = sc('anx1') + sc('anx2') >= 3 || sc('dep1') + sc('dep2') >= 3;
    p.phq4_often = ['anx1', 'anx2', 'dep1', 'dep2'].some(r => sc(r) >= 2);
  }
  const MD = { 'Yoga or Pilates': ['Yoga for stress', 'Stretching'], 'Listening to music to relax': ['Music to unwind'], 'Creative hobbies, such as drawing, crafts or playing an instrument': ['Enjoyable leisure'], 'Short breaks during the day': ['Micro-breaks'], 'Meditation or mindfulness': ['Meditation'], 'Journalling or reflection': ['Expressive writing'], 'Breathing or relaxation practices': ['Slow breathing'], 'Time for hobbies or enjoyable activities': ['Enjoyable leisure'], 'Limits on social media use': ['Social media limits'], 'A gratitude practice': ['Three good things'], 'Reframing stressful thoughts': ['Reframing'], 'Naming my feelings': ['Naming emotions'], 'Setting aside focused work time': ['Focused work', 'Present-moment attention'], 'Time away from work': ['Time away from work'], 'Working towards goals that matter to me': ['Sense of purpose'], 'Tools for building habits, such as if-then plans': ['Habit building', 'If-then planning'] };
  for (const o of (A.q34 || [])) if (MD[o]) p.doing.push(...MD[o]);
  p.mind_none = has('q34', 'None of these');
  const ph = g('q36', 'phone'), meet = g('q36', 'meet');
  p.isolated = meet === 'Never' && ['Never', 'Once'].includes(ph);
  p.meet_rare = ['Never', 'Once'].includes(meet);
  p.no_group = g('q36', 'group') === 'Never';
  const CN = { 'Do small acts of kindness for others': ['Acts of kindness'], 'Tell people what I appreciate about them': ['Expressing gratitude'], 'Respond with enthusiasm when others share good news': ['Responding to good news'], 'Ask follow-up questions and really listen': ['Asking follow-up questions'], 'Share how I’m really feeling with someone I trust': ['Feelings check-ins', 'Opening up'], 'Get in touch with people I haven’t seen for a while': ['Reaching out'], 'Chat with people I don’t know well, such as neighbours': ['Talking to acquaintances', 'Meals with new people'], 'Share meals with others': ['Shared meals', 'Conversation at meals', 'Sharing recipes with others', 'Thanks after meals'], 'Cook or share food traditions with others': ['Food memories', 'Meal rituals'], 'Hug or share affection with people close to me': ['Affectionate touch'] };
  for (const o of (A.q37 || [])) if (CN[o]) p.doing.push(...CN[o]);
  p.conn_none = has('q37', 'None of these');
  const tob = g('q40', 'tobacco'), vap = g('q40', 'vape');
  p.smokes = tob === 'Daily' ? 'daily' : tob === 'Occasionally' ? 'occasional' : false;
  p.vapes = ['Daily', 'Occasionally'].includes(vap);
  p.ex_smoker = [tob, vap].includes("I used to, but I've stopped");
  p.want_quit = (A.q41 || '').startsWith('Yes'); p.tried_quit = A.q42 === 'Yes';
  const i3 = (q, opts) => Math.max(0, opts.indexOf(A[q]));
  if (A.q43 === 'Never') { p.drinks = 0; p.audit = 0; }
  else if (A.q43) { p.drinks = 1; const opts = id => QUESTIONS.find(x => x.id === id).options; p.audit = i3('q43', opts('q43')) + i3('q44', opts('q44')) + i3('q45', opts('q45')); }
  p.bp_old = ['More than 2 years ago', "Never, or I'm not sure"].includes(A.q46);
  p.sunburn = has('q48', "I've been sunburnt, or used a sunbed, in the past 12 months");
  p.hearing_diff = has('q48', 'I often find it hard to follow conversations, or ask people to repeat themselves');
  p.learn_rare = A.q51 === 'Rarely or never';
  if (['About once a week', 'Several times a week'].includes(A.q51)) p.doing.push('Learning new skills');   // already learns something new weekly
  p.drinks_rare = ['Monthly or less', '2-4 times a month'].includes(A.q43);
  for (const q of QUESTIONS) if (q.goals) p.goals[q.goals] = (A[q.id] || []).map(o => GOAL_KEYS[q.goals][q.options.indexOf(o)]).filter(Boolean);
  const mg = p.goals.Mind || [], vg = p.goals.Movement || [];
  if ((mg.includes('focus') || mg.includes('phone')) && !has('q34', 'Keeping notifications turned off')) { p.hyg.push('Notifications'); p.hyg_why['Notifications'] = mg.includes('focus') ? 'You picked focus and concentration as a goal.' : 'You picked less phone time as a goal.'; }
  if (p.mvpa >= 150 || vg.includes('performance')) if (!has('q25', 'Plan rest or lighter days')) { p.hyg.push('Recovery'); p.hyg_why['Recovery'] = vg.includes('performance') ? 'You picked improving performance as a goal.' : "You already do 150 minutes or more of activity a week."; }
  if (A.q24 === "I don't track my steps" && vg.includes('everyday')) { p.hyg.push('Step tracking'); p.hyg_why['Step tracking'] = "You'd like more everyday movement and don't track your steps yet."; }
  if (A.q54 && A.q54.text && A.q54.text.trim()) p.own_habit = [A.q54.text.trim(), A.q54.choice === 'Share this with my Pilot so they can support me' ? 'share' : 'private'];
  // agreed per-practice baselines (rules.json level_setting): the level that is the member's next step; 'skip' = already at the top
  const F4 = (v, map) => map[[...FREQ4].indexOf(v)];
  const bl = {};
  bl['Daily steps'] = { 'Fewer than 5,000': 'Learning', '5,000-7,999': 'Developing', '8,000-9,999': 'skip', '10,000 or more': 'skip' }[A.q24];
  bl['Time in nature'] = { 'Less than 30 minutes': 'Learning', '30 minutes to 2 hours': 'Developing', '2 to 3 hours': 'Mastering', 'More than 3 hours': 'skip' }[A.q30];
  bl['Social media limits'] = { 'More than 2 hours': 'Learning', '1-2 hours': 'Developing', '30-60 minutes': 'Mastering', 'Less than 30 minutes': 'skip' }[A.q31];
  bl['Learning new skills'] = { 'Rarely or never': 'Learning', 'A few times a month': 'Developing' }[A.q51];
  bl['Whole grains'] = F4(g('q7', 'grains'), ['Learning', 'Learning', 'Developing', 'Mastering']);
  bl['Beans and lentils'] = F4(g('q7', 'beans'), ['Learning', 'Learning', 'Developing', 'Mastering']);
  bl['Nuts'] = F4(g('q7', 'nuts'), ['Learning', 'Developing', 'Mastering', 'skip']);
  bl['Reducing sugar'] = F4(g('q7', 'sugary'), ['Mastering', 'Developing', 'Learning', 'Learning']);
  bl['Less processed food'] = F4(g('q7', 'processed'), ['Mastering', 'Developing', 'Learning', 'Learning']);
  bl['Salt'] = F4(g('q7', 'salt'), ['Mastering', 'Developing', 'Learning', 'Learning']);
  bl['Meal planning and home cooking'] = { 'Fewer than 3': 'Learning', '3–5': 'Developing', 'More than 5': 'Mastering' }[g('q7', 'cooked')];
  bl['Gap between eating and bed'] = { 'Less than 1 hour': 'Learning', '1-2 hours': 'Developing', '2-3 hours': 'Mastering', '3 hours or more': 'skip' }[A.q16];
  const SC = v => ({ 'Never': 'Learning', 'Once': 'Learning', '2-3 times': 'Developing', 'Weekly or more': 'Mastering' }[v]);
  bl['Calling instead of texting'] = SC(g('q36', 'phone')); bl['Shared meals'] = SC(g('q36', 'meet')); bl['Group membership'] = SC(g('q36', 'group')); bl['Volunteering'] = SC(g('q36', 'volunteer'));
  // meal habits: 'Sometimes' means they already do it some of the time, so they start one level up
  for (const [k, f] of [['screen', 'Screen-free meals'], ['attention', 'Attention to food'], ['slow', 'Slow eating'], ['variety', 'Plant variety'], ['out', 'Eating out and on the move'], ['window', 'Daily eating window']]) if (g('q8', k) === 'Sometimes') bl[f] = 'Developing'; else if (g('q8', k) === 'Rarely' && k !== 'window') bl[f] = 'Learning';
  for (const k in bl) if (bl[k] === undefined) delete bl[k];
  p.bl = bl;
  // plain-language reasons from their own answers, used when a practice isn't chosen through a goal or a signal
  const W = {};
  if (g('q7', 'veg') === '3-4 portions') W['Balanced plate'] = 'You eat 3-4 portions of vegetables and fruit a day; this helps you reach 5 or more.';
  // whole grains on some days is not offered as 'more of' (agreed October 2026)
  const nu = g('q7', 'nuts'); if (nu === 'Rarely or never') W['Nuts'] = 'You rarely eat nuts; a small handful most days is linked with better heart health.';
  const MW = { screen: ['Screen-free meals', 'you rarely eat without a screen'], attention: ['Attention to food', 'you rarely pay attention to the taste and smell of your food'], slow: ['Slow eating', 'you rarely eat slowly'], variety: ['Plant variety', 'you rarely eat a wide variety of plant foods'], out: ['Eating out and on the move', "you rarely have a plan for eating well when you're out"] };
  for (const k in MW) if (g('q8', k) === 'Rarely') W[MW[k][0]] = 'You said ' + MW[k][1] + '.';
  if (has('q19', 'Stress or feeling under pressure')) for (const f of ['Slow breathing to wind down', 'Bedtime to-do list', 'Progressive muscle relaxation']) W[f] = 'You said stress or pressure affects your sleep, and this helps you settle before bed.';
  if (has('q19', 'Screens or technology')) W['Screen-free wind-down'] = 'You said screens affect your sleep.';
  if (has('q19', 'Alcohol')) W['Alcohol and sleep'] = 'You said alcohol affects your sleep.';
  p.why_ans = W;
  p.time = { 'About 45–60 minutes': '45-60', '1-2 hours': '1-2h', '2-4 hours': '2-4h', 'More than 4 hours': '4h+', 'It varies': 'varies' }[A.q55] || '45-60';
  p.change = { "Small, easy steps. I'm not sure how much I can manage right now": 'small', 'Something in between': 'mid', "I'm ready for a bigger challenge": 'big' }[A.q56] || 'mid';
  const OO = { 'Tracking or counting what I eat': 'tracking_food', 'Using apps or devices to track things': 'apps', 'Eating windows or fasting': 'fasting', 'Meditation': 'meditation', 'Journalling or writing': 'journalling', 'Early-morning activities': 'early', 'Practices involving physical affection or touch': 'touch' };
  p.optout = (A.q57 || []).map(o => OO[o]).filter(Boolean);
  return p;
}

