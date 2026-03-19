const jwt = require("jsonwebtoken");

/**
 * Sign a JWT and set it as an httpOnly cookie on the response.
 */
const signAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  const cookieOptions = {
    httpOnly: true, // JS cannot read this cookie
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge:
      Number(process.env.JWT_COOKIE_EXPIRES_DAYS || 7) * 24 * 60 * 60 * 1000,
    path: "/",
  };

  res.cookie("fadein_token", token, cookieOptions);
  return token;
};

/**
 * Clear the auth cookie on logout.
 */
const clearCookie = (res) => {
  res.cookie("fadein_token", "logged_out", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    expires: new Date(Date.now() + 5000), // expire in 5s
    path: "/",
  });
};

/**
 * Verify a JWT token string.
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { signAndSetCookie, clearCookie, verifyToken };
