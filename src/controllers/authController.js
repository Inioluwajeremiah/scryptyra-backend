const crypto = require("crypto");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { signAndSetCookie, clearCookie } = require("../utils/token");
const { sendEmail } = require("../services/emailService");
const logger = require("../utils/logger");

// ── Helper ───────────────────────────────────────────────
const getIP = (req) =>
  req.ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "Unknown";

// ── Controllers ──────────────────────────────────────────

/**
 * POST /api/auth/signup
 */
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check existing user
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return next(
        new AppError("An account with this email already exists.", 409)
      );
    }

    // Create user
    const user = await User.create({ name, email, password });

    // Generate email verification token
    const verificationToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Set JWT cookie
    signAndSetCookie(res, user._id);

    // Send welcome + verification email (non-blocking)
    sendEmail(user.email, "welcome", user.name).catch(() => {});
    sendEmail(
      user.email,
      "emailVerification",
      user.name,
      verificationToken
    ).catch(() => {});

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      status: "success",
      message:
        "Account created. Please check your email to verify your address.",
      data: { user: user.toSafeObject() },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password field included
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError("Incorrect email or password.", 401));
    }

    // Set JWT cookie
    signAndSetCookie(res, user._id);

    // Send login alert email (non-blocking)
    // sendEmail(
    //   user.email,
    //   "loginAlert",
    //   user.name,
    //   getIP(req),
    //   req.headers["user-agent"]
    // ).catch(() => {});

    logger.info(`User logged in: ${user.email} from ${getIP(req)}`);

    res.status(200).json({
      status: "success",
      data: { user: user.toSafeObject() },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
exports.logout = (req, res) => {
  clearCookie(res);
  res
    .status(200)
    .json({ status: "success", message: "Logged out successfully." });
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user.
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError("User not found.", 404));

    res.status(200).json({
      status: "success",
      data: { user: user.toSafeObject() },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/auth/update-profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    // Disallow password change here — use dedicated endpoint
    if (req.body.password) {
      return next(
        new AppError(
          "This route is not for password updates. Use /change-password.",
          400
        )
      );
    }

    const allowed = ["name"];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field]) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: { user: user.toSafeObject() },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/auth/change-password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError("Current password is incorrect.", 401));
    }

    user.password = newPassword;
    await user.save();

    // Rotate cookie with new token
    signAndSetCookie(res, user._id);

    // Notify by email
    sendEmail(user.email, "passwordChanged", user.name).catch(() => {});

    logger.info(`Password changed for: ${user.email}`);

    res.status(200).json({
      status: "success",
      message: "Password updated successfully.",
      data: { user: user.toSafeObject() },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });

    // Always respond success to prevent email enumeration
    const successResponse = () =>
      res.status(200).json({
        status: "success",
        message:
          "If an account exists for this email, a reset link has been sent.",
      });

    if (!user) return successResponse();

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    sendEmail(user.email, "passwordResetRequest", user.name, resetToken).catch(
      () => {}
    );

    logger.info(`Password reset requested for: ${user.email}`);
    successResponse();
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/auth/reset-password/:token
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError("Reset token is invalid or has expired.", 400));
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Auto login after reset
    signAndSetCookie(res, user._id);

    sendEmail(user.email, "passwordChanged", user.name).catch(() => {});

    logger.info(`Password reset completed for: ${user.email}`);

    res.status(200).json({
      status: "success",
      message: "Password reset successfully.",
      data: { user: user.toSafeObject() },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/verify-email/:token
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new AppError("Verification link is invalid or has expired.", 400)
      );
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    logger.info(`Email verified for: ${user.email}`);

    res.status(200).json({
      status: "success",
      message: "Email verified successfully.",
      data: { user: user.toSafeObject() },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/auth/delete-account
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+password");

    // Require password confirmation before deletion
    if (!(await user.comparePassword(req.body.password))) {
      return next(
        new AppError("Incorrect password. Account deletion cancelled.", 401)
      );
    }

    // Soft delete
    await User.findByIdAndUpdate(req.user._id, { isActive: false });

    clearCookie(res);

    sendEmail(user.email, "accountDeleted", user.name).catch(() => {});

    logger.info(`Account deleted: ${user.email}`);

    res
      .status(200)
      .json({ status: "success", message: "Account deleted successfully." });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/resend-verification
 * Protected — generates a fresh token and resends the verification email.
 */
exports.resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError("User not found.", 404));

    if (user.isEmailVerified) {
      return res.status(200).json({
        status: "success",
        message: "Your email is already verified.",
      });
    }

    // Prevent spam: block if a fresh token was issued less than 1 min ago
    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires > Date.now() + 23.98 * 60 * 60 * 1000
    ) {
      return next(
        new AppError(
          "A verification email was sent very recently. Please wait a moment before trying again.",
          429
        )
      );
    }

    const verificationToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    sendEmail(
      user.email,
      "emailVerification",
      user.name,
      verificationToken
    ).catch(() => {});

    logger.info(`Verification email resent to: ${user.email}`);

    res.status(200).json({
      status: "success",
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (err) {
    next(err);
  }
};
