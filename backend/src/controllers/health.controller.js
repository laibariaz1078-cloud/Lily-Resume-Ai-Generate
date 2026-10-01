"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.health = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const health = (_req, res) => {
    const databaseConnected = mongoose_1.default.connection.readyState === 1;
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
exports.health = health;
