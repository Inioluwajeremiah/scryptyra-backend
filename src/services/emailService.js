const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

// ─── Transporter ─────────────────────────────────────────
let _transporter;
function getTransporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    pool: true, maxConnections: 5, maxMessages: 100,
  });
  return _transporter;
}

// ─── Shared SVG assets ────────────────────────────────────
const ICON_SCRIPT = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="1" width="12" height="16" rx="2" stroke="white" stroke-width="1.5"/><line x1="5" y1="5.5" x2="11" y2="5.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/><line x1="5" y1="8.5" x2="9" y2="8.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/><line x1="5" y1="11.5" x2="10" y2="11.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`;

// ─── Base HTML wrapper ────────────────────────────────────
function htmlWrapper(heroLabel, heroTitle, heroSub, content, preheader = "") {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>SCRYPTYRA</title>
${preheader ? `<span style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</span>` : ""}
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#EDEBE8;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}
a{color:#ff6b35;text-decoration:none}

/* ── Shell ── */
.shell{max-width:600px;margin:0 auto;padding:40px 16px 56px}

/* ── Topbar ── */
.topbar{display:flex;align-items:center;justify-content:space-between;padding:0 4px;margin-bottom:20px}
.t-logo{display:flex;align-items:center;gap:9px}
.t-logomark{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#ff6b35,#d94f1e);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(255,107,53,.35)}
.t-wordmark{font-size:15px;font-weight:900;letter-spacing:3px;color:#1a1a1a;text-transform:uppercase}
.t-wordmark b{color:#ff6b35;font-weight:900}
.t-badge{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#ff6b35;background:rgba(255,107,53,.08);border:1px solid rgba(255,107,53,.2);border-radius:20px;padding:4px 11px}

/* ── Hero ── */
.hero{border-radius:16px 16px 0 0;background:linear-gradient(135deg,#0d0d12 0%,#13131d 40%,#1a1020 100%);padding:40px 44px 38px;position:relative;overflow:hidden}
.hero-glow-1{position:absolute;top:-80px;right:-60px;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(255,107,53,.20) 0%,transparent 65%);pointer-events:none}
.hero-glow-2{position:absolute;bottom:-60px;left:-40px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(255,107,53,.10) 0%,transparent 65%);pointer-events:none}
.hero-glow-3{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:400px;height:200px;background:radial-gradient(ellipse,rgba(255,107,53,.06) 0%,transparent 70%);pointer-events:none}
.hero-grid{position:absolute;inset:0;opacity:.04;background-image:linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px);background-size:32px 32px}
.hero-tag{position:relative;z-index:2;display:inline-flex;align-items:center;gap:7px;background:rgba(255,107,53,.12);border:1px solid rgba(255,107,53,.25);border-radius:30px;padding:5px 13px;margin-bottom:20px}
.hero-dot{width:6px;height:6px;border-radius:50%;background:#ff6b35;box-shadow:0 0 6px #ff6b35}
.hero-dot-pulse{animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.hero-tag-text{font-size:11px;font-weight:700;color:#ff6b35;letter-spacing:1.5px;text-transform:uppercase}
.hero-h{position:relative;z-index:2;font-size:32px;font-weight:900;color:#fff;line-height:1.18;margin-bottom:12px;letter-spacing:-.5px}
.hero-h em{font-style:normal;background:linear-gradient(90deg,#ff6b35 0%,#ffaa80 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero-p{position:relative;z-index:2;font-size:14px;color:rgba(255,255,255,.45);line-height:1.7;max-width:380px}
.hero-sep{position:relative;z-index:2;height:1px;background:linear-gradient(to right,rgba(255,107,53,.3),rgba(255,107,53,.05),transparent);margin-top:28px}

/* ── Film strip ── */
.filmstrip{position:absolute;bottom:0;right:0;display:flex;gap:0;z-index:2;opacity:.15}
.filmstrip-frame{width:22px;height:16px;border:1.5px solid #ff6b35;border-radius:1px;margin-right:3px}

/* ── Card ── */
.card{background:#fff;border:1px solid #ddd;border-top:none;padding:40px 44px 36px}

/* ── Footer ── */
.footer{background:#f7f5f2;border:1px solid #ddd;border-top:none;border-radius:0 0 16px 16px;padding:22px 44px 26px}
.footer-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #e8e5e1}
.f-wordmark{font-size:12px;font-weight:900;letter-spacing:2.5px;color:#ccc;text-transform:uppercase}
.f-wordmark b{color:rgba(255,107,53,.5)}
.f-links{display:flex;gap:14px}
.f-links a{font-size:11px;color:#bbb;text-decoration:none}
.f-meta{font-size:11px;color:#bbb;line-height:1.7}

/* ── Typography ── */
.eyebrow{font-size:10px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#ff6b35;margin-bottom:14px}
h2{font-size:24px;font-weight:800;color:#111;line-height:1.25;margin-bottom:10px;letter-spacing:-.3px}
h2 em{font-style:normal;color:#ff6b35}
.lead{font-size:15px;color:#555;line-height:1.75;margin-bottom:16px}
.body-text{font-size:14px;color:#666;line-height:1.75;margin-bottom:14px}
.divider{height:1px;background:#f0ece8;margin:26px 0}

/* ── Buttons ── */
.btn-row{margin:30px 0 22px}
.btn{display:inline-block;padding:14px 30px;background:linear-gradient(135deg,#ff6b35 0%,#d94f1e 100%);color:#fff !important;font-weight:700;font-size:14px;letter-spacing:.2px;border-radius:10px;box-shadow:0 6px 20px rgba(255,107,53,.35);text-decoration:none !important}
.btn-ghost{display:inline-block;padding:12px 26px;background:transparent;color:#ff6b35 !important;font-weight:600;font-size:13px;border:2px solid #ff6b35;border-radius:10px;text-decoration:none !important}

/* ── Feature list ── */
.feat-list{list-style:none;margin:16px 0 20px}
.feat-list li{display:flex;align-items:flex-start;gap:13px;padding:11px 0;border-bottom:1px solid #f5f2ef}
.feat-list li:last-child{border-bottom:none}
.feat-icon{width:26px;height:26px;min-width:26px;border-radius:7px;background:linear-gradient(135deg,#ff6b35,#d94f1e);display:flex;align-items:center;justify-content:center;font-size:12px;margin-top:1px;box-shadow:0 3px 8px rgba(255,107,53,.25)}
.feat-text{font-size:14px;color:#555;line-height:1.55}
.feat-text strong{color:#1a1a1a;font-weight:700}

/* ── Info card ── */
.info-card{background:#faf9f7;border:1px solid #e8e5e1;border-radius:12px;overflow:hidden;margin:20px 0}
.info-row{display:flex;padding:12px 18px;border-bottom:1px solid #f0ece8;font-size:13px}
.info-row:last-child{border-bottom:none}
.info-key{width:100px;min-width:100px;color:#aaa;font-weight:600;font-size:12px;letter-spacing:.3px}
.info-val{color:#555;word-break:break-all;font-size:13px}

/* ── Alert boxes ── */
.alert{border-radius:10px;padding:15px 18px;margin:20px 0;font-size:13px;line-height:1.65;display:flex;align-items:flex-start;gap:13px}
.alert-icon{font-size:18px;line-height:1;flex-shrink:0;margin-top:2px}
.alert-body{flex:1}
.alert-body strong{display:block;font-weight:700;margin-bottom:3px;font-size:13px}
.alert-warn{background:#fff8f5;border:1px solid #ffd4b8}
.alert-warn .alert-body strong{color:#bf4a0a}
.alert-warn .alert-body{color:#8a3a10}
.alert-danger{background:#fff5f5;border:1px solid #ffbbbb}
.alert-danger .alert-body strong{color:#c0180a}
.alert-danger .alert-body{color:#7a1a1a}
.alert-ok{background:#f2fff6;border:1px solid #aadfb8}
.alert-ok .alert-body strong{color:#1a7a3a}
.alert-ok .alert-body{color:#2a5a3a}

/* ── Script card ── */
.script-card{background:linear-gradient(135deg,#0d0d12 0%,#1a1020 100%);border-radius:14px;padding:28px 30px;margin:22px 0;position:relative;overflow:hidden}
.sc-top-border{position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#ff6b35,#ffaa80,#ff6b35);background-size:200% auto;animation:shimmer 3s linear infinite}
@keyframes shimmer{0%{background-position:0% center}100%{background-position:200% center}}
.sc-glow{position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,rgba(255,107,53,.15) 0%,transparent 70%);pointer-events:none}
.sc-eyebrow{position:relative;z-index:1;font-size:9px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:rgba(255,107,53,.6);margin-bottom:12px}
.sc-title{position:relative;z-index:1;font-family:'Courier New',monospace;font-size:18px;font-style:italic;font-weight:700;color:#fff;line-height:1.4}
.sc-meta{position:relative;z-index:1;margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.07);font-size:11px;color:rgba(255,255,255,.3);letter-spacing:.5px}
.sc-meta span{color:rgba(255,107,53,.5);margin:0 4px}

/* ── Stat pills ── */
.stat-row{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}
.stat-pill{background:#faf9f7;border:1px solid #e8e5e1;border-radius:20px;padding:6px 14px;font-size:12px;color:#888;font-weight:500}
.stat-pill strong{color:#ff6b35;font-weight:700}

/* ── Note / small ── */
.note{font-size:12px;color:#aaa;line-height:1.7;margin-top:18px}
.note a{color:#ff6b35;text-decoration:none}
.url-box{background:#faf9f7;border:1px solid #e8e5e1;border-radius:8px;padding:11px 16px;margin-top:12px;font-family:'Courier New',monospace;font-size:11px;color:#bbb;word-break:break-all;line-height:1.6}

/* ── Countdown strip ── */
.countdown{background:linear-gradient(135deg,rgba(255,107,53,.06),rgba(255,107,53,.03));border:1px solid rgba(255,107,53,.15);border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:14px;margin:20px 0}
.countdown-num{font-size:28px;font-weight:900;color:#ff6b35;line-height:1;font-variant-numeric:tabular-nums}
.countdown-label{font-size:12px;color:#888;line-height:1.5}
.countdown-label strong{display:block;color:#444;font-size:13px;margin-bottom:2px}
</style>
</head>
<body>
<div class="shell">

  <!-- Top bar -->
  <div class="topbar">
    <div class="t-logo">
      <div class="t-logomark">${ICON_SCRIPT}</div>
      <div class="t-wordmark">SCRY<b>PTY</b>RA</div>
    </div>
    <div class="t-badge">Screenplay Editor</div>
  </div>

  <!-- Hero banner -->
  <div class="hero">
    <div class="hero-glow-1"></div>
    <div class="hero-glow-2"></div>
    <div class="hero-glow-3"></div>
    <div class="hero-grid"></div>
    <div class="filmstrip">
      <div class="filmstrip-frame"></div>
      <div class="filmstrip-frame"></div>
      <div class="filmstrip-frame"></div>
      <div class="filmstrip-frame"></div>
    </div>
    <div class="hero-tag">
      <div class="hero-dot hero-dot-pulse"></div>
      <span class="hero-tag-text">${heroLabel}</span>
    </div>
    <div class="hero-h">${heroTitle}</div>
    <div class="hero-p">${heroSub}</div>
    <div class="hero-sep"></div>
  </div>

  <!-- Content -->
  <div class="card">${content}</div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-top">
      <div class="f-wordmark">SCRY<b>PTY</b>RA</div>
      <div class="f-links">
        <a href="${process.env.APP_URL}/settings">Settings</a>
        <a href="${process.env.APP_URL}/privacy">Privacy</a>
        <a href="${process.env.APP_URL}/unsubscribe">Unsubscribe</a>
      </div>
    </div>
    <p class="f-meta">© ${year} SCRYPTYRA. All rights reserved. You're receiving this because you have an account at scryptyra.app</p>
  </div>

</div>
</body>
</html>`;
}

// ─── Templates ────────────────────────────────────────────
const templates = {

  welcome: (name) => ({
    subject: `Welcome to SCRYPTYRA, ${name} — Your story starts now ✦`,
    html: htmlWrapper(
      "✦ You're in",
      `Welcome, <em>${name}.</em>`,
      "Your account is live. The blank page is waiting — and now you have everything to fill it.",
      `
      <div class="eyebrow">Account Ready</div>
      <h2>Everything you need to <em>write.</em></h2>
      <p class="lead">You now have access to professional screenplay formatting, AI-powered story assistance, and tools built for serious writers.</p>
      <ul class="feat-list">
        <li>
          <div class="feat-icon">✦</div>
          <div class="feat-text"><strong>AI Script Consultant</strong> — Scene ideas, sharp dialogue, plot twists, character arcs — on demand.</div>
        </li>
        <li>
          <div class="feat-icon">⇅</div>
          <div class="feat-text"><strong>Industry Formatting</strong> — WGA-standard scene headings, action, dialogue, transitions. Automatic.</div>
        </li>
        <li>
          <div class="feat-icon">↩</div>
          <div class="feat-text"><strong>Full Undo History</strong> — 100 steps. Ctrl+Z / Ctrl+Y. Write without fear.</div>
        </li>
        <li>
          <div class="feat-icon">🎭</div>
          <div class="feat-text"><strong>Character Intelligence</strong> — Auto-detects every character. Tracks dialogue counts. One click to insert.</div>
        </li>
        <li>
          <div class="feat-icon">⎙</div>
          <div class="feat-text"><strong>PDF Export</strong> — Print-ready output with proper margins. Submission-ready instantly.</div>
        </li>
      </ul>
      <div class="btn-row">
        <a href="${process.env.APP_URL}/dashboard" class="btn">Open My Dashboard →</a>
      </div>
      <div class="divider"></div>
      <p class="note">Questions, feedback, or ideas? Reply directly to this email — we read every message.</p>
      `,
      `Welcome to SCRYPTYRA, ${name}. Your account is ready.`
    ),
    text: `Welcome to SCRYPTYRA, ${name}! Your account is ready. Dashboard: ${process.env.APP_URL}/dashboard`,
  }),

  emailVerification: (name, verificationToken) => ({
    subject: "Verify your SCRYPTYRA email — one tap to unlock everything",
    html: htmlWrapper(
      "Step 1 of 1",
      `Verify your <em>email.</em>`,
      "Almost there — one quick tap and you're fully set up.",
      `
      <div class="eyebrow">Email Verification</div>
      <h2>You're almost <em>in.</em></h2>
      <p class="lead">Hi ${name}, thanks for joining SCRYPTYRA. Tap the button below to verify your email address and unlock all features.</p>
      <div class="btn-row">
        <a href="${process.env.APP_URL}/verify-email?token=${verificationToken}" class="btn">Verify My Email →</a>
      </div>
      <div class="countdown">
        <div class="countdown-num">24</div>
        <div class="countdown-label">
          <strong>Hours remaining</strong>
          This link expires in 24 hours. After that, sign in to request a new one.
        </div>
      </div>
      <p class="note">Didn't create a SCRYPTYRA account? You can safely ignore this email — nothing will change.</p>
      `,
      "One tap to verify and unlock SCRYPTYRA."
    ),
    text: `Hi ${name}, verify your SCRYPTYRA email: ${process.env.APP_URL}/verify-email?token=${verificationToken} (expires in 24 hours)`,
  }),

  loginAlert: (name, ipAddress, userAgent) => ({
    subject: "New sign-in to your SCRYPTYRA account",
    html: htmlWrapper(
      "Security Notice",
      `New sign-in <em>detected.</em>`,
      "A new session was opened on your account. Review the details below.",
      `
      <div class="eyebrow">Account Activity</div>
      <h2>Was this <em>you?</em></h2>
      <p class="lead">Hi ${name}, a new sign-in to your SCRYPTYRA account was just recorded.</p>
      <div class="info-card">
        <div class="info-row">
          <span class="info-key">Time</span>
          <span class="info-val">${new Date().toUTCString()}</span>
        </div>
        <div class="info-row">
          <span class="info-key">IP Address</span>
          <span class="info-val">${ipAddress || "Unknown"}</span>
        </div>
        <div class="info-row">
          <span class="info-key">Device</span>
          <span class="info-val">${userAgent ? userAgent.slice(0, 90) : "Unknown"}</span>
        </div>
      </div>
      <div class="alert alert-ok">
        <div class="alert-icon">✓</div>
        <div class="alert-body">
          <strong>This was you?</strong>
          No action needed — you're all set.
        </div>
      </div>
      <div class="alert alert-danger">
        <div class="alert-icon">🚨</div>
        <div class="alert-body">
          <strong>Wasn't you?</strong>
          Your password may be compromised. Secure your account immediately.
        </div>
      </div>
      <div class="btn-row">
        <a href="${process.env.APP_URL}/login" class="btn">Secure My Account →</a>
      </div>
      `,
      `New sign-in to your account from ${ipAddress || "unknown IP"}.`
    ),
    text: `New sign-in to SCRYPTYRA at ${new Date().toUTCString()} from IP ${ipAddress || "Unknown"}. Not you? Reset your password: ${process.env.APP_URL}/login`,
  }),

  passwordChanged: (name) => ({
    subject: "Your SCRYPTYRA password was changed",
    html: htmlWrapper(
      "Account Update",
      `Password <em>updated.</em>`,
      "Your account password was successfully changed.",
      `
      <div class="eyebrow">Security Update</div>
      <h2>Password <em>updated.</em></h2>
      <p class="lead">Hi ${name}, your SCRYPTYRA account password was just changed successfully.</p>
      <div class="alert alert-ok">
        <div class="alert-icon">✓</div>
        <div class="alert-body">
          <strong>Change confirmed.</strong>
          If you made this change, your scripts and data are safe and untouched.
        </div>
      </div>
      <div class="alert alert-danger">
        <div class="alert-icon">🚨</div>
        <div class="alert-body">
          <strong>Didn't change your password?</strong>
          Act immediately — reply to this email or reset your password now.
        </div>
      </div>
      <div class="btn-row">
        <a href="${process.env.APP_URL}/login" class="btn">Sign In →</a>
      </div>
      `,
      "Your SCRYPTYRA password was just changed."
    ),
    text: `Hi ${name}, your SCRYPTYRA password was changed. Wasn't you? Contact us immediately.`,
  }),

  passwordResetRequest: (name, resetToken) => ({
    subject: "Reset your SCRYPTYRA password — link expires in 10 minutes",
    html: htmlWrapper(
      "Password Reset",
      `Forgot your <em>password?</em>`,
      "No worries — it happens. Click below to set a new one.",
      `
      <div class="eyebrow">Password Reset</div>
      <h2>Let's get you <em>back in.</em></h2>
      <p class="lead">Hi ${name}, we received a request to reset the password for your SCRYPTYRA account.</p>
      <div class="countdown">
        <div class="countdown-num">10</div>
        <div class="countdown-label">
          <strong>Minutes to act</strong>
          This reset link expires in 10 minutes for your security.
        </div>
      </div>
      <div class="btn-row">
        <a href="${process.env.APP_URL}/reset-password?token=${resetToken}" class="btn">Reset My Password →</a>
      </div>
      <div class="divider"></div>
      <p class="note">Didn't request a reset? You can safely ignore this email — your password won't change.</p>
      <p class="note" style="margin-top:10px;">Button not working? Copy this link into your browser:</p>
      <div class="url-box">${process.env.APP_URL}/reset-password?token=${resetToken}</div>
      `,
      "Reset your SCRYPTYRA password — link expires in 10 minutes."
    ),
    text: `Hi ${name}, reset your SCRYPTYRA password: ${process.env.APP_URL}/reset-password?token=${resetToken} (expires in 10 minutes)`,
  }),

  scriptShared: (recipientName, senderName, scriptTitle, shareUrl) => ({
    subject: `${senderName} shared a screenplay with you — "${scriptTitle}"`,
    html: htmlWrapper(
      "Shared With You",
      `You've got <em>a script.</em>`,
      `${senderName} thinks you should read this.`,
      `
      <div class="eyebrow">New Screenplay</div>
      <h2><em>"${scriptTitle}"</em></h2>
      <p class="lead">Hi ${recipientName}, <strong style="color:#ff6b35">${senderName}</strong> has shared their screenplay with you on SCRYPTYRA.</p>
      <div class="script-card">
        <div class="sc-top-border"></div>
        <div class="sc-glow"></div>
        <div class="sc-eyebrow">Screenplay</div>
        <div class="sc-title">"${scriptTitle}"</div>
        <div class="sc-meta">Shared by ${senderName}<span>·</span>SCRYPTYRA<span>·</span>${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
      </div>
      <div class="btn-row">
        <a href="${shareUrl}" class="btn">Read the Script →</a>
      </div>
      <p class="note">You need a SCRYPTYRA account to view this script. <a href="${process.env.APP_URL}/signup">Create one free →</a></p>
      `,
      `${senderName} shared "${scriptTitle}" with you.`
    ),
    text: `${senderName} shared "${scriptTitle}" with you on SCRYPTYRA. View it at: ${shareUrl}`,
  }),


  subscriptionStarted: (name, plan, interval) => ({
    subject: `Welcome to Scryptyra ${plan.charAt(0).toUpperCase()+plan.slice(1)} — You're all set`,
    html: htmlWrapper(
      "Subscription Active",
      `You're on ${plan.charAt(0).toUpperCase()+plan.slice(1)}.`,
      "Your subscription is live. All features unlocked.",
      `
      <div class="eyebrow">Subscription Confirmed</div>
      <h2>Welcome to <em>${plan.charAt(0).toUpperCase()+plan.slice(1)},</em> ${name}.</h2>
      <p class="lead">Your ${plan.charAt(0).toUpperCase()+plan.slice(1)} plan is now active.</p>
      <div class="info-card">
        <div class="info-row"><span class="info-key">Plan</span><span class="info-val">${plan.charAt(0).toUpperCase()+plan.slice(1)}</span></div>
        <div class="info-row"><span class="info-key">Billing</span><span class="info-val">${interval === "annual" ? "Annual (billed once a year)" : "Monthly"}</span></div>
      </div>
      <div class="btn-row"><a href="${process.env.APP_URL}/dashboard" class="btn">Start Writing</a></div>
      <p class="note">Manage your subscription at <a href="${process.env.APP_URL}/billing">scryptyra.app/billing</a></p>
      `,
      `Your Scryptyra ${plan} plan is now active.`
    ),
    text: `Your Scryptyra ${plan} plan is now active. Start writing: ${process.env.APP_URL}/dashboard`,
  }),

  subscriptionCanceled: (name) => ({
    subject: "Your Scryptyra subscription has been canceled",
    html: htmlWrapper(
      "Subscription Canceled",
      "Subscription canceled.",
      "You have been moved to the free plan.",
      `
      <div class="eyebrow">Account Update</div>
      <h2>Subscription <em>canceled.</em></h2>
      <p class="lead">Hi ${name}, your Scryptyra subscription has ended and your account has been moved to the Free plan.</p>
      <p class="body-text">You can still access up to 3 scripts. Your existing scripts are safe.</p>
      <div class="btn-row"><a href="${process.env.APP_URL}/pricing" class="btn">Resubscribe</a></div>
      <p class="note">Changed your mind? Resubscribe anytime — your data is preserved.</p>
      `,
      `Your Scryptyra subscription has been canceled.`
    ),
    text: `Hi ${name}, your Scryptyra subscription has been canceled. Resubscribe at ${process.env.APP_URL}/pricing`,
  }),

  paymentFailed: (name, amount) => ({
    subject: "Action required — Scryptyra payment failed",
    html: htmlWrapper(
      "Payment Issue",
      "Payment failed.",
      "We could not charge your card. Please update your payment method.",
      `
      <div class="eyebrow">Payment Issue</div>
      <h2>Payment <em>failed.</em></h2>
      <p class="lead">Hi ${name}, we were unable to process your payment of <strong style="color:#ff6b35;">$${amount}</strong>.</p>
      <div class="alert alert-danger">
        <div class="alert-icon">alert</div>
        <div class="alert-body">
          <strong>Action required.</strong>
          Update your payment method within 7 days to keep your subscription active.
        </div>
      </div>
      <div class="btn-row"><a href="${process.env.APP_URL}/billing" class="btn">Update Payment Method</a></div>
      `,
      `Payment of $${amount} failed. Please update your payment method.`
    ),
    text: `Hi ${name}, your Scryptyra payment of $${amount} failed. Update: ${process.env.APP_URL}/billing`,
  }),

  accountDeleted: (name) => ({
    subject: "Your SCRYPTYRA account has been deleted",
    html: htmlWrapper(
      "Account Closed",
      `Account <em>deleted.</em>`,
      "Your account and all data have been permanently removed.",
      `
      <div class="eyebrow">Account Closed</div>
      <h2>Goodbye, <em>${name}.</em></h2>
      <p class="lead">Your SCRYPTYRA account and all associated data have been permanently deleted as requested.</p>
      <p class="body-text">We're sorry to see you go. If you ever change your mind, you're always welcome back — your stories have a home here.</p>
      <div class="btn-row">
        <a href="${process.env.APP_URL}/signup" class="btn-ghost">Create a New Account</a>
      </div>
      <div class="alert alert-danger">
        <div class="alert-icon">🚨</div>
        <div class="alert-body">
          <strong>Didn't request this deletion?</strong>
          Reply to this email immediately — we can investigate and help.
        </div>
      </div>
      `,
      "Your SCRYPTYRA account has been permanently deleted."
    ),
    text: `Hi ${name}, your SCRYPTYRA account has been deleted. Didn't request this? Contact us immediately.`,
  }),
};

// ─── Send function ────────────────────────────────────────
const sendEmail = async (to, template, ...args) => {
  if (!templates[template]) {
    logger.error(`Email template "${template}" not found.`);
    return;
  }
  try {
    const { subject, html, text } = templates[template](...args);
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "SCRYPTYRA"}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to, subject, html, text,
    });
    logger.info(`Email sent: ${template} → ${to} [${info.messageId}]`);
    return info;
  } catch (err) {
    logger.error(`Failed to send email (${template} → ${to}): ${err.message}`);
  }
};

// ─── Verify connection on startup ─────────────────────────
const verifyEmailConnection = async () => {
  if (process.env.NODE_ENV === "test") return;
  try {
    await getTransporter().verify();
    logger.info("Email transporter ready.");
  } catch (err) {
    logger.warn(`Email transporter not ready: ${err.message}. Check SMTP credentials.`);
  }
};

module.exports = { sendEmail, verifyEmailConnection };
