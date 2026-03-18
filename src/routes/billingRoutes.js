const express = require("express");
const router = express.Router();
const billing = require("../controllers/billingController");
const { protect } = require("../middleware/auth");

// ── Public ───────────────────────────────────────────────
router.get("/plans", billing.getPlans);

// ── Stripe webhook — MUST be raw body, before JSON middleware ──
// Mounted in app.js BEFORE express.json()
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  billing.handleWebhook
);
// Paystack webhook (payment notifications)
router.post("/paystack-webhook", billing.handlePaystackWebhook);

// ── Protected ────────────────────────────────────────────
router.use(protect);

router.post("/create-checkout-session", billing.createCheckoutSession);
// Start checkout (returns Paystack payment link)
router.post("/create-portal-session", billing.createPortalSession);
router.get("/subscription", billing.getSubscription);
// Verify payment after redirect
router.get("/verify-payment", billing.verifyPayment);

module.exports = router;
