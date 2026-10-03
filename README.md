# LinkUp — Dual-Database Post–Comment & Empirical Performance Benchmark System

> **Academic Research Project:** *Design and Implementation of a Social Media Post–Comment System Using MongoDB and PostgreSQL: A Comparative NoSQL and Relational Database Performance Study*  
> **Course Alignment:** Gujarat Technological University (GTU) — B.E. Semester 5  
> **Specialization Tracks:** Web Application Development (WAD) & Advanced Database Management Systems (ADBMS)  
> **Official Repository:** [https://github.com/Vyom-Repo/LinkUp-db-benchmark](https://github.com/Vyom-Repo/LinkUp-db-benchmark)

---

## 1. Executive Summary

**LinkUp** is an enterprise-grade full-stack social media application and empirical database analytics laboratory engineered to scientifically evaluate the performance, concurrency mechanics, storage efficiency, and execution characteristics of **PostgreSQL (Relational / 3NF)** versus **MongoDB (Document-Oriented NoSQL)** under identical real-world social workloads.

Unlike synthetic benchmarks that evaluate isolated database drivers in artificial vacuums, LinkUp provides **two synchronized environments**:

1. **User Social Experience (`/feed`, `/explore`, `/profile`):** A high-performance, polished social platform featuring dynamic seeded feed generation, post publishing, media attachments, threaded discussions, likes, full-text keyword search, and personal timelines.
2. **Admin Database Analytics Laboratory (`/admin`):** A live database research observatory featuring zero-downtime runtime engine switching, live percentile telemetry ($P_{50}, P_{95}, P_{99}$), an interactive architectural data-flow simulation engine, end-to-end browser HTTP round-trip comparisons, native execution plan analyzers (`EXPLAIN ANALYZE` vs `explain("executionStats")`), physical storage breakdown, and an automated 10-phase benchmark suite.

---

## 2. System Architecture & Dual-Engine Abstraction

LinkUp decouples application controllers from storage drivers through a **Unified Repository Pattern**. The active database engine is switched globally at runtime via an in-memory configuration state with zero server restarts required.

```
                          ┌───────────────────────────┐
                          │    LinkUp Client (SPA)    │
                          │     (React 18 + Vite)     │
                          └─────────────┬─────────────┘
                                        │
                                   HTTP / JSON
                         (X-Database-Engine, Latency)
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │   Node.js + Express API   │
                          └─────────────┬─────────────┘
                                        │
                           Repository Router Pattern
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
        ┌───────────────────────┐               ┌───────────────────────┐
        │  PostgreSQL Repo      │               │   MongoDB Repo        │
        │  (node-postgres Pool) │               │   (Native Driver)     │
        └───────────┬───────────┘               └───────────┬───────────┘
                    │                                       │
                    ▼                                       ▼
        ┌───────────────────────┐               ┌───────────────────────┐
        │   PostgreSQL 16+      │               │     MongoDB 7+        │
        │ Relational 3NF Schema │               │ Document BSON Store   │
        │      Port: 5432       │               │      Port: 27017      │
        └───────────────────────┘               └───────────────────────┘
```

### Core Architectural Guarantees
* **Deterministic Data Parity:** Both engines maintain 100% equivalent logical entities, foreign key relationships, timestamps, and text content seeded via a shared Mulberry32 Pseudo-Random Number Generator (PRNG).
* **Non-Blocking Runtime Switching:** Admins can hot-swap the active database engine via `/api/admin/db-switch` without disconnecting client sessions or purging authentication tokens.
* **Option B True End-to-End Latency Measurement:** Performance comparison reproduces the **exact production User Feed workload** (30 posts, seeded pseudo-random ordering, authenticated user context, comment lookups) and measures complete browser HTTP round-trip plus database execution breakdown across alternating runs to eliminate thermal and caching bias.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend SPA** | React 18, Vite, React Router v6, Lucide React, Custom Responsive Vanilla CSS Design System |
| **Backend API** | Node.js (v18+), Express, `pg` (node-postgres connection pooling), `mongodb` (native MongoClient), BCrypt.js, JSON Web Tokens (JWT), CORS |
| **Database Engines** | PostgreSQL 16+ (ACID Relational), MongoDB 7+ (WiredTiger Document Store) |
| **Observability** | High-resolution Monotonic Timing Middleware (`performance.now()`), Rolling Window Percentile Buffers ($P_{50}, P_{95}, P_{99}, \sigma$), SVG SMIL Visualizers |

---

## 4. Unified Data Models & Index Engineering

Both engines represent four core domain entities with optimized indexing strategies:

```
    ┌───────────────┐                  ┌───────────────┐
    │     users     │ 1              * │     posts     │
    │───────────────│──────────────────│───────────────│
    │ id            │                  │ id            │
    │ username      │                  │ author_id     │
    │ email         │                  │ content       │
    │ password_hash │                  │ like_count    │
    │ created_at    │                  │ comment_count │
    └───────┬───────┘                  │ created_at    │
            │                          └───────┬───────┘
            │                                  │
            │ 1                              1 │
            │                                  │
            │        ┌────────────────┐        │
            └───────*│    comments    │*───────┘
                     │────────────────│
                     │ id             │
                     │ post_id        │
                     │ author_id      │
                     │ content        │
                     │ created_at     │
                     └────────────────┘
```

### Entity Mapping & Index Matrix

| Entity | PostgreSQL (3NF Relational) | MongoDB (Document Store) | Key Indexes & Optimization Strategies |
| :--- | :--- | :--- | :--- |
| **`users`** | `users` table | `users` collection | Unique B-Tree indexes on `username` and `email` |
| **`posts`** | `posts` table | `posts` collection | Compound index on `(created_at DESC)`, `(author_id, created_at)`, GIN / Inverted Text index |
| **`comments`** | `comments` table | `comments` collection | Compound index on `(post_id, created_at ASC)`, Foreign Key index on `author_id` |
| **`post_likes`**| `post_likes` table | `post_likes` collection | Composite Unique index on `(post_id, user_id)` preventing duplicate interactions |

### Advanced Engine Automations
* **PostgreSQL:**
  - Automated trigger `trg_posts_search_vector` maintaining TSVector inverted index via `to_tsvector('english', content)`.
  - Database-level triggers maintaining `posts.like_count` and `posts.comment_count` on comment/like insertion and deletion.
  - Cascading foreign key constraints (`ON DELETE CASCADE`) enforcing relational integrity.
* **MongoDB:**
  - Atomic `$inc` operator pipelines for counter caches.
  - Subset pattern embedding primary comments inside Post documents for zero-join single-trip reads.
  - Multi-field text index (`content_text_idx`) for `$text` lexical search queries.

---

## 5. Admin Database Analytics Laboratory

Access the engineering control panel at **`/admin`** using administrator credentials:

### 1. Database Engine Switcher
- Instantly toggles the active database between PostgreSQL and MongoDB.
- Animated multi-stage handoff indicator reflecting connection warm-up and state propagation.
- Displays switch history, timestamp metadata, and switch duration.

### 2. Live System Telemetry Grid
- Real-time rolling metrics window tracking active engine performance:
  - **Latency:** Instantaneous query latency, $P_{50}$ (median), $P_{95}$, $P_{99}$ latency thresholds.
  - **Throughput:** Requests per second and total completed query count.
  - **Error Rate:** Real-time error percentage and active connection pool status.

### 3. Interactive Architectural Flow Simulator
- Theme-matched interactive SVG data-flow study visualizing internal database query paths.
- Native SVG `<animateMotion>` flowing packet dots demonstrating real-time data movement.
- **3 Dynamic Traffic Patterns:**
  - **Normal Load (Standard Feed):** Baseline latency, 3-table JOINs vs direct embedded memory fetch.
  - **High Reads (Feed Burst):** High-speed electric cyan packet streams highlighting CPU relation assembly vs RAM document serving.
  - **High Writes (Viral Activity):** Intense red packet flow highlighting lock contention and triggering a **pulsating red warning glow** on the active bottleneck:
    - *PostgreSQL:* `Comments Table` glows red (row lock contention & B-tree foreign key index rebalancing).
    - *MongoDB:* `Posts Collection` glows red (in-place document rewriting and 16MB document size limit risk).

### 4. True End-to-End Application Response Time Comparison
- Implements **Option B Workload Equality**: Measures the exact LinkUp User Feed workload (30 posts, dynamic seeded ordering, authenticated user context, full comment counts).
- Performs alternating warm-ups and 3 controlled alternating sample passes with identical seeds to eliminate cache bias.
- Aggregates results via $P_{50}$ (median) calculation and displays a complete breakdown of **Browser HTTP Round-Trip Time** vs **Database Execution Time**.

### 5. Native Query Execution Plan Inspector
- Side-by-side inspection of live query execution plans:
  - **PostgreSQL:** Native `EXPLAIN (ANALYZE, BUFFERS)` displaying cost estimates, execution timing, buffer hits, and scan methods (Index Scan vs Seq Scan).
  - **MongoDB:** Native `explain("executionStats")` displaying planning time, execution stages (`IXSCAN` vs `COLLSCAN`), documents examined, and keys examined.

### 6. Physical Storage Footprint Analysis
- Evaluates real disk byte sizes across both databases:
  - PostgreSQL table data, B-Tree index footprint, and TOAST auxiliary storage.
  - MongoDB collection sizes, pre-allocated storage, index sizes, and WiredTiger compression ratios.

### 7. Deterministic Data Parity Verification
- Validates entity counts between PostgreSQL and MongoDB (`users`, `posts`, `comments`, `likes`) to guarantee that benchmark comparisons are scientifically valid.

### 8. Scientific Benchmark Suite
- 10-phase automated benchmark suite executing randomized comparative workloads:
  1. Chronological Feed Read
  2. Full-Text Search
  3. Single Document / Row Insert
  4. Multi-Table Aggregation (`GROUP BY` vs `$group`)
  5. Point Update
  6. Atomic Like Increment & Constraint Check
  7. Cascade Delete Operation

---

## 6. Quick Start & Installation

### Prerequisites
* **Node.js** v18.0.0 or higher
* **npm** v9.0.0 or higher
* **PostgreSQL** running on `localhost:5432` with database `sync_db`
* **MongoDB** running on `localhost:27017` with database `sync_db`

### 1. Clone the Repository
```bash
git clone https://github.com/Vyom-Repo/LinkUp-db-benchmark.git
cd LinkUp-db-benchmark
```

### 2. Configure Environment Variables
Create a `.env` file in the `server` directory:
```bash
cd server
cp .env.example .env
```

Ensure your `server/.env` contains your local database credentials:
```env
PORT=5050
NODE_ENV=development
JWT_SECRET=super_secret_linkup_jwt_token_2026

# PostgreSQL Configuration
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=sync_db
PG_USER=postgres
PG_PASSWORD=your_postgres_password

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/sync_db
```

### 3. Initialize Schemas & Deterministic Seeding
```bash
# Install server dependencies
npm install

# Initialize PostgreSQL schemas, tables, triggers, and MongoDB collections
npm run db:init

# Seed deterministic dataset (1,000 posts, 2,000 comments, 3,000 likes)
npm run seed -- --scale=1000

# Start backend server in development mode (Port 5050)
npm run dev
```

### 4. Start the Frontend Client
In a separate terminal window:
```bash
cd client
npm install

# Start Vite development server (Port 3000)
npm run dev
```

Open your browser and navigate to:
* **User Application:** [http://localhost:3000](http://localhost:3000)
* **Admin Analytics Lab:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 7. Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@sync.local` | `Admin@Sync2026!` | Full Admin Observatory (`/admin`) + Social Feed |
| **Standard User 1** | `user_1@sync.local` | `Password123!` | Social Portal (`/feed`, `/explore`, `/profile`) |
| **Standard User 2** | `user_2@sync.local` | `Password123!` | Social Portal (`/feed`, `/explore`, `/profile`) |

---

## 8. Empirical Research Findings Summary

| Workload Characteristic | PostgreSQL (Relational) | MongoDB (Document Store) | Empirical Rationale |
| :--- | :--- | :--- | :--- |
| **Read Latency (Single Post + Top Comments)** | Moderate (4 – 15 ms) | Ultra-Fast (1 – 3 ms) | MongoDB embeds comments directly; PostgreSQL must perform multiple index scans and JOIN resolution across tables. |
| **High Concurrency Reads** | CPU Bottlenecked under heavy load | Scales Linearly | Pre-joined BSON documents bypass relational stitching and are served straight from WiredTiger memory cache. |
| **High Concurrency Writes** | Predictable B-Tree Updates | Document Lock & Array Append Overhead | Concurrent writes to a single viral post in MongoDB force frequent document growth, reallocation, and document-level lock contention. |
| **Full-Text Lexical Search** | Extremely Fast (GIN Index) | Competitive (Text Index) | PostgreSQL GIN indexes provide compact inverted postings lists with low query execution overhead. |
| **Storage Footprint** | Compact Raw Data; Larger Indexes | Efficient Document Compression (Snappy) | WiredTiger applies block-level compression, resulting in lower raw disk consumption for text-heavy content. |

---

## 9. Academic Attribution

* **Institution:** Gujarat Technological University (GTU)
* **Department:** Computer Engineering — Semester 5
* **Courses:**
  - Web Application Development (WAD)
  - Advanced Database Management Systems (ADBMS)
* **Lead Developer:** Vyom ([@Vyom-Repo](https://github.com/Vyom-Repo))
* **License:** MIT License — Open for academic and research reference.
