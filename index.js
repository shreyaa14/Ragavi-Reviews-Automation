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
  'Priya', 'Ananya', 'Simran', 'Neha', 'Pooja', 'Riya', 'Aditi', 'Shreya', 'Kavya', 'Divya',
  'Meghna', 'Ishita', 'Tanvi', 'Kriti', 'Aisha', 'Nishi', 'Preeti', 'Swati', 'Anjali', 'Pallavi',
  'Garima', 'Sakshi', 'Nandita', 'Akansha', 'Rhea', 'Sanya', 'Tanya', 'Vrinda', 'Mansi', 'Deepika',
  'Aaradhya', 'Akshara', 'Avani', 'Bhavna', 'Charu', 'Devika', 'Esha', 'Fatima', 'Gayatri', 'Hina',
  'Ira', 'Jiya', 'Kiran', 'Latika', 'Meera', 'Nisha', 'Ojasvi', 'Payal', 'Radhika', 'Sneha',
  'Tripti', 'Urvashi', 'Vaidehi', 'Yamini', 'Zoya', 'Amrita', 'Bindiya', 'Chitra', 'Disha', 'Ekta',
  'Gunjan', 'Harshita', 'Indu', 'Juhi', 'Kajal', 'Lipika', 'Manisha', 'Nupur', 'Prisha', 'Rashmi',
  'Shalini', 'Tanuja', 'Upasana', 'Varsha', 'Yashasvi', 'Alisha', 'Barkha', 'Chetna', 'Divika', 'Gitanjali',
  'Himani', 'Jaspreet', 'Kanika', 'Madhuri', 'Nidhi', 'Parul', 'Rekha', 'Sonali', 'Tejaswini', 'Vasudha',
  'Aloka', 'Binita', 'Daksha', 'Hemlata', 'Kalyani', 'Malini', 'Padmini', 'Renu', 'Sujata', 'Vandana'
];

const LAST_NAMES = [
  'Sharma', 'Gupta', 'Singh', 'Kapoor', 'Mehta', 'Joshi', 'Patel', 'Verma', 'Agarwal', 'Bose',
  'Nair', 'Reddy', 'Iyer', 'Kumar', 'Saxena', 'Malhotra', 'Srivastava', 'Mishra', 'Chauhan', 'Tiwari',
  'Pandey', 'Chatterjee', 'Banerjee', 'Desai', 'Pillai', 'Menon', 'Rajan', 'Khanna', 'Chopra', 'Sen',
  'Roy', 'Rao', 'Bhat', 'Kulkarni', 'Shenoy', 'Prabhu', 'Hegde', 'Pai', 'Kamat', 'Nayak',
  'Fernandez', 'DSouza', 'Rodrigues', 'Gonsalves', 'Pinto', 'Mascarenhas', 'Lobo', 'Saldanha', 'Coelho', 'Mukherjee',
  'Ganguly', 'Dutta', 'Das', 'Ghosh', 'Mitra', 'Pal', 'Kundu', 'Halder', 'Choudhury', 'Dasgupta',
  'Majumdar', 'Sanyal', 'Bhaduri', 'Chakraborty', 'Lahiri', 'Ray', 'Guha', 'Basu', 'Shah', 'Vyas',
  'Trivedi', 'Dave', 'Pandya', 'Shukla', 'Dwivedi', 'Tripathi', 'Pathak', 'Dubey', 'Bajpai', 'Awasthi',
  'Agnihotri', 'Dixit', 'Chaturvedi', 'Ranganathan', 'Krishnan', 'Subramanian', 'Srinivasan', 'Balasubramanian', 'Venkataraman', 'Sundaram',
  'Swaminathan', 'Narayanan', 'Ramachandran', 'Viswanathan', 'Iyengar', 'Deshmukh', 'Kadam', 'Shinde', 'Jadhav', 'Gaikwad'
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
      'Perfect dress for summer days!',
      'Absolutely gorgeous fit and color',
      'My new favorite party dress!',
      'Exceeded my expectations, beautiful',
      'Got so many compliments at brunch',
      'Lovely fabric, feels super soft',
      'Stunning and very comfortable to wear',
      'Elegant design, fits like a glove',
      'Perfect length and great fabric quality',
      'Premium material, totally worth the price',
      'So breezy and stylish for outings',
      'Beautiful floral pattern and stitching',
      'Extremely flattering cut, love it!',
      'Exquisite piece, fits perfectly',
      'Highly recommend this gorgeous dress',
      'Color is exactly as shown in the picture',
      'Beautifully made, very neat stitching',
      'Perfect styling option for dinners',
      'Simple yet very classy look!',
      'Love the sleeve design and comfort',
      'Feels luxurious and looks amazing',
      'Super fast delivery, great packaging',
      'So lightweight and perfect for vacation',
      'Incredible quality, ordering another color soon',
      'Absolute show-stopper dress!'
    ],
    bodies: [
      'I ordered this dress for a friend\'s birthday party and it was a hit! The fabric is incredibly soft and the color looks even more vibrant in real life. True to size fit!',
      'This is the most comfortable dress I own. The material is lightweight and breathable, making it perfect for long hours. I love the fit around the waist!',
      'Got so many compliments when I wore this to a weekend brunch! The stitching is perfect and there are no loose threads. Very premium look and feel.',
      'I was skeptical about the fit, but it hugs the body beautifully in all the right places. The fabric quality is top-notch. Absolutely worth every rupee!',
      'This dress is beautiful! The color is stunning and the material is soft against the skin. Delivery was fast too, arrived in neat packaging within 4 days.',
      'A perfect outfit for summer outings. The smocking detail is gorgeous and fits true to size. I paired it with white sneakers and felt so stylish!',
      'The quality of this dress is amazing. Even after a wash, the color did not fade at all and the shape remained intact. Highly recommend Ragavi!',
      'Love the sleeve design and the neckline. It looks very classy and elegant. Perfect for date nights or casual dinners. Will buy more from this brand!',
      'The fabric feels very rich and luxurious. I am extremely pleased with the stitching quality. Fits like a glove. Received many queries about where I got it!',
      'Exceeded all my expectations! The print is so pretty and the dress is super breezy. Great for warm weather. Definitely a 5-star purchase!',
      'This dress is very flattering. The fabric draping is beautiful and looks expensive. Excellent customer service and speedy delivery.',
      'Beautiful design and high-quality craftsmanship. The inner lining is soft and comfortable. Perfect length for me. Very happy with this purchase.',
      'Simply gorgeous! The pattern is elegant and the fabric has a nice flow to it. Received compliments from everyone at office.',
      'Very stylish and trendy dress. The fabric is premium quality and doesn\'t crease easily. Extremely comfortable for all-day wear.',
      'Highly recommend this dress! The cut is perfect, fabric is durable, and color is eye-catching. Ideal for both casual and semi-formal events.',
      'The fit is absolute perfection. It\'s rare to find dresses online that fit so well without alterations. Excellent work by the designers!',
      'I am in love with the color and print of this dress. It\'s very cheerful and looks exactly like the pictures. Great packaging.',
      'Comfortable, stylish, and high quality. The stitching details are superb. Will definitely be a regular customer of Ragavi now.',
      'This dress has a lovely flare and the fabric is premium quality. Very lightweight and perfect for holidays.',
      'Received this today and couldn\'t wait to try it on. It fits beautifully and the material is very comfortable. Highly satisfied!',
      'Beautifully stitched dress. The attention to detail is noticeable. It feels very premium and looks great with minimal styling.',
      'Excellent value for money. The fabric is soft and the dress has a very elegant look. Got many compliments from my sisters!',
      'Perfect casual wear dress. The material is skin-friendly and breathable. The color is very soothing. Will buy again.',
      'The design is modern and chic. Fits comfortably and the length is just right. Love the fabric texture.',
      'Absolutely stunning dress! It made me feel so confident and beautiful. A must-have in every wardrobe.'
    ]
  },
  lehenga: {
    titles: [
      'Royal look on a budget!',
      'Absolutely stunning festive wear',
      'Perfect wedding guest outfit!',
      'Exquisite craftsmanship and details',
      'Loved the flare and fabric quality',
      'Beautifully designed lehenga set',
      'Got so many compliments at the wedding',
      'Elegant design and premium feel',
      'Fits perfectly, felt like a princess',
      'Gorgeous colors and neat embroidery',
      'Breathtaking design, highly recommended',
      'Stitching quality is top-notch!',
      'Perfect flare for festive dancing',
      'Beautiful organza dupatta and work',
      'Worth every single rupee!',
      'Absolutely gorgeous, exceeded expectations',
      'Elegant and lightweight lehenga',
      'High quality material and printing',
      'Perfect fit and fast delivery',
      'Beautiful color combination, loved it',
      'Stunning ethnic wear, great purchase',
      'Graceful drape and lovely details',
      'Received so many compliments!',
      'Excellent packaging and quick dispatch',
      'Dreamy lehenga, absolute showstopper'
    ],
    bodies: [
      'Wore this to a sangeet ceremony and received compliments all night! The embroidery is intricate and the fabric drapes beautifully. Fits perfectly.',
      'This lehenga is absolutely breathtaking in person! The colors are more vibrant than in the photos and the fabric quality is premium. So many compliments!',
      'Ordered this for my cousin\'s mehndi function and it was a total hit! The embroidery detail is beautiful and the dupatta adds such an elegant touch.',
      'The lehenga arrived well-packed and the quality is outstanding for the price. The blouse fits perfectly and the skirt has a lovely flare.',
      'I was skeptical about ordering ethnic wear online but this exceeded all my expectations! The fabric is luxurious and the fit is perfect.',
      'Absolutely gorgeous! I wore this to a family function and everyone thought I had spent a fortune on it. The work is beautiful.',
      'This lehenga set is the perfect blend of traditional and contemporary. The fabric is lightweight yet looks very rich. I photographed beautifully!',
      'Purchased this for Navratri and it was the perfect choice! The colors are stunning, the lehenga has great flare, and the dupatta is so elegant.',
      'High quality fabric and beautiful stitching. The lehenga has a very premium look and feels very comfortable. Highly recommend!',
      'The embroidery is neat and details are stunning. Fits exactly as per size chart. Received many compliments from my relatives.',
      'Fits like a dream! The fabric is soft and the work is very detailed. Perfect for weddings and grand festivals.',
      'Breathtakingly beautiful lehenga. The color combination is unique and looks very sophisticated. Delivery was very prompt.',
      'I felt so elegant wearing this lehenga. The flare is amazing and the blouse stitching is very neat. Excellent quality product.',
      'Exceeded all my expectations! The material feels very premium and looks rich. Great customer service and packaging.',
      'Highly recommended for the wedding season. It is comfortable to wear for hours and looks extremely royal.',
      'Beautiful design and great craftsmanship. The inner lining is comfortable and the dupatta length is perfect.',
      'The color is exactly as shown and the embroidery is gorgeous. It looks much more expensive than it is. Very happy!',
      'Absolutely stunning outfit! The flare of the skirt is wonderful and the blouse fits perfectly. Got compliments from everyone.',
      'Great quality product. The fabric is durable and the work is very clean. Worth the price. Will buy from Ragavi again.',
      'Beautiful lehenga set with a great fit. Lightweight and easy to carry. The colors are very festive and bright.',
      'Excellent ethnic wear! The stitching and finishing are neat, and the fabric feels premium. Perfect for special occasions.',
      'Loved the design and flare. It is perfect for family functions and looks very classy. Shipping was very fast.',
      'Very beautiful and elegant. The embroidery is very neat and has a nice shine. Fits comfortably.',
      'Stunning lehenga set. The dupatta work is beautiful and the skirt drape is very graceful. Very satisfied with the purchase.',
      'A gorgeous outfit that fits perfectly. Got so many inquiries about where I bought it from. Highly recommended!'
    ]
  },
  kurta: {
    titles: [
      'Elegant and classy kurta set',
      'Perfect for festive celebrations!',
      'Beautiful embroidery and fabric',
      'Best ethnic wear purchase online',
      'Highly comfortable and very elegant',
      'Exceeded my expectations on quality',
      'Stunning design and rich colors',
      'Fits perfectly, no alterations needed',
      'Loved the organza dupatta detail',
      'Great value for money, premium feel',
      'Perfect outfit for pujas and festivals',
      'Gorgeous embroidery details, love it',
      'Very comfortable fabric for summer',
      'Extremely graceful silhouette!',
      'Got many compliments from family',
      'Color and material are excellent',
      'Beautifully designed festive wear',
      'Stitching is very professional and neat',
      'Lovely design, looks very rich',
      'Classic addition to my ethnic collection',
      'Highly recommended kurta set!',
      'Beautiful print and soft texture',
      'Perfect fit and very fast shipping',
      'Absolutely love the dupatta length and work',
      'Graceful and comfortable all day long'
    ],
    bodies: [
      'This kurta set is absolutely gorgeous! The fabric is soft and breathable, perfect for all-day wear. I wore it to a puja and received so many compliments.',
      'Ordered this for a family function and it was perfect! The dupatta is so graceful and the fabric has a lovely sheen. Sizing is true to size.',
      'The quality of this kurta set is exceptional for the price. The fabric feels premium, the color is vibrant and the embroidery is well done.',
      'I love everything about this kurta set! Wore it to a sangeet and kept getting compliments. The organza dupatta adds such an elegant touch.',
      'Absolutely beautiful! The fabric is lightweight, comfortable and has a luxurious drape. Perfect for festive occasions. Highly recommend!',
      'This is my third purchase from Ragavi and they never disappoint! The kurta is beautifully crafted, the fabric is soft and the fit is flattering.',
      'Received this as a gift and absolutely love it! The fabric has a lovely sheen and the embroidery is intricate and well done.',
      'Such a classy kurta set! The silhouette is very flattering and the fabric drapes beautifully. I wore it to a pooja and felt so elegant.',
      'The fit is perfect and the material is very comfortable. The color is exactly as shown on the website. Will buy more from Ragavi.',
      'Very elegant design. The neck work is beautiful and the stitching is perfect. Received many compliments from colleagues at the festival.',
      'High quality fabric and very neat stitching. The set looks very premium and royal. Excellent packaging and prompt delivery.',
      'This ethnic set is a must-buy! The fabric is very soft on the skin and the dupatta is absolutely gorgeous. Fits perfectly.',
      'Beautiful kurta set with great fit. The fabric is premium quality and doesn\'t fade after washing. Very happy with the purchase.',
      'Excellent craftsmanship! The embroidery is neat and the fabric is very comfortable. Ideal for family gatherings and festivals.',
      'Highly recommend this outfit. It is extremely comfortable for hot weather and looks very stylish. Got so many compliments!',
      'The print is very elegant and the color is gorgeous. It fits like a dream without any alterations. Fast shipping!',
      'Absolutely in love with this kurta set. The fabric feels luxurious and the design is very graceful. Worth every penny.',
      'Perfectly tailored and beautiful design. The dupatta matches beautifully and completes the look. Will order again.',
      'Great quality ethnic wear. The embroidery details are stunning and the fabric is premium. Very comfortable to wear.',
      'Beautiful addition to my wardrobe. Sizing is accurate and the material is very breathable. Perfect for daily and festive wear.',
      'Very classy and sophisticated look. The stitching is neat and the fabric is of high standard. Highly recommended!',
      'Super comfortable and stylish. The color combination is beautiful and looks exactly like the picture. Very satisfied!',
      'Exceeded expectations! The material is rich and soft, and the dupatta design is very elegant. Great shopping experience.',
      'Beautiful styling, great fit, and high-quality fabric. Got many compliments from relatives during Diwali.',
      'Excellent purchase. The style is modern yet traditional. Extremely comfortable and elegant. Thanks, Ragavi!'
    ]
  },
  generic: {
    titles: [
      'Excellent quality and service!',
      'Beautiful clothing, highly satisfied',
      'Love this brand, will buy again',
      'Great value for money, premium quality',
      'Absolutely stunning outfit!',
      'Very happy with the purchase',
      'Exceeded all my expectations',
      'Lovely designs and neat stitching',
      'Highly recommended brand!',
      'Premium fabric and great customer care',
      'Beautiful collection, fits perfectly',
      'Very comfortable and elegant look',
      'Fast delivery and excellent packaging',
      'Great experience shopping here',
      'Elegant styles and high quality',
      'Beautiful products, love the material',
      'Absolutely in love with this brand',
      'Fits true to size, great quality',
      'Exceptional craftsmanship and design',
      'Very neat stitching and comfortable',
      'Amazing designs, got many compliments',
      'High-quality fabric and perfect fit',
      'Wonderful shopping experience!',
      'Classy clothing options, love it',
      'Beautifully made, very high standard'
    ],
    bodies: [
      'Absolutely love this! The quality is excellent and the fit is perfect. Delivery was fast and well-packaged. I\'ve become a loyal Ragavi customer.',
      'Such beautiful craftsmanship! The fabric quality is top notch and the colors are exactly as shown. I received so many compliments.',
      'Really happy with this purchase! Great quality, accurate sizing and beautiful design. The delivery was also really prompt.',
      'Stunning piece! I was a bit nervous ordering online but the product exceeded all expectations. The fabric feels premium and the design is elegant.',
      'Purchased as a gift and the recipient absolutely loved it! Great quality, beautiful design and impressive packaging. Highly recommend!',
      'I\'ve ordered from Ragavi multiple times and they never disappoint. The quality is consistently excellent and the designs are always gorgeous.',
      'Love love love this! The quality is so much better than I expected. The fabric is comfortable to wear all day and the design is beautiful. Worth every penny.',
      'Five stars all the way! Beautiful product, great quality and quick delivery. I wore this to a family function and felt amazing. So many people asked where I got it. Ragavi for the win!',
      'Exceptional quality and styling. The fabric feels very luxurious and fits true to size. Will definitely be ordering more soon.',
      'Very pleased with my purchase. The stitching is clean, the fabric is durable, and the customer support was very helpful.',
      'Ragavi has become my favorite brand for ethnic and casual wear. The designs are unique and quality is top-notch.',
      'Beautifully made outfit. Fits perfectly without any alterations. The fabric is lightweight and comfortable.',
      'Extremely satisfied with this purchase. The color didn\'t run during washing and the fabric is still soft. Highly recommended.',
      'Great quality clothing at reasonable prices. The shipping was incredibly fast, and the packaging was very secure.',
      'Absolutely stunning design. The material is very soft and feels premium. Fits beautifully and looks elegant.',
      'I am very impressed by the attention to detail in the stitching. It looks and feels like a designer boutique piece.',
      'Perfect fit, comfortable fabric, and lovely design. Got many compliments from friends and family. Will buy again!',
      'High standard of customer service and excellent product quality. Highly recommend Ragavi to anyone looking for stylish clothing.',
      'The outfit is very comfortable and fits perfectly. The material is premium and the color is gorgeous.',
      'Beautiful clothing with accurate size details. Very comfortable for long wear. Will definitely shop here again.',
      'Excellent quality fabric and perfect tailoring. It looks very elegant and feels comfortable. Highly recommended!',
      'Superb shopping experience! The product is beautiful, sizing is correct, and delivery was very fast.',
      'I love the texture and weight of the fabric. It is perfect for any season and looks very classy.',
      'Great designs and excellent value. The fit is perfect and the stitching is very neat. Very satisfied.',
      'Beautifully crafted item. Exceeded expectations in terms of comfort, fit, and appearance. Five stars!'
    ]
  }
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
