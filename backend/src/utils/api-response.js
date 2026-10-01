"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
function sendSuccess(res, statusCode, message, data) {
    res.status(statusCode).json({ success: true, message, data });
}
