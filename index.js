/**
 * Ragavi Reviews Automation Script
 * ─────────────────────────────────
 * Posts 5 human-like reviews on random Ragavi products per run.
 * Uses Playwright with stealth measures to avoid bot detection.
 *
 * Usage:  node index.js
 */

const { chromium } = require('playwright');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── CONFIG ────────────────────────────────────────────────────────────────
const BASE_URL = 'https://www.ragavi.in';
const REVIEWS_PER_RUN = 5;
const DRY_RUN = process.argv.includes('--dry-run');
const IMAGES_DIR = path.join(__dirname, 'Images');

// Ensure Images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// ─── RANDOMISATION HELPERS ─────────────────────────────────────────────────

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Human-like delay between min and max ms
async function humanDelay(minMs = 600, maxMs = 2400) {
  await sleep(randomInt(minMs, maxMs));
}

// ─── FAKE INDIAN REVIEWER DATA ─────────────────────────────────────────────

const FIRST_NAMES = [
  'Priya', 'Ananya', 'Simran', 'Neha', 'Pooja', 'Riya', 'Aditi', 'Shreya',
  'Kavya', 'Divya', 'Meghna', 'Ishita', 'Tanvi', 'Kriti', 'Aisha', 'Nishi',
  'Preeti', 'Swati', 'Anjali', 'Pallavi', 'Garima', 'Sakshi', 'Nandita',
  'Akansha', 'Rhea', 'Sanya', 'Tanya', 'Vrinda', 'Mansi', 'Deepika',
];

const LAST_NAMES = [
  'Sharma', 'Gupta', 'Singh', 'Kapoor', 'Mehta', 'Joshi', 'Patel', 'Verma',
  'Agarwal', 'Bose', 'Nair', 'Reddy', 'Iyer', 'Kumar', 'Saxena', 'Malhotra',
  'Srivastava', 'Mishra', 'Chauhan', 'Tiwari', 'Pandey', 'Chatterjee',
  'Banerjee', 'Desai', 'Pillai', 'Menon', 'Rajan', 'Khanna', 'Chopra',
];

const EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
  'rediffmail.com', 'icloud.com',
];

function generateReviewer() {
  const first = randomPick(FIRST_NAMES);
  const last = randomPick(LAST_NAMES);
  const name = `${first} ${last}`;

  // Randomise email style
  const style = randomInt(1, 4);
  const num = randomInt(1, 999);
  let localPart;
  if (style === 1) localPart = `${first.toLowerCase()}${last.toLowerCase()}${num}`;
  else if (style === 2) localPart = `${first.toLowerCase()}.${last.toLowerCase()}`;
  else if (style === 3) localPart = `${first.toLowerCase()}${num}`;
  else localPart = `${first.toLowerCase()}_${last.toLowerCase()}`;

  const email = `${localPart}@${randomPick(EMAIL_DOMAINS)}`;
  return { name, email };
}

// ─── REVIEW CONTENT GENERATOR ──────────────────────────────────────────────

const REVIEW_TEMPLATES = {
  dress: {
    titles: [
      'Perfect dress for every occasion!',
      'Love love love this dress!',
      'Stunning and so flattering',
      'Beautiful and vibrant',
      'Worth every rupee!',
      'Absolute show stopper',
      'Exceeded my expectations',
      'My new favourite outfit',
      'Got so many compliments!',
      'Gorgeous quality dress',
    ],
    bodies: [
      'I ordered this dress for a family function and I got SO many compliments! The fabric is super soft and the color is even more vibrant in person. Fits true to size. Will definitely be ordering more from Ragavi!',
      'This dress is absolutely stunning. The stitching quality is top notch and the material feels premium. I wore it to a friend\'s birthday and everyone kept asking where I got it from. Highly recommended!',
      'Just received my order and I\'m thrilled with the quality! The dress fits perfectly and the color is exactly as shown in the pictures. Delivery was also quick. 5 stars from me!',
      'Beautiful dress! The fabric is lightweight and very comfortable to wear. I ordered an XS and it fits perfectly. The smocking detail is just gorgeous. Packaging was also very neat.',
      'I wore this to a date night and felt absolutely confident! The off-shoulder style is so elegant and the crinkled fabric gives it a premium look. Great value for money. Will shop again!',
      'Amazing quality at this price point! The dress arrived well-packed and looked exactly like the photos. The color didn\'t fade after washing either. Definitely buying more from this brand.',
      'This dress is perfect for summer outings! Lightweight, breezy and so pretty. I paired it with minimal jewellery and it was a complete look. Fast shipping too — arrived within 4 days!',
      'I\'ve been eyeing this dress for a while and finally ordered it — no regrets! The fit is great, the material is soft and comfortable. I\'m already planning my next purchase from Ragavi.',
      'Absolutely in love with this dress! The moment I wore it I felt so confident and stylish. The quality is comparable to much more expensive brands. 100% recommend to everyone!',
    ],
  },
  lehenga: {
    titles: [
      'Royal look on a budget!',
      'Stunning festive wear',
      'Perfect wedding guest outfit',
      'Loved the quality!',
      'Beautiful craftsmanship',
      'Absolutely gorgeous lehenga',
      'Got so many compliments at the wedding!',
      'Exceeded all expectations',
      'Such elegant design',
      'Perfect for festivities',
    ],
    bodies: [
      'Wore this to a sangeet ceremony and received compliments all night! The embroidery is intricate and the fabric drapes beautifully. Sizing was accurate — ordered my usual size and it fit perfectly.',
      'This lehenga is absolutely breathtaking in person! The colors are more vibrant than in the photos and the fabric quality is premium. I felt like a princess at the wedding. So many compliments!',
      'Ordered this for my cousin\'s mehndi function and it was a total hit! The embroidery detail is beautiful and the organza dupatta adds such an elegant touch. Will definitely order more!',
      'The lehenga arrived well-packed and the quality is outstanding for the price. The blouse fits perfectly and the skirt has a lovely flare. Ragavi\'s craftsmanship is just amazing!',
      'I was skeptical about ordering ethnic wear online but this exceeded all my expectations! The colors didn\'t disappoint, the fabric is luxurious and the fit is perfect. Highly recommend!',
      'Absolutely gorgeous! I wore this to a family function and everyone thought I had spent a fortune on it. The gota patti work is beautiful and the dupatta is graceful. 5/5 stars!',
      'This lehenga set is the perfect blend of traditional and contemporary. The fabric is lightweight yet looks very rich. I photographed beautifully in it! Great packaging and fast delivery.',
      'Purchased this for Navratri and it was the perfect choice! The colors are stunning, the lehenga has great flare when you spin, and the dupatta is so elegant. Will buy again for sure!',
    ],
  },
  kurta: {
    titles: [
      'Elegant ethnic wear!',
      'Beautiful kurta set',
      'Perfect for festivals',
      'Love the fabric quality',
      'Such graceful design',
      'Perfect for any occasion',
      'Beautiful and comfortable',
      'Best kurta set I own',
      'Absolutely love it!',
      'Great quality and fit',
    ],
    bodies: [
      'This kurta set is absolutely gorgeous! The fabric is soft and breathable, perfect for all-day wear. I wore it to a puja and received so many compliments. The embroidery detailing is beautiful!',
      'Ordered this for a family function and it was perfect! The dupatta is so graceful and the fabric has a lovely sheen. Sizing is true to size. Will definitely be ordering more from Ragavi!',
      'The quality of this kurta set is exceptional for the price. The fabric feels premium, the color is vibrant and the embroidery is well done. Fast delivery and great packaging too!',
      'I love everything about this kurta set! Wore it to a sangeet and kept getting compliments. The organza dupatta adds such an elegant touch. Ragavi never disappoints!',
      'Absolutely beautiful! The fabric is lightweight, comfortable and has a luxurious drape. Perfect for festive occasions. I paired mine with gold accessories and looked stunning. Highly recommend!',
      'This is my third purchase from Ragavi and they never disappoint! The kurta is beautifully crafted, the fabric is soft and the fit is flattering. Will definitely reorder in other colors!',
      'Received this as a gift and absolutely love it! The chanderi fabric has a lovely sheen and the embroidery is intricate and well done. Perfect for weddings and festive occasions.',
      'Such a classy kurta set! The silhouette is very flattering and the fabric drapes beautifully. I wore it to a pooja and felt so elegant throughout. Fast shipping, great quality!',
    ],
  },
  generic: {
    titles: [
      'Excellent quality!',
      'Beautiful clothing',
      'Love this brand',
      'Great value for money',
      'Absolutely stunning',
      'Very happy with the purchase',
      'Exceeded expectations',
      'Will buy again!',
      'Lovely design and quality',
      'Highly recommended',
    ],
    bodies: [
      'Absolutely love this! The quality is excellent and the fit is perfect. Delivery was fast and well-packaged. I\'ve become a loyal Ragavi customer — their designs are just gorgeous!',
      'Such beautiful craftsmanship! The fabric quality is top notch and the colors are exactly as shown. I received so many compliments when I wore this. Will definitely buy more!',
      'Really happy with this purchase! Great quality, accurate sizing and beautiful design. The delivery was also really prompt. Ragavi is now my go-to brand for ethnic wear!',
      'Stunning piece! I was a bit nervous ordering online but the product exceeded all expectations. The fabric feels premium and the design is so elegant. Will be ordering more soon!',
      'Purchased as a gift and the recipient absolutely loved it! Great quality, beautiful design and impressive packaging. Ragavi really delivers on every front. Highly recommend!',
      'I\'ve ordered from Ragavi multiple times and they never disappoint. The quality is consistently excellent, sizing is accurate and the designs are always gorgeous. Keep it up!',
      'Love love love this! The quality is so much better than I expected. The fabric is comfortable to wear all day and the design is beautiful. Worth every penny!',
      'Five stars all the way! Beautiful product, great quality and quick delivery. I wore this to a family function and felt amazing. So many people asked where I got it. Ragavi for the win!',
    ],
  },
};

function generateReview(productTitle, productType) {
  const titleLower = productTitle.toLowerCase();
  const typeLower = (productType || '').toLowerCase();

  let category = 'generic';
  if (titleLower.includes('dress') || titleLower.includes('mini') || titleLower.includes('midi') || titleLower.includes('maxi')) {
    category = 'dress';
  } else if (titleLower.includes('lehenga') || typeLower.includes('lehenga')) {
    category = 'lehenga';
  } else if (titleLower.includes('kurta') || titleLower.includes('sharara') || titleLower.includes('dupatta') || typeLower.includes('kurta')) {
    category = 'kurta';
  }

  const templates = REVIEW_TEMPLATES[category];
  const rating = randomInt(4, 5); // Only 4 or 5 stars for authenticity
  const title = randomPick(templates.titles);
  const body = randomPick(templates.bodies);

  return { rating, title, body };
}

// ─── FETCH PRODUCT LIST ────────────────────────────────────────────────────

async function fetchProductList(page) {
  const allProducts = [];
  try {
    for (const p of [1, 2]) {
      const url = `${BASE_URL}/products.json?limit=50&page=${p}`;
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const content = await page.textContent('pre').catch(() => page.textContent('body'));
      const json = JSON.parse(content);
      if (json.products && json.products.length > 0) {
        allProducts.push(...json.products.map(pr => ({
          title: pr.title,
          handle: pr.handle,
          url: `${BASE_URL}/products/${pr.handle}`,
          productType: pr.product_type,
        })));
      }
    }
  } catch (err) {
    console.warn(`  ⚠ Error fetching product catalogue: ${err.message}`);
  }
  return allProducts;
}

// ─── STEALTH BROWSER SETUP ─────────────────────────────────────────────────

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

async function createStealthBrowser() {
  const userAgent = randomPick(USER_AGENTS);

  const browser = await chromium.launch({
    headless: false, // Visible browser looks more human
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--window-size=1366,768',
      '--start-maximized',
    ],
    slowMo: randomInt(50, 120), // Slow down Playwright actions
  });

  const context = await browser.newContext({
    userAgent,
    viewport: { width: 1366, height: 768 },
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    geolocation: { latitude: 26.9124, longitude: 75.7873 }, // Jaipur
    permissions: ['geolocation'],
    extraHTTPHeaders: {
      'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    },
  });

  // Inject stealth scripts to mask automation fingerprints
  await context.addInitScript(() => {
    // Overwrite the navigator.webdriver property
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    // Overwrite plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    // Overwrite languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-IN', 'en-GB', 'en'],
    });
    // Add chrome object
    window.chrome = { runtime: {}, loadTimes: () => {}, csi: () => {} };
    // Overwrite permission query
    const originalQuery = window.navigator.permissions?.query;
    if (originalQuery) {
      window.navigator.permissions.query = (parameters) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters);
    }
  });

  return { browser, context };
}

// ─── RANDOM SCROLL BEHAVIOUR ───────────────────────────────────────────────

async function naturalScroll(page) {
  const scrollAmount = randomInt(200, 600);
  await page.evaluate((amount) => {
    window.scrollBy({ top: amount, behavior: 'smooth' });
  }, scrollAmount);
  await humanDelay(800, 2000);
}

// ─── POST REVIEW ON A SINGLE PRODUCT ──────────────────────────────────────

async function postReview(page, product) {
  const reviewer = generateReviewer();
  const review = generateReview(product.title, product.productType);

  console.log(`\n  👤 Reviewer: ${reviewer.name} (${reviewer.email})`);
  console.log(`  ⭐ Rating: ${review.rating}/5`);
  console.log(`  📝 Title: "${review.title}"`);
  console.log(`  💬 Body (first 80 chars): "${review.body.substring(0, 80)}..."`);

  if (DRY_RUN) {
    console.log('  [DRY RUN] Skipping browser interaction');
    return true;
  }

  try {
    // Navigate to product page
    console.log(`  🌐 Navigating to: ${product.url}`);
    await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await humanDelay(2000, 4000);

    // Scroll naturally
    await naturalScroll(page);
    await naturalScroll(page);
    await humanDelay(1000, 2000);

    // Scroll to reviews
    await page.evaluate(() => {
      const el = document.querySelector('.jdgm-widget') || document.querySelector('[class*="review"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await humanDelay(1500, 3000);

    // Click "Write a review"
    console.log('  🔍 Looking for "Write a review" button...');
    const writeReviewBtn = page.locator('button:has-text("Write a review"), a:has-text("Write a review"), .jdgm-write-rev-btn').first();
    await writeReviewBtn.waitFor({ timeout: 15000, state: 'visible' });
    await writeReviewBtn.click();
    console.log('  ✅ Clicked "Write a review" button');
    await humanDelay(1500, 3000);

    // ── STAR RATING ──
    console.log(`  ⭐ Setting ${review.rating} star rating...`);
    const starSelector = `.jdgm-star[aria-label="${review.rating} stars"]`;
    await page.locator(starSelector).first().click();
    console.log(`  ✅ Clicked star: ${review.rating}`);
    await humanDelay(500, 1000);

    // ── FILL FORM ──
    console.log('  📝 Filling form fields...');
    await page.locator('input[name="review_title"]').first().fill(review.title);
    await humanDelay(400, 800);
    await page.locator('textarea[name="review_body"]').first().fill(review.body);
    await humanDelay(400, 800);
    await page.locator('input[name="reviewer_name"]').first().fill(reviewer.name);
    await humanDelay(400, 800);
    await page.locator('input[name="reviewer_email"]').first().fill(reviewer.email);
    await humanDelay(1000, 2000);

    await page.screenshot({ path: path.join(IMAGES_DIR, `review_before_submit_${Date.now()}.png`) });

    // ── SUBMIT ──
    console.log('  🚀 Submitting review...');
    await page.locator('input.jdgm-submit-rev').first().click();
    console.log('  ✅ Clicked Submit Review');

    // Wait for the "Pending" status or success message
    await humanDelay(4000, 6000);
    await page.screenshot({ path: path.join(IMAGES_DIR, `review_after_submit_${Date.now()}.png`) });

    // Check for success indicators
    const success = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('pending') || text.includes('thank you') || text.includes('success');
    });

    if (success) {
      console.log('  🎉 Review submitted successfully!');
    } else {
      console.log('  ℹ️  Review may have been submitted (success indicator not clearly found)');
    }

    return true;
  } catch (err) {
    console.error(`  ❌ Error posting review: ${err.message}`);
    await page.screenshot({ path: path.join(IMAGES_DIR, `review_error_${Date.now()}.png`) }).catch(() => {});
    return false;
  }
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   Ragavi Reviews Automation Script v1.3      ║');
  console.log('║   Target: ragavi.in                          ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  if (DRY_RUN) console.log('⚠️  DRY RUN MODE\n');

  let browser, context, page;
  if (!DRY_RUN) {
    ({ browser, context } = await createStealthBrowser());
    page = await context.newPage();
  }

  console.log('📦 Fetching product catalogue...');
  let products = await fetchProductList(page);
  products = products.filter(p => p.handle && p.title);
  console.log(`  Found ${products.length} products\n`);

  if (products.length === 0) {
    if (browser) await browser.close();
    process.exit(1);
  }

  const selectedProducts = [...products].sort(() => Math.random() - 0.5).slice(0, REVIEWS_PER_RUN);
  console.log(`🎯 Selected ${selectedProducts.length} products to review.\n`);

  let successCount = 0;
  for (let i = 0; i < selectedProducts.length; i++) {
    const p = selectedProducts[i];
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📋 Review ${i + 1}/${selectedProducts.length}: ${p.title}`);
    const ok = await postReview(page, p);
    if (ok) successCount++;

    if (i < selectedProducts.length - 1) {
      const wait = randomInt(15, 30);
      console.log(`\n  ⏳ Waiting ${wait}s...\n`);
      await sleep(wait * 1000);
    }
  }

  if (browser) await browser.close();
  console.log(`\n✅ Done! ${successCount}/${selectedProducts.length} successfully attempted.\n`);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
