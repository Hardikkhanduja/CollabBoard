<div align="center">

# 🎨 CollabBoard

**Real-time collaborative whiteboard — draw, annotate, and create together, live.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-collab--board--coral.vercel.app-6ee7b7?style=for-the-badge)](https://collab-board-coral.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## ✨ Features

- 🖊️ **Real-time drawing** — powered by [tldraw](https://tldraw.com) with full canvas tools
- 👥 **Live collaboration** — see other users' cursors and changes instantly via WebSockets + Yjs
- 🔐 **Authentication** — sign in with Clerk (Google, GitHub, email)
- 📋 **Board management** — create, rename, and delete boards
- 🔗 **Invite system** — share boards with a simple invite code
- 📸 **Snapshots** — save and restore canvas states
- 🌐 **Presence indicators** — see who's online in each board

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, tldraw |
| Backend | Node.js, Express, Socket.io |
| Real-time | Yjs, y-websocket |
| Auth | Clerk |
| Database | PostgreSQL (Supabase) + Prisma ORM |
| Cache | Upstash Redis |
| Deployment | Vercel (client) + Railway (server) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Clerk](https://clerk.com) account
- A [Supabase](https://supabase.com) PostgreSQL database
- An [Upstash](https://upstash.com) Redis instance

### 1. Clone the repo

```bash
git clone https://github.com/Hardikkhanduja/CollabBoard.git
cd CollabBoard/collabboard
```

### 2. Install dependencies

```bash
# Install client deps
cd client && npm install

# Install server deps
cd ../server && npm install
```

### 3. Configure environment variables

**Client** — copy `client/.env.example` to `client/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
VITE_CLIENT_URL=http://localhost:5173
```

**Server** — copy `server/.env.example` to `server/.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/collabboard
UPSTASH_REDIS_REST_URL=https://your-upstash-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...
CLIENT_URL=http://localhost:5173
PORT=4000
```

### 4. Set up the database

```bash
cd server
npx prisma migrate deploy
```

### 5. Run locally

```bash
# Terminal 1 — start the server
cd server && npm run dev

# Terminal 2 — start the client
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📖 How to Use

### Creating a Board

1. Sign in with your account
2. Click **Create Board** on the home screen
3. Enter a board name and confirm
4. You'll be taken directly to your new board

### Inviting Collaborators

1. Inside a board, click the **Share** button in the top bar
2. The invite code is copied to your clipboard
3. Share the code with others
4. They go to the home screen → **Join with Code** → paste the code

### Drawing Tools

Once inside a board, use the tldraw toolbar to:
- ✏️ Draw freehand
- 🔷 Add shapes (rectangles, ellipses, arrows)
- 📝 Add text
- 🖼️ Insert images
- 🗑️ Erase elements

### Snapshots

- Click the **History** icon to open the snapshot drawer
- Save the current canvas state with a label
- Restore any previous snapshot at any time

---

## 📁 Project Structure

```
collabboard/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── pages/   # Home, Board, Join, NotFound
│       ├── components/
│       ├── hooks/
│       └── lib/     # API, socket, Yjs setup
├── server/          # Express backend
│   └── src/
│       ├── routes/  # users, rooms, snapshots
│       ├── socket/  # Socket.io + Yjs provider
│       └── middleware/
└── shared/          # Shared type definitions
```

---

## 🌍 Deployment

| Service | Purpose |
|---------|---------|
| [Vercel](https://vercel.com) | Hosts the React client |
| [Railway](https://railway.app) | Hosts the Node.js server (WebSocket support) |
| [Supabase](https://supabase.com) | PostgreSQL database |
| [Upstash](https://upstash.com) | Redis for presence/caching |


