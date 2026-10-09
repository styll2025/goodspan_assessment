# The Good Span: complete plan rules

This is the single reference for how an assessment becomes a Good Span. The engine (`core/engine.js`) implements every rule here; the tests in `tests/` check them. If you change a rule, change the engine, this file and the tests together.

Internal document. Nothing in this file is shown to members except the practice text and the “Why this is in your Good Span” line.

## Principle

the member says what they'd like to improve; the assessment shows where the greatest opportunity is; the Good Span comes from both. Every practice says why it's there. The Good Span describes what to work on and is the same for every membership tier: Pilot service levels sit on top of it and are never written into the plan.

## Plan structure

- **Starting Position → Your Good Span (6 months) → New Position → Your next Good Span.**
- **Months 1–3:** 3 priority practices, up to 3 lighter touches, foundations in the background. Month 1 is set; months 2–3 are provisional (CONTINUE / LEVEL UP / SWAP), decided at each monthly check-in by the member, with their Pilot where they have one.
- **Months 4–6:** 4 themes; practices within each theme are chosen at the mid-Span check-in.
- Each practice shows the practice, how often and for how long, the details, its level, its evidence level, the new minutes it adds and its target time, and **“Why this is in your Good Span”**.
- The plan is the same for every membership tier. Pilot notes are never shown to members.
- The system is **rule-based and deterministic**: the same answers always give the same plan. Ties are broken by the order in the library and goal lists, never at random.

## Rules

### Rule 1. Opportunity score

each answer in the table below adds to an area's score. A High signal counts 2 points and a Medium signal counts 1. The Starting Position shows each area as Learning (2+ points), Developing (1) or Mastering (0).

### Rule 2. Priorities

each area's combined score = opportunity score + 2 if the member chose it in question 1. The highest combined area is the first priority; the second-highest is also a priority if it scores 2 or more. Ties: chosen areas first, then more High signals, then the order on the map. “I'm not sure yet” = opportunity score only.

### Rule 3. Priority practices

3. Two from the first priority area and one from the second (or all three from the first). Each is chosen in this order: (a) practices that answer this member's own goals and answers in that area (in an area the member chose, their first goal comes first, then any High signal, then their other goals and Medium signals; elsewhere signals come first; goals map through the “Goals → practices” table); (b) the same from the other priority area; (c) the area's starting set, Foundation-level practices only; (d) if there are still fewer than 3, the next areas by score, their own answers first, then Foundation practices. After a fall, Balance comes first in Movement; if the member already does 150+ minutes of activity but strength on 0-1 days, Strength comes first. Explore-level practices are priority practices only when they match one of the member's goals. An area the member chose never ends up with no practice: if nothing else fits, a Targeted practice from that area is used. A starting-set practice (one not linked to the member's goals or answers) is only used where their own answer shows they are at the start; it is never "more of" something they already do most days (for example, whole grains on 3–5 days a week or 3–4 portions of vegetables). If that leaves fewer than 3 priority practices, the plan has fewer. Alcohol practices are not used as starting-set fillers for people who drink little.

### Rule 4. Lighter touches

up to 3, one per area, from the other areas with a combined score of 1 or more. Each must answer one of the member's own answers or goals (never the starting set), start at Learning or the level they already do, and add no more than 15 minutes a week (stop-smoking and stop-vaping support is exempt). An area with nothing that fits gets no lighter touch, and the next area is tried.

### Rule 5. Evidence level

every practice is Foundation (strong evidence, broadly applicable), Targeted (good evidence, particular needs) or Explore (promising or emerging, optional). Priority goes to Foundation and Targeted practices.

### Rule 6. Hard constraints, applied before anything is proposed

(a) opted-out practice types are never proposed; (b) exclusions for health conditions, pregnancy, injury and the other flags in each practice's Exclude if; (c) Movement is held at Learning, with no vigorous practices, for exercise warning symptoms or a heart, metabolic or kidney condition with inactivity, until the Pilot has discussed it; (d) appetite for change limits the starting level and level-ups (see the notes on the time and change questions); with small, easy steps, a practice that has no easy level is not offered as a priority; (e) the extra Good Span time never goes over the member's weekly time.

### Rule 7. Time

each practice has a target time (the full behaviour) and an extra Good Span time (only what's new for this member). Practices that only change how or when they do something they already do add no time. For cardio and strength, the extra time is the target minus what they already do. If the plan is over the member's time: remove lighter touches first, then start priority practices a level lower or swap them for a quicker practice in the same area. Adjust other practices before the first priority practice or one that answers a High signal. Never exceed the member's time; if a priority practice can't fit, leave it out, fill its place with one that fits (the member's own answers first, then Foundation practices), and add a Pilot note.

### Rule 7b. Minimum new time

unless the member chose small, easy steps, if the plan adds less than a third of their weekly time and no priority practice adds at least 15 minutes, swap one priority practice for one that adds at least 15 minutes and still fits. Never swap the first priority practice or one that answers a High signal; swap a starting-set practice first. Look in the same area, then the other priority area, then other areas the answers point to, then Foundation practices anywhere. If no priority practice can be swapped, one lighter touch that answers the member's own answers may add more than 15 minutes. If the plan still adds less than a third of their time, add a Pilot note.

### Rule 8. Starting level

the member's own answer for that practice where the library maps one (vegetable portions, protein meals, sleep hours, activity minutes, strength days, sitting, steps (8,000 or more counts as already there), time in nature, social media, whole grains, beans, nuts, sugary drinks, processed food, salt, home cooking, eating before bed, and contact with friends, family, groups and volunteering). It is the member's next step, and the plan never offers a level below it, because that is something they already do (already at the top = don't offer it). With no answer for that practice, use the area's level on the Starting Position, but no higher than Developing. Then adjust for appetite for change and safety holds.

### Rule 9. Months 2–3 (provisional)

Months 2-3 are provisional and set at each monthly check-in, with the Pilot's judgement where the member has one: CONTINUE (needs more time to become established) or LEVEL UP (the same practice one level higher: only if it fits the member's time, their appetite for change and any safety hold). The plan itself suggests SWAP only for clear reasons: a one-off practice is done (for example, a check-up is booked; the next practice must fit the member's time and can't be one already used; it comes from the same area, then the other priority areas, then the next areas; otherwise the space stays free and is shown as DONE), or the member has reached the top level and moves to the next practice in that group (for example, Building up cardio to Weekly cardio). Any other change comes from the member through Rule 13.

### Rule 10. Foundations

4-8 hygiene checklist items, those triggered by the member's answers first. If fewer than 4 trigger, fill from these broadly useful items, skipping any the member already does: dim evening light, dark bedroom, cool bedroom, notifications, bedroom noise, caffeine timing (not for people who don't have caffeine). Warm-up, napping, recovery and music in exercise are never used as fillers.

### Rule 11. Themes for months 4-6

4 themes, one per priority area (two if there is one), then the lighter-touch areas. At mid-Span, use the theme where the member's practices went best.

### Rule 12. Pilot notes

health signals and a shared personal habit go to the Pilot for the pre-Span interview (table below) and are never shown to the member as medical advice. The plan only shows the general disclaimer. These safety rules must be reviewed by a qualified professional before the paid launch.

### Rule 13. “Not right for me”

members can flag any practice at any time, but the plan only changes at a check-in (with the Pilot, or the member's own monthly check-in). The member picks one reason from a fixed list and each reason has one rule. (a) It takes too much time: the same practice one level lower, or a practice in the same pillar that adds less new time (or the same new time with a lower weekly target). (b) It doesn't fit my routine: a different practice in the same pillar; if there is none, one from the other priority pillar. (c) I already do this: record it as already in place, then offer the next level, the next practice in that group, or another practice in the same pillar. (d) I'd rather focus on another pillar: the best practice from the other priority pillar or the next pillars the member's answers or goals point to; if there are none, Foundation practices from other pillars. (e) A health or physical reason: no replacement; the practice is paused and a Pilot note is added. (f) Something else: the member's own words go to the Pilot; no automatic change.

Every option offered under Rule 13 passes the same rules as the original plan: weekly time, opt-outs, health flags and exclusions, equipment, overlap with the other practices, the baseline level, safety holds, Explore practices only when they match a goal, and lighter touches no more than 15 minutes. The member sees at most 2 options and picks one; they can't browse the library or choose practice groups freely. If nothing passes, the member keeps the practice or pauses it until the check-in, and the Pilot is told.

Limits: at most one change per practice and two per check-in across the plan. The first priority practice, and stop-smoking, stop-vaping and smoke-free-home support, are never changed by the member alone: the request goes to the Pilot. If the same practice is flagged at two check-ins in a row, the Pilot talks it through instead of the plan offering another option. Every change is recorded with its reason.

### Rule 14. Fit score

The groups stay in the same order (the member's goals and clear needs first), but inside each group practices are ordered by how well they fit this member: +3 if it answers two or more of their goals or answers at once; +2 if it matches something they enjoy or where they like to be active; +1 for Foundation evidence, −1 for Explore (unless the member asked for it through a goal); −1 if it would take more than half of their weekly time; −1 with small, easy steps if it adds more than 15 minutes; −1 for practices over an hour a week when they have caring responsibilities, irregular hours or a busy schedule. Ties keep the library order, so the same answers always give the same plan. If nothing in the plan matches what they enjoy, one lighter touch may be swapped for one that does, as long as it still answers their own answers or goals.

### Rule 15. Life context

Members who aren't working are not offered practices about the working day (Micro-breaks, Time away from work, Focused work). Shift workers keep the existing sleep-timing exclusions. Caring responsibilities, irregular hours and a busy schedule favour shorter practices (Rule 14).

### Rule 16. Tried it and it didn't help

A sleep habit the member has tried without success is not offered as a priority or lighter touch, and the matching foundation is not used; the Pilot is told what they tried.

### Rule 17. Variety

The priority practices come from different themes wherever possible; two from the same theme only if nothing else from the member's own answers fits. Variety never removes a practice for a goal that has no practice yet, and never brings in a starting-set practice in place of one from their answers.

### Rule 18. Every goal counts

When a member picks more than one goal in an area, each goal gets one practice before any goal gets a second.

## Thresholds

Thresholds follow the sources in the practice library: 7+ hours' sleep (AASM/SRS consensus), 5 portions of vegetables and fruit (WHO), 150-300 minutes of activity and 2+ strength days (WHO 2020), 120 minutes a week in nature (White et al., 2019), AUDIT-C cut-offs and the PHQ-4 screen.

## Signals → practices

Each answer adds to an area's opportunity score (High = 2, Medium = 1) and, where it applies, points to the practice that answers it.

| Pillar | Answer | Weight | What the member is told |
|---|---|---|---|
| Sleep | Usually sleeps less than 6 hours | High | You usually sleep less than 6 hours a night. Most adults need 7 or more hours for good health. |
| Sleep | Usually sleeps 6-7 hours | Medium | You usually sleep 6-7 hours a night, a little under the 7 or more hours most adults need. |
| Sleep | 2 or more sleep difficulties on 3+ nights a week | High | On 3 or more nights a week, [difficulties]. (Also adds a Pilot note.) |
| Sleep | 1 sleep difficulty on 3+ nights a week | Medium | On 3 or more nights a week, [difficulty]. |
| Sleep | Last caffeine after 3pm | Medium | Your last caffeine is usually after 3pm, which can make it harder to fall asleep. |
| Nutrition | No vegetables or fruit on a typical day | High | You don't usually eat vegetables or fruit. At least 5 portions a day are recommended. |
| Nutrition | 1-2 portions of vegetables and fruit | Medium | You usually eat 1-2 portions of vegetables and fruit a day. At least 5 are recommended. |
| Nutrition | Sugary drinks on 3+ days a week | Medium | You have sugary drinks on [3-5 / 6-7] days a week. |
| Nutrition | Packaged or processed foods on 3+ days a week | Medium | You eat packaged or processed foods on [3-5 / 6-7] days a week. |
| Nutrition | Whole grains rarely or never | Medium | You rarely eat whole grains. |
| Nutrition | Beans, lentils or chickpeas rarely or never | Medium | You rarely eat beans, lentils or chickpeas. |
| Nutrition | Rarely eats without a screen, pays attention to food, eats slowly, eats a variety of plants or plans for eating out | Ranking only | Puts the matching practice forward within Nutrition (it doesn't raise the Nutrition score). 'Sometimes' starts that practice one level up. |
| Nutrition | Protein at no main meals or one | Medium | Most of your main meals don't include a source of protein. |
| Nutrition | Adds salt on 6-7 days a week | Medium | You add salt to your food most days. |
| Movement | Moderate or vigorous activity under 60 minutes a week (days × minutes) | High | You do about [X] minutes of moderate or vigorous activity a week. Guidelines recommend 150-300 minutes. |
| Movement | Moderate or vigorous activity 60-149 minutes a week (practice: Building up cardio under 100 minutes, Weekly cardio from 100) | Medium | You do about [X] minutes of moderate or vigorous activity a week, a little under the 150 minutes guidelines recommend. |
| Movement | A fall in the past 12 months | Medium | You've had a fall in the past 12 months. Balance practice can help you stay steady on your feet. (Also adds a Pilot note.) |
| Movement | Strength exercise on 0-1 days a week | Medium | You do strength exercise on [0 / 1] days a week. Guidelines recommend 2 or more. |
| Movement | Sits 8 or more hours a day | Medium | You sit for 8 or more hours on a typical day. |
| Movement | Fewer than 5,000 steps a day (if tracked) | Medium | You take fewer than 5,000 steps on a typical day. |
| Mind | Positive PHQ-4 screen (only when those questions were shown) | High | You've been feeling anxious or low on several days recently. Points to Self-compassion. (Also adds a Pilot note.) |
| Mind | Less than 2 hours a week in nature | Medium | You spend less than 2 hours a week in nature. People who spend at least 2 hours a week tend to report better health and wellbeing. |
| Mind | Social media more than 2 hours a day | Medium | You spend more than 2 hours a day on social media. |
| Mind | None of the listed Mind practices in their routine | Medium | None of the mind practices we asked about are part of your routine yet. |
| Connection | Meets friends or family in person 'Never' and talks by phone or video 'Never' or 'Once' a month | High | You rarely see or speak to friends or family. |
| Connection | Meets friends or family in person once a month or less | Medium | You see friends or family in person once a month or less. |
| Connection | Never takes part in a group, club or class | Medium | You don't currently take part in a group, club or class. |
| Connection | None of the listed connection habits | Medium | None of the everyday connection habits we asked about are part of your week yet. |
| Prevention | Smokes daily (practice: quitting support if they want to stop; otherwise Smoke-free home and a Pilot note) | High | You smoke daily. Stopping is one of the biggest things you can do for your long-term health, and support makes it much more likely to work. |
| Prevention | Smokes occasionally, or vapes, and would like to stop | High | You [smoke occasionally / vape] and you'd like to stop. Support makes stopping much more likely to work. |
| Prevention | Smokes occasionally, or vapes, and isn't ready to stop | Medium | You [smoke occasionally / vape]. (Also adds a Pilot note.) |
| Prevention | AUDIT-C 8 or more | High | Your drinking is in the higher-risk range. (Also adds a Pilot note.) |
| Prevention | AUDIT-C 5-7 | Medium | Your drinking is above lower-risk levels. |
| Prevention | Blood pressure last checked more than 2 years ago, never or not sure | Medium | Your blood pressure hasn't been checked in the past 2 years. All adults are advised to have it checked regularly. |
| Prevention | Sunburnt or used a sunbed in the past 12 months | Medium | You've [been sunburnt / used a sunbed] in the past 12 months. |
| Prevention | Finds it hard to follow conversations | Medium | You often find it hard to follow conversations. (Also adds a Pilot note.) |
| Prevention | Learns something new rarely or never | Medium | You rarely learn new things or practise a challenging hobby, which helps keep the mind active. |

## Goals → practices

In the order the plan tries them (then re-ordered within the list by the fit score, Rule 14).

| Pillar | Goal (as the member sees it) | Key | Practices | Notes |
|---|---|---|---|---|
| Nutrition | Getting enough protein | `protein` | Protein at meals, Balanced plate |  |
| Nutrition | Eating more plants and fibre | `plants` | Balanced plate, Whole grains, Beans and lentils, Plant variety |  |
| Nutrition | Reducing highly processed foods | `processed` | Less processed food |  |
| Nutrition | Reducing sugar | `sugar` | Reducing sugar |  |
| Nutrition | Heart health: less salt and more nuts | `heart` | Salt, Nuts | Nuts excluded for nut allergy. |
| Nutrition | Meal planning and home cooking | `planning` | Meal planning and home cooking |  |
| Nutrition | Eating well when I'm out or travelling | `out` | Eating out and on the move |  |
| Nutrition | When I eat, such as late-evening eating | `timing` | Gap between eating and bed, Daily eating window | Eating window excluded for pregnancy, blood-sugar medicine, a difficult relationship with food, shift work, or opting out of fasting. |
| Nutrition | Eating more mindfully, with fewer distractions | `mindful` | Screen-free meals, Attention to food, Slow eating |  |
| Sleep | Falling asleep more easily | `fall_asleep` | Slow breathing to wind down, Screen-free wind-down, Bedtime to-do list, Progressive muscle relaxation, Bedtime music |  |
| Sleep | Staying asleep through the night | `stay_asleep` | Bed for sleep, Alcohol and sleep, Slow breathing to wind down, Progressive muscle relaxation | Alcohol and sleep excluded for non-drinkers. |
| Sleep | Getting more sleep | `more_sleep` | Enough sleep |  |
| Sleep | Waking at the time I want | `wake_time` | Consistent sleep timing, Morning daylight |  |
| Sleep | Waking feeling rested | `rested` | Enough sleep, Consistent sleep timing, Activity for better sleep |  |
| Sleep | Having a more consistent sleep schedule | `schedule` | Consistent sleep timing, Morning daylight | Sleep timing excluded for shift work. |
| Sleep | Improving my evening routine | `evening` | Screen-free wind-down, Slow breathing to wind down, Bedtime to-do list, Bedtime music |  |
| Sleep | Improving my morning routine | `morning` | Morning daylight, Activity for better sleep |  |
| Movement | Build general fitness | `fitness` | Weekly cardio, Building up cardio, Strength sessions | Weekly cardio only from 100+ minutes of activity; below that, Building up cardio. |
| Movement | Build strength | `strength` | Strength sessions, Strength volume |  |
| Movement | Improve cardiovascular fitness | `cardio` | Weekly cardio, Building up cardio, Harder cardio and long intervals, Short intervals | Intervals excluded for warning symptoms, condition and inactive, pregnancy, pain or injury, or a fall. |
| Movement | Improve mobility and flexibility | `mobility` | Stretching |  |
| Movement | Improve balance and coordination | `balance` | Balance |  |
| Movement | Increase everyday movement | `everyday` | Daily steps, Breaking up sitting, Walking after meals, Active travel, Movement snacks |  |
| Movement | Become more consistent with exercise | `consistency` | Group activity, Walking with others, Activity challenges |  |
| Movement | Improve performance | `performance` | Harder cardio and long intervals, Short intervals, Strength volume |  |
| Mind | Managing stress | `stress` | Slow breathing, Meditation, Reframing, Self-compassion, Yoga for stress, Micro-breaks, Savouring, Problem-solving steps, Music to unwind | Meditation excluded if opted out. Yoga excluded for pregnancy, exercise warning symptoms, or pain or injury. |
| Mind | Switching off and relaxing | `switch_off` | Time away from work, Slow breathing, Music to unwind, Yoga for stress, Social media limits |  |
| Mind | Focus and concentration | `focus` | Focused work, Micro-breaks, Present-moment attention |  |
| Mind | Managing difficult emotions | `emotions` | Self-compassion, Naming emotions, Using your own name, Expressive writing, Reframing, Problem-solving steps | Expressive writing excluded for a positive PHQ-4 or opting out of journalling. |
| Mind | Spending less time on my phone or social media | `phone` | Social media limits | Excluded if they don't use social media. |
| Mind | Making more time for myself | `me_time` | Enjoyable leisure, Time in nature |  |
| Mind | Enjoyment and positive experiences | `enjoyment` | Three good things, Savouring, Best possible self, Enjoyable leisure, Time in nature | Best possible self excluded if opted out of journalling. |
| Mind | Rest and recovery | `rest` | Time in nature, Micro-breaks, Time away from work |  |
| Mind | A greater sense of purpose | `purpose` | Sense of purpose, Best possible self |  |
| Mind | Building routines that stick | `routines` | Habit building, If-then planning |  |
| Connection | More meaningful relationships | `meaningful` | Opening up, Feelings check-ins, Asking follow-up questions, Responding to good news |  |
| Connection | Meeting new people | `new_people` | Talking to acquaintances, Meals with new people, Group membership |  |
| Connection | More shared activities | `shared` | Group membership, Meals with new people, Shared meals |  |
| Connection | A stronger sense of belonging | `belonging` | Group membership, Affectionate touch, Talking to acquaintances | Affectionate touch excluded if opted out of touch. |
| Connection | More time with friends or family | `time` | Reaching out, Shared meals, Calling instead of texting, Conversation at meals |  |
| Connection | Staying in touch with people who live far away | `far` | Calling instead of texting, Reaching out |  |
| Connection | Sharing meals with others | `meals` | Shared meals, Sharing recipes with others, Conversation at meals, Meal rituals, Food memories, Thanks after meals |  |
| Connection | Helping others or contributing to my community | `helping` | Acts of kindness, Volunteering, Expressing gratitude |  |
| Prevention | Drinking less alcohol | `alcohol` | Alcohol-free swaps, Alcohol intake | Excluded for non-drinkers; Mastering levels excluded for AUDIT-C 8+. |
| Prevention | Stopping smoking or vaping | `smoking` | Quitting with full support, Trying again to quit, Stopping vaping, Smoke-free home | Trying again to quit replaces Quitting with full support if they have tried before; Stopping vaping only if they vape. |
| Prevention | Keeping up with check-ups | `checkups` | Routine check-ups |  |
| Prevention | Knowing which vaccines are due | `vaccines` | Vaccination record |  |
| Prevention | Taking only the supplements I need | `supplements` | Supplement check |  |
| Prevention | Protecting my skin from the sun | `sun` | Daily sunscreen, Avoiding sunburn |  |
| Prevention | Protecting my hearing | `hearing` | Safe listening, Hearing protection, Hearing check |  |
| Prevention | Breathing cleaner air at home and outdoors | `air` | Air quality, Indoor air |  |
| Prevention | Keeping my mind active by learning new things | `learning` | Learning new skills |  |

Extra mappings: ('Prevention', '(answer) Used to smoke or vape, has stopped', 'Staying nicotine-free', 'Offered as a lighter touch when Prevention scores; not a goal option.'); ('Connection', '(rule) Sleep is a priority area', 'Sharing sleep plans with others; Sharing sleep learnings with others; Celebrating sleep wins', 'Offered only as a Connection lighter touch, and only when Sleep is a priority, so the member shares their sleep practice with someone.')

## Pilot notes (internal, never shown to members)

| Pillar | Answer that triggers it | Note for the Pilot | What the plan does automatically |
|---|---|---|---|
| Sleep | Sleep difficulties on 3+ nights a week (2 or more, or 1 with under 6 hours' sleep) | Ask how long it has been going on. If 3 months or more, suggest they talk to their doctor. | Wind-down and sleep-timing practices only. No insomnia therapy in the plan. |
| Sleep | Loud snoring or pauses in breathing | Suggest they mention it to their doctor. | Nothing changes. |
| Movement | Chest pain, breathlessness, dizziness, palpitations, swollen ankles or calf pain | Ask whether they've seen their doctor. | Movement stays at Learning (rule 6); harder cardio excluded. |
| Movement | Heart, metabolic or kidney condition and less than 150 minutes of activity | Ask whether their doctor has advised on activity. | Movement stays at Learning (rule 6); harder cardio excluded. |
| Movement | A fall in the past 12 months | Ask whether they've seen a doctor or physiotherapist about it. | Balance practice suggested; level not raised; higher-intensity practices excluded. |
| All | Pregnant or breastfeeding | Check their midwife or doctor is happy with the plan. | Marked practices excluded; Movement and Nutrition levels not raised. |
| Mind | Positive PHQ-4 screen | Check in gently and share local support options. | Expressive writing excluded; Mind level not raised. |
| Prevention | AUDIT-C 8 or more | Talk about support from their doctor or a local alcohol service. If they drink heavily every day, they shouldn't stop suddenly without medical advice. | Full alcohol-free month and Mastering alcohol practices excluded. |
| Prevention | Smokes or vapes and would like to stop | Help them find a stop-smoking service or quitline. Ask about past attempts. | Quitting practice added if Prevention is a focus. |
| Prevention | Often finds it hard to follow conversations | Suggest a hearing test. | Nothing else changes. |
| Nutrition | Difficult relationship with food | Check they have support. | Tracking, eating-window and eating-before-bed practices excluded. |
| Nutrition | Difficult relationship with food (or prefers not to say) and chose the “when I eat” goal | Talk about when they eat together and agree an approach that feels safe. | No meal-timing practice is offered for that goal. |
| Nutrition | Takes diabetes or other blood-sugar medicine | Suggest they check with their doctor before changing meal timing. | Eating-window practices excluded. |
| All | “I'm not sure yet” and no area scores 2 or more | Confirm the focus areas together; the suggestion is only a starting point. | Nothing changes. |
| Sleep | Works shifts or nights | Tailor sleep timing together; the library has no shift-work sleep practices yet. | Sleep-timing practices excluded. |
| Prevention | Smokes or vapes and isn't ready to stop | Raise it gently; support is there whenever they want it. | Smoke-free home offered for smokers; no quitting practice. |
| All | Personal habit shared with the Pilot | Talk about it and shape it into a practice with them, if they'd like. | Nothing else changes. |
| All | A priority practice was left out to keep within the member's time | Agree with them whether to make room for it, or keep the plan as it is. | The plan never goes over the member's time. |
| Sleep | Usually sleeps more than 9 hours | Ask how they feel during the day and whether anything has changed. | Nothing else changes. |
| Nutrition | Has kidney disease | Check any nutrition changes with their doctor. | Protein practices excluded. |
| All | Has high blood pressure | Check it is being monitored, and talk through any big changes in exercise. | Nothing else changes. |
| Movement | Has a lung condition, such as asthma or COPD | Check the movement plan suits them. | Nothing else changes. |
| Nutrition | Food allergy or intolerance (other than nuts), a dietary restriction, a health condition that affects eating, or something else | Check the nutrition practices suit them. | Nothing else changes. |
| Nutrition | Prefers not to say about food considerations | Ask gently if there's anything to know; don't assume a difficulty. | Tracking, eating-window and eating-before-bed practices excluded, to be safe. |
| All | The plan adds less than a third of the member's time and no practice adds 15 minutes or more | Ask whether they'd like to use more of their time. | Nothing else changes. |

## “Not right for me” (Rule 13), as implemented

| Reason | What the engine does |
|---|---|
| It takes too much time | Same practice one level lower (only if it is lighter), or a practice in the same pillar that adds less new time (or the same new time with a lower weekly target). |
| It doesn't fit my routine | A different practice in the same pillar; if none, one from the other priority pillar. |
| I already do this | Next level up, the next practice in that group, or another practice in the same pillar. |
| I'd rather focus on another pillar | Best practice from the other priority pillar or the next pillars their answers or goals point to; if none, Foundation practices from other pillars. |
| A health or physical reason | Paused; no replacement; Pilot note. |
| Something else | Their own words go to the Pilot; no automatic change. |

The first priority practice and stop-smoking, stop-vaping and smoke-free-home practices always go to the Pilot. At most 2 options are shown; at most one change per practice and two per check-in. If nothing passes the rules: keep it or pause it until the check-in.

## Engine constants (from `core/engine.js`)

**AREAS**

```json
[
 "Nutrition",
 "Sleep",
 "Movement",
 "Mind",
 "Connection",
 "Prevention"
]
```

**LEVELS**

```json
[
 "Learning",
 "Developing",
 "Mastering"
]
```

**BUDGET**

```json
{
 "45-60": 60,
 "1-2h": 120,
 "2-4h": 240,
 "4h+": 300,
 "varies": 60
}
```

**DEFAULTS**

```json
{
 "Sleep": [
  "Consistent sleep timing",
  "Screen-free wind-down",
  "Morning daylight",
  "Slow breathing to wind down",
  "Enough sleep",
  "Bed for sleep",
  "Bedtime to-do list"
 ],
 "Nutrition": [
  "Balanced plate",
  "Protein at meals",
  "Plant variety",
  "Whole grains",
  "Less processed food",
  "Slow eating",
  "Nuts"
 ],
 "Movement": [
  "Building up cardio",
  "Strength sessions",
  "Breaking up sitting",
  "Balance",
  "Stretching",
  "Daily steps",
  "Walking after meals"
 ],
 "Mind": [
  "Slow breathing",
  "Three good things",
  "Savouring",
  "Time in nature",
  "Meditation",
  "Self-compassion",
  "Micro-breaks",
  "Present-moment attention",
  "Habit building",
  "Reframing"
 ],
 "Connection": [
  "Reaching out",
  "Asking follow-up questions",
  "Acts of kindness",
  "Expressing gratitude",
  "Shared meals",
  "Group membership"
 ],
 "Prevention": [
  "Routine check-ups",
  "Alcohol-free swaps",
  "Daily sunscreen",
  "Learning new skills",
  "Air quality",
  "Vaccination record"
 ]
}
```

**OVERLAP**

```json
[
 [
  "Slow breathing",
  "Slow breathing to wind down"
 ],
 [
  "Building up cardio",
  "Weekly cardio",
  "Activity for better sleep"
 ],
 [
  "Harder cardio and long intervals",
  "Short intervals"
 ],
 [
  "Strength sessions",
  "Strength volume"
 ],
 [
  "Alcohol intake",
  "Alcohol-free swaps",
  "Alcohol and sleep"
 ],
 [
  "Walking with others",
  "Group activity"
 ],
 [
  "Daily eating window",
  "Gap between eating and bed"
 ],
 [
  "Shared meals",
  "Meals with new people"
 ],
 [
  "Quitting with full support",
  "Trying again to quit"
 ],
 [
  "Three good things",
  "Expressing gratitude"
 ],
 [
  "Safe listening",
  "Hearing protection"
 ],
 [
  "Air quality",
  "Indoor air"
 ]
]
```

**ONE_OFF**

```json
{}
```

**CAP_LEARNING**

```json
{
 "Movement": [
  "Exercise warning symptoms",
  "Heart, metabolic or kidney condition and inactive"
 ]
}
```

**NO_RAISE**

```json
{
 "Movement": [
  "Pregnant",
  "Fall in past 12 months",
  "Pain, injury or joint limitation"
 ],
 "Mind": [
  "Positive PHQ-4 screen"
 ],
 "Nutrition": [
  "Difficult relationship with food",
  "Pregnant"
 ],
 "Prevention": [
  "Higher-risk drinking (AUDIT-C 8+)"
 ]
}
```

**OPTOUT**

```json
{
 "meditation": [
  "Meditation",
  "Self-compassion.Mastering"
 ],
 "journalling": [
  "Expressive writing",
  "Three good things",
  "Bedtime to-do list",
  "Best possible self",
  "Self-compassion.Developing"
 ],
 "fasting": [
  "Daily eating window"
 ],
 "tracking_food": [
  "Daily eating window",
  "Plant variety.Developing",
  "Plant variety.Mastering",
  "Salt.Mastering",
  "Reducing sugar.Mastering",
  "Protein at meals.Mastering"
 ],
 "touch": [
  "Affectionate touch"
 ],
 "early": [
  "Morning daylight.Mastering"
 ],
 "apps": [
  "Daily steps.Developing",
  "Daily steps.Mastering"
 ]
}
```

**NEXTFAM**

```json
{
 "Building up cardio": "Weekly cardio",
 "Strength sessions": "Strength volume",
 "Safe listening": "Hearing protection",
 "Air quality": "Indoor air"
}
```

**SLEEP_SHARE**

```json
[
 "Sharing sleep plans with others",
 "Sharing sleep learnings with others",
 "Celebrating sleep wins"
]
```

**CESSATION**

```json
[
 "Quitting with full support",
 "Trying again to quit",
 "Stopping vaping"
]
```

**MAX_UPS**

```json
{
 "small": 1,
 "mid": 2,
 "big": 6
}
```

**WISH_WEIGHT**

```json
2
```

**ENJOY**

```json
{
 "outdoors": [
  "Time in nature",
  "Daily steps",
  "Walking after meals",
  "Walking with others",
  "Building up cardio",
  "Weekly cardio",
  "Morning daylight",
  "Awe walks"
 ],
 "music": [
  "Music to unwind",
  "Bedtime music"
 ],
 "making": [
  "Enjoyable leisure",
  "Meal planning and home cooking"
 ],
 "writing": [
  "Expressive writing",
  "Three good things",
  "Best possible self",
  "Bedtime to-do list",
  "Problem-solving steps",
  "Sense of purpose"
 ],
 "social": [
  "Walking with others",
  "Group activity",
  "Group membership",
  "Shared meals",
  "Meals with new people",
  "Volunteering",
  "Activity challenges",
  "Talking to acquaintances",
  "Reaching out"
 ],
 "quiet": [
  "Meditation",
  "Slow breathing",
  "Savouring",
  "Present-moment attention",
  "Time in nature",
  "Progressive muscle relaxation",
  "Slow breathing to wind down"
 ],
 "stretch": [
  "Yoga for stress",
  "Stretching",
  "Balance"
 ],
 "sport": [
  "Weekly cardio",
  "Building up cardio",
  "Harder cardio and long intervals",
  "Short intervals",
  "Activity challenges",
  "Group activity",
  "Strength sessions",
  "Strength volume"
 ],
 "cooking": [
  "Meal planning and home cooking",
  "Shared meals",
  "Sharing recipes with others",
  "Food memories",
  "Plant variety",
  "Beans and lentils",
  "Whole grains"
 ],
 "home": [
  "Strength sessions",
  "Stretching",
  "Balance",
  "Yoga for stress",
  "Movement snacks"
 ],
 "gym": [
  "Strength sessions",
  "Strength volume",
  "Harder cardio and long intervals",
  "Short intervals"
 ],
 "work": [
  "Breaking up sitting",
  "Micro-breaks",
  "Movement snacks",
  "Walking after meals"
 ]
}
```

**WORK_FAMS**

```json
[
 "Micro-breaks",
 "Time away from work",
 "Focused work"
]
```

## Safety notice

The safety rules (exclusions, safety holds, Pilot notes) must be reviewed by a qualified professional before the paid launch. Never show medical advice, conditions or Pilot notes to members, never recommend therapy (including insomnia therapy) or specific vaccines, and never imply a member has a condition.
