/**
 * Plan limits — single source of truth for all tier restrictions.
 * Used by both the usageLimiter middleware and the frontend via /api/billing/plans.
 */

const PLANS = {
  // free: {
  //   label:           'Free',
  //   price:           { monthly: 0, annual: 0 },
  //   scripts:         3,           // max total scripts
  //   maxPages:        15,          // max pages per script (~3,000 words)
  //   aiRequests:      10,          // per month
  //   storyboards:     1,           // per month
  //   storyboardImages: 20,         // images per storyboard
  //   voiceReadthroughs: 0,         // per month
  //   collaboration:   false,
  //   versionHistory:  false,
  //   pdfExport:       true,
  //   txtExport:       true,
  //   apiAccess:       false,
  //   customBranding:  false,
  //   teamSeats:       1,
  // },
  free: {
    label: "Free",
    price: { monthly: 0, annual: 0 },
    scripts: 3, // max total scripts
    maxPages: 15, // max pages per script (~3,000 words)
    aiRequests: 0, // per month
    storyboards: 0, // per month
    storyboardImages: 0, // images per storyboard
    voiceReadthroughs: 0, // per month
    collaboration: false,
    versionHistory: false,
    pdfExport: true,
    txtExport: true,
    apiAccess: false,
    customBranding: false,
    teamSeats: 1,
  },
  // writer: {
  //   label: "Writer",
  //   price: { monthly: 7000, annual: 60000 }, // $8/mo billed annually
  //   scripts: Infinity,
  //   maxPages: Infinity,
  //   aiRequests: 200,
  //   storyboards: 5,
  //   storyboardImages: 200,
  //   voiceReadthroughs: 1,
  //   collaboration: "view", // view-only sharing links
  //   versionHistory: 30, // days
  //   pdfExport: true,
  //   txtExport: true,
  //   apiAccess: false,
  //   customBranding: false,
  //   teamSeats: 1,
  // },
  writer: {
    label: "Writer",
    price: { monthly: 7000, annual: 60000 },
    scripts: Infinity,
    maxPages: Infinity,
    aiRequests: 0,
    storyboards: 0,
    storyboardImages: 0,
    voiceReadthroughs: 0,
    collaboration: "view", // view-only sharing links
    versionHistory: 0, // days
    pdfExport: true,
    txtExport: true,
    apiAccess: false,
    customBranding: false,
    teamSeats: 1,
  },
  pro: {
    label: "Pro",
    price: { monthly: 10000, annual: 100000 }, // $19/mo billed annually
    scripts: Infinity,
    maxPages: Infinity,
    aiRequests: 1000,
    storyboards: 20,
    storyboardImages: 800,
    voiceReadthroughs: 5,
    collaboration: "edit", // real-time co-writing (2 users)
    versionHistory: 365, // days
    pdfExport: true,
    txtExport: true,
    apiAccess: false,
    customBranding: false,
    teamSeats: 2,
    scriptCoverage: true, // AI structure/character/dialogue notes
    genreTemplates: true,
  },
  studio: {
    label: "Studio",
    price: { monthly: 20000, annual: 200000 }, // $52/mo billed annually
    scripts: Infinity,
    maxPages: Infinity,
    aiRequests: 5000,
    storyboards: Infinity,
    storyboardImages: Infinity,
    voiceReadthroughs: Infinity,
    collaboration: "edit",
    versionHistory: Infinity,
    pdfExport: true,
    txtExport: true,
    apiAccess: true,
    customBranding: true,
    teamSeats: 5,
    scriptCoverage: true,
    genreTemplates: true,
    videoPreview: true, // Kling/Runway clips
    pitchDeck: true,
  },
};

// Stripe Price IDs — set these from your Stripe dashboard in .env
const STRIPE_PRICES = {
  writer: {
    monthly: process.env.STRIPE_PRICE_WRITER_MONTHLY,
    annual: process.env.STRIPE_PRICE_WRITER_ANNUAL,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL,
  },
  studio: {
    monthly: process.env.STRIPE_PRICE_STUDIO_MONTHLY,
    annual: process.env.STRIPE_PRICE_STUDIO_ANNUAL,
  },
};

// Map a Stripe price ID back to plan + interval
function getPlanFromPriceId(priceId) {
  for (const [plan, prices] of Object.entries(STRIPE_PRICES)) {
    if (prices.monthly === priceId) return { plan, interval: "monthly" };
    if (prices.annual === priceId) return { plan, interval: "annual" };
  }
  return null;
}

module.exports = { PLANS, STRIPE_PRICES, getPlanFromPriceId };
