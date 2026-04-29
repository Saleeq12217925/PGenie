# PGenie — PG Rental Management System

A secure, full-stack web application for managing Paying Guest (PG) accommodations. Built with the MERN stack (MongoDB, Express, React, Node.js), a Python/Flask AI microservice, and real-time WebSocket chat.

---

## Features

- **Register / Login** with email and password
- **Two-Factor Authentication (2FA)** using Google Authenticator (TOTP)
- **Role-based access** — Tenant, PG Owner, Admin
- **Secure token management** — access tokens in memory, refresh tokens in httpOnly cookies
- **AES-256-GCM encryption** for sensitive data at rest
- **Audit logging** — every auth action is logged to the database, auto-deleted after 90 days
- **Rate limiting** — brute-force protection on all auth routes
- **PG Listings** — owners can create, edit, delete listings with multi-photo uploads (up to 5 photos per listing)
- **Booking workflow** — tenants request bookings; owners approve or reject; tenants can cancel
- **Payment flow** — tenants initiate and confirm payments per booking
- **Real-time chat** — Socket.io-powered in-app messaging per booking between tenant and owner
- **AI rent prediction** — ML model predicts optimal rent for owners based on location, amenities, occupancy, and market trends
- **AI recommendations** — personalised PG recommendations for tenants via a hybrid recommender
- **Admin panel** — manage users, view all bookings, browse audit logs, view platform stats

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router v7 |
| Backend | Node.js 20, Express.js, Socket.io |
| Database | MongoDB 7 (Mongoose) |
| Auth | JWT, bcrypt, speakeasy (TOTP), qrcode |
| File uploads | Multer (local / Docker volume) |
| AI service | Python 3.11, Flask, scikit-learn, pandas, joblib |
| Security | Helmet.js, CORS, express-rate-limit, express-validator |
| Container | Docker, Docker Compose, nginx |

---

## Architecture

### Docker (recommended)

```
Browser → localhost:3000 → nginx (client container)
                              ├── /api/*       → server:5000  (Express REST API)
                              ├── /uploads/*   → server:5000  (static file serving)
                              ├── /socket.io/  → server:5000  (WebSocket upgrade)
                              └── /*           → React SPA (index.html)
```

| Service | Image | Internal port | Persistent volume |
|---|---|---|---|
| `mongo` | `mongo:7` | 27017 | `mongo_data` |
| `server` | `node:20-alpine` | 5000 | `uploads` |
| `ai-service` | `python:3.11-slim` | 8000 | `ai_models` (joblib cache) |
| `client` | `nginx:1.27-alpine` | 3000 → 80 | — |

All four services sit on an internal `pgenie` bridge network. Only the `client` container exposes a port to the host.

### Local dev (without Docker)

The Vite dev server proxies `/api` to `http://localhost:5000` directly, and the client `.env` sets `VITE_API_URL=http://localhost:5000`. Run the server and client independently — no nginx or Docker needed.

---

## Quick Start — Docker

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- [Google Authenticator](https://support.google.com/accounts/answer/1066447) on your phone (for 2FA)

### 1. Clone the repository

```bash
git clone https://github.com/HireMyProject/PGenie.git
cd PGenie
```

### 2. Build and start all services

```bash
docker compose up --build
```

All four services start automatically. The app is available at **http://localhost:3000**.

### 3. Seed demo data (first run only)

```bash
docker compose exec server node scripts/seed.js
```

This creates sample PG listings, users (tenant, owner, admin), and bookings so you can explore the app immediately.

### 4. Seed test users (alternative: clean start)

```bash
# Reset DB and create only test users (admin, owner, tenant)
docker compose exec server node scripts/resetDB.js --force

# Or just add test users without dropping data
docker compose exec server node scripts/seedTestUsers.js

# Or create only the admin user
docker compose exec server node scripts/seedAdmin.js
```

#### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@pgenie.test` | `Admin@123` |
| Owner | `owner@pgenie.test` | `Owner@123` |
| Tenant | `tenant@pgenie.test` | `Tenant@123` |

> **Important:** Always run seed scripts through Docker when using the Docker stack. Running them locally will write to the local MongoDB, not the Docker container's MongoDB.

---

## Quick Start — Local Dev (without Docker)

### Prerequisites

- **Node.js** v18 or later — [Download](https://nodejs.org)
- **Python** 3.11 — [Download](https://www.python.org/downloads/)
- **MongoDB** Community Edition running locally — [Download](https://www.mongodb.com/try/download/community)
- **Google Authenticator** app on your phone

### 1. Clone the repo

```bash
git clone https://github.com/HireMyProject/PGenie.git
cd PGenie
```

### 2. Start the AI service

```bash
cd ai-service
pip install -r requirements.txt
python app.py
# Flask listens on http://localhost:8000
```

### 3. Start the backend server

```bash
cd server
npm install
# server/.env is pre-configured for local dev
npm run dev
# Express listens on http://localhost:5000
```

### 4. Start the frontend

```bash
cd client
npm install
npm run dev
# Vite listens on http://localhost:5173
```

### 5. Open the app

Visit [http://localhost:5173](http://localhost:5173).

---

## Environment Variables

### `server/.env`

A working `.env` is bundled for local development. **Do not use these secrets in production** — regenerate them before deploying.

| Variable | Default (local) | Description |
|---|---|---|
| `PORT` | `5000` | Express listen port |
| `MONGO_URI` | `mongodb://localhost:27017/pgenie` | MongoDB connection string |
| `JWT_SECRET` | (set) | 64-byte hex secret for access tokens |
| `REFRESH_SECRET` | (set) | 64-byte hex secret for refresh tokens |
| `AES_KEY` | (set) | 32-byte hex key for AES-256-GCM encryption |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin |
| `AI_SERVICE_URL` | `http://localhost:8000` | Internal AI service base URL |
| `NODE_ENV` | `development` | `development` or `production` |

### `client/.env`

```env
VITE_API_URL=http://localhost:5000
```

### `ai-service/.env`

```env
MODEL_DIR=model
```

---

## Project Structure

```
PGenie/
├── docker-compose.yml
│
├── client/                        ← React 19 SPA (Vite + Tailwind CSS v4)
│   ├── nginx.conf                 ← Production nginx config (proxy + SPA fallback)
│   ├── Dockerfile
│   └── src/
│       ├── App.jsx                ← React Router routes (role-gated)
│       ├── components/
│       │   ├── auth/              ← AuthCard, FormField, OtpInput, etc.
│       │   ├── layout/            ← ProtectedRoute, Wordmark
│       │   └── ui/                ← Shared UI primitives
│       ├── context/               ← AuthContext (global auth state + token refresh)
│       ├── hooks/                 ← useAuth
│       ├── lib/                   ← Axios instance with silent refresh interceptors
│       └── pages/
│           ├── LoginPage.jsx
│           ├── RegisterPage.jsx
│           ├── VerifyMfaPage.jsx
│           ├── admin/             ← AdminDashboardPage, UsersPage, BookingsAdminPage, AuditLogPage
│           ├── owner/             ← OwnerDashboardPage, MyListingsPage, ListingFormPage, BookingRequestsPage
│           ├── tenant/            ← TenantDashboardPage, SearchPage, MyBookingsPage
│           └── shared/            ← PGDetailPage, BookingDetailPage, PaymentPage, ChatPage, NotFoundPage
│
├── server/                        ← Node.js 20 + Express
│   ├── server.js                  ← Entry point: Express + Socket.io + routes
│   ├── Dockerfile
│   ├── config/                    ← env validation, MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      ← register, login, verifyMfa, me, refresh, logout
│   │   ├── pgController.js        ← CRUD + photo upload for PG listings
│   │   ├── bookingController.js   ← booking lifecycle + chat history
│   │   ├── paymentController.js   ← initiate + confirm payments
│   │   ├── adminController.js     ← users, bookings, audit logs, stats, owner revenue
│   │   └── aiProxyController.js   ← forwards requests to the Python AI service
│   ├── middleware/
│   │   ├── auth.js                ← verifyToken, requireRole
│   │   ├── rateLimiter.js         ← authLimiter, loginLimiter, mfaLimiter
│   │   ├── auditLogger.js         ← writes AuditLog records before/after handlers
│   │   ├── upload.js              ← Multer config (photos → uploads/)
│   │   └── validate.js            ← express-validator error aggregator
│   ├── models/
│   │   ├── User.js
│   │   ├── PGListing.js           ← room types, amenities, occupancy, ratings
│   │   ├── Booking.js             ← status: pending → approved/rejected/cancelled/completed
│   │   ├── Message.js             ← Socket.io chat messages
│   │   └── AuditLog.js
│   ├── routes/
│   │   ├── auth.js  → /api/auth/*
│   │   ├── pgs.js   → /api/pgs/*
│   │   ├── bookings.js → /api/bookings/*
│   │   ├── payments.js → /api/payments/*
│   │   ├── admin.js → /api/admin/*
│   │   └── ai.js    → /api/ai/*
│   ├── socket/
│   │   └── chatSocket.js          ← Socket.io room-based chat per booking
│   ├── utils/                     ← crypto, jwt, mfa helpers
│   └── scripts/
│       ├── seed.js                ← Seeds demo users, listings, and bookings
│       ├── seedAdmin.js           ← Creates default admin user
│       ├── seedTestUsers.js       ← Creates admin + owner + tenant test users
│       └── resetDB.js             ← Drops all collections and re-seeds test users
│
└── ai-service/                    ← Python 3.11 + Flask microservice
    ├── app.py                     ← /predict-rent, /recommend, /health
    ├── requirements.txt
    └── model/
        ├── rent_model.py          ← RentPredictor (scikit-learn, joblib cache)
        └── recommender.py        ← HybridRecommender
```

---

## API Reference

All routes are served under `/api`.

### Auth — `/api/auth`

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register + receive TOTP QR code | — |
| POST | `/auth/login` | Login → returns `tempToken` if 2FA pending | — |
| POST | `/auth/verify-mfa` | Submit TOTP code → receive access token | — |
| GET | `/auth/me` | Get current user | ✅ |
| PATCH | `/auth/profile` | Update name or password | ✅ |
| POST | `/auth/refresh` | Silent access-token refresh via httpOnly cookie | — |
| POST | `/auth/logout` | Invalidate session | ✅ |

### PG Listings — `/api/pgs`

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/pgs` | Browse / search all active listings | — |
| GET | `/pgs/:id` | Get a single listing | — |
| GET | `/pgs/owner/mine` | Owner's own listings | ✅ Owner |
| POST | `/pgs` | Create a new listing | ✅ Owner |
| PUT | `/pgs/:id` | Update a listing | ✅ Owner |
| DELETE | `/pgs/:id` | Delete a listing | ✅ Owner |
| POST | `/pgs/:id/photos` | Upload photos (max 5) | ✅ Owner |

### Bookings — `/api/bookings`

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/bookings` | Create a booking request | ✅ Tenant |
| GET | `/bookings/mine` | Tenant's bookings | ✅ Tenant |
| GET | `/bookings/requests` | Owner's incoming requests | ✅ Owner |
| GET | `/bookings/:id` | Get a single booking | ✅ |
| PATCH | `/bookings/:id/approve` | Approve a booking | ✅ Owner |
| PATCH | `/bookings/:id/reject` | Reject a booking | ✅ Owner |
| PATCH | `/bookings/:id/cancel` | Cancel a booking | ✅ Tenant |
| GET | `/bookings/chat/:bookingId` | Fetch chat history | ✅ |

### Payments — `/api/payments`

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/payments/initiate` | Initiate a payment for a booking | ✅ Tenant |
| POST | `/payments/confirm` | Confirm payment and mark booking paid | ✅ Tenant |

### Admin — `/api/admin`

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/admin/users` | List all users | ✅ Admin |
| PATCH | `/admin/users/:id/role` | Change a user's role | ✅ Admin |
| GET | `/admin/bookings` | List all bookings | ✅ Admin |
| GET | `/admin/audit-logs` | Browse audit log | ✅ Admin |
| GET | `/admin/stats` | Platform statistics | ✅ Admin |
| GET | `/admin/owner-stats` | Owner's revenue report | ✅ Owner |

### AI — `/api/ai`

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/ai/predict-rent` | Predict optimal rent for a listing | ✅ Owner |
| GET | `/ai/recommendations` | Get personalised PG recommendations | ✅ Tenant |

### AI service (internal, port 8000)

| Method | Path | Description |
|---|---|---|
| POST | `/predict-rent` | Rent prediction (location_score, amenities_count, room_type_encoded, occupancy_rate, market_trend_index) |
| POST | `/recommend` | Hybrid recommendations |
| GET | `/health` | Service health check |

---

## Real-time Chat

The server mounts a Socket.io instance on the same HTTP server as Express. Clients join a room keyed by `bookingId`. Both the tenant and the ownerof a booking can exchange messages in real time; history is persisted in the `Message` collection and retrieved via `GET /api/bookings/chat/:bookingId`.

---

## Roles

| Role | Capabilities |
|---|---|
| **Tenant** | Search PGs, view listing details, request bookings, cancel own bookings, make payments, chat with owner, receive AI recommendations |
| **Owner** | Create / edit / delete listings, upload photos, approve or reject booking requests, view revenue stats, use AI rent predictor, chat with tenants |
| **Admin** | View and manage all users, change roles, view all bookings, browse audit logs, view platform statistics |

> Tenant and Owner roles are available for self-registration. Admin accounts must be promoted manually (via the database or the `seed.js` script).

---

## Security Notes

- **Passwords** hashed with bcrypt (12 rounds)
- **MFA secrets** encrypted with AES-256-GCM before storage
- **Access tokens** (15 min) live in browser memory only — never in localStorage
- **Refresh tokens** (7 days) stored in httpOnly cookies and rotated on every use
- **Rate limiting**: auth routes (10 req / 15 min), login (5 req / 15 min), MFA (5 req / 5 min)
- **Audit logs** record every auth and admin action with IP + user agent; auto-deleted after 90 days

---

## Production Notes

Before deploying, **regenerate all secrets**:

```bash
# Run in your terminal and paste results into your production environment
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # AES_KEY
```

Also:

- Set `NODE_ENV=production`
- Set `CLIENT_URL` to your actual frontend domain
- Use a MongoDB Atlas URI instead of `localhost`
- Enable HTTPS — the refresh cookie uses the `Secure` flag in production
- Rotate the `JWT_SECRET` in `docker-compose.yml` (or inject via a secrets manager)

---

## Troubleshooting

**Docker: port 3000 already in use**
→ Stop the conflicting process or change the host port in `docker-compose.yml`: `"3001:80"`

**"MongoDB connection error"** (local dev)
→ Start MongoDB: `brew services start mongodb-community` (macOS) or `sudo systemctl start mongod` (Linux)

**"Missing required environment variable"**
→ Make sure `server/.env` exists and contains all keys shown in `server/.env.example`

**"Invalid authenticator code"**
→ Your phone's clock must be synced. TOTP codes change every 30 seconds.

**AI service not responding**
→ Check `docker compose logs ai-service` or ensure `python app.py` is running on port 8000 locally.

**Port already in use (local dev)**
→ Change `PORT` in `server/.env` and update `vite.config.js` proxy target accordingly.
