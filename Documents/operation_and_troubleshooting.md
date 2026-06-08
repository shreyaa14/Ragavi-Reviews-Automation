# Operation & Troubleshooting Guide

This guide provides instructions on how to configure, run, debug, and troubleshoot the review automation script.

---

## 1. Prerequisites & Setup

Ensure you have [Node.js](https://nodejs.org/) installed (v16+ recommended).

### Installation
From the project root directory, run:
```bash
# Install NPM dependencies (Playwright, Axios, etc.)
npm install

# Download and install the Chromium browser binaries for Playwright
npx playwright install chromium
```

---

## 2. Command Execution

The script can be executed in two modes:

### A. Live Run (Submits Real Reviews)
Launches the Chromium browser, loads products from ragavi.in, fills out forms, and submits them to Judge.me.
```bash
npm start
# or
node index.js
```

### B. Dry Run (Simulates the Action)
Performs API checks, random product selection, and reviewer/review content generation, but **skips all browser launching and form submissions**. Ideal for testing templates.
```bash
npm test
# or
node index.js --dry-run
```

---

## 3. Web Page Selectors (Judge.me Widget)

If the website layout changes or the review platform updates, you may need to update the DOM selectors in `index.js`. Here are the selectors currently targeted by the script:

| Element / Action | Selector Used in Script | Context / Usage |
| :--- | :--- | :--- |
| **Review Widget Box** | `.jdgm-widget` / `[class*="review"]` | Scrolled into center-view before clicking |
| **"Write a review" Button** | `button:has-text("Write a review")`, `a:has-text("Write a review")`, `.jdgm-write-rev-btn` | Triggers the review form overlay |
| **Star Rating Button** | `.jdgm-star[aria-label="X stars"]` (where X is 4 or 5) | Selects the positive star score |
| **Review Title Input** | `input[name="review_title"]` | Fills the review title |
| **Review Body Input** | `textarea[name="review_body"]` | Fills the review body description |
| **Reviewer Name Input** | `input[name="reviewer_name"]` | Fills the reviewer's name |
| **Reviewer Email Input** | `input[name="reviewer_email"]` | Fills the reviewer's email address |
| **Submit Button** | `input.jdgm-submit-rev` | Triggers submission |

---

## 4. Debugging via Screenshots

Every review submission attempt saves visual logs to the `/Images` directory at the project root. This is critical for diagnosing errors when running headlessly or identifying what went wrong.

### Screenshot Files
*   `review_before_submit_[timestamp].png`: Captured right before clicking the submit button. Useful for verifying that all fields were successfully filled out and that the correct star rating was selected.
*   `review_after_submit_[timestamp].png`: Captured 4-6 seconds after submission. Used to verify success notifications ("Pending approval", "Thank you", etc.).
*   `review_error_[timestamp].png`: Captured if a Playwright action throws an exception. Check this image to see what state the browser window was in when the error occurred.

---

## 5. Troubleshooting Common Failures

### A. Selector Timeout Errors
*   **Symptom**: Console logs `❌ Error posting review: waiting for locator('...') to be visible`.
*   **Cause**: The CSS classes of the review widget on the product page have changed, or the widget failed to render.
*   **Resolution**: 
    1. Open a browser and navigate to any product page on `ragavi.in`.
    2. Right-click the "Write a Review" button and inspect the elements.
    3. Update the selectors inside `index.js` (lines 335–372) to match the new class names.

### B. Anti-Bot / CAPTCHA Block
*   **Symptom**: The browser hangs on a Cloudflare challenge screen, or screenshots show a CAPTCHA verification widget.
*   **Resolution**:
    1. Ensure `headless: false` is configured (default behavior) so you can manually complete the CAPTCHA in the browser window if it pops up.
    2. Increase delays or change the user agent list to avoid trigger signatures.
    3. Rotate your IP address (using a VPN or mobile hotspot) to reset rate limiting.

### C. Shopify API Fails to Fetch Products
*   **Symptom**: Console logs `Found 0 products` and exits.
*   **Cause**: Shopify has rate-limited your IP, or the `/products.json` endpoint structure has been blocked.
*   **Resolution**: Check your network connection. Try navigating to `https://www.ragavi.in/products.json` in a standard browser to verify if Shopify is serving the JSON catalog data.
