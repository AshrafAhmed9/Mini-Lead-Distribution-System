# Prowider — Mini Lead Distribution System

## Live Demo
https://mini-lead-distribution-system-uxdv.vercel.app

## Pages
- `/request-service` — Customer form to submit a service request
- `/dashboard` — Provider dashboard with real-time auto-refresh
- `/test-tools` — Testing panel for webhooks, idempotency, and concurrency

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Validation:** Zod
- **Deployment:** Vercel

## Business Rules
| Service | Mandatory Providers | Round-Robin Pool |
|---|---|---|
| Moving (1) | Provider 1 | Providers 2, 3, 4 |
| Packing (2) | Provider 5 | Providers 6, 7, 8 |
| Storage (3) | Providers 1 & 4 | Providers 2, 3, 5, 6, 7, 8 |

Each lead is assigned to exactly 3 providers total.

## Allocation Algorithm
1. Mandatory providers for the service are assigned first
2. Remaining slots are filled using a **persisted round-robin pointer** stored in the `RoundRobinState` table
3. The pointer cycles through the service-specific pool in order
4. Providers at their monthly quota (10 leads) are skipped
5. The pointer persists across server restarts — stored in the database, not memory

## Concurrency Handling
- The round-robin pointer row is locked with `SELECT FOR UPDATE` inside a database transaction
- Only one lead distribution runs at a time per service pool
- Concurrent requests queue behind the lock, each picking up the already-advanced pointer
- This prevents double-assignment and quota violations under simultaneous load

## Webhook Idempotency
- Every webhook request requires a UUID `event_id`
- Before processing, the system checks if that `event_id` exists in the `WebhookEvent` table
- If it does, returns 200 immediately without reprocessing
- The `WebhookEvent` record and the lead are created in the same transaction — atomic

## API Endpoints
| Method | Route | Description |
|---|---|---|
| POST | /api/leads | Create and distribute a lead |
| GET | /api/leads | List recent leads with assignments |
| GET | /api/providers | Provider stats with monthly usage |
| POST | /api/webhooks/lead | Idempotent webhook receiver |
| POST | /api/webhooks/reset-quota | Reset provider quota (payment webhook) |
| GET | /api/rr-state | View current round-robin pointers |
| GET | /api/health | Database health check |

## Engineering Decisions
- **DB-level unique constraint** on `(phone, service_id)`: enforced at the right layer, not just frontend
- **SELECT FOR UPDATE** over SERIALIZABLE isolation: lighter lock, only serializes the pointer update
- **Persisted pointer per service**: true round-robin semantics, deterministic and auditable
- **Polling over WebSockets**: reliable on Vercel serverless without extra infrastructure
- **Zod validation**: all inputs validated at the API boundary before reaching the database

## Local Setup
```bash
npm install
cp .env.example .env  # add your DATABASE_URL and DIRECT_URL
npx prisma migrate dev
npx prisma db seed
npm run dev
