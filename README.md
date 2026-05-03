# TN Election Results 2026 Tracker

A real-time, responsive web application built with Next.js to track the Tamil Nadu Legislative Assembly election results.

## Features
- **Real-Time Tracking**: Scrapes live results from the Election Commission of India (ECI) website.
- **Backend Caching**: Avoids IP bans/rate limits by caching results on the backend for 20 seconds. All connected clients share the cache.
- **Auto-Refresh**: Frontend automatically polls the backend every 20 seconds for the latest updates.
- **Responsive UI**: Mobile-first design built with Tailwind CSS, featuring glassmorphism, custom party themes, and smooth animations.
- **Data Visualization**: Includes Recharts-based bar charts (seat tally) and donut charts (vote share).
- **Pre-Election State**: Automatically detects if counting hasn't started and displays a countdown timer to 8:00 AM IST on election day.
- **Graceful Error Handling**: Displays stale data with an error banner if the ECI website experiences downtime.

## Tech Stack
- Next.js (App Router, API Routes)
- React
- Tailwind CSS
- Recharts
- Cheerio (for HTML parsing)

## Setup & Deployment
1. Install dependencies: `npm install`
2. Run locally: `npm run dev`
3. Deploy to Vercel: The project includes a `vercel.json` configured for optimal deployment in the `sin1` region with appropriate function timeouts.

## Notes
The scraper in `app/api/results/route.ts` contains multiple URL patterns to attempt to fetch live data from the ECI website. It handles potential changes in table structures and normalises party names.
