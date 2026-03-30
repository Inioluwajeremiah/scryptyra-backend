const nodemailer = require("nodemailer");
const logger = require("../utils/logger");
const { Resend } = require("resend");

// // ─── Transporter ─────────────────────────────────────────
// let _transporter;
// function getTransporter() {
//   if (_transporter) return _transporter;
//   _transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: Number(process.env.SMTP_PORT) || 587,
//     secure: Number(process.env.SMTP_PORT) === 465,
//     auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
//     pool: true,
//     maxConnections: 5,
//     maxMessages: 100,
//   });
//   return _transporter;
// }

let _resend;

function getResendClient() {
  if (_resend) return _resend;

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set.");
  }

  _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

// ─── Base HTML wrapper ────────────────────────────────────
function htmlWrapper(heroLabel, heroTitle, heroSub, content, preheader = "") {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<title>SCRYPTYRA</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table{border-collapse:collapse}
body{background:#EDEBE8;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}
img{border:0;outline:none;text-decoration:none}
a{color:#ff6b35;text-decoration:none}

/* ── Preheader ── */
.pre{display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#EDEBE8;opacity:0}

/* ── Shell ── */
.shell{max-width:600px;margin:0 auto;padding:36px 16px 52px}

/* ── Top bar ── */
.topbar{display:flex;align-items:center;justify-content:space-between;padding:0 4px;margin-bottom:18px}
.tl{display:flex;align-items:center;gap:10px}

.tl-name{font-size:14px;font-weight:900;letter-spacing:3px;color:#1c1c1c;text-transform:uppercase}
.tl-name b{color:#ff6b35}
.tr-badge{font-size:10px;font-weight:700;color:#ff6b35;letter-spacing:1.5px;text-transform:uppercase;background:rgba(255,107,53,.08);border:1px solid rgba(255,107,53,.18);border-radius:20px;padding:4px 12px}

/* ── Hero ── */
.hero{border-radius:14px 14px 0 0;background:#0b0b0f;padding:0;position:relative;overflow:hidden}
.hero-inner{position:relative;z-index:3;padding:38px 44px 36px}
.hero-bg-grad{position:absolute;inset:0;background:radial-gradient(ellipse 80% 120% at 70% -10%,rgba(255,107,53,.22) 0%,transparent 60%),radial-gradient(ellipse 60% 80% at 10% 90%,rgba(255,107,53,.08) 0%,transparent 60%);pointer-events:none;z-index:1}
.hero-dots{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.06;background-image:radial-gradient(rgba(255,255,255,.9) 1px,transparent 1px);background-size:22px 22px}
.hero-line{position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(255,107,53,.6),rgba(255,107,53,.3),transparent);z-index:4}
.hero-tag{display:inline-flex;align-items:center;gap:7px;background:rgba(255,107,53,.12);border:1px solid rgba(255,107,53,.22);border-radius:100px;padding:5px 14px;margin-bottom:18px}
.hero-dot{width:5px;height:5px;border-radius:50%;background:#ff6b35;animation:hpulse 2.2s ease-in-out infinite;box-shadow:0 0 5px rgba(255,107,53,.7)}
@keyframes hpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.8)}}
.hero-lbl{font-size:10px;font-weight:800;color:#ff6b35;letter-spacing:2px;text-transform:uppercase}
.hero-h{font-size:30px;font-weight:900;color:#fff;line-height:1.2;letter-spacing:-.4px;margin-bottom:10px}
.hero-h em{font-style:normal;color:#ff6b35}
.hero-sub{font-size:13.5px;color:rgba(255,255,255,.38);line-height:1.7;max-width:360px}
.hero-frames{position:absolute;right:0;bottom:0;display:flex;gap:2px;padding:0 18px 0 0;z-index:2;opacity:.1;align-items:flex-end}
.hf{width:18px;border:1.5px solid #ff6b35;border-radius:2px}
.hf-1{height:14px}.hf-2{height:20px}.hf-3{height:16px}.hf-4{height:24px}.hf-5{height:18px}

/* ── Card body ── */
.card{background:#ffffff;border:1px solid #e4e0dc;border-top:none;padding:38px 44px 34px}

/* ── Footer ── */
.footer{background:#f5f2ef;border:1px solid #e4e0dc;border-top:none;border-radius:0 0 14px 14px;padding:20px 44px 24px}
.footer-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e8e4e0}
.f-logo{font-size:11px;font-weight:900;letter-spacing:2.5px;color:#c8c4c0;text-transform:uppercase}
.f-logo b{color:rgba(255,107,53,.45)}
.f-nav{display:flex;gap:16px}
.f-nav a{font-size:11px;color:#c0bcb8;text-decoration:none}
.f-meta{font-size:11px;color:#c0bcb8;line-height:1.65}

/* ── Type ── */
.eyebrow{font-size:10px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#ff6b35;margin-bottom:12px}
h2{font-size:22px;font-weight:800;color:#111;line-height:1.3;margin-bottom:10px;letter-spacing:-.2px}
h2 em{font-style:normal;color:#ff6b35}
.lead{font-size:14.5px;color:#555;line-height:1.75;margin-bottom:18px}
.body-text{font-size:13.5px;color:#666;line-height:1.75;margin-bottom:14px}
.hr{height:1px;background:linear-gradient(to right,#f0ece8,#e8e4e0,#f0ece8);margin:26px 0;border:none}

/* ── Buttons ── */
.btn-row{margin:28px 0 20px}
.btn{display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#ff6b35 0%,#d03e10 100%);color:#fff !important;font-size:14px;font-weight:700;letter-spacing:.2px;border-radius:10px;text-decoration:none !important;box-shadow:0 5px 18px rgba(255,107,53,.38)}
.btn-outline{display:inline-block;padding:12px 26px;background:transparent;color:#ff6b35 !important;font-size:13px;font-weight:600;border:2px solid #ff6b35;border-radius:10px;text-decoration:none !important}

/* ── Feature list ── */
.feat-list{list-style:none;margin:18px 0 22px;border:1px solid #f0ece8;border-radius:12px;overflow:hidden}
.feat-list li{display:flex;align-items:flex-start;gap:14px;padding:14px 18px;border-bottom:1px solid #f5f2ef;background:#fff}
.feat-list li:last-child{border-bottom:none}
.feat-list li:nth-child(odd){background:#fdfcfb}
.fi{width:28px;height:28px;min-width:28px;border-radius:8px;background:linear-gradient(135deg,#ff6b35,#c84010);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;margin-top:1px;box-shadow:0 3px 8px rgba(255,107,53,.22)}
.ft{font-size:13.5px;color:#555;line-height:1.55}
.ft strong{color:#1a1a1a;font-weight:700;display:block;margin-bottom:2px;font-size:13.5px}

/* ── Info card ── */
.info-card{border:1px solid #ece8e4;border-radius:12px;overflow:hidden;margin:20px 0;background:#fdfcfb}
.info-row{display:flex;align-items:center;padding:11px 18px;border-bottom:1px solid #f2ede8;font-size:13px}
.info-row:last-child{border-bottom:none}
.ik{width:110px;min-width:110px;color:#b0aba6;font-weight:600;font-size:11px;letter-spacing:.4px;text-transform:uppercase}
.iv{color:#444;font-size:13px;word-break:break-all;line-height:1.5}

/* ── Alerts ── */
.alert{border-radius:10px;padding:15px 18px;margin:16px 0;font-size:13px;line-height:1.65;display:flex;align-items:flex-start;gap:13px}
.ai{font-size:17px;line-height:1.2;flex-shrink:0;margin-top:1px}
.ab{flex:1}
.ab strong{display:block;font-weight:700;margin-bottom:3px;font-size:13px}
.a-ok{background:#f0fdf4;border:1px solid #bbf7d0}
.a-ok .ab strong{color:#15803d}
.a-ok .ab{color:#166534}
.a-err{background:#fff5f5;border:1px solid #fecaca}
.a-err .ab strong{color:#b91c1c}
.a-err .ab{color:#7f1d1d}
.a-warn{background:#fffbeb;border:1px solid #fde68a}
.a-warn .ab strong{color:#92400e}
.a-warn .ab{color:#78350f}
.a-info{background:#eff6ff;border:1px solid #bfdbfe}
.a-info .ab strong{color:#1e40af}
.a-info .ab{color:#1e3a8a}

/* ── Script card ── */
.sc{background:#0b0b0f;border-radius:12px;padding:26px 28px;margin:22px 0;position:relative;overflow:hidden}
.sc-shine{position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#ff6b35,#ffaa80,#ff6b35,transparent);background-size:300% auto;animation:scshine 4s linear infinite}
@keyframes scshine{0%{background-position:0% center}100%{background-position:300% center}}
.sc-glow{position:absolute;top:-60px;right:-40px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(255,107,53,.12) 0%,transparent 70%);pointer-events:none}
.sc-ey{position:relative;z-index:1;font-size:9px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:rgba(255,107,53,.5);margin-bottom:10px}
.sc-t{position:relative;z-index:1;font-family:'Courier New',Courier,monospace;font-size:17px;font-style:italic;font-weight:700;color:#fff;line-height:1.45}
.sc-m{position:relative;z-index:1;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.06);font-size:11px;color:rgba(255,255,255,.28);letter-spacing:.4px}
.sc-m span{color:rgba(255,107,53,.4);margin:0 5px}

/* ── Countdown ── */
.cdown{background:linear-gradient(135deg,rgba(255,107,53,.05),rgba(255,107,53,.02));border:1px solid rgba(255,107,53,.14);border-radius:10px;display:flex;align-items:center;gap:16px;padding:16px 20px;margin:20px 0}
.cn{font-size:32px;font-weight:900;color:#ff6b35;line-height:1;font-variant-numeric:tabular-nums;min-width:44px}
.cl{font-size:12px;color:#888;line-height:1.5}
.cl strong{display:block;font-weight:700;color:#444;font-size:13px;margin-bottom:2px}

/* ── Note ── */
.note{font-size:12px;color:#aaa;line-height:1.7;margin-top:16px}
.note a{color:#ff6b35}
.url-box{background:#faf8f6;border:1px solid #e8e4e0;border-radius:8px;padding:12px 16px;margin-top:12px;font-family:'Courier New',monospace;font-size:11px;color:#bbb;word-break:break-all;line-height:1.65}

/* ── Stat pills ── */
.pills{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}
.pill{background:#faf8f6;border:1px solid #e8e4e0;border-radius:100px;padding:5px 13px;font-size:12px;color:#888;font-weight:500}
.pill strong{color:#ff6b35;font-weight:700}

/* ── Plan chip ── */
.plan-chip{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,rgba(255,107,53,.1),rgba(255,107,53,.05));border:1px solid rgba(255,107,53,.2);border-radius:100px;padding:5px 14px;font-size:12px;font-weight:700;color:#ff6b35;letter-spacing:.5px}
.plan-dot{width:6px;height:6px;border-radius:50%;background:#ff6b35}

/* ── Roadmap strip ── */
.roadmap{display:flex;gap:0;margin:22px 0;border-radius:10px;overflow:hidden;border:1px solid #ece8e4}
.rm-step{flex:1;padding:14px 16px;border-right:1px solid #ece8e4;background:#fdfcfb}
.rm-step:last-child{border-right:none}
.rm-step.active{background:#fff8f5}
.rm-n{font-size:10px;font-weight:800;color:#d0ccc8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:5px}
.rm-step.active .rm-n{color:#ff6b35}
.rm-t{font-size:12px;font-weight:700;color:#888}
.rm-step.active .rm-t{color:#111}

@media only screen and (max-width:480px){
  .shell{padding:20px 10px 40px}
  .hero-inner{padding:28px 24px 26px}
  .card{padding:28px 24px 26px}
  .footer{padding:18px 24px 22px}
  .hero-h{font-size:24px}
  .feat-list li{padding:11px 14px}
  .roadmap{flex-direction:column}
  .rm-step{border-right:none;border-bottom:1px solid #ece8e4}
  .rm-step:last-child{border-bottom:none}
}
</style>
</head>
<body>
${
  preheader
    ? `<div class="pre">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>`
    : ""
}
<div class="shell">

<!-- REPLACE the .topbar div with this -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
  <tr>
    <td style="vertical-align:middle; padding:0 4px;">
      <!-- Logo mark + name -->
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:middle; padding-right:10px;">
            <div style="width:36px;height:36px;border-radius:10px;text-align:center;line-height:36px;">
              <img src="https://scryptyra-backend.onrender.com/public/logo.png" alt="S" width="22" height="22" 
                   style="vertical-align:middle;display:inline-block;margin-top:7px;"/>
            </div>
          </td>
          <td style="vertical-align:middle;">
            <span style="font-size:14px;font-weight:900;letter-spacing:3px;color:#1c1c1c;
                         text-transform:uppercase;font-family:Inter,-apple-system,sans-serif;">
              SCRY<span style="color:#ff6b35;">PTY</span>RA
            </span>
          </td>
        </tr>
      </table>
    </td>
    <td align="right" style="vertical-align:middle; padding:0 4px;">
      <span style="font-size:10px;font-weight:700;color:#ff6b35;letter-spacing:1.5px;
                   text-transform:uppercase;background:#fff3ee;border:1px solid #ffd0bb;
                   border-radius:20px;padding:4px 12px;
                   font-family:Inter,-apple-system,sans-serif;">
        Screenplay Editor
      </span>
    </td>
  </tr>
</table>

  <div class="hero">
    <div class="hero-bg-grad"></div>
    <div class="hero-dots"></div>
    <div class="hero-frames">
      <div class="hf hf-1"></div>
      <div class="hf hf-2"></div>
      <div class="hf hf-3"></div>
      <div class="hf hf-4"></div>
      <div class="hf hf-5"></div>
    </div>
    <div class="hero-inner">
    <!-- REPLACE the .hero-tag div with this -->
    <table cellpadding="0" cellspacing="0" border="0" 
           style="display:inline-table;margin-bottom:18px;
                  background:#1a1a24;border:1px solid rgba(255,107,53,.22);
                  ">
      <tr>
        <td style="padding:5px 6px 5px 14px; vertical-align:middle;">
          <!-- Static dot — no animation (stripped by email clients) -->
          <span style="display:inline-block;width:6px;height:6px;border-radius:50%;
                       background:#ff6b35;vertical-align:middle;
                       margin-right:7px;"></span>
          <span style="font-size:10px;font-weight:800;color:#ff6b35;
                       letter-spacing:2px;text-transform:uppercase;
                       font-family:Inter,-apple-system,sans-serif;
                       vertical-align:middle;">${heroLabel}</span>
        </td>
        <td style="padding:5px 14px 5px 0;"></td>
      </tr>
    </table>
      <div class="hero-h">${heroTitle}</div>
      <div class="hero-sub">${heroSub}</div>
    </div>
    <div class="hero-line"></div>
  </div>

  <div class="card">${content}</div>

  <div class="footer">
    <div class="footer-row">
      <div class="f-logo">SCRY<b>PTY</b>RA</div>
      <div class="f-nav">
        <a href="${process.env.APP_URL}/settings">Settings</a>
        <a href="${process.env.APP_URL}/pricing">Plans</a>
      </div>
    </div>
    <p class="f-meta">© ${year} SCRYPTYRA · Open Horizon Innovations. You're receiving this because you have an account at scryptyra.openhorizoninnovations.com</p>
  </div>

</div>
</body>
</html>`;
}

// ─── Templates ────────────────────────────────────────────
const templates = {
  // ── 1. Welcome ──────────────────────────────────────────
  welcome: (name) => ({
    subject: `Welcome to SCRYPTYRA, ${name} — your story starts here ✦`,
    html: htmlWrapper(
      "Account Active",
      `Welcome, <em>${name}.</em>`,
      "Your account is live. Every great script started with a blank page — and now you have the tools to fill it.",
      `
      <div class="eyebrow">You're In</div>
      <h2>Everything you need to <em>write.</em></h2>
      <p class="lead">Here's what's waiting for you inside SCRYPTYRA.</p>
      <ul class="feat-list">
        <li>
          <div class="fi">✦</div>
          <div class="ft"><strong>AI Script Consultant</strong>Scene ideas, sharp dialogue, plot twists, character arcs — powered by Claude, on demand.</div>
        </li>
        <li>
          <div class="fi">⇅</div>
          <div class="ft"><strong>Industry Formatting</strong>WGA-standard scene headings, action, dialogue, transitions. Automatic as you type.</div>
        </li>
        <li>
          <div class="fi">☁</div>
          <div class="ft"><strong>Cloud Autosave</strong>Your scripts save to the database in real time. Write on any device — nothing is ever lost.</div>
        </li>
        <li>
          <div class="fi">↩</div>
          <div class="ft"><strong>Full Undo History</strong>100 steps. Ctrl+Z / Ctrl+Y. Write without fear.</div>
        </li>
        <li>
          <div class="fi">⎙</div>
          <div class="ft"><strong>PDF Export</strong>Print-ready output with proper margins. Submission-ready instantly.</div>
        </li>
      </ul>
      <div class="btn-row"><a href="${process.env.APP_URL}/dashboard" class="btn">Open My Dashboard →</a></div>
      <hr class="hr"/>
      <p class="note">Questions, ideas, or feedback? Reply directly to this email — we read every message.</p>
      `,
      `Welcome to SCRYPTYRA, ${name}. Your account is ready.`
    ),
    text: `Welcome to SCRYPTYRA, ${name}! Your account is ready. Open your dashboard: ${process.env.APP_URL}/dashboard`,
  }),

  // ── 2. Email Verification ────────────────────────────────
  emailVerification: (name, verificationToken) => ({
    subject: "Verify your SCRYPTYRA email — one tap to unlock everything",
    html: htmlWrapper(
      "Step 1 of 1",
      `Verify your <em>email.</em>`,
      "Almost there. One tap and you're fully set up.",
      `
      <div class="eyebrow">Email Verification</div>
      <h2>You're almost <em>in.</em></h2>
      <p class="lead">Hi ${name}, thanks for joining SCRYPTYRA. Tap the button below to confirm your email address and unlock all features.</p>
      <div class="btn-row"><a href="${process.env.APP_URL}/verify-email?token=${verificationToken}" class="btn">Verify My Email →</a></div>
      <div class="cdown">
        <div class="cn">24</div>
        <div class="cl"><strong>Hours remaining</strong>This link expires in 24 hours. After that, sign in to request a new one.</div>
      </div>
      <hr class="hr"/>
      <p class="note">Didn't create a SCRYPTYRA account? You can safely ignore this email — nothing will change.</p>
      <p class="note" style="margin-top:8px">Button not working? Paste this link into your browser:</p>
      <div class="url-box">${process.env.APP_URL}/verify-email?token=${verificationToken}</div>
      `,
      "One tap to verify and unlock SCRYPTYRA."
    ),
    text: `Hi ${name}, verify your SCRYPTYRA email: ${process.env.APP_URL}/verify-email?token=${verificationToken} (expires in 24 hours)`,
  }),

  // ── 3. Login Alert ───────────────────────────────────────
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
        <div class="info-row"><span class="ik">Time</span><span class="iv">${new Date().toUTCString()}</span></div>
        <div class="info-row"><span class="ik">IP Address</span><span class="iv">${
          ipAddress || "Unknown"
        }</span></div>
        <div class="info-row"><span class="ik">Device</span><span class="iv">${
          userAgent ? userAgent.slice(0, 90) : "Unknown"
        }</span></div>
      </div>
      <div class="alert a-ok">
        <div class="ai">✓</div>
        <div class="ab"><strong>This was you?</strong>No action needed — you're all set and your account is secure.</div>
      </div>
      <div class="alert a-err">
        <div class="ai">⚠</div>
        <div class="ab"><strong>Wasn't you?</strong>Your password may be compromised. Change it immediately using the button below.</div>
      </div>
      <div class="btn-row"><a href="${
        process.env.APP_URL
      }/settings" class="btn">Secure My Account →</a></div>
      `,
      `New sign-in from ${ipAddress || "unknown IP"}.`
    ),
    text: `New sign-in to SCRYPTYRA at ${new Date().toUTCString()} from ${
      ipAddress || "Unknown"
    }. Not you? Secure your account: ${process.env.APP_URL}/settings`,
  }),

  // ── 4. Password Changed ──────────────────────────────────
  passwordChanged: (name) => ({
    subject: "Your SCRYPTYRA password was changed",
    html: htmlWrapper(
      "Security Update",
      `Password <em>updated.</em>`,
      "Your account password was successfully changed.",
      `
      <div class="eyebrow">Security Update</div>
      <h2>Password <em>updated.</em></h2>
      <p class="lead">Hi ${name}, your SCRYPTYRA password was just changed successfully.</p>
      <div class="alert a-ok">
        <div class="ai">✓</div>
        <div class="ab"><strong>Change confirmed.</strong>If you made this change, your scripts and data are safe and untouched.</div>
      </div>
      <div class="alert a-err">
        <div class="ai">⚠</div>
        <div class="ab"><strong>Didn't change your password?</strong>Act immediately — reset your password and contact us via reply.</div>
      </div>
      <div class="btn-row"><a href="${process.env.APP_URL}/login" class="btn">Sign In →</a></div>
      `,
      "Your SCRYPTYRA password was just changed."
    ),
    text: `Hi ${name}, your SCRYPTYRA password was changed. Wasn't you? Contact us immediately.`,
  }),

  // ── 5. Password Reset Request ────────────────────────────
  passwordResetRequest: (name, resetToken) => ({
    subject: "Reset your SCRYPTYRA password — expires in 10 minutes",
    html: htmlWrapper(
      "Password Reset",
      `Let's get you <em>back in.</em>`,
      "No worries — it happens. Click below to set a new password.",
      `
      <div class="eyebrow">Password Reset</div>
      <h2>Forgot your <em>password?</em></h2>
      <p class="lead">Hi ${name}, we received a request to reset the password for your SCRYPTYRA account. Tap the button to choose a new one.</p>
      <div class="cdown">
        <div class="cn">10</div>
        <div class="cl"><strong>Minutes to act</strong>This reset link expires in 10 minutes for your security. After that, request a new one.</div>
      </div>
      <div class="btn-row"><a href="${process.env.APP_URL}/reset-password?token=${resetToken}" class="btn">Reset My Password →</a></div>
      <hr class="hr"/>
      <p class="note">Didn't request a password reset? You can safely ignore this email — your password will not change.</p>
      <p class="note" style="margin-top:10px">Button not working? Copy this link into your browser:</p>
      <div class="url-box">${process.env.APP_URL}/reset-password?token=${resetToken}</div>
      `,
      "Reset your SCRYPTYRA password — link expires in 10 minutes."
    ),
    text: `Hi ${name}, reset your SCRYPTYRA password: ${process.env.APP_URL}/reset-password?token=${resetToken} (expires in 10 minutes)`,
  }),

  // ── 6. Script Shared ─────────────────────────────────────
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
      <div class="sc">
        <div class="sc-shine"></div>
        <div class="sc-glow"></div>
        <div class="sc-ey">Screenplay</div>
        <div class="sc-t">"${scriptTitle}"</div>
        <div class="sc-m">Shared by ${senderName}<span>·</span>SCRYPTYRA<span>·</span>${new Date().toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric", year: "numeric" }
      )}</div>
      </div>
      <div class="btn-row"><a href="${shareUrl}" class="btn">Read the Script →</a></div>
      <p class="note">You need a SCRYPTYRA account to view this script. <a href="${
        process.env.APP_URL
      }/signup">Create one free →</a></p>
      `,
      `${senderName} shared "${scriptTitle}" with you.`
    ),
    text: `${senderName} shared "${scriptTitle}" with you on SCRYPTYRA. View it at: ${shareUrl}`,
  }),

  // ── 7. Subscription Started ──────────────────────────────
  subscriptionStarted: (name, plan, interval) => {
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
    return {
      subject: `You're on Scryptyra ${planLabel} — all features unlocked ✦`,
      html: htmlWrapper(
        "Subscription Active",
        `Welcome to <em>${planLabel}.</em>`,
        "Your subscription is live. Every feature is now unlocked and ready.",
        `
        <div class="eyebrow">Subscription Confirmed</div>
        <h2>${name}, you're on <em>${planLabel}.</em></h2>
        <p class="lead">Your ${planLabel} plan is active and all features are unlocked.</p>
        <div class="info-card">
          <div class="info-row"><span class="ik">Plan</span><span class="iv"><span class="plan-chip"><span class="plan-dot"></span>${planLabel}</span></span></div>
          <div class="info-row"><span class="ik">Billing</span><span class="iv">${
            interval === "annual" ? "Annual — billed once a year" : "Monthly"
          }</span></div>
          <div class="info-row"><span class="ik">Status</span><span class="iv" style="color:#16a34a;font-weight:600">● Active</span></div>
        </div>
        <div class="btn-row"><a href="${
          process.env.APP_URL
        }/dashboard" class="btn">Start Writing →</a></div>
        <p class="note">Manage your subscription, invoices, and billing details at <a href="${
          process.env.APP_URL
        }/billing">scryptyra.openhorizoninnovations.com/billing</a></p>
        `,
        `Your Scryptyra ${planLabel} plan is now active.`
      ),
      text: `Your Scryptyra ${planLabel} plan is now active. Start writing: ${process.env.APP_URL}/dashboard`,
    };
  },

  // ── 8. Subscription Canceled ──────────────────────────
  subscriptionCanceled: (name) => ({
    subject: "Your Scryptyra subscription has ended",
    html: htmlWrapper(
      "Account Update",
      `Subscription <em>ended.</em>`,
      "You've been moved to the free plan. Your scripts are safe.",
      `
      <div class="eyebrow">Plan Change</div>
      <h2>See you around, <em>${name}.</em></h2>
      <p class="lead">Your Scryptyra subscription has ended and your account has been moved to the Free plan.</p>
      <div class="alert a-info">
        <div class="ai">ℹ</div>
        <div class="ab"><strong>Your scripts are safe.</strong>You can still access up to 3 scripts on the free plan. All your existing work is preserved.</div>
      </div>
      <div class="roadmap">
        <div class="rm-step active"><div class="rm-n">Now</div><div class="rm-t">Free Plan</div></div>
        <div class="rm-step"><div class="rm-n">Upgrade</div><div class="rm-t">Writer · $12/mo</div></div>
        <div class="rm-step"><div class="rm-n">Upgrade</div><div class="rm-t">Pro · $29/mo</div></div>
        <div class="rm-step"><div class="rm-n">Upgrade</div><div class="rm-t">Studio · $79/mo</div></div>
      </div>
      <div class="btn-row"><a href="${process.env.APP_URL}/pricing" class="btn">See Plans →</a></div>
      <p class="note">Changed your mind? Resubscribe anytime — your data, settings, and scripts are all still here waiting.</p>
      `,
      `Your Scryptyra subscription has ended.`
    ),
    text: `Hi ${name}, your Scryptyra subscription has ended. Your scripts are safe. Resubscribe at ${process.env.APP_URL}/pricing`,
  }),

  // ── 9. Payment Failed ────────────────────────────────────
  paymentFailed: (name, amount) => ({
    subject: "Action required — Scryptyra payment failed",
    html: htmlWrapper(
      "Payment Issue",
      `Payment <em>failed.</em>`,
      "We couldn't charge your card. Update your payment method to keep your subscription active.",
      `
      <div class="eyebrow">Action Required</div>
      <h2>Payment <em>failed.</em></h2>
      <p class="lead">Hi ${name}, we were unable to process your payment of <strong style="color:#ff6b35">$${amount}</strong> for Scryptyra.</p>
      <div class="alert a-err">
        <div class="ai">⚠</div>
        <div class="ab"><strong>Update your payment method.</strong>You have 7 days before your account is downgraded to the free plan. Your scripts will not be deleted.</div>
      </div>
      <div class="info-card">
        <div class="info-row"><span class="ik">Amount</span><span class="iv" style="font-weight:700;color:#b91c1c">$${amount}</span></div>
        <div class="info-row"><span class="ik">Status</span><span class="iv" style="color:#b91c1c;font-weight:600">● Failed</span></div>
        <div class="info-row"><span class="ik">Action by</span><span class="iv">Within 7 days</span></div>
      </div>
      <div class="btn-row"><a href="${process.env.APP_URL}/billing" class="btn">Update Payment Method →</a></div>
      <p class="note">Need help? Reply to this email and we'll sort it out together.</p>
      `,
      `Payment of $${amount} failed. Update your method within 7 days.`
    ),
    text: `Hi ${name}, your Scryptyra payment of $${amount} failed. Update your payment method within 7 days: ${process.env.APP_URL}/billing`,
  }),

  // ── 10. Account Deleted ──────────────────────────────────
  accountDeleted: (name) => ({
    subject: "Your SCRYPTYRA account has been deleted",
    html: htmlWrapper(
      "Account Closed",
      `Goodbye, <em>${name}.</em>`,
      "Your account and all associated data have been permanently removed.",
      `
      <div class="eyebrow">Account Closed</div>
      <h2>It was a pleasure, <em>${name}.</em></h2>
      <p class="lead">Your SCRYPTYRA account and all associated data have been permanently deleted as you requested.</p>
      <p class="body-text">We're sorry to see you go. Every great story takes time to find its writer — and if you ever come back, your home here will be waiting.</p>
      <div class="btn-row"><a href="${process.env.APP_URL}/signup" class="btn-outline">Create a New Account</a></div>
      <div class="alert a-err" style="margin-top:24px">
        <div class="ai">⚠</div>
        <div class="ab"><strong>Didn't request this deletion?</strong>Reply to this email immediately — we can investigate and help you recover your account.</div>
      </div>
      `,
      "Your SCRYPTYRA account has been permanently deleted."
    ),
    text: `Hi ${name}, your SCRYPTYRA account has been permanently deleted. Didn't request this? Contact us immediately by replying to this email.`,
  }),

  // ── 11. Resend Verification ──────────────────────────────
  resendVerification: (name, verificationToken) => ({
    subject: "Your new SCRYPTYRA verification link",
    html: htmlWrapper(
      "New Link",
      `New verification <em>link.</em>`,
      "You requested a new verification email. Here it is.",
      `
      <div class="eyebrow">Email Verification</div>
      <h2>Fresh link, <em>ready to go.</em></h2>
      <p class="lead">Hi ${name}, here's your new email verification link for SCRYPTYRA. The previous one has been invalidated.</p>
      <div class="btn-row"><a href="${process.env.APP_URL}/verify-email?token=${verificationToken}" class="btn">Verify My Email →</a></div>
      <div class="cdown">
        <div class="cn">24</div>
        <div class="cl"><strong>Hours remaining</strong>This link expires in 24 hours. If it expires, simply sign in and request another.</div>
      </div>
      <p class="note">Still having trouble? Reply to this email and we'll get you sorted.</p>
      <div class="url-box">${process.env.APP_URL}/verify-email?token=${verificationToken}</div>
      `,
      "Your new SCRYPTYRA email verification link."
    ),
    text: `Hi ${name}, your new verification link: ${process.env.APP_URL}/verify-email?token=${verificationToken} (expires in 24 hours)`,
  }),
};

const sendEmail = async (to, template, ...args) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  if (!templates[template]) {
    logger.error(`Email template "${template}" not found.`);
    return;
  }

  try {
    const { subject, html, text } = templates[template](...args);

    const { data, error } = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME || "SCRYPTYRA"} <${
        process.env.EMAIL_FROM_ADDRESS
      }>`,
      to,
      subject,
      html,
      text, // optional
    });

    if (error) {
      logger.error(
        `Failed to send email (${template} → ${to}): ${error.message}`
      );
      return;
    }
    logger.info(`Email sent: ${template} → ${to} [${data.id}]`);
    return data;
  } catch (err) {
    logger.error(`Failed to send email (${template} → ${to}): ${err.message}`);
  }
};

// // ─── Verify connection on startup ─────────────────────────
// // const verifyEmailConnection = async () => {
// //   if (process.env.NODE_ENV === "test") return;
// //   try {
// //     await getTransporter().verify();
// //     logger.info("Email transporter ready.");
// //   } catch (err) {
// //     logger.warn(
// //       `Email transporter not ready: ${err.message}. Check SMTP credentials.`
// //     );
// //   }
// // };

const verifyEmailConnection = async () => {
  if (process.env.NODE_ENV === "test") return;
  try {
    // Simple check: ensure API key exists
    await getResendClient();
    logger.info("Resend email client ready.");
  } catch (err) {
    logger.warn(
      `Resend not ready: ${err.message}. Check API key configuration.`
    );
  }
};

module.exports = { sendEmail, verifyEmailConnection };
