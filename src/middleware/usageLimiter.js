const AppError = require('../utils/AppError');
const { PLANS } = require('../config/plans');
const Script = require('../models/Script');

// ── Reset usage counters if a new month has started ──────
async function resetUsageIfNeeded(user) {
  const now = new Date();
  const resetAt = user.usage?.usageResetAt ? new Date(user.usage.usageResetAt) : new Date(0);
  const sameMonth =
    now.getFullYear() === resetAt.getFullYear() &&
    now.getMonth()    === resetAt.getMonth();

  if (!sameMonth) {
    user.usage.aiRequests       = 0;
    user.usage.storyboards      = 0;
    user.usage.voiceReadthroughs = 0;
    user.usage.usageResetAt     = now;
    await user.save({ validateBeforeSave: false });
  }
}

// ── Check script count limit ─────────────────────────────
exports.checkScriptLimit = async (req, res, next) => {
  try {
    const limits = PLANS[req.user.plan] || PLANS.free;
    if (limits.scripts === Infinity) return next();

    const count = await Script.countDocuments({ userId: req.user._id, isArchived: false });
    if (count >= limits.scripts) {
      return next(new AppError(
        `Your ${limits.label} plan allows up to ${limits.scripts} script${limits.scripts !== 1 ? 's' : ''}. Upgrade to create more.`,
        403
      ));
    }
    next();
  } catch (err) { next(err); }
};

// ── Check AI request limit ───────────────────────────────
exports.checkAILimit = async (req, res, next) => {
  try {
    await resetUsageIfNeeded(req.user);
    const limits = PLANS[req.user.plan] || PLANS.free;
    if (req.user.usage.aiRequests >= limits.aiRequests) {
      return next(new AppError(
        `You've used all ${limits.aiRequests} AI requests for this month. Upgrade for more.`,
        403
      ));
    }
    // Increment counter
    req.user.usage.aiRequests += 1;
    await req.user.save({ validateBeforeSave: false });
    next();
  } catch (err) { next(err); }
};

// ── Check storyboard limit ───────────────────────────────
exports.checkStoryboardLimit = async (req, res, next) => {
  try {
    await resetUsageIfNeeded(req.user);
    const limits = PLANS[req.user.plan] || PLANS.free;
    if (limits.storyboards !== Infinity && req.user.usage.storyboards >= limits.storyboards) {
      return next(new AppError(
        `You've used all ${limits.storyboards} storyboard generation${limits.storyboards !== 1 ? 's' : ''} for this month. Upgrade for more.`,
        403
      ));
    }
    req.user.usage.storyboards += 1;
    await req.user.save({ validateBeforeSave: false });
    next();
  } catch (err) { next(err); }
};

// ── Check voice readthrough limit ───────────────────────
exports.checkVoiceLimit = async (req, res, next) => {
  try {
    await resetUsageIfNeeded(req.user);
    const limits = PLANS[req.user.plan] || PLANS.free;
    if (limits.voiceReadthroughs === 0) {
      return next(new AppError(
        `Voice readthrough is not available on the ${limits.label} plan. Upgrade to Writer or above.`,
        403
      ));
    }
    if (limits.voiceReadthroughs !== Infinity && req.user.usage.voiceReadthroughs >= limits.voiceReadthroughs) {
      return next(new AppError(
        `You've used all ${limits.voiceReadthroughs} voice readthrough${limits.voiceReadthroughs !== 1 ? 's' : ''} for this month. Upgrade for more.`,
        403
      ));
    }
    req.user.usage.voiceReadthroughs += 1;
    await req.user.save({ validateBeforeSave: false });
    next();
  } catch (err) { next(err); }
};

// ── Attach plan limits to every authenticated request ────
// Adds req.planLimits so controllers can check features without importing plans.js
exports.attachPlanLimits = (req, res, next) => {
  req.planLimits = PLANS[req.user?.plan] || PLANS.free;
  next();
};
