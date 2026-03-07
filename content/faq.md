# Help & FAQ

## Getting Started

### What is Prelapp?
Prelapp is a readiness and recovery tracking app built for track and field athletes. Each day you log your morning readiness, training session, and recovery activities. Over time, you can review trends to better understand how your body responds to training.

### How do I create an account?
Tap **Get Started** on the home page, enter your name, email, and password, then select your event type(s) and timezone. Once your profile is set up you'll land on the dashboard and can start logging.

### What are event types and why do they matter?
Event types (Runner, Jumper, Thrower, Hurdler, Pole Vaulter) determine which soreness areas and training options appear in your logs. For example, runners see mileage tracking and leg-specific soreness, while throwers see upper-body muscle groups. You can select multiple types if you compete in multiple events.

### Can I change my event types after signing up?
Yes — go to **Settings** from the menu and update your event types at any time. Your historical data is not affected.

---

## Daily Logging

### What are the three log sections?
Each day has three sections:

- **Morning Readiness** — Rate sleep quality, energy, stress, hydration, nutrition, and muscle soreness on a 1–5 scale.
- **Training** — Log training type(s), intensity, muscles worked, mileage (if applicable), and notes.
- **Recovery** — Mark which recovery activities you did (stretching, ice bath, massage, etc.) and add notes.

### Do I have to fill in all three sections?
No. Each section is optional and independent. You can log just morning readiness, skip training if it was a rest day, or fill in all three. Incomplete sections remain open for editing later that day.

### Can I edit a log after submitting it?
Yes. Once a section is submitted it shows in read-only view with an **Edit** button. Tap Edit to open a modal and update your entries.

### What day does my log reset?
Logs are per calendar date in your local timezone (set in Settings). A new blank log appears each day.

### What if I forget to log a day?
Past days are visible in the **History** tab. You can view but not add new logs for past days — logging is intended for the current day only.

---

## Readiness Score

### How is the readiness score calculated?
The score is a weighted average of your morning metrics.  The result is normalized to a 50–99 scale.

### What do the score colors mean?
- **Red** (below 60) — Very low readiness; consider rest or easy effort
- **Orange** (60–69) — Below average; monitor how you feel
- **Yellow** (70–79) — Average readiness
- **Light green** (80–89) — Good readiness
- **Green** (90–99) — Excellent readiness

---

## Trends

### What is the Habit Tracker?
The Habit Tracker is a calendar heatmap (like a GitHub contribution graph). Each cell represents one day. Select a metric from the dropdown — cells are shaded based on your logged value for that day, so you can quickly spot streaks and gaps.

### What is Track Progress?
Track Progress shows a bar chart for a single metric over your logging history. A dashed trend line shows the overall direction. A percentage badge shows how much the metric has changed over the displayed period.

### What is Compare Trends?
Compare Trends overlays two metrics on the same chart — one as a filled area (blue) and one as a line (yellow). Use this to look for correlations, such as whether high training intensity follows low sleep quality.

### Why does my chart start from a specific date?
Charts automatically trim leading empty dates, so they start from your first logged day with data for that metric.

---

## Account & Settings

### How do I change my name, email, or timezone?
Go to **Settings** from the menu. You can update your first name, last name, and timezone there. Email changes are handled through your Supabase auth account.

### How do I delete my account?
Go to **Settings** from the menu. At the bottom there is a button to delete your account. Account deletion will permanently erase your data.

---

## Privacy & Data

### Where is my data stored?
All data is stored securely in a Supabase (PostgreSQL) database. Your credentials are managed by Supabase Auth. We do not sell or share your data with third parties.

### Is my data private?
Yes. Your logs and profile are only accessible to your account. No other athlete can view your data.

### What data does Prelapp collect?
Prelapp collects only what you enter: your name, email, timezone, event types, and daily log entries (readiness metrics, training info, and recovery activities).
