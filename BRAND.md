# BRAND.md — Prelapp Landing Page

Single source of truth for all landing page content and design direction.

---

## Hero Section

**Headline**
Own your training. Optimize this season.

**Subheadline**
Prelapp helps track and field athletes monitor recovery, log training, and spot trends that move the needle.

**CTA Button**
"Take control of your season!" → `/signup`

**Hero Visual**
App screenshot — trends/charts view (place in `/public/images/screenshots/`)

---

## Features

Each feature section = full-width row with text on one side and a phone screenshot on the other. Alternates left/right. On mobile, screenshot stacks above text.

1. **Daily Readiness Check-In**
   Start every session with a 60-second log of sleep, energy, stress, hydration, and muscle soreness. Know where your body is before you train.
   - Screenshot: `/public/images/screenshots/morning-checkin.png`
   - Layout: text left, phone right

2. **Training Logger**
   Log intensity, session types, muscles worked, and mileage after every workout. Everything in one place, every time.
   - Screenshot: `/public/images/screenshots/training-log.png`
   - Layout: phone left, text right

3. **Recovery Tracking**
   Record what you did to recover — cooldowns, stretching, nutrition, and more. Build habits that actually stick.
   - Screenshot: `/public/images/screenshots/recovery-log.png`
   - Layout: text left, phone right

4. **Readiness Score**
   A daily score calculated from your morning check-in. Color-coded so you know at a glance whether to push or pull back.
   - Screenshot: `/public/images/screenshots/readiness-score.png`
   - Layout: phone left, text right

5. **Trend Analytics**
   Spot patterns across weeks and months with habit heatmaps, progress charts, and side-by-side metric comparisons.
   - Screenshot: `/public/images/screenshots/trends.png`
   - Layout: text left, phone right

6. **Habit Tracker**
   See your entire season at a glance. A calendar heatmap shows your consistency day by day — stretching, soreness, training, and more. Build streaks. Spot gaps. Stay accountable.
   - Screenshot: `/public/images/screenshots/stretching-habit-tracker.png`
   - Layout: phone left, text right

---

## How It Works

1. **Build Your Profile** — Tell Prelapp which events you run. Your metrics and training workouts are tailored to you from day one.
2. **Log How You Feel** — Each session starts with a quick check-in: sleep, energy, stress, hydration, and soreness. Takes less than a minute.
3. **Track Training & Recovery** — After each session, log what you did — intensity, types, muscles, mileage, and recovery activities.
4. **Monitor Your Trends** — Weekly and monthly charts reveal patterns in your readiness, performance, and recovery so you can train smarter.

---

## Social Proof

*Skip for now — add testimonials and user stats once available.*

---

## Pricing

Free only — no pricing section on the landing page.

---

## Footer

**Links:** Contact/Feedback, Help & FAQ, Privacy Policy, Instagram

**Instagram handle:** TBD — update before launch

---

## Design Direction

- **Hero**: Dark navy background (`#384959`), blue accent (`#BDDDFC`), white text
- **Feature sections**: Light background. Each feature is a full-width section — text on one side, phone screenshot on the other, alternating per feature. Phone gets a rounded frame + drop shadow (CSS only, no extra asset). The screenshot is the dominant visual element.
- **Mobile behavior**: Screenshot stacks above the text, full width. Text below.
- **How It Works section**: Light background, numbered steps, no screenshots needed
- **Footer**: Dark background to bookend the page
- Mobile-first, consistent with existing Tailwind + CSS custom properties setup
- Icons: Lucide React (consistent with the rest of the app)

## Screenshot Assets

All screenshots go in `/public/images/screenshots/`. Replace placeholders with real app captures before launch.

| File | Screen to capture |
|---|---|
| `morning-checkin.png` | Morning readiness form (MorningReadiness component) |
| `training-log.png` | Training log form (TrainingLog component) |
| `recovery-log.png` | Recovery log form (RecoveryLog component) |
| `readiness-score.png` | Dashboard header showing the readiness score |
| `trends.png` | Trends tab — Track Progress or Compare chart |
| `stretching-habit-tracker.png` | Trends tab — Habit Tracker calendar heatmap |
| `hero.png` | Trends tab — full view for hero section |
