const { verifyToken } = require("../utils/token");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

/**
 * Protect — verifies the JWT httpOnly cookie and attaches req.user.
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from httpOnly cookie
    const token = req.cookies?.fadein_token;

    console.log("token from protect ===>>> ", token);

    if (!token || token === "logged_out") {
      return next(
        new AppError("You are not logged in. Please sign in to continue.", 401)
      );
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(
          new AppError("Your session has expired. Please sign in again.", 401)
        );
      }
      return next(new AppError("Invalid session. Please sign in again.", 401));
    }

    // 3. Check user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(
        new AppError(
          "The account associated with this session no longer exists.",
          401
        )
      );
    }

    // 4. Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          "Your password was recently changed. Please sign in again.",
          401
        )
      );
    }

    // 5. Attach user to request
    req.user = user;
    next();
  } catch (err) {
    logger.error(`Auth middleware error: ${err.message}`);
    next(new AppError("Authentication failed. Please sign in again.", 401));
  }
};

/**
 * Restrict to certain roles (e.g. 'pro', 'admin').
 */
const restrictTo = (...plans) => {
  return (req, res, next) => {
    if (!plans.includes(req.user.plan)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
    next();
  };
};

module.exports = { protect, restrictTo };
