"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
let transporter;
function getTransporter() {
    if (!env_1.env.SMTP_HOST || !env_1.env.SMTP_USER || !env_1.env.SMTP_PASSWORD) {
        throw new Error('SMTP is not configured');
    }
    transporter ??= nodemailer_1.default.createTransport({
        host: env_1.env.SMTP_HOST,
        port: env_1.env.SMTP_PORT,
        secure: env_1.env.SMTP_SECURE,
        auth: { user: env_1.env.SMTP_USER, pass: env_1.env.SMTP_PASSWORD },
    });
    return transporter;
}
function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character] ?? character);
}
async function sendPasswordResetEmail(email, name, resetUrl) {
    const safeName = escapeHtml(name);
    await getTransporter().sendMail({
        from: env_1.env.SMTP_FROM,
        to: email,
        subject: 'Reset your Lily Studio password',
        text: `Hello ${name},\n\nUse this link to reset your password. It expires in 15 minutes:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
        html: `<p>Hello ${safeName},</p><p>Use the link below to reset your password. It expires in 15 minutes.</p><p><a href="${escapeHtml(resetUrl)}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    });
}
