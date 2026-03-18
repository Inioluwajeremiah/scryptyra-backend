# FADE IN — Backend API

Node.js + Express + MongoDB backend for the FADE IN screenplay editor. Features JWT authentication via httpOnly cookies, email notifications via Nodemailer, and full script CRUD.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express 4 |
| Database | MongoDB + Mongoose 8 |
| Auth | JWT via httpOnly cookie (`bcryptjs` for hashing) |
| Email | Nodemailer (SMTP — Gmail, Mailtrap, etc.) |
| Validation | express-validator |
| Security | helmet, cors, express-mongo-sanitize, express-rate-limit |
| Logging | Winston |
| Dev | nodemon |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — see Environment Variables section below

# 3. Start MongoDB (if running locally)
mongod --dbpath /data/db

# 4. Run in development (with nodemon hot-reload)
npm run dev

# 5. Run in production
npm start
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# MongoDB
MONGO_URI=mongodb://localhost:27017/fadein

# JWT — generate secret with:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_64_char_secret_here
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_DAYS=7

# SMTP (Gmail example — needs App Password with 2FA enabled)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password

EMAIL_FROM_NAME=FADE IN
EMAIL_FROM_ADDRESS=noreply@fadein.app

APP_URL=http://localhost:3000
```

### Mailtrap (recommended for development)

Sign up at [mailtrap.io](https://mailtrap.io) for a free inbox that catches all emails without sending them:

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<your mailtrap user>
SMTP_PASS=<your mailtrap pass>
```

---

## Project Structure

```
fade-in-server/
├── src/
│   ├── index.js                 # Entry point — starts server
│   ├── app.js                   # Express app — middleware + routes
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── models/
│   │   ├── User.js              # User schema (bcrypt, tokens, soft-delete)
│   │   └── Script.js            # Script schema (blocks, auto stats)
│   ├── controllers/
│   │   ├── authController.js    # signup, login, logout, password, verify
│   │   └── scriptController.js  # CRUD for scripts
│   ├── routes/
│   │   ├── authRoutes.js        # /api/auth/*
│   │   └── scriptRoutes.js      # /api/scripts/*
│   ├── middleware/
│   │   ├── auth.js              # protect (JWT cookie), restrictTo
│   │   ├── errorHandler.js      # global error handler
│   │   ├── validate.js          # express-validator rules + runner
│   │   └── rateLimiter.js       # auth / api / email rate limits
│   ├── services/
│   │   └── emailService.js      # Nodemailer + 7 HTML email templates
│   └── utils/
│       ├── AppError.js          # Operational error class
│       ├── token.js             # JWT sign/verify + cookie helpers
│       └── logger.js            # Winston logger
├── logs/                        # Auto-created log files
├── .env.example
├── .gitignore
├── nodemon.json
└── package.json
```

---

## API Reference

All responses follow:
```json
{ "status": "success" | "fail" | "error", "data": { ... } | null, "message": "..." }
```

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/signup` | — | Register new user |
| POST | `/login` | — | Sign in, sets httpOnly cookie |
| POST | `/logout` | — | Clear auth cookie |
| GET | `/me` | ✓ | Get current user |
| PATCH | `/update-profile` | ✓ | Update name |
| PATCH | `/change-password` | ✓ | Change password |
| DELETE | `/delete-account` | ✓ | Soft-delete account |
| POST | `/forgot-password` | — | Send reset email |
| PATCH | `/reset-password/:token` | — | Reset password |
| GET | `/verify-email/:token` | — | Verify email address |

#### POST `/api/auth/signup`
```json
// Request
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret123" }

// Response 201
{
  "status": "success",
  "message": "Account created. Please check your email to verify your address.",
  "data": {
    "user": { "id": "...", "name": "Jane Doe", "email": "jane@example.com", "avatar": "JD", "plan": "free", "isEmailVerified": false, "joinedAt": "..." }
  }
}
```
Sets `fadein_token` httpOnly cookie. Sends welcome + verification emails.

#### POST `/api/auth/login`
```json
// Request
{ "email": "jane@example.com", "password": "secret123" }

// Response 200
{ "status": "success", "data": { "user": { ... } } }
```
Sets `fadein_token` httpOnly cookie. Sends login-alert email with IP + user-agent.

#### POST `/api/auth/logout`
Clears the `fadein_token` cookie. Returns `200`.

#### POST `/api/auth/forgot-password`
```json
{ "email": "jane@example.com" }
```
Always returns `200` (prevents email enumeration). Sends password-reset email if account exists (token valid 10 minutes).

#### PATCH `/api/auth/reset-password/:token`
```json
{ "password": "newpassword123" }
```
Resets password, auto-logs in (new cookie), sends password-changed email.

#### PATCH `/api/auth/change-password`
```json
{ "currentPassword": "old", "newPassword": "newpassword123" }
```
Rotates JWT cookie. Sends password-changed email.

---

### Scripts — `/api/scripts` (all protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all scripts (no blocks, sorted by updatedAt) |
| POST | `/` | Create new script |
| GET | `/:id` | Get script with all blocks |
| PATCH | `/:id` | Update title and/or blocks |
| DELETE | `/:id` | Delete script |
| PATCH | `/:id/archive` | Archive script |

#### POST `/api/scripts`
```json
// Request
{
  "title": "The Last Frame",
  "blocks": [
    { "type": "scene", "content": "INT. OFFICE - NIGHT" },
    { "type": "action", "content": "Rain streaks the window." }
  ]
}

// Response 201
{
  "status": "success",
  "data": {
    "script": {
      "id": "...",
      "title": "The Last Frame",
      "userId": "...",
      "blocks": [...],
      "wordCount": 7,
      "pageCount": 1,
      "sceneCount": 1,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

#### PATCH `/api/scripts/:id`
```json
// Request — send only what you want to update
{
  "title": "The Last Frame (Revised)",
  "blocks": [ ... ]
}
```
Stats (wordCount, pageCount, sceneCount) are recalculated automatically on every save.

---

## Email Notifications

Seven HTML email templates — all dark-themed, cinematic noir:

| Template | Trigger | Content |
|---|---|---|
| `welcome` | Signup | Welcome message + feature list + dashboard CTA |
| `emailVerification` | Signup | Verification link (24h expiry) |
| `loginAlert` | Login | IP address, timestamp, user-agent |
| `passwordChanged` | Change/reset password | Security notification |
| `passwordResetRequest` | Forgot password | Reset link (10m expiry) |
| `scriptShared` | (future) Script sharing | Share notification with script title |
| `accountDeleted` | Account deletion | Confirmation + recovery note |

---

## Security Features

- **httpOnly JWT cookie** — JavaScript cannot access the token
- **Secure flag** — Cookie only sent over HTTPS in production
- **SameSite** — `strict` in production, `lax` in development
- **bcrypt** — Password hashing with salt rounds of 12
- **Helmet** — Security HTTP headers
- **CORS** — Restricted to `CLIENT_URL` with credentials
- **Rate limiting** — Auth (10/15min), API (200/15min), Email (5/hr)
- **MongoDB sanitization** — Prevents NoSQL injection
- **JWT invalidation** — Tokens issued before password change are rejected
- **Soft delete** — Accounts marked inactive, not destroyed in DB

---

## Connecting the Next.js Frontend

Replace the localStorage-based `AuthContext` and `ScriptsContext` with API calls:

```typescript
// lib/api.ts
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function apiRequest(method: string, path: string, body?: object) {
  const res = await fetch(`${API}${path}`, {
    method,
    credentials: 'include',   // ← sends the httpOnly cookie
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

// signup
await apiRequest('POST', '/api/auth/signup', { name, email, password })

// login
await apiRequest('POST', '/api/auth/login', { email, password })

// get scripts
await apiRequest('GET', '/api/scripts')

// save script
await apiRequest('PATCH', `/api/scripts/${id}`, { title, blocks })
```

Add to your Next.js `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use a strong random `JWT_SECRET` (64+ chars)
- [ ] Use MongoDB Atlas connection string for `MONGO_URI`
- [ ] Configure real SMTP credentials
- [ ] Set `CLIENT_URL` to your deployed frontend URL
- [ ] Set `APP_URL` to your deployed frontend URL
- [ ] Run behind HTTPS (cookie `secure` flag requires it)
- [ ] Use a process manager (PM2) or Docker
# scryptyra-backend
