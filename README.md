Order Execution System – Architecture & Flow

This project implements an asynchronous order execution system with real-time status updates.
It is designed to be idempotent, fault-tolerant, and process-safe, with clear separation between API, worker, and real-time delivery layers.

High-Level Overview

The system consists of:

HTTP API server – accepts client requests

PostgreSQL (Neon) – persistent source of truth

Redis – queue + pub/sub

BullMQ worker – executes orders asynchronously

WebSocket server – pushes live order updates to clients

Prisma – database ORM

Docker Compose – local development setup

The API server and worker run as separate processes.

Core Design Goals

Idempotent APIs (safe retries)

Asynchronous execution (non-blocking)

Real-time updates via WebSockets

Crash-safe execution with retries

Database-driven state management

Complete Order Flow
1. Client → API (HTTP)

Client sends a request to create an order.

Each request must include an Idempotency-Key header.

The API:

Checks if the idempotency key already exists

Returns the existing order if found

Otherwise creates a new order with status = PENDING

2. API → Queue (BullMQ)

After creating the order:

Order ID is pushed to the order-execution queue

API responds immediately with the orderId

This keeps the HTTP layer fast and non-blocking.

3. Worker → Order Processing

Worker runs as a separate process

Consumes jobs from BullMQ

Executes the order step-by-step:

ROUTING

BUILDING

SUBMITTED

CONFIRMED or FAILED

Each step:

Updates the order status in PostgreSQL

Persists metadata like txHash, executionPrice, or error

4. Worker → Redis Pub/Sub

After each status update:

Worker publishes an event to Redis

Redis is used only as a signaling layer, not for persistence

5. Server → WebSocket → Client

API server subscribes to Redis events

For each event:

Message is forwarded to the WebSocket manager

WebSocket manager pushes the update to the connected client

WebSocket Behavior

Clients connect using orderId

WebSocket is used only for live updates

Database remains the source of truth

Late or disconnected clients can always fetch the latest status via HTTP

Idempotency Guarantees
Create Order API

Enforced using:

Idempotency-Key header

Database uniqueness constraint

Guarantees:

No duplicate orders

Safe client retries

Worker Execution

Worker always reads and writes state through the database

Retries are safe and deterministic

No duplicate execution side effects

Database

PostgreSQL (Neon in production)

Prisma as ORM

Database acts as:

Source of truth

Recovery mechanism

Audit log

Project Setup (Step-by-Step)
1. Prerequisites

Make sure you have the following installed:

Node.js (v18+ recommended)

Docker & Docker Compose

npm or pnpm

A Neon PostgreSQL database (or local Postgres)

2. Clone the Repository
git clone <repository-url>
cd <project-root>

3. Install Dependencies
npm install

4. Environment Variables

Create a .env file in the project root:

DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>
REDIS_HOST=localhost
REDIS_PORT=6379


For Neon, use the connection string provided in the Neon dashboard.

5. Prisma Setup
Generate Prisma Client
npx prisma generate

Run Migrations
npx prisma migrate dev


This will create the required tables in PostgreSQL.

6. Start Infrastructure (Redis + Postgres)
docker compose up -d


This starts:

Redis

Any local Postgres service (if configured)

7. Start the API Server
npm run dev


The API server will:

Accept HTTP requests

Manage WebSocket connections

Subscribe to Redis events

8. Start the Worker Process

In a separate terminal:

npm run worker:dev


The worker will:

Consume jobs from BullMQ

Execute orders

Update the database

Publish events to Redis

9. Create an Order

Example HTTP request:

POST /api/orders/execute
Idempotency-Key: abc-123
Content-Type: application/json

{
  "inputToken": "SOL",
  "outputToken": "USDC",
  "amount": 10,
  "orderType": "MARKET",
  "slippage": 0.5
}


Response:

{
  "orderId": "uuid"
}

10. Subscribe to WebSocket Updates
ws://localhost:8000/api/orders/execute?orderId=<orderId>
