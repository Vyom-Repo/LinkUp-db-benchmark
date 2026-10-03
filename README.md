# Sync — Dual-Database Post–Comment & Performance Benchmark System

> **Academic Project:** *Design and Implementation of a Social Media Post–Comment System Using MongoDB and PostgreSQL: A Comparative NoSQL and Relational Database Performance Study*  
> **Course Alignment:** Gujarat Technological University (GTU) — B.E. Semester 5  
> **Tracks:** Web Application Development (WAD) & Advanced Database Management Systems (ADBMS)  
> **Repository:** [https://github.com/Vyom-Repo/LinkUp-db-benchmark](https://github.com/Vyom-Repo/LinkUp-db-benchmark)

---

## 1. System Overview

**Sync** is a full-stack social platform and empirical database research lab engineered to compare **PostgreSQL (Relational / 3NF)** and **MongoDB (Document-Oriented NoSQL)** under identical social-media workloads.

The project features two distinct experiences:
1. **User Social Portal:** Clean, fast, modern social feed with post publishing, threaded discussions, likes, full-text keyword search, and profile timelines. Users experience no academic labeling or database friction.
2. **Admin Database Analytics Lab (`/admin`):** Real-time database engine switching, live system telemetry (CPU, memory, request volume, latency percentiles), physical storage footprint analysis, native query execution plan inspectors (`EXPLAIN (ANALYZE, BUFFERS)` vs `explain("executionStats")`), and a scientific benchmark suite with visual comparative charts.

---

## 2. Architecture & Design Principles

```
                         ┌──────────────────────┐
                         │       SYNC SPA       │
                         │   (React.js + Vite)  │
                         └──────────┬───────────┘
                                    │
                               HTTP / JSON
                       (X-Database-Engine, Latency)
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Node.js + Express   │
                         └──────────┬───────────┘
                                    │
                        Repository Router Pattern
                                    │
                   ┌────────────────┴────────────────┐
                   ▼                                 ▼
         ┌───────────────────┐             ┌───────────────────┐
         │ PostgreSQL Repo   │             │   MongoDB Repo    │
         │ (pg.Pool raw SQL) │             │  (Native Driver)  │
         └─────────┬─────────┘             └─────────┬─────────┘
                   │                                 │
                   ▼                                 ▼
         ┌───────────────────┐             ┌───────────────────┐
         │ PostgreSQL (SQL)  │             │  MongoDB (NoSQL)  │
         │  Port: 5432       │             │   Port: 27017     │
         └───────────────────┘             └───────────────────┘
```

### Core Architectural Pillars
* **Global Runtime Engine Switching:** Toggled at the server layer without disconnecting active users or requiring client restarts.
* **Deterministic Data Parity:** Both databases share identical UUIDs, usernames, content, and timestamp distributions generated via a fixed-seed Mulberry32 PRNG streaming seeder.
* **Workload-Dependent Evidence:** No artificial delays (`setTimeout`) or bias. Results objectively reflect storage format, indexing efficiency, and engine architecture.

---

## 3. Technology Stack

* **Frontend:** React 18, Vite, React Router v6, Recharts, Lucide React, Vanilla CSS Design System.
* **Backend:** Node.js, Express, `pg` (node-postgres), `mongodb` (native driver), BCrypt.js, JSON Web Tokens (JWT), CORS.
* **Databases:** PostgreSQL 16+, MongoDB 7+.
* **Observability:** Custom monotonic timing middleware capturing `X-Response-Time-Ms` and rolling percentiles ($P_{50}$, $P_{95}$, $P_{99}$, Standard Deviation $\sigma$).

---

## 4. Unified Data Models

Both systems maintain 4 identical logical entities: `users`, `posts`, `comments`, and `post_likes`.

| Entity | PostgreSQL (3NF) | MongoDB (Document Store) | Key Indexes |
| :--- | :--- | :--- | :--- |
| **`users`** | `users` table | `users` collection | Unique `username`, Unique `email` |
| **`posts`** | `posts` table | `posts` collection | `createdAt DESC`, Compound `(authorId, createdAt)`, GIN / Text Index |
| **`comments`**| `comments` table | `comments` collection | Compound `(postId, createdAt ASC)`, `authorId` |
| **`post_likes`**| `post_likes` table | `post_likes` collection | Composite Unique `(postId, userId)` |

### Advanced Engine Automations
* **PostgreSQL:**
  * Automated trigger `trg_posts_search_vector` maintaining `search_vector` via `to_tsvector('english', content)`.
  * Automated triggers maintaining `posts.like_count` and `posts.comment_count` on insert/delete.
* **MongoDB:**
  * Multi-collection sequential application operations maintaining atomic `$inc` counters.
  * Inverted Full-Text Index (`content_text_idx`) for `$text` search queries.

---

## 5. Controlled Benchmark Experiments

The Admin Lab executes 10 controlled experiments with randomized engine order to eliminate thermal throttling and cache warming bias:

1. **Feed Read:** Chronological retrieval with author profile join (`JOIN` vs `$lookup`).
2. **Full-Text Search:** Inverted index scan comparing PostgreSQL GIN vs MongoDB Text Index.
3. **Single Insert:** Individual write latency, WAL, and BSON serialization costs.
4. **Aggregation:** Top 5 engaged posts computation (`GROUP BY` vs `$group` pipeline).
5. **Point Update:** In-place content editing and timestamp updates.
6. **Like & Counter:** Unique constraint verification and counter modification.
7. **Cascade Delete:** Deleting a dedicated fixture post with 50 comments and 100 likes.

---

## 6. Quick Start & Setup

### Prerequisites
* Node.js v18+ & npm
* PostgreSQL running locally on `localhost:5432` with database `sync_db`
* MongoDB running locally on `localhost:27017` with database `sync_db`

### 1. Clone & Configure
```bash
git clone https://github.com/Vyom-Repo/LinkUp-db-benchmark.git
cd LinkUp-db-benchmark
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env

# Initialize database schemas, tables, triggers, and indexes
npm run db:init

# Seed deterministic dataset (1,000 posts, 2,000 comments, 3,000 likes)
npm run seed -- --scale=1000

# Start backend server (Port 5050)
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install

# Start Vite dev server (Port 3000)
npm run dev
```

Open your browser at **`http://localhost:3000`**.

---

## 7. Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@sync.local` | `Admin@Sync2026!` |
| **Test User** | `user_1@sync.local` | `Password123!` |
