# Appzeto Helpdesk

A production-quality full-stack MERN application that lets a small support team triage, assign, and resolve customer tickets with SLA tracking, lazy SLA escalation, optimistic locking, and a live polling dashboard.

## Tech Stack

- **Backend**: Node.js, Express, Mongoose, MongoDB
- **Frontend**: React (Vite), React Router, Axios, Tailwind CSS
- **No Redux** — local component state + a small custom toast/polling layer is enough.

## Features

### Backend
- **Models**: `Agent`, `Ticket` (with embedded `Comment` and `History` subdocuments).
- **Auto seeder** for agents on boot — creates `Riya (3)`, `Karan (4)`, `Dev (5)` if missing.
- **Auto assignment** by load percentage with deterministic tie-breakers and a **Queued** fallback when everyone is full.
- **Lazy SLA escalation** on read (no cron). Priority is bumped exactly once on SLA breach and recorded in history with a `priorityEscalated` flag.
- **Status machine** with explicit allowed transitions and `400 Invalid status transition` for illegal ones.
- **Optimistic locking** on every mutation via a `version` integer — mismatch returns `409` with `currentTicket`.
- **Single-pipeline stats** endpoint using `$facet`.
- **Auto-pull from queue** whenever a ticket becomes `Resolved` / `Closed`.

### Frontend
- **Ticket List** page with stats bar, debounced (500ms) search, status/priority/sort filters, paginated cards, and **live polling every 5 seconds**. Polling never resets the page, scroll, or dropdowns; when it detects real changes it pops a toast like `“3 tickets updated”` and updates state silently.
- **Create Ticket** page with field-level validation that mirrors the backend exactly.
- **Ticket Detail** page with full info, **live SLA countdown** (green / yellow / red), assignment timeline, comments (disabled with a reason for `Closed` tickets), and a status dropdown that shows **only legal next states**.
- **Optimistic UI** on status changes with rollback + toast on failure.
- **Conflict modal** on `409` showing **Your Change vs Server State** with `Take Theirs` and `Retry Mine On Top` options.
- Loading skeletons, empty states, and error states everywhere.
- Tailwind-based professional dashboard look with color-coded priority/status badges.

## Folder Structure

```
.
├── backend/
│   └── src/
│       ├── controllers/     # ticketController, agentController
│       ├── routes/          # ticketRoutes, agentRoutes
│       ├── services/        # assignmentService, escalationService
│       ├── models/          # Agent, Ticket (with embedded Comment + History)
│       ├── middleware/      # errorHandler, notFound
│       ├── utils/           # constants, sla, validators
│       ├── seeders/         # agentSeeder
│       ├── app.js
│       └── server.js
└── frontend/
    └── src/
        ├── pages/           # TicketListPage, CreateTicketPage, TicketDetailPage
        ├── components/      # Badges, ConflictModal, Modal, Pagination, StatsBar, TicketCard, States, ToastProvider
        ├── hooks/           # useDebouncedValue, useInterval, useNow
        ├── services/        # apiClient, ticketService
        └── utils/           # constants, time
```

## Prerequisites

- Node.js 18+
- A running MongoDB (locally on `mongodb://127.0.0.1:27017` is the default).

## Run — Backend

```bash
cd backend
cp .env.example .env       # optional; defaults are fine for local dev
npm install
npm run dev                # starts on http://localhost:5000 with nodemon
# or: npm start
```

The server connects to MongoDB (`MONGO_URI`), seeds the 3 default agents if they don’t exist, and listens on `PORT` (default `5000`).

Health check:

```bash
curl http://localhost:5000/api/health
```

## Run — Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev                # starts on http://localhost:5173
```

Open <http://localhost:5173> in your browser. The Vite dev server proxies `/api/*` requests to `http://localhost:5000`, so no CORS or env wiring is needed.

## API Surface

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness probe |
| `GET` | `/api/agents` | List agents with active workloads |
| `GET` | `/api/tickets` | Paginated list with `status`, `priority`, `search`, `sort`, `page`, `limit` |
| `GET` | `/api/tickets/stats` | Single-aggregation `{ statusCounts, priorityCounts }` |
| `POST` | `/api/tickets` | Create + auto-assign (validated) |
| `GET` | `/api/tickets/:id` | Fetch one (runs lazy SLA escalation) |
| `PATCH` | `/api/tickets/:id/status` | Body `{ status, version }` — status machine + optimistic locking |
| `POST` | `/api/tickets/:id/comments` | Body `{ text, version }` — blocked on Closed |

### Conflict response shape (HTTP 409)

```json
{
  "message": "Version conflict",
  "currentTicket": { "_id": "...", "version": 7, "status": "Resolved", ... }
}
```

## Quick Manual Smoke Test

1. Start backend + frontend.
2. Hit **+ New Ticket**, create a Critical ticket.
3. Watch it appear on the list, assigned to whichever agent has the lowest load percentage.
4. Open it, change `Open → In Progress → Resolved → Closed`. Note the timeline grows, the status dropdown shrinks legal options, and comments are blocked once Closed.
5. Create 12+ tickets to push some agents to `maxLoad` and watch overflow land in **Queued**.
6. Resolve one and see the oldest Queued ticket auto-flip to `Open` assigned to the freed agent (`Auto assigned from queue`).
7. Open the same ticket in two browser tabs, change status in one, then change in the other → the second tab shows the **conflict modal**.

## Implementation Notes

- **SLA escalation** is intentionally lazy. Every `GET /tickets/:id` and every list page response runs `maybeEscalate`, which checks the breach state, bumps priority once, and flips `priorityEscalated`. No cron, no background workers required.
- **Polling** uses a stable signature (`status:priority:version:commentCount:slaState`) to avoid spurious toasts on no-op refreshes.
- **Optimistic UI** wraps the API call in a small `runMutation` helper that snapshots the previous state and rolls back on failure (other than 409, which routes through the conflict modal).
- **Status machine** is defined once in `backend/src/utils/constants.js` and mirrored in `frontend/src/utils/constants.js` so the dropdown shows only the legal next states for the current status.
