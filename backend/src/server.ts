import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { app } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';

let server: Server | undefined;
let stopping = false;

async function start(): Promise<void> {
  await connectDatabase();
  server = app.listen(env.PORT, () => {
    console.info(`Lily API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });
  server.on('error', (error) => {
    console.error(`HTTP server failed to start (${error.name})`);
    process.exitCode = 1;
  });
}

async function shutdown(signal: string): Promise<void> {
  if (stopping) return;
  stopping = true;
  console.info(`${signal} received; shutting down Lily API`);

  if (!server) {
    await mongoose.disconnect();
    return;
  }

  server.close(async (error) => {
    if (error) console.error('HTTP server shutdown reported an error');
    await mongoose.disconnect();
    process.exitCode = error ? 1 : 0;
  });
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

void start().catch(() => {
  process.exitCode = 1;
});
