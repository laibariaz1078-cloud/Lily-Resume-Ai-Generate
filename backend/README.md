# Lily Resume API

Express and MongoDB API for Lily Studio: authentication, profiles/settings, owner-scoped resumes and versions, AI resume tools, templates, job matching, subscriptions, PDF export, and admin reporting. Payment processing remains mocked in development and is not connected to a real payment provider.

## Requirements

- Node.js 20 or newer
- MongoDB 6 or newer
- SMTP credentials for verification and reset email
- Cloudflare Turnstile site and secret keys

## Configure and run

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Set a unique, randomly generated `JWT_SECRET` (at least 32 characters), reachable `MONGODB_URI`, exact frontend `CLIENT_URL`, Turnstile keys, and SMTP credentials in `backend/.env`. For the frontend, copy the repository-root `.env.example` to `.env.local`; set its public API URL and public Turnstile site key. The Turnstile secret, JWT secret, SMTP password, and AI provider key must never be exposed in frontend environment variables.

Production must use HTTPS. Configure `SESSION_COOKIE_SAME_SITE=none` when the frontend and API are on different sites; the API then marks the session cookie `Secure`. Set `CLIENT_URL` to the exact frontend origin (scheme and hostname, without a trailing slash). Rotate any credentials that have ever been committed or shared, including credentials labelled as test values.

Run the API locally:

```powershell
npm run dev
```

Build and start the production JavaScript with `npm run build` and `npm start`. The server connects to MongoDB before listening and exits with a non-zero status if configuration or the database connection is invalid.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | No | `development`, `test`, or `production` |
| `PORT` | No | HTTP port; defaults to `4000` |
| `TRUST_PROXY_HOPS` | No | Trusted reverse-proxy hop count for client IP/rate-limit handling; defaults to `0` |
| `MONGODB_URI` | Yes | MongoDB connection URI |
| `JWT_SECRET` | Yes | Legacy HS256 bearer-token signing secret, at least 32 characters; production rejects placeholders |
| `JWT_EXPIRES_IN` | No | Legacy bearer-token lifetime such as `15m`, `1h`, or `7d`; defaults to `1h` |
| `CLIENT_URL` | No | Exact allowed browser origin; defaults to `http://localhost:3000` |
| `SESSION_COOKIE_NAME` | No | HttpOnly session cookie name |
| `SESSION_TTL_HOURS` | No | Session lifetime without remember-me; 1–168 hours |
| `REMEMBER_ME_TTL_DAYS` | No | Remember-me session lifetime; 1–90 days |
| `SESSION_COOKIE_SAME_SITE` | No | Cookie policy: `strict`, `lax`, or `none` |
| `TURNSTILE_SITE_KEY` | For auth | Cloudflare Turnstile public site key |
| `TURNSTILE_SECRET_KEY` | For auth | Cloudflare Turnstile server-side secret |
| `SMTP_HOST` | For email | SMTP hostname |
| `SMTP_PORT` | For email | SMTP port; defaults to `587` |
| `SMTP_SECURE` | For email | `true` for implicit TLS, otherwise `false` |
| `SMTP_USER` | For email | SMTP username |
| `SMTP_PASSWORD` | For email | SMTP password or app password |
| `SMTP_FROM` | For email | Verified sender address |
| `PASSWORD_RESET_URL` | Legacy | URL used by the previous reset-link workflow |
| `AI_PROVIDER` | No | `openai` or `anthropic`; defaults to `openai` |
| `AI_API_KEY` | For AI | Provider API key; backend only |
| `AI_MODEL` | No | Provider model override |
| `FREE_AI_MONTHLY_LIMIT` | No | Monthly AI request quota for FREE; defaults to `50` |
| `PREMIUM_AI_MONTHLY_LIMIT` | No | Monthly AI request quota for PREMIUM; defaults to `1000` |

## Authentication

Signup sends a 4-digit verification code and does not create a signed-in session. Email verification is required before login. Signup, login, email verification, code resend, and password reset require a server-verified Turnstile response. Verification and reset codes are generated with cryptographic randomness, HMAC-hashed using the server secret, valid for 10 minutes, limited to five attempts, and sent only through SMTP.

Successful login creates an opaque, random session. Only its SHA-256 hash is stored in MongoDB; the browser receives the raw token in an HttpOnly, SameSite cookie. Sessions expire, support an optional remember-me duration, and are revoked on logout, password change, or password reset. SameSite and origin checks protect cookie-authenticated writes against CSRF. Existing bearer JWT clients remain supported, but the browser frontend never stores tokens in `localStorage`.

The frontend restores a session through `/api/auth/me` and gates the workspace and resume builder while checking it. Passwords are bcrypt-hashed before persistence. Reset requests do not disclose whether an email address has an account. Email changes remain pending until the new address is verified.

## Tests

Run fast model/schema validation tests:

```powershell
npm run test:validation
```

Run the HTTP integration smoke test against a reachable MongoDB instance:

```powershell
npm run test:smoke
```

The smoke test does not bypass Turnstile or SMTP. It verifies that auth routes reject requests without security tokens, exercises authenticated account/resource routes, and removes its temporary account afterward.

## API behavior

Routes are mounted under `/api`. JSON responses use `{ "success", "message", "data" }`; errors use `{ "success": false, "message", "errors": [] }`. PDF export returns a private, no-store attachment. Helmet, exact-origin CORS, a 256 KB JSON limit, API/auth rate limits, strict Zod schemas, Mongoose filter sanitization, owner-scoped resource access, and safe request timing logs are enabled. Production logs do not include request bodies, authorization headers, provider credentials, or stack traces.

Admin APIs require an authenticated `ADMIN` account. Public signup cannot set the admin role. AI requests are authenticated, rate limited, subject to plan quotas, and validated against structured output schemas. Free resumes expire ten days after creation but are retained and reported as expired; premium resumes remain permanent after a later downgrade. Development subscription upgrades use a mock payment provider; upgrade and renewal fail closed in production until a real payment adapter is configured.

The complete endpoint reference is in [docs/API.md](./docs/API.md).
