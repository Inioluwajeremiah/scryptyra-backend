require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const logger = require("./utils/logger");
const { verifyEmailConnection } = require("./services/emailService");

const PORT = process.env.PORT || 5000;

// ── Graceful shutdown handler ────────────────────────────
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully…`);
  server.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });
  // Force close after 10s
  setTimeout(() => {
    process.exit(1);
  }, 10000);
};

// ── Start ────────────────────────────────────────────────
let server;

(async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Verify email transporter
    await verifyEmailConnection();

    // Start HTTP server
    server = app.listen(PORT, () => {
      logger.info(`
      ╔═══════════════════════════════════════════╗
      ║          Scryptyra — API Server             ║
      ╠═══════════════════════════════════════════╣
      ║  Port    : ${String(PORT).padEnd(31)}║
      ║  Env     : ${(process.env.NODE_ENV || "development").padEnd(31)}║
      ║  DB      : MongoDB connected              ║
      ╚═══════════════════════════════════════════╝
            `);
    });

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      logger.error(`Unhandled Rejection: ${err.name} — ${err.message}`);
      gracefulShutdown("unhandledRejection");
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
})();
