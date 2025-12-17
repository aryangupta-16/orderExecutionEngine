// src/server.ts
import { buildApp } from "./app";

const PORT = Number(process.env.PORT) || 8000;
const HOST = "0.0.0.0";

async function startServer() {
  const app = buildApp();

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`🚀 Server running on http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

startServer();
