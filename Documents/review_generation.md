# Reviewer & Review Content Generation

This document details how the script programmatically generates realistic reviewer profiles and context-appropriate review content for products on [ragavi.in](https://www.ragavi.in).

---

## 1. Reviewer Profile Generation

The function `generateReviewer()` generates randomized Indian names and matching emails to simulate genuine customers.

### A. Core Data Pools
The script contains predefined lists of popular Indian names:
*   **First Names**: 30 female names (e.g., Priya, Ananya, Simran, Neha, Pooja, Preeti, Swati).
*   **Last Names**: 30 common Indian family names (e.g., Sharma, Gupta, Singh, Kapoor, Mehta, Patel, Nair).
*   **Email Domains**: Popular email providers in India (Gmail, Yahoo, Outlook, Hotmail, Rediffmail, iCloud).

### B. Email Structuring Algorithms
To avoid simple pattern-detection algorithms flagging the reviews, emails are generated using one of four structural patterns chosen at random:

| Style ID | Formula | Example Result |
| :---: | :--- | :--- |
| **1** | `firstname + lastname + random_number` | `priyasharma482@gmail.com` |
| **2** | `firstname + . + lastname` | `ananya.gupta@yahoo.com` |
| **3** | `firstname + random_number` | `simran82@outlook.com` |
| **4** | `firstname + _ + lastname` | `neha_kapoor@rediffmail.com` |

---

## 2. Review Content Logic

The function `generateReview(productTitle, productType)` ensures reviews are relevant to what is being sold.

### A. Product Categorization Rules
The script scans the product's title and its metadata type against keyword criteria to classify it into one of four categories:

```
                  ┌──────────────────────────────┐
                  │  Check Product Title & Type  │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
Contains: "dress",       Contains: "lehenga"     Contains: "kurta",
"mini", "midi", "maxi"   or Type: "lehenga"      "sharara", "dupatta"
         │                       │               or Type: "kurta"
         ▼                       ▼                       ▼
   [ dress ]                [ lehenga ]              [ kurta ]
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                         None of the above
                                 ▼
                            [ generic ]
```

### B. Review Content Templates
Each category contains a dedicated pool of positive titles (ratings between 4 and 5 stars) and detailed, descriptive body paragraphs.

#### 1. Dress templates
*   **Focus**: Smocking detail, breezy fabric, style, fit, suitability for date nights/parties/summer, color fastness.
*   *Sample Title*: "Perfect dress for every occasion!"
*   *Sample Body*: "This dress is absolutely stunning. The stitching quality is top notch and the material feels premium. I wore it to a friend's birthday and everyone kept asking where I got it from. Highly recommended!"

#### 2. Lehenga templates
*   **Focus**: Wedding/festive wear, embroidery, fabric drape, organza dupatta quality, blouse fit, skirt flare (spinning), Navratri/Sangeet.
*   *Sample Title*: "Royal look on a budget!"
*   *Sample Body*: "Wore this to a sangeet ceremony and received compliments all night! The embroidery is intricate and the fabric drapes beautifully. Sizing was accurate — ordered my usual size and it fit perfectly."

#### 3. Kurta templates
*   **Focus**: Chanderi fabric sheen, organza dupatta grace, pujas/festivals, comfort, silhouette.
*   *Sample Title*: "Elegant ethnic wear!"
*   *Sample Body*: "This kurta set is absolutely gorgeous! The fabric is soft and breathable, perfect for all-day wear. I wore it to a puja and received so many compliments. The embroidery detailing is beautiful!"

#### 4. Generic templates
*   **Focus**: Gift giving, customer service, fast delivery, packaging, repeat purchasing.
*   *Sample Title*: "Excellent quality!"
*   *Sample Body*: "Absolutely love this! The quality is excellent and the fit is perfect. Delivery was fast and well-packaged. I've become a loyal Ragavi customer — their designs are just gorgeous!"

---

## 3. Modifying and Extending Content

To keep the content fresh, you can modify the arrays in `index.js`:

### Adding Reviewers
Append strings to the `FIRST_NAMES` (line 47) and `LAST_NAMES` (line 54) arrays.

### Customizing Product Keywords
If a new product line is added (e.g., sarees), update the categorization rules in the `generateReview` function (line 186):
```javascript
// Example: Adding saree detection
if (titleLower.includes('saree') || titleLower.includes('sari')) {
  category = 'saree';
}
```
*Note: Make sure to also add a corresponding `saree` object with `titles` and `bodies` arrays inside `REVIEW_TEMPLATES` (line 86).*
