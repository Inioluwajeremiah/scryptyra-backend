const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const { PLANS, STRIPE_PRICES, getPlanFromPriceId } = require("../config/plans");
const { sendEmail } = require("../services/emailService");
const axios = require("axios");

// ─── GET /api/billing/plans ─────────────────────────────
// Public — returns plan metadata for the pricing page
exports.getPlans = (req, res) => {
  const plans = Object.entries(PLANS).map(([key, p]) => ({
    key,
    label: p.label,
    price: p.price,
    limits: p,
    priceIds: STRIPE_PRICES[key] || null,
  }));
  res.status(200).json({ status: "success", data: { plans } });
};

// ─── POST /api/billing/create-checkout-session ─────────
// Creates a Stripe Checkout session for plan upgrade
// exports.createCheckoutSession = async (req, res, next) => {
//   try {
//     const { plan, interval } = req.body; // e.g. { plan: 'pro', interval: 'monthly' }
//     const user = req.user;

//     if (!['writer', 'pro', 'studio'].includes(plan)) {
//       return next(new AppError('Invalid plan.', 400));
//     }
//     if (!['monthly', 'annual'].includes(interval)) {
//       return next(new AppError('Invalid billing interval.', 400));
//     }

//     const priceId = STRIPE_PRICES[plan]?.[interval];
//     if (!priceId) {
//       return next(new AppError('This plan/interval combination is not configured yet.', 400));
//     }

//     // Create or reuse Stripe customer
//     let customerId = user.stripeCustomerId;
//     if (!customerId) {
//       const customer = await stripe.customers.create({
//         email: user.email,
//         name:  user.name,
//         metadata: { userId: user._id.toString() },
//       });
//       customerId = customer.id;
//       await User.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
//     }

//     const session = await stripe.checkout.sessions.create({
//       customer:   customerId,
//       mode:       'subscription',
//       line_items: [{ price: priceId, quantity: 1 }],
//       success_url: `${process.env.CLIENT_URL}/billing?success=true&plan=${plan}`,
//       cancel_url:  `${process.env.CLIENT_URL}/pricing?canceled=true`,
//       allow_promotion_codes: true,
//       subscription_data: {
//         metadata: { userId: user._id.toString(), plan, interval },
//         trial_period_days: plan === 'writer' ? 7 : 0, // 7-day free trial for Writer
//       },
//       metadata: { userId: user._id.toString(), plan, interval },
//     });

//     res.status(200).json({ status: 'success', data: { url: session.url } });
//   } catch (err) {
//     logger.error(`Stripe checkout error: ${err.message}`);
//     next(err);
//   }
// };
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { plan, interval } = req.body;
    const user = req.user;

    console.log(" createCheckoutSession ===>> ");

    if (!["writer", "pro", "studio"].includes(plan)) {
      return next(new AppError("Invalid plan.", 400));
    }

    if (!["monthly", "annual"].includes(interval)) {
      return next(new AppError("Invalid billing interval.", 400));
    }

    let paymentUrl;

    if (plan === "writer" && interval === "monthly") {
      paymentUrl = process.env.PAYSTACK_WRITER_MONTHLY;
      console.log("monthly writer url ===>>> ", paymentUrl);
    }

    if (plan === "writer" && interval === "annual") {
      paymentUrl = process.env.PAYSTACK_WRITER_ANNUAL;
      console.log("annual writer url ===>>> ", paymentUrl);
    }

    if (!paymentUrl) {
      return next(new AppError("This plan is not available yet.", 400));
    }

    res.status(200).json({
      status: "success",
      data: { url: paymentUrl },
    });
  } catch (err) {
    logger.error(`Paystack checkout error: ${err.message}`);
    next(err);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.query;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = response.data.data;

    if (data.status !== "success") {
      return next(new AppError("Payment verification failed", 400));
    }

    const userId = data.metadata.userId;
    const plan = data.metadata.plan;
    const interval = data.metadata.interval;

    const user = await User.findById(userId);

    user.plan = plan;
    user.billingInterval = interval;
    user.subscriptionStatus = "active";

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: "Subscription activated",
    });
  } catch (err) {
    logger.error(`Paystack verify error: ${err.message}`);
    next(err);
  }
};

// ─── POST /api/billing/create-portal-session ───────────
// Opens Stripe Customer Portal (manage billing, cancel, update card)
exports.createPortalSession = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user.stripeCustomerId) {
      return next(
        new AppError("No billing account found. Please subscribe first.", 400)
      );
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/billing`,
    });
    res.status(200).json({ status: "success", data: { url: session.url } });
  } catch (err) {
    logger.error(`Stripe portal error: ${err.message}`);
    next(err);
  }
};

// ─── GET /api/billing/subscription ─────────────────────
// Returns current subscription details + usage for the billing page
exports.getSubscription = async (req, res, next) => {
  try {
    const user = req.user;
    const limits = PLANS[user.plan] || PLANS.free;

    let invoices = [];
    if (user.stripeCustomerId) {
      const inv = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 5,
      });
      invoices = inv.data.map((i) => ({
        id: i.id,
        amount: i.amount_paid / 100,
        date: new Date(i.created * 1000).toISOString(),
        status: i.status,
        pdf: i.invoice_pdf,
      }));
    }

    res.status(200).json({
      status: "success",
      data: {
        plan: user.plan,
        billingInterval: user.billingInterval,
        subscriptionStatus: user.subscriptionStatus,
        currentPeriodEnd: user.currentPeriodEnd,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        limits,
        usage: user.usage,
        invoices,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/billing/webhook ─────────────────────────
// Stripe sends events here — MUST use raw body (no JSON parsing)
exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    logger.error(`Stripe webhook signature error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      // ── Subscription created or updated ────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const planInfo = getPlanFromPriceId(sub.items.data[0]?.price?.id);
        if (!planInfo) break;

        const user = await User.findOne({ stripeCustomerId: sub.customer });
        if (!user) break;

        user.plan = planInfo.plan;
        user.billingInterval = planInfo.interval;
        user.stripeSubscriptionId = sub.id;
        user.stripePriceId = sub.items.data[0]?.price?.id;
        user.subscriptionStatus = sub.status;
        user.currentPeriodEnd = new Date(sub.current_period_end * 1000);
        user.cancelAtPeriodEnd = sub.cancel_at_period_end;
        await user.save({ validateBeforeSave: false });

        logger.info(
          `Subscription updated: ${user.email} → ${planInfo.plan} (${planInfo.interval})`
        );

        // Welcome email for new subscription
        if (event.type === "customer.subscription.created") {
          sendEmail(
            user.email,
            "subscriptionStarted",
            user.name,
            planInfo.plan,
            planInfo.interval
          ).catch(() => {});
        }
        break;
      }

      // ── Subscription deleted / canceled ────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const user = await User.findOne({ stripeCustomerId: sub.customer });
        if (!user) break;

        user.plan = "free";
        user.billingInterval = null;
        user.subscriptionStatus = "canceled";
        user.cancelAtPeriodEnd = false;
        user.stripeSubscriptionId = null;
        user.stripePriceId = null;
        await user.save({ validateBeforeSave: false });

        sendEmail(user.email, "subscriptionCanceled", user.name).catch(
          () => {}
        );
        logger.info(
          `Subscription canceled: ${user.email} → downgraded to free`
        );
        break;
      }

      // ── Payment failed ─────────────────────────────────
      case "invoice.payment_failed": {
        const inv = event.data.object;
        const user = await User.findOne({ stripeCustomerId: inv.customer });
        if (!user) break;

        user.subscriptionStatus = "past_due";
        await user.save({ validateBeforeSave: false });

        sendEmail(
          user.email,
          "paymentFailed",
          user.name,
          inv.amount_due / 100
        ).catch(() => {});
        logger.warn(
          `Payment failed: ${user.email}, amount: ${inv.amount_due / 100}`
        );
        break;
      }

      // ── Payment succeeded ──────────────────────────────
      case "invoice.payment_succeeded": {
        const inv = event.data.object;
        const user = await User.findOne({ stripeCustomerId: inv.customer });
        if (!user) break;

        if (user.subscriptionStatus === "past_due") {
          user.subscriptionStatus = "active";
          await user.save({ validateBeforeSave: false });
        }
        break;
      }

      default:
        logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  } catch (err) {
    logger.error(`Stripe webhook handler error: ${err.message}`);
  }

  res.status(200).json({ received: true });
};

// paystack
const crypto = require("crypto");

exports.handlePaystackWebhook = async (req, res) => {
  try {
    // 🔐 Verify Paystack signature (IMPORTANT)
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      console.warn("Invalid Paystack signature");
      return res.sendStatus(401);
    }

    const event = req.body;

    console.log("Paystack event ===>>>", event.event);

    const data = event.data;
    const email = data?.customer?.email;

    if (!email) return res.sendStatus(200);

    const user = await User.findOne({ email });

    if (!user) {
      console.warn("User not found:", email);
      return res.sendStatus(200);
    }

    // ─────────────────────────────────────────────
    // 🔁 HANDLE EVENTS
    // ─────────────────────────────────────────────

    switch (event.event) {
      // ✅ PAYMENT SUCCESS (initial + recurring)
      case "charge.success": {
        const planName = data?.plan?.name?.toLowerCase() || "";
        const interval = data?.plan?.interval || null;

        // map plan name → your enum
        let mappedPlan = "free";
        if (planName.includes("writer")) mappedPlan = "writer";
        else if (planName.includes("pro")) mappedPlan = "pro";
        else if (planName.includes("studio")) mappedPlan = "studio";

        user.plan = mappedPlan;
        user.billingInterval =
          interval === "annually" ? "annual" : interval || null;

        user.subscriptionStatus = "active";

        // estimate next renewal date
        if (interval === "annually") {
          user.currentPeriodEnd = new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          );
        } else if (interval === "monthly") {
          user.currentPeriodEnd = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          );
        }

        user.cancelAtPeriodEnd = false;

        sendEmail(
          user.email,
          "subscriptionStarted",
          user.name,
          mappedPlan,
          user.billingInterval
        ).catch(() => {});

        break;
      }

      // ❌ PAYMENT FAILED
      case "invoice.payment_failed": {
        user.subscriptionStatus = "past_due";
        break;
      }

      // 🔁 SUBSCRIPTION CREATED
      case "subscription.create": {
        user.subscriptionStatus = "active";
        break;
      }

      // ❌ SUBSCRIPTION DISABLED / CANCELED
      case "subscription.disable": {
        user.subscriptionStatus = "canceled";
        user.cancelAtPeriodEnd = true;
        break;
      }

      // 🔄 SUBSCRIPTION NOT RENEWED
      case "subscription.not_renew": {
        user.subscriptionStatus = "canceled";
        user.cancelAtPeriodEnd = true;
        break;
      }

      default:
        console.log("Unhandled Paystack event:", event.event);
    }

    await user.save({ validateBeforeSave: false });

    // ✅ Always return 200
    res.sendStatus(200);
  } catch (err) {
    console.error("Paystack webhook error:", err);
    res.sendStatus(200);
  }
};
