/**
 * POST /api/auth/resend-verification
 * Protected — user must be logged in but not yet verified.
 * Generates a fresh token and sends a new verification email.
 */
exports.resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) return next(new AppError('User not found.', 404));

    if (user.isEmailVerified) {
      return res.status(200).json({
        status: 'success',
        message: 'Your email is already verified.',
      });
    }

    // Rate-limit: don't resend if a non-expired token still exists
    if (
      user.emailVerificationToken &&
      user.emailVerificationExpires &&
      user.emailVerificationExpires > Date.now() + 23 * 60 * 60 * 1000 // sent less than 1 hour ago
    ) {
      return next(new AppError('A verification email was sent recently. Please wait before requesting another.', 429));
    }

    const verificationToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    sendEmail(user.email, 'emailVerification', user.name, verificationToken).catch(() => {});

    logger.info(`Verification email resent to: ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (err) {
    next(err);
  }
};
