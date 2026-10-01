"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("./app");
const database_1 = require("./config/database");
const env_1 = require("./config/env");
let server;
let stopping = false;
async function start() {
    await (0, database_1.connectDatabase)();
    server = app_1.app.listen(env_1.env.PORT, () => {
        console.info(`Lily API listening on port ${env_1.env.PORT} (${env_1.env.NODE_ENV})`);
    });
    server.on('error', (error) => {
        console.error(`HTTP server failed to start (${error.name})`);
        process.exitCode = 1;
    });
}
async function shutdown(signal) {
    if (stopping)
        return;
    stopping = true;
    console.info(`${signal} received; shutting down Lily API`);
    if (!server) {
        await mongoose_1.default.disconnect();
        return;
    }
    server.close(async (error) => {
        if (error)
            console.error('HTTP server shutdown reported an error');
        await mongoose_1.default.disconnect();
        process.exitCode = error ? 1 : 0;
    });
}
process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
void start().catch(() => {
    process.exitCode = 1;
});
