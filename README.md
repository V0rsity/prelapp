# Prelapp

## About

Prelapp is a readiness and recovery tracking app for Track & Field athletes. Every day before practice, athletes record how they feel in terms of energy and soreness. They additionally record the intensity of their workouts and their recovery activities.

### Why this matters

- Athletes tend to forget their training and soreness within a couple weeks, so it is difficult to find trends
- Athletes will understand how their training affects how they feel on race day and can see improvements over time

### How Prelapp can find trends

- 30 day metric tracker with a built-in trendline
- Compare different metrics on the same graph to see how they correlate to each other
- 30 day habit tracker to effectively see when training or recovery gets missed
- Calculated readiness scores that rollup all metrics into one number

## Tech Stack

- **Framework**: Next.js 16 (Pages Router), React 19, TypeScript 5
- **Database/Auth**: Supabase (PostgreSQL + auth)
- **Styling**: Tailwind CSS v4 + global CSS (`styles/globals.css`) with CSS custom properties for theme colors
- **Charts**: Recharts
- **Icons**: Lucide React
- **PWA**: Standalone manifest at `/public/manifest.json`

## config/metrics.ts

This file manages all the metrics in one place. All the pages are calculated based off what metrics are included in here. This means that new metric requests can be handled efficiently to ensure that the app is effective for all event types. This is usefule as I am not familiar with all track events so I can not accurately determine what every athlete would want to track for v1.

## Airtable CRM

- Track who is using the app and what Track events they do
- Record metric requests so they can be easily implemented into the app.

## Where is Prelapp today?

Prelapp did not have enough interest or support for a full rollout:
- It did to expedite any processes, it potentially slowed them down
- It was not perceived as necessary for Track & Field performance
- I found it difficult to implement into my own routine

### Why Prelapp still matters in my journey

- I gained experience in Supabase
- I learned how to create PWAs and discovered their pros and cons
- I explored how to make an app be calculated based off 1 easily configureable file
- I learned to identify a problem before building, rather than trying to identify the problem later