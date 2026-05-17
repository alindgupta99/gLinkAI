# Website SEO & Performance Optimisation Guide

A complete reference for building and optimising a marketing website for Google search and performance. Steps are ordered by impact.

---

## Part 1 — SEO: In-Code Changes

### 1. Schema Markup / Structured Data (JSON-LD)
Add inside `<head>`. Tells Google what your business is programmatically. Enables rich results.

**Organization schema:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company",
  "url": "https://yoursite.com",
  "logo": "https://yoursite.com/logo.png",
  "description": "One-line description of what you do.",
  "telephone": "+91-XXXXXXXXXX",
  "email": "hello@yoursite.com",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+91-XXXXXXXXXX",
    "contactType": "customer service",
    "availableLanguage": ["English", "Hindi"]
  },
  "areaServed": "India"
}
</script>
```

**ProfessionalService / LocalBusiness schema:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Your Company",
  "url": "https://yoursite.com",
  "telephone": "+91-XXXXXXXXXX",
  "email": "hello@yoursite.com",
  "description": "Full description.",
  "priceRange": "₹₹",
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    "opens": "09:00",
    "closes": "20:00"
  },
  "areaServed": { "@type": "Country", "name": "India" },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Services",
    "itemListElement": [
      {"@type":"Offer","itemOffered":{"@type":"Service","name":"Service Name","description":"What it does."}}
    ]
  }
}
</script>
```

**FAQPage schema** (pair this with a visible FAQ section on the page):
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Question text here?",
      "acceptedAnswer": {"@type":"Answer","text":"Answer text here."}
    }
  ]
}
</script>
```

**Validate all schemas at:** https://search.google.com/test/rich-results

---

### 2. Meta Tags (add to `<head>`)
```html
<!-- Primary -->
<title>Company Name — Primary Keyword | Secondary Keyword</title>
<meta name="description" content="150–160 char description matching search intent. No keyword stuffing." />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://yoursite.com/" />

<!-- Open Graph (controls WhatsApp/LinkedIn/Facebook previews) -->
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Company Name" />
<meta property="og:title" content="Same as <title> or slightly shorter" />
<meta property="og:description" content="Same as meta description or adapted" />
<meta property="og:url" content="https://yoursite.com/" />
<meta property="og:image" content="https://yoursite.com/og-image.png" />
<meta property="og:locale" content="en_IN" />

<!-- Twitter / X Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Company Name — Short tagline" />
<meta name="twitter:description" content="Short description under 200 chars." />
<meta name="twitter:image" content="https://yoursite.com/og-image.png" />

<!-- Google Search Console verification -->
<meta name="google-site-verification" content="YOUR_CODE_HERE" />
```

**Notes:**
- Title: 50–60 characters, primary keyword as far left as possible
- Description: 140–160 characters, focus on intent not keywords
- OG image: ideally 1200×630px for social shares
- Canonical tag prevents duplicate content penalties if site is accessible at multiple URLs

---

### 3. Heading Hierarchy (H1–H6)
- **Exactly one `<h1>`** per page — the primary topic
- Every section gets an `<h2>` with keyword-rich text (not just "What We Do")
- Service cards, subsections use `<h3>`
- Never skip levels (H2 → H4 is wrong)

**Good heading examples (broad, not sector-restricted):**
```
H1: Your Business, Powered by AI
H2: Professional Digital Services — Website, SEO & Automation
H2: How AI Delivers Your Website & Automation in 48 Hours
H2: How to Get Your Business Online in 4 Simple Steps
H2: Common Questions
```

**Bad examples:**
```
H2: What We Do        ← no keywords
H2: Our Services      ← too generic
```

---

### 4. robots.txt
Create at project root. Blocks crawl of admin and API routes.

```
User-agent: *
Disallow: /admin
Disallow: /api/

Sitemap: https://yoursite.com/sitemap.xml
```

**Important on Express + Vercel:** Add an explicit route — `express.static` can miss this file in serverless:
```javascript
app.get('/robots.txt', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});
```

---

### 5. sitemap.xml
Create at project root. Helps Google discover and prioritise pages.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yoursite.com/</loc>
    <lastmod>YYYY-MM-DD</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

Add explicit Express route (same reason as robots.txt):
```javascript
app.get('/sitemap.xml', (_req, res) => {
  res.setHeader('Content-Type', 'application/xml');
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});
```

Submit at: Google Search Console → Sitemaps

---

### 6. Keyword Integration in Copy
Target how people actually search, not marketing language.

| Instead of | Use |
|-----------|-----|
| "Digital Growth Solutions" | "professional website design" |
| "AI-Powered Offerings" | "AI automation for business" |
| "Transformative Digital Journey" | "get your business online fast" |

- Weave keywords into H2/H3 headings, hero paragraph, service descriptions
- Do NOT restrict to specific sectors if the business is open to all
- One primary keyword per section — no stuffing

---

### 7. FAQ Section (+ FAQPage schema)
FAQs with `FAQPage` schema can appear as expandable accordions in Google results, taking 3× the SERP space.

```html
<section id="faq">
  <h2>Common Questions</h2>
  <div class="faq-list">
    <div class="faq-item">
      <button class="faq-q" onclick="toggleFaq(this)" aria-expanded="false">
        Question text? <span class="faq-arrow">↓</span>
      </button>
      <div class="faq-a" style="display:none">Answer text.</div>
    </div>
  </div>
</section>
```

```javascript
function toggleFaq(btn) {
  const isOpen = btn.getAttribute('aria-expanded') === 'true';
  document.querySelectorAll('.faq-q').forEach(q => {
    q.setAttribute('aria-expanded', 'false');
    q.nextElementSibling.style.display = 'none';
  });
  if (!isOpen) {
    btn.setAttribute('aria-expanded', 'true');
    btn.nextElementSibling.style.display = 'block';
  }
}
```

**Good FAQ questions to cover:**
- How quickly can the product/service be delivered?
- Who do you work with? (keep broad)
- Do I need technical knowledge?
- Do I own everything after delivery?
- What does [specific service] involve?
- What does it cost?
- What support is provided?

---

### 8. Semantic HTML
```html
<!-- Wrap all page content between nav and footer -->
<main>
  <section id="hero" aria-label="Hero">...</section>
  <section id="services">...</section>
  <!-- etc. -->
</main>

<!-- Footer stays outside main -->
<footer>...</footer>
```

Use proper semantic elements: `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<header>`

---

### 9. Image Alt Text
Every `<img>` must have a descriptive `alt` attribute:
```html
<img src="/logo.png" alt="CompanyName logo" />
<img src="/service-diagram.png" alt="Diagram showing AI automation workflow" />
```

Decorative images (pure CSS, background images) don't need alt text.

---

### 10. Vercel-specific: includeFiles
Any static file served by Express on Vercel must be declared in `vercel.json`:
```json
{
  "version": 2,
  "builds": [{
    "src": "server.js",
    "use": "@vercel/node",
    "config": {
      "includeFiles": ["*.html", "robots.txt", "sitemap.xml", "logos/*"]
    }
  }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

---

## Part 2 — Performance Optimisation

### 1. Remove CPU-Expensive CSS Effects
The single biggest LCP killer in CSS-heavy single-page sites.

**Remove `feTurbulence` noise texture completely** — it's computed on the CPU and blocks first paint:
```css
/* DELETE THIS ENTIRELY */
body::before {
  background-image: url("data:image/svg+xml,...feTurbulence...");
}
```

**Remove `backdrop-filter: blur()`** from navigation and buttons — forces an expensive compositor layer:
```css
/* Before */
nav { backdrop-filter: blur(20px); background: rgba(5,6,15,0.75); }

/* After */
nav { background: rgba(5,6,15,0.93); }
```

---

### 2. GPU-Composite Animated Elements
Add `will-change: transform` to any element with CSS animations or JS-driven transforms. This tells the browser to promote it to its own GPU layer before animation starts:

```css
.orb, .animated-element, .marquee-track {
  will-change: transform;
}
```

Also reduce blur radius on filter effects — lower values = less GPU work:
```css
/* Before: filter: blur(80px); */
filter: blur(60px);
```

---

### 3. Throttle JS Event Listeners
**mousemove** fires hundreds of times per second. Throttle it with `requestAnimationFrame`:
```javascript
const orb1 = document.querySelector('.orb-1');
const orb2 = document.querySelector('.orb-2');
let rafId = null;

document.addEventListener('mousemove', (e) => {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    if (orb1) orb1.style.transform = `translate(${x * 0.8}px, ${y * 0.8}px)`;
    if (orb2) orb2.style.transform = `translate(${-x * 0.6}px, ${-y * 0.6}px)`;
    rafId = null;
  });
}, { passive: true });  // ← always passive for mousemove

window.addEventListener('scroll', () => {
  // scroll handler code
}, { passive: true });  // ← always passive for scroll
```

---

### 4. Non-Blocking Font Loading
Load Google Fonts asynchronously so they never block rendering. Use `font-display=swap` so text shows immediately with a fallback font:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
  media="print" onload="this.media='all'" />
<noscript>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" />
</noscript>
```

**Font weight tip:** Only load weights actually used. Inter with 7 weights is 7 network requests. Cut to 5 or fewer.

---

### 5. content-visibility for Below-Fold Sections
Tells the browser to skip rendering off-screen sections until they scroll into view. Can cut initial Style & Layout time dramatically on long pages:

```css
#services, .industries, .ai-section, .process,
#pricing, .testimonials, #contact, #faq {
  content-visibility: auto;
  contain-intrinsic-block-size: 600px; /* approximate section height */
}
```

---

### 6. CDN Caching Headers (critical for Vercel)
Without cache headers, every visitor hits a serverless cold start (adds 500–1500ms TTFB). With `s-maxage`, Vercel's CDN serves the page from cache:

```javascript
// In server.js — static file middleware
app.use(express.static(path.join(__dirname), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    } else if (/\.(jpe?g|png|webp|svg|ico|woff2?)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// Also set on the explicit HTML route
app.get('/', (_req, res) => {
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.sendFile(path.join(__dirname, 'index.html'));
});
```

**What the values mean:**
- `s-maxage=3600` — Vercel CDN caches for 1 hour
- `stale-while-revalidate=86400` — serve cached version for 24h while fetching fresh copy in background
- `max-age=31536000, immutable` — images cached in browser for 1 year (use only for assets with hashed filenames or rarely-changing files)

---

### 7. CSS Minification
Inline CSS (inside `<style>` tags) can be minified by removing comments and whitespace. Lighthouse typically finds 1–3 KiB savings on a single-page site.

Remove comment blocks like:
```css
/* ─── SECTION NAME ─── */
```
And collapse multi-line rules to single lines where readable. Or run the HTML through an HTML minifier as a build step.

---

## Part 3 — Post-Launch Verification

### Tools to use immediately after deployment:

| Tool | URL | What to check |
|------|-----|---------------|
| Google Rich Results Test | search.google.com/test/rich-results | Schema validity — FAQ, Organization, Service |
| PageSpeed Insights | pagespeed.web.dev | Performance score, Core Web Vitals |
| Google Search Console | search.google.com/search-console | Index coverage, sitemap, CWV report |
| Mobile-Friendly Test | search.google.com/test/mobile-friendly | Mobile rendering |

### Google Search Console setup steps:
1. Add property (use your domain or Vercel URL)
2. Verify via HTML meta tag in `<head>`
3. Submit sitemap at `https://yoursite.com/sitemap.xml`
4. Check Coverage report after 1–2 weeks for indexing confirmation

### Google Business Profile:
- Set up at business.google.com
- Adds your business to Google Maps and local search
- NAP (Name, Address, Phone) must match exactly what's on the website

---

## Part 4 — What to Expect (Timeline)

| Timeframe | Expected result |
|-----------|----------------|
| Day 1 | Rich Results Test confirms schema is valid |
| Week 1–2 | Google crawls and indexes the site (check GSC Coverage) |
| Week 2–4 | First impressions and query data in GSC Search Results |
| Month 1–2 | Rankings begin moving for target keywords |
| Month 2–4 | FAQ rich results may appear in Google search |
| Month 3–6 | Meaningful organic traffic if content is being built |

---

## Part 5 — Core Web Vitals Targets

| Metric | Good | Needs Work | Poor |
|--------|------|------------|------|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5–4s | > 4s |
| INP (Interaction to Next Paint) | < 200ms | 200–500ms | > 500ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1–0.25 | > 0.25 |
| FCP (First Contentful Paint) | < 1.8s | 1.8–3s | > 3s |
| TTFB (Time to First Byte) | < 800ms | 800–1800ms | > 1800ms |

---

## Part 6 — SEO Ranking Factors (Priority Order)

1. **Content quality & relevance** — original, helpful, people-first content
2. **E-E-A-T** — Experience, Expertise, Authoritativeness, Trustworthiness signals
3. **Backlinks** — quality over quantity; earned editorial links from relevant sites
4. **Core Web Vitals & mobile speed** — passing all three CWV gives 8–15% visibility boost
5. **User experience signals** — CTR, time on page, bounce rate
6. **Semantic structure** — topic coverage depth, structured data, heading hierarchy
7. **HTTPS** — required; non-HTTPS sites are actively demoted
8. **Technical fundamentals** — clean crawlable structure, sitemap, canonical, robots.txt
9. **Local signals** (if local business) — Google Business Profile, reviews, NAP consistency

---

## Quick Checklist for Any New Website

### Before launch:
- [ ] `<title>` tag — 50–60 chars, keyword at start
- [ ] `<meta name="description">` — 140–160 chars
- [ ] Canonical tag
- [ ] Open Graph tags (og:title, og:description, og:image, og:url)
- [ ] Twitter Card tags
- [ ] Organization JSON-LD schema
- [ ] Service/Product JSON-LD schema
- [ ] FAQPage JSON-LD schema (if FAQ section exists)
- [ ] One H1 per page, keyword-rich H2s per section
- [ ] Alt text on all meaningful images
- [ ] `<main>` semantic wrapper
- [ ] robots.txt (with explicit Express route)
- [ ] sitemap.xml (with explicit Express route)
- [ ] vercel.json includeFiles updated
- [ ] Fonts loaded async (media="print" onload)
- [ ] No feTurbulence or heavy SVG filters in CSS
- [ ] No backdrop-filter on frequently-repainting elements
- [ ] will-change: transform on animated elements
- [ ] content-visibility: auto on below-fold sections
- [ ] Passive scroll and mousemove listeners
- [ ] mousemove throttled with requestAnimationFrame
- [ ] Cache-Control headers set (s-maxage for CDN)

### After launch:
- [ ] Verify site in Google Search Console
- [ ] Submit sitemap in GSC
- [ ] Run Rich Results Test — confirm schema valid
- [ ] Run PageSpeed Insights — target 85+ mobile
- [ ] Set up Google Business Profile (if local business)
- [ ] Monitor GSC weekly for impressions and index coverage
