# Lily Resume API

Backend services for Lily Studio, including authentication, profiles/settings, persisted owner-scoped resumes and versions, AI resume intelligence, structured templates, job matching, subscriptions, PDF export, and admin reporting. Payment processing remains mocked in development and is intentionally not connected to a real payment provider.

## Requirements

- Node.js 20 or newer
- MongoDB 6 or newer, running locally or reachable by URI
- SMTP credentials for delivering password-reset messages

## Install and configure

```bash
cd backend
npm install
Copy-Item .env.example .env
```

Edit `.env` and set a unique `JWT_SECRET` with at least 32 characters, a reachable `MONGODB_URI`, and the correct `CLIENT_URL`. Set `AI_PROVIDER`, `AI_API_KEY`, and `AI_MODEL` to enable AI requests; supported providers are `openai` and `anthropic`. The AI key is backend-only and must never be exposed as a frontend environment variable. Set the SMTP variables to enable reset-email delivery. The API never returns reset tokens; without SMTP configuration, reset requests still receive the same generic response and the reset email is not delivered.

For a local MongoDB service, the example URI uses `mongodb://127.0.0.1:27017/Lily_resume_api`.

## Development and production

```bash
npm run dev
```

Development uses `tsx` watch mode and listens on port 4000 by default. Compile and run the production build with:

```bash
npm run build
npm start
```

Run the local integration smoke test against a reachable MongoDB instance by setting `MONGODB_URI` and `JWT_SECRET`, then running `npm run test:smoke`. It exercises the real HTTP routes and removes its temporary account afterward.

The server connects to MongoDB before listening. Startup fails with a non-zero exit code if configuration or the database connection is invalid. Shutdown signals close the HTTP server and MongoDB connection cleanly.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | No | `development`, `test`, or `production` |
| `PORT` | No | HTTP port; defaults to `4000` |
| `MONGODB_URI` | Yes | MongoDB connection URI |
| `JWT_SECRET` | Yes | HS256 signing secret, at least 32 characters |
| `JWT_EXPIRES_IN` | No | Token lifetime such as `15m`, `1h`, or `7d`; defaults to `1h` |
| `CLIENT_URL` | No | Allowed browser origin; defaults to `http://localhost:3000` |
| `SMTP_HOST` | For email | SMTP hostname |
| `SMTP_PORT` | For email | SMTP port; defaults to `587` |
| `SMTP_SECURE` | For email | `true` for implicit TLS, otherwise `false` |
| `SMTP_USER` | For email | SMTP username |
| `SMTP_PASSWORD` | For email | SMTP password or app password |
| `SMTP_FROM` | For email | Verified sender address |
| `PASSWORD_RESET_URL` | For email | Frontend password-reset page URL |
| `AI_PROVIDER` | No | `openai` or `anthropic`; defaults to `openai` |
| `AI_API_KEY` | For AI | Provider API key; backend only |
| `AI_MODEL` | No | Provider model override; defaults to a supported provider model |
| `FREE_AI_MONTHLY_LIMIT` | No | Monthly AI request quota for FREE; defaults to `50` |
| `PREMIUM_AI_MONTHLY_LIMIT` | No | Monthly AI request quota for PREMIUM; defaults to `1000` |

Never commit `.env` files or place secrets in frontend environment variables.

## API structure

```text
src/
  config/       environment and MongoDB connection
  controllers/  HTTP request handlers
  middleware/   authentication, authorization, validation, errors, rate limits
  models/       Mongoose models
  routes/       versionable REST route composition
  services/     user-safe serialization and password-reset email workflow
  types/        request and token types
  utils/        API errors, JWT helpers, response helpers
  validators/   Zod request schemas
  app.ts        Express middleware and route composition
  server.ts     database-first startup and graceful shutdown
```

All JSON responses use `{ "success", "message", "data" }`; errors use `{ "success": false, "message", "errors": [] }`. PDF export returns a private, no-store PDF attachment. Production responses never include stack traces, request bodies, authorization headers, or provider credentials in logs. Helmet, origin-restricted CORS, a 256 KB JSON limit (100 KB max per resume data object), API and authentication rate limits, strict Zod schemas, Mongoose filter sanitization, and safe request timing logs are enabled. Application indexes are explicitly created during database startup even when automatic indexing is disabled in production.

## Authentication flow

Signup and login return a JWT and a password-free user object. Send the JWT on protected routes using `Authorization: Bearer <token>`. `/api/auth/logout` increments the account token version, invalidating all existing tokens for that account. Passwords are bcrypt-hashed before persistence. Password reset tokens are generated with cryptographic randomness, stored only as SHA-256 hashes, expire after 15 minutes, are single-use, and are sent only through SMTP. Resetting a password revokes existing JWTs.

## API Reference

The complete endpoint reference, including authentication requirements, request bodies, query parameters, success data, and common errors, is in [docs/API.md](docs/API.md). Routes are mounted under `/api`.

AI requests are authenticated, globally and per-user rate limited, subject to monthly plan quotas, and validated against structured output schemas. Premium AI tailoring and premium template configuration use shared plan checks. No AI request applies content changes to a resume automatically.

Free resumes expire ten days after creation but remain stored and are reported as expired; expired resumes are not silently deleted. Premium resumes remain permanent after a later downgrade. Template associations are retained, while new premium template selections require an active premium plan. Development subscription upgrades use a mock payment provider and store no payment information. Upgrade and renewal fail closed in production until a real payment adapter is configured.

Admin APIs require an authenticated `ADMIN` user. Public signup cannot grant the admin role.
