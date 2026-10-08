"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendVerificationCodeEmail = sendVerificationCodeEmail;
exports.sendPasswordResetCodeEmail = sendPasswordResetCodeEmail;
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
async function sendCodeEmail(email, name, code, purpose) {
    const safeName = escapeHtml(name);
    const verification = purpose === 'verify';
    const subject = verification ? 'Verify your Lily Studio email' : 'Reset your Lily Studio password';
    const action = verification ? 'verify your email address' : 'reset your password';
    const text = `Hello ${name},\n\nUse this code to ${action}: ${code}\n\nIt expires in 10 minutes. If you did not request this, you can ignore this email.`;
    const html = `<p>Hello ${safeName},</p><p>Use this code to ${action}:</p><p style="font-size:28px;font-weight:700;letter-spacing:8px">${code}</p><p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>`;
    await getTransporter().sendMail({ from: env_1.env.SMTP_FROM, to: email, subject, text, html });
}
async function sendVerificationCodeEmail(email, name, code) {
    return sendCodeEmail(email, name, code, 'verify');
}
async function sendPasswordResetCodeEmail(email, name, code) {
    return sendCodeEmail(email, name, code, 'reset');
}
