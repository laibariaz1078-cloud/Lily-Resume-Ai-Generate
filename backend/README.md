# Lily Resume API

Part 1 backend foundation for Lily Studio. This service currently provides health checks, account authentication, profile updates, and password-reset infrastructure only. Resume CRUD, AI, templates, payments, exports, and job matching are intentionally out of scope.

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

Edit `.env` and set a unique `JWT_SECRET` with at least 32 characters, a reachable `MONGODB_URI`, and the correct `CLIENT_URL`. Set the SMTP variables to enable reset-email delivery. The API never returns reset tokens; without SMTP configuration, reset requests still receive the same generic response and the reset email is not delivered.

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

All JSON responses use `{ "success", "message", "data" }`; errors use `{ "success": false, "message", "errors": [] }`. Production responses never include stack traces. Helmet, origin-restricted CORS, 10 KB JSON limits, strict Zod schemas, Mongoose filter sanitization, and per-IP authentication rate limits are enabled.

## Authentication flow

Signup and login return a JWT and a password-free user object. Send the JWT on protected routes using `Authorization: Bearer <token>`. `/api/auth/logout` increments the account token version, invalidating all existing tokens for that account. Passwords are bcrypt-hashed before persistence. Password reset tokens are generated with cryptographic randomness, stored only as SHA-256 hashes, expire after 15 minutes, are single-use, and are sent only through SMTP. Resetting a password revokes existing JWTs.

## Endpoints

| Method | Path | Access |
| --- | --- | --- |
| `GET` | `/api/health` | Public |
| `POST` | `/api/auth/signup` | Public, rate limited |
| `POST` | `/api/auth/login` | Public, rate limited |
| `GET` | `/api/auth/me` | Bearer token |
| `POST` | `/api/auth/logout` | Bearer token |
| `POST` | `/api/auth/forgot-password` | Public, rate limited |
| `POST` | `/api/auth/reset-password` | Public, rate limited |
| `PATCH` | `/api/users/me` | Bearer token |

The admin authorization middleware is included for future routes. No admin signup path is exposed.
