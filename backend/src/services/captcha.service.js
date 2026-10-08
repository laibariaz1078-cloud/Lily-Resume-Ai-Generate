"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCaptcha = verifyCaptcha;
const env_1 = require("../config/env");
const api_error_1 = require("../utils/api-error");
async function verifyCaptcha(token, remoteAddress) {
    if (!env_1.env.TURNSTILE_SITE_KEY || !env_1.env.TURNSTILE_SECRET_KEY) {
        throw new api_error_1.ApiError(503, 'Account security checks are not configured. Please contact support.');
    }
    const body = new URLSearchParams({
        secret: env_1.env.TURNSTILE_SECRET_KEY,
        response: token,
    });
    if (remoteAddress)
        body.set('remoteip', remoteAddress);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body,
            signal: controller.signal,
        });
        if (!response.ok)
            throw new api_error_1.ApiError(503, 'Security check could not be verified. Please try again.');
        const result = await response.json();
        const expectedHost = new URL(env_1.env.CLIENT_URL).hostname;
        if (!result.success || result.hostname !== expectedHost) {
            throw new api_error_1.ApiError(400, 'Security check expired or could not be verified. Please try again.');
        }
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError)
            throw error;
        throw new api_error_1.ApiError(503, 'Security check could not be verified. Please try again.');
    }
    finally {
        clearTimeout(timeout);
    }
}
