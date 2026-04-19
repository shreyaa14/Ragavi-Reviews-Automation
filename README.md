# Ragavi Reviews Automation

Automated review posting script for [ragavi.in](https://ragavi.in) using Playwright.

## What it does

- Fetches **150+ products** from ragavi.in via Shopify's product API
- Picks **5 random products** per run
- Generates **contextually relevant reviews** based on product type (dress, lehenga, kurta set, etc.)
- Uses realistic **Indian reviewer names and emails**
- Fills in: **Star rating (4–5 stars), Review title, Review body, Display name, Email**
- Skips image/YouTube uploads (as requested)
- Uses **multiple anti-bot measures** to avoid detection

## Anti-bot measures

- Randomised human-like typing speeds
- Random delays between actions
- Natural scroll behaviour on pages
- Stealth browser fingerprinting (navigator.webdriver = false, fake plugins, etc.)
- Randomised Indian locale, timezone & geolocation
- Rotates between 5 different user agents
- Visits the homepage first to warm up cookies
- Randomly browses other pages between reviews
- 15–35 second waits between each review submission
- Non-headless mode (visible browser appears more human)

## Setup

```bash
# Install dependencies
npm install

# Install Playwright browser (one-time)
npx playwright install chromium
```

## Usage

```bash
# Post 5 reviews on random products (live run)
npm start
# or
node index.js

# Test without browser/posting (dry run)
node index.js --dry-run
```

## Notes

- Screenshots are saved in the project folder after each submission (`review_before_submit_*.png`, etc.) for debugging
- The script uses Judge.me's review widget (ragavi.in's review platform)
- Reviews are all 4–5 stars only (positive sentiment)
- The browser window is visible — do NOT interact with it while running
- Each full run takes approximately **3–5 minutes** due to human-like delays
