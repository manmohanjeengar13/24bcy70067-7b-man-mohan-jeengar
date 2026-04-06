# ProductHub

A full-stack product management platform with real-time WebSocket updates, JWT authentication, and role-based access control.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express + TypeScript |
| Database | MySQL 8+ with connection pooling |
| Auth | JWT (access 15min / refresh 30d) + bcrypt |
| Real-time | WebSocket (`ws` library) |
| Frontend | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand (persisted to localStorage) |
| HTTP client | Axios with auto-refresh interceptor |

---

## Project structure

```
producthub/
├── backend/          Node.js + Express API
└── frontend/         Next.js 15 app
```

---

## Setup

### Prerequisites

- Node.js 18+
- MySQL 8+

### 1. Clone and install

```bash
# Backend
cd producthub/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure backend environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=4000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=producthub_db
JWT_SECRET=change_this_secret_min32chars_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change_this_refresh_secret_min32chars
JWT_REFRESH_EXPIRES_IN=30d
CLIENT_URL=http://localhost:3000
```

### 3. Configure frontend environment

```bash
cp frontend/.env.example frontend/.env.local
```

`frontend/.env.local` defaults are fine for local dev:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

### 4. Create MySQL database

The backend creates the database and all tables automatically on first run. You only need a running MySQL instance with the credentials from your `.env`.

### 5. Run

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

- API: http://localhost:4000
- App: http://localhost:3000

---

## Test credentials

| Role | Email | Password |
|------|-------|----------|
| 🔴 Admin | admin@example.com | admin123 |
| 🟡 Manager | manager@example.com | manager123 |
| 🟢 User | user@example.com | user123 |

> These are inserted automatically on first startup if no users exist.

---

## Role permissions

| Action | User | Manager | Admin |
|--------|------|---------|-------|
| View products | ✅ | ✅ | ✅ |
| Create product | ❌ | ✅ | ✅ |
| Update product | ❌ | ✅ | ✅ |
| Delete product | ❌ | ❌ | ✅ |
| View all users | ❌ | ❌ | ✅ |
| Change user role | ❌ | ❌ | ✅ |
| Delete user | ❌ | ❌ | ✅ |
| Register (new accounts always start as `user`) | ✅ | ✅ | ✅ |

---

## API endpoints

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Create account |
| POST | `/login` | — | Login, returns tokens |
| POST | `/refresh` | — | Exchange refresh token for new access token |
| POST | `/logout` | — | Invalidate refresh token |
| GET | `/me` | Bearer | Get current user profile |

### Products — `/api/products`

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/` | — | Any |
| GET | `/:id` | — | Any |
| POST | `/` | Bearer | manager+ |
| PUT | `/:id` | Bearer | manager+ |
| DELETE | `/:id` | Bearer | admin |

**Query params for `GET /`:**
- `?category=electronics|clothing|books|sports`
- `?sort=price_asc|price_desc|name_asc|name_desc|created_asc|created_desc`

### Users — `/api/users`

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/` | Bearer | admin |
| GET | `/:id` | Bearer | admin |
| PATCH | `/:id/role` | Bearer | admin |
| DELETE | `/:id` | Bearer | admin |

### Response format

All responses follow:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { ... }
}
```

Errors:

```json
{
  "success": false,
  "message": "What went wrong",
  "error": "Error detail or code"
}
```

---

## WebSocket

Connect to `ws://localhost:4000`.

### Authenticate after connecting

```json
{ "type": "AUTH", "payload": { "token": "<accessToken>" }, "timestamp": "..." }
```

Server replies with `AUTH_SUCCESS` or `AUTH_ERROR`.

### Server-broadcast events

| Event | Trigger |
|-------|---------|
| `PRODUCT_CREATED` | New product created |
| `PRODUCT_UPDATED` | Any product field updated |
| `PRODUCT_DELETED` | Product deleted |
| `PRICE_CHANGED` | Price field specifically changed |
| `STOCK_CHANGED` | Stock field specifically changed |

### Message shape

```ts
{
  type: WsMessageType;
  payload?: unknown;
  timestamp: string;  // ISO 8601
  userId?: string;
  role?: 'admin' | 'manager' | 'user';
}
```

### Heartbeat

Server pings every 30 seconds. Clients that don't respond with `pong` are terminated. The frontend hook handles this automatically with exponential backoff reconnect (1s → 2s → 4s → … → 30s max).

---

## JWT flow

```
Login → { accessToken (15min), refreshToken (30d stored in DB) }
          ↓
Request → Authorization: Bearer <accessToken>
          ↓
401?  → POST /auth/refresh { refreshToken }
          ↓
      → new accessToken (Axios interceptor retries original request)
          ↓
Logout → refresh token deleted from DB (server-side invalidation)
```

---

## Pages

| Path | Access | Description |
|------|--------|-------------|
| `/` | — | Redirects to `/products` or `/login` |
| `/login` | Public | Sign in |
| `/register` | Public | Create account |
| `/products` | Any authenticated | Product grid with filters, live WS indicator |
| `/dashboard` | manager+ | Stats overview, product table, user management (admin) |
