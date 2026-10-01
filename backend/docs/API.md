# Lily Studio Backend API

Base URL: `http://localhost:4000/api`. All JSON endpoints use `{ "success": true, "message": "...", "data": {} }`; errors use `{ "success": false, "message": "...", "errors": [{ "field": "...", "message": "..." }] }`. PDF export is the binary exception. JSON requests are limited to 256 KB; resume `data` is limited to 100 KB and 80 top-level fields. Authentication uses `Authorization: Bearer <access-token>`.

## Authentication

| Method | URL | Auth | Request | Success data | Common errors |
|---|---|---|---|---|---|
| POST | `/auth/signup` | No | `{name,email,password}` | `{user,token}` | 400 validation, 409 duplicate email, 429 rate limit |
| POST | `/auth/login` | No | `{email,password}` | `{user,token}` | 400 validation, 401 invalid credentials, 429 |
| GET | `/auth/me` | Yes | None | `{user}` | 401 invalid/expired token |
| POST | `/auth/logout` | Yes | None | `{}` | 401 |
| POST | `/auth/forgot-password` | No | `{email}` | Generic confirmation | 400, 429 |
| POST | `/auth/reset-password` | No | `{token,password}` | Confirmation | 400 invalid/expired token, 429 |

Passwords are never returned. Password-reset delivery requires configured SMTP.

## Users And Settings

| Method | URL | Auth | Request | Success data | Common errors |
|---|---|---|---|---|---|
| GET | `/users/profile` | Yes | None | `{user}` | 401, 404 |
| PUT | `/users/profile` | Yes | Any of `{name,email,profileImage}` | `{user}` | 400 validation, 409 duplicate email |
| PATCH | `/users/me` | Yes | Any of `{name,profileImage}` | `{user}` | 400, 404 |
| PATCH | `/users/password` | Yes | `{currentPassword,newPassword}` | `{}`; current tokens revoked | 400 wrong current password, 401 |
| PATCH | `/users/settings` | Yes | Partial `{theme,notifications,ai}` | `{settings}` | 400 validation |

Changing email marks it unverified. Settings accept `theme: LIGHT|DARK|SYSTEM`, notification booleans `weeklySummary`/`productNews`, and AI booleans `suggestions`/`considerJobDescriptions`/`requireReview`.

## Resumes

All resume resources and versions are owner-scoped. Resume payload shape is `{title,data,favorite?,templateId?}`; `data` contains the frontend renderer's structured resume fields. Free resumes expire ten days after creation and are not deleted; reads include `expiration: {state,isActive,isExpired,expiresAt}`. Premium resumes are permanent. Expired resumes cannot be changed, exported, or matched. Existing permanent resumes and template associations are retained if a user downgrades.

| Method | URL | Auth | Request/query | Success data | Common errors |
|---|---|---|---|---|---|
| GET | `/resumes` | Yes | `page`, `limit` (max 100), `favorite=true|false` | `{items,pagination}` | 400 query validation |
| POST | `/resumes` | Yes | `{title,data,favorite?,templateId?}` | `{resume}` | 400 validation, 403 premium template required |
| GET | `/resumes/:id` | Yes | None | `{resume}` | 400 malformed ID, 404 missing/not owned |
| PUT | `/resumes/:id` | Yes | Partial `{title,data,favorite,templateId}` | `{resume}` | 400, 403, 404, 410 expired |
| DELETE | `/resumes/:id` | Yes | None | `{}` | 400, 404 |
| GET | `/resumes/:id/versions` | Yes | `page`, `limit` (max 100) | `{items,pagination}` | 400, 404 |
| POST | `/resumes/:id/versions/:versionId/restore` | Yes | None | `{resume}` | 400 malformed ID, 404 not owned, 410 expired |
| GET | `/resumes/:id/analysis` | Yes | `page`, `limit` (max 100) | `{items,pagination}` | 400, 404 not owned |
| POST | `/resumes/:id/export/pdf` | Yes | None | `application/pdf` attachment | 400, 404, 410 expired |

PDFs are generated on demand with selectable text, A4 page size, structured sections, page breaks, and supported template colors/typography. Files are not persisted.

## Templates

Template specs are JSON renderer configuration (`layout`, `typography`, `spacing`, `colors`, `sectionOrder`, `headerStyle`, `sidebar`, `borders`, `icons`); no image template is stored. Public reads show active system-template metadata. Premium specs are redacted for anonymous/FREE users and included for authenticated PREMIUM users or administrators. Mutations require an administrator. Template records include nullable `ownerId` to support future user-owned templates.

| Method | URL | Auth | Request/query | Success data | Common errors |
|---|---|---|---|---|---|
| GET | `/templates` | No | `category`, `premium=true|false` or `free=true|false`, `search`, `sort=newest|name-asc|name-desc|relevance`, `page`, `limit` | `{items,pagination}` | 400 query validation |
| GET | `/templates/category/:category` | No | Same list query options | `{items,pagination}` | 400 unsupported category |
| GET | `/templates/:id` | No | ID or slug | `{template}` | 404 inactive/missing |
| POST | `/templates` | Admin | Full template fields and valid `templateSpec` | `{template}` | 400, 401, 403, 409 duplicate slug |
| PUT | `/templates/:id` | Admin | Non-empty partial template fields | `{template}` | 400, 401, 403, 404 |
| DELETE | `/templates/:id` | Admin | None | `{}` | 401, 403, 404 |
| POST | `/templates/generate-concept` | Yes, AI limited | `{style,industry?,preferences?,colorPreferences?,layoutPreferences?}` | Structured template concept | 400, 401, 429, 502/503 AI errors |

Categories: `ATS`, `Modern`, `Minimal`, `Professional`, `Creative`, `Executive`, `Academic`, `Tech` (category filtering is case-insensitive).

## AI

All AI calls stay on the backend. AI routes use an IP-wide API limiter, an authenticated-user AI limiter, and configured monthly plan quotas. Responses are validated before delivery; AI suggestions do not mutate resumes.

| Method | URL | Auth/plan | Request | Success data | Common errors |
|---|---|---|---|---|---|
| POST | `/ai/generate` | Yes, quota | Raw resume facts such as education, workExperience, skills, projects, achievements, targetRole | `{content,questions,suggestions}` | 400, 401, 429, 502/503 |
| POST | `/ai/improve` | Yes, quota | `{resumeId?,section,currentContent,requestedOperation}` | Reviewable original/improved content and suggestions | 400, 401, 429, 502/503 |
| POST | `/ai/suggestions` | Yes, quota | `{resume}` | Structured optional suggestions | 400, 401, 429, 502/503 |
| POST | `/ai/chat` | Yes, quota | `{message,resume}` | `{message,actions}` with before/after/reason/actionType | 400, 401, 429, 502/503 |
| POST | `/ai/analyze-resume` | Yes, quota | `{resumeId?,resume}` | Structured quality/completeness/ATS analysis | 400, 401, 404 not owned, 429, 502/503 |
| POST | `/ai/tailor` | Premium, quota | `{resume,jobDescription}` | Reviewable changes, missing keywords and questions | 400, 401, 403, 429, 502/503 |

`AI_PROVIDER`, `AI_API_KEY`, and `AI_MODEL` are backend environment variables only. Monthly usage defaults to 50 for FREE and 1000 for PREMIUM; configure `FREE_AI_MONTHLY_LIMIT` and `PREMIUM_AI_MONTHLY_LIMIT` to change limits.

## Jobs

Job descriptions must be 50–12,000 characters. Matching and tailoring load the resume from MongoDB by both resume ID and authenticated user ID; clients do not submit resume content.

| Method | URL | Auth/plan | Request | Success data | Common errors |
|---|---|---|---|---|---|
| POST | `/jobs/analyze` | Yes, quota | `{jobDescription}` | `{jobTitle,requiredSkills,preferredSkills,technologies,responsibilities,qualifications,keywords}` | 400, 401, 429, 502/503 |
| POST | `/jobs/match-resume` | Yes, quota | `{resumeId,jobDescription}` | Matching/missing skills, evidence, experience relevance, keyword and section analysis | 400, 401, 404 not owned, 410 expired, 429, 502 |
| POST | `/jobs/tailor` | Premium, quota | `{resumeId,jobDescription}` | Reviewable fact-preserving tailoring suggestions | 400, 401, 403, 404, 410, 429, 502/503 |

Missing skills are reported as missing; users are never advised to claim skills without resume evidence.

## Subscriptions

Development uses a mock payment provider and stores no card data. Upgrade/renew are disabled in production until a real payment provider is configured. Premium periods last 30 days; cancellation immediately reverts effective access to FREE. Subscription history retains the PREMIUM plan with `CANCELLED`/`EXPIRED` status. Plan changes do not delete resumes or template associations.

| Method | URL | Auth | Request | Success data | Common errors |
|---|---|---|---|---|---|
| GET | `/subscription` | Yes | None | `{subscription,effectivePlan}` | 401, 404 |
| POST | `/subscription/upgrade` | Yes | `{plan:"PREMIUM"}` | `{subscription,payment:{provider:"mock",status:"succeeded"}}` | 400, 401, 503 production payment unavailable |
| POST | `/subscription/cancel` | Yes | None | `{subscription}` | 401, 409 no active premium plan |
| POST | `/subscription/renew` | Yes | None | `{subscription,payment}` | 401, 503 production payment unavailable |

## Admin

All endpoints require a valid bearer token and `ADMIN` role. Admin creation is not exposed through public signup.

| Method | URL | Auth | Request | Success data | Common errors |
|---|---|---|---|---|---|
| GET | `/admin/stats` | Admin | None | User, resume, template and subscription aggregates | 401, 403 |
| GET | `/admin/users/count` | Admin | None | `{total,activePremium}` | 401, 403 |
| GET | `/admin/subscriptions/stats` | Admin | None | Subscription counts grouped by plan/status | 401, 403 |
| GET | `/admin/system/health` | Admin | None | Database state, uptime and runtime version | 401, 403 |

## Health And Errors

| Method | URL | Auth | Success data |
|---|---|---|---|
| GET | `/health` | No | API/database readiness |

Common status codes: `400` invalid request, `401` missing/invalid authentication, `403` insufficient role/plan, `404` missing or non-owned resource, `409` conflicting state, `410` expired resume, `413` request too large, `429` rate/quota limit, `502` invalid AI/PDF upstream output, `503` unavailable AI/database/payment service, `500` unexpected internal error. Error responses never include provider secrets or stack traces.
