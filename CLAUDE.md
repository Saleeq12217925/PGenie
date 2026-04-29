# CLAUDE.md — PGenie

Instructions and context for Claude Code when working in this repository.

---

## What this app is

PGenie is a full-stack **Paying Guest (PG) Rental Management System** — a MERN app with an AI Python microservice for rent prediction and PG recommendations. Three roles: Admin, Owner, Tenant.

---

## Running the app

### Local dev (without Docker)

```bash
# Terminal 1 — MongoDB
mongod --dbpath ~/data/db

# Terminal 2 — Express backend
cd server && npm run dev          # port 5000

# Terminal 3 — Flask AI microservice
cd ai-service
python -m venv venv && source venv/bin/activate   # first time only
pip install -r requirements.txt                    # first time only
python app.py                                      # port 8000

# Terminal 4 — React frontend
cd client && npm run dev          # port 5173

# One-time seed (after server starts)
node server/scripts/seed.js
```

### Docker

```bash
docker compose up --build

# Seed after containers are running
docker compose exec server node scripts/seed.js
```

App is at **http://localhost:3000** (Docker) or **http://localhost:5173** (local dev).

### Seed credentials

All seed users share: password `PGenie@1234`, MFA base32 `JBSWY3DPEHPK3PXP`

| Email | Role |
|---|---|
| admin@pgenie.com | admin |
| owner1–3@pgenie.com | owner |
| tenant1–5@pgenie.com | tenant |

Generate a live TOTP code for testing:
```bash
node -e "import('speakeasy').then(s => console.log(s.default.totp({ secret: 'JBSWY3DPEHPK3PXP', encoding: 'base32' })))"
```

---

## Architecture

```
Browser → (Docker: nginx:3000) → /api, /uploads, /socket.io → server:5000
                                 /*                          → React SPA
server:5000 → ai-service:8000 (rent prediction, recommendations)
server:5000 → mongo:27017
```

---

## Folder structure

```
PGenie/
├── client/                      React 19 + Vite + Tailwind v4
│   ├── nginx.conf               Docker: proxies /api /uploads /socket.io → server
│   └── src/
│       ├── components/
│       │   ├── auth/            AuthCard, FormField, OtpInput, SubmitButton
│       │   ├── layout/          AppShell (sidebar+nav), ProtectedRoute, Wordmark
│       │   └── ui/              Badge, Card, StatCard, DataTable, Modal,
│       │                        FileUpload, ErrorBanner, Spinner
│       ├── context/             AuthContext, ChatContext (Socket.io)
│       ├── hooks/               useAuth, useChat
│       ├── lib/                 axios.js (JWT interceptor + silent refresh)
│       └── pages/
│           ├── LandingPage.jsx
│           ├── LoginPage.jsx / RegisterPage.jsx / VerifyMfaPage.jsx
│           ├── admin/           AdminDashboardPage, UsersPage, BookingsAdminPage, AuditLogPage
│           ├── owner/           OwnerDashboardPage, MyListingsPage, ListingFormPage, BookingRequestsPage
│           ├── tenant/          TenantDashboardPage, SearchPage, MyBookingsPage
│           └── shared/          PGDetailPage, BookingDetailPage, PaymentPage, ChatPage, NotFoundPage
│
├── server/                      Node.js + Express
│   ├── config/                  db.js, env.js (validates required vars)
│   ├── controllers/             auth, pg, booking, admin, payment, aiProxy
│   ├── middleware/              auth.js (verifyToken, requireRole), rateLimiter,
│   │                            auditLogger, validate, upload (multer)
│   ├── models/                  User, AuditLog, PGListing, Booking, Message
│   ├── routes/                  auth, pgs, bookings, admin, payments, ai
│   ├── scripts/seed.js          Populate DB with test data
│   ├── socket/chatSocket.js     Socket.io real-time chat (auth middleware included)
│   ├── uploads/                 Multer destination for PG photos (Docker: named volume)
│   └── utils/                   crypto.js (AES-256-GCM), jwt.js, mfa.js
│
├── ai-service/                  Python Flask — port 8000
│   ├── app.py                   POST /predict-rent  POST /recommend  GET /health
│   ├── model/
│   │   ├── rent_model.py        RandomForestRegressor — auto-trains on first run
│   │   └── recommender.py       Hybrid: 60% content cosine + 40% collaborative SVD
│   └── data/train_data.py       Synthetic training data generator (2 000 rows)
│
└── docker-compose.yml           mongo, server, ai-service, client (nginx)
```

---

## API reference

### Auth — `/api/auth`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/register` | — | Returns `tempToken` + MFA QR |
| POST | `/login` | — | Returns `tempToken` |
| POST | `/verify-mfa` | — | Returns `accessToken` (15 min) + refresh cookie (7 days) |
| GET | `/me` | ✓ | Current user |
| POST | `/refresh` | — | Rotates refresh token, returns new `accessToken` |
| POST | `/logout` | ✓ | Clears cookie + DB hash |

### PG Listings — `/api/pgs`
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/` | — | `?city=&roomType=&minRent=&maxRent=&amenities=&page=&limit=` |
| GET | `/:id` | — | Single listing |
| GET | `/owner/mine` | owner | Own listings |
| POST | `/` | owner | Create |
| PUT | `/:id` | owner | Update |
| DELETE | `/:id` | owner | Soft-delete (`isActive=false`) |
| POST | `/:id/photos` | owner | Multer upload, max 5 images |

### Bookings — `/api/bookings`
| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/` | tenant | Create request |
| GET | `/mine` | tenant | Own bookings |
| GET | `/requests` | owner | Incoming for owner's listings |
| GET | `/:id` | owner/tenant | |
| PATCH | `/:id/approve` | owner | |
| PATCH | `/:id/reject` | owner | |
| PATCH | `/:id/cancel` | tenant | |
| GET | `/chat/:bookingId` | owner/tenant | Message history |

### Payments — `/api/payments`
| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/initiate` | tenant | Returns fake `orderId` |
| POST | `/confirm` | tenant | Sets `paymentStatus: paid`, `status: active` |

### AI — `/api/ai`
| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/predict-rent` | owner | Proxies to Flask `/predict-rent` |
| GET | `/recommendations` | tenant | Fetches DB data, proxies to Flask `/recommend` |

### Admin — `/api/admin`
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/users` | admin | Paginated |
| PATCH | `/users/:id/role` | admin | |
| GET | `/bookings` | admin | Filterable by status |
| GET | `/audit-logs` | admin | Filterable by action, date |
| GET | `/stats` | admin | Counts + revenue |
| GET | `/owner-stats` | owner | Revenue chart + pending count |

---

## Key patterns

### Auth middleware
```js
import { verifyToken, requireRole } from '../middleware/auth.js';
router.get('/protected', verifyToken, requireRole('admin'), handler);
// req.user = { id, role } inside handlers
```

### Audit logging (fire-and-forget)
```js
import { auditLog } from '../middleware/auditLogger.js';
router.post('/action', verifyToken, auditLog('ACTION_NAME', (req) => ({ meta: req.body.id })), handler);
```

### AES encryption (sensitive fields)
```js
import { encrypt, decrypt } from '../utils/crypto.js';
const stored = encrypt(plaintext);   // "iv:authTag:ciphertext"
const plain  = decrypt(stored);
```

### Frontend auth access
```jsx
import { useAuth } from './hooks/useAuth.js';
const { user, accessToken, status, setTokens, logout } = useAuth();
// status: 'loading' | 'authenticated' | 'unauthenticated'
```

### CSS design tokens (always use these — no hardcoded hex)
```
--text          body text
--text-h        headings / emphasis
--bg            page background
--surface       cards, sidebar, panels
--border        dividers, input borders
--accent        #059669 (emerald-600) — buttons, active states, links
--accent-hover  #047857
--accent-bg     10% accent — active nav, selected chips
--accent-border 50% accent — focused inputs, selected borders
--shadow        subtle card shadow
--shadow-md     elevated card shadow (hover states)
```

### Role colours (via `<Badge variant="..." />`)
- `admin` — red
- `owner` — amber
- `tenant` — purple (accent)
- `approved` / `paid` / `active` — green
- `pending` / `unpaid` — amber
- `rejected` / `cancelled` — red / gray

---

## Environment variables

### `server/.env`
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/pgenie
JWT_SECRET=<64 hex chars>
REFRESH_SECRET=<64 hex chars>
AES_KEY=<64 hex chars — 32 bytes>
CLIENT_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
NODE_ENV=development
```
In Docker, `MONGO_URI` and `AI_SERVICE_URL` are overridden by `docker-compose.yml` to use service names.

### `client/.env`
```env
VITE_API_URL=http://localhost:5000
```
In Docker this is empty (relative URLs served by nginx). Affects photo `src` and Socket.io connection URL.

---

## Data models (key fields)

**User** — `name email passwordHash role mfaSecret(encrypted) mfaEnabled isVerified refreshTokenHash`

**PGListing** — `owner title description address city locality roomType rent deposit amenities[] photos[] totalBeds occupiedBeds rules isActive avgRating`  
Virtual: `occupancyRate = occupiedBeds / totalBeds`

**Booking** — `tenant listing owner checkIn checkOut status(pending→approved|rejected|cancelled|completed) totalAmount paymentStatus(unpaid|paid|refunded) paymentId note`

**Message** — `booking sender role(tenant|owner) content readAt`  
Index: `{ booking: 1, createdAt: 1 }`

**AuditLog** — `userId action ip userAgent meta createdAt`  
TTL index: auto-deleted after 90 days

---

## Things to keep in mind

- **Inline styles only** — components use `style={{}}` objects with CSS variables. No Tailwind utility classes inside JSX (Tailwind is only used for the base reset in `index.css`).
- **No hardcoded colours** — always use CSS variables. Exception: semantic status colours in `Badge.jsx` which are intentional.
- **`VITE_API_URL`** — used for photo `<img src>` and Socket.io URL. Empty string in Docker (nginx proxies); `http://localhost:5000` locally.
- **Socket.io auth** — token passed via `socket.handshake.auth.token`, verified with `verifyAccessToken()` in `chatSocket.js`. Rooms are named by `bookingId`.
- **AI service is optional** — Express proxy returns `503` if Flask isn't running. UI shows an error but doesn't crash.
- **Multer uploads** go to `server/uploads/`. In Docker this is a named volume. Filenames: `<timestamp>-<random>.<ext>`. Served at `/uploads/<filename>`.
- **Payment is fully simulated** — no Razorpay/Stripe keys needed. `initiate` returns a fake `orderId`; `confirm` sets `paymentStatus: paid`.
- **Seed script is destructive** — `node server/scripts/seed.js` drops and recreates all collections. Safe for dev, don't run in production.
