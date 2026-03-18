const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");

const { apiLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const scriptRoutes = require("./routes/scriptRoutes");
const billingRoutes = require("./routes/billingRoutes");
const AppError = require("./utils/AppError");
const logger = require("./utils/logger");

const app = express();

app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// app.use(cors({
//   origin: process.env.CLIENT_URL || 'http://localhost:3000',
//   credentials: true,
//   methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:3004",
    ],
    credentials: true, // required for cookies
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Stripe webhook needs raw body — mount BEFORE express.json ──
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  require("./controllers/billingController").handleWebhook
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());
app.use(mongoSanitize());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } })
  );
}

app.use("/api", apiLimiter);

app.get("/", (req, res) => {
  res.send("Server is live 🚀");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/scripts", scriptRoutes);
app.use("/api/billing", billingRoutes);

app.all("*", (req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found.`, 404));
});

app.use(errorHandler);

module.exports = app;
