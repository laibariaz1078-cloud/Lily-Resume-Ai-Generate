import type { RequestHandler } from 'express';
import mongoose from 'mongoose';

export const health: RequestHandler = (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  const status = databaseConnected ? 'ok' : 'degraded';

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    message: databaseConnected ? 'API is healthy' : 'Database is unavailable',
    data: {
      api: status,
      server: 'running',
      database: databaseConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    },
  });
};
