# Solana DEX Order Execution Engine

A high-performance, asynchronous order execution system for Solana DEXs with real-time WebSocket updates. This implementation focuses on market orders with DEX routing between Raydium and Meteora.

## ✨ Features

- **DEX Aggregation**: Routes orders to Raydium or Meteora for best execution
- **Real-time Order Tracking**: WebSocket-based order status streaming
- **Idempotent API**: Safe retries with idempotency keys
- **Queue Processing**: Concurrent order processing with BullMQ
- **Mock DEX Integration**: Simulated DEX responses with realistic delays

## 🏗️ Architecture

```
Client → API Server (Fastify) → BullMQ Queue → Worker → DEX (Raydium/Meteora)
     ↑                                ↓                     ↓
     └────── WebSocket ←───── Redis Pub/Sub ←───────┘
```

### Core Components

- **API Server**: Handles HTTP requests and WebSocket connections
- **Worker**: Processes orders asynchronously
- **PostgreSQL**: Persistent storage for orders
- **Redis**: Message broker for queue and pub/sub
- **WebSocket Server**: Pushes real-time order updates

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- pnpm (recommended) or npm

### Setup

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/yourusername/solana-dex-engine.git
   cd solana-dex-engine
   pnpm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Update .env with your configuration
   ```

3. **Start services**
   ```bash
   # Start Redis and PostgreSQL
   docker compose up -d
   
   # Run database migrations
   pnpm prisma migrate dev
   ```

4. **Start the services**
   ```bash
   # Terminal 1 - API Server
   pnpm dev

   # Terminal 2 - Worker
   pnpm worker:dev
   ```

## 📡 API Reference

### Submit Order
```http
POST /api/orders/execute
Content-Type: application/json
Idempotency-Key: your-unique-key

{
  "inputToken": "SOL",
  "outputToken": "USDC",
  "amount": 1.5,
  "orderType": "MARKET",
  "slippage": 0.5
}
```

### WebSocket Connection
Connect to receive real-time order updates:
```
ws://localhost:8000/api/orders/ws?orderId=<orderId>
```

### Order Status Flow
1. `PENDING`: Order received and queued
2. `ROUTING`: Finding best DEX price
3. `BUILDING`: Creating transaction
4. `SUBMITTED`: Transaction sent to network
5. `CONFIRMED`: Transaction successful (includes txHash)
6. `FAILED`: Error occurred (includes error details)

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## 🛠️ Development

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@localhost:5432/orders
REDIS_URL=redis://localhost:6379
PORT=8000
```

### Useful Commands
```bash

# Generate Prisma client
pnpm prisma generate
```

