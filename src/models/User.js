const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String, required: [true, 'Name is required'],
      trim: true, minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String, required: [true, 'Email is required'],
      unique: true, lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String, required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: function () {
        return this.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      },
    },

    // ── Plan / Billing ──────────────────────────────────────
    plan: {
      type: String,
      enum: ['free', 'writer', 'pro', 'studio'],
      default: 'free',
    },
    billingInterval: {
      type: String,
      enum: ['monthly', 'annual', null],
      default: null,
    },
    stripeCustomerId:     { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    stripePriceId:        { type: String, default: null },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled', 'incomplete', null],
      default: null,
    },
    currentPeriodEnd: { type: Date, default: null },   // subscription renewal date
    cancelAtPeriodEnd: { type: Boolean, default: false },

    // ── Usage counters (reset monthly by cron / Stripe webhook) ──
    usage: {
      aiRequests:    { type: Number, default: 0 },
      storyboards:   { type: Number, default: 0 },
      voiceReadthroughs: { type: Number, default: 0 },
      usageResetAt:  { type: Date, default: () => new Date() },
    },

    // ── Auth ────────────────────────────────────────────────
    isEmailVerified:         { type: Boolean, default: false },
    emailVerificationToken:  String,
    emailVerificationExpires: Date,
    passwordResetToken:       String,
    passwordResetExpires:     Date,
    passwordChangedAt:        Date,
    isActive:                 { type: Boolean, default: true, select: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ stripeCustomerId: 1 });

// ── Pre-save: hash password ──────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// ── Pre-find: exclude inactive accounts ─────────────────
userSchema.pre(/^find/, function (next) {
  this.find({ isActive: { $ne: false } });
  next();
});

// ── Instance methods ─────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.changedPasswordAfter = function (jwtIat) {
  if (this.passwordChangedAt) {
    return jwtIat < parseInt(this.passwordChangedAt.getTime() / 1000, 10);
  }
  return false;
};

userSchema.methods.createEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken  = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken  = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return token;
};

userSchema.methods.toSafeObject = function () {
  return {
    id:               this._id,
    name:             this.name,
    email:            this.email,
    avatar:           this.avatar,
    plan:             this.plan,
    billingInterval:  this.billingInterval,
    subscriptionStatus: this.subscriptionStatus,
    currentPeriodEnd: this.currentPeriodEnd,
    cancelAtPeriodEnd: this.cancelAtPeriodEnd,
    isEmailVerified:  this.isEmailVerified,
    joinedAt:         this.createdAt,
    usage:            this.usage,
  };
};

module.exports = mongoose.model('User', userSchema);
