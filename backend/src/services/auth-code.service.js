"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueEmailVerificationCode = issueEmailVerificationCode;
exports.issuePasswordResetCode = issuePasswordResetCode;
exports.resetPasswordWithCode = resetPasswordWithCode;
exports.verifyEmailCode = verifyEmailCode;
const node_crypto_1 = require("node:crypto");
const mongoose_1 = require("mongoose");
const env_1 = require("../config/env");
const user_model_1 = require("../models/User");
const email_service_1 = require("./email.service");
const session_service_1 = require("./session.service");
const api_error_1 = require("../utils/api-error");
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_DELAY_MS = 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const after = (date) => mongoose_1.trusted({ $gt: date });
const belowAttemptLimit = mongoose_1.trusted({ $lt: MAX_CODE_ATTEMPTS });
function digestCode(purpose, email, code) {
    return (0, node_crypto_1.createHmac)('sha256', env_1.env.JWT_SECRET)
        .update(`${purpose}:${email.toLowerCase()}:${code}`)
        .digest('hex');
}
function matchingHex(left, right) {
    const a = Buffer.from(left, 'hex');
    const b = Buffer.from(right, 'hex');
    return a.length === b.length && (0, node_crypto_1.timingSafeEqual)(a, b);
}
function generateCode() {
    return (0, node_crypto_1.randomInt)(0, 10000).toString().padStart(4, '0');
}
function ensureResendAvailable(lastSentAt) {
    if (lastSentAt && Date.now() - lastSentAt.getTime() < RESEND_DELAY_MS) {
        throw new api_error_1.ApiError(429, 'Please wait before requesting another code');
    }
}
async function issueEmailVerificationCode(user) {
    ensureResendAvailable(user.emailVerificationLastSentAt);
    const email = user.pendingEmail || user.email;
    const code = generateCode();
    const hash = digestCode('verify-email', email, code);
    user.emailVerificationCodeHash = hash;
    user.emailVerificationExpiresAt = new Date(Date.now() + CODE_TTL_MS);
    user.emailVerificationAttempts = 0;
    user.emailVerificationLastSentAt = new Date();
    await user.save();
    try {
        await (0, email_service_1.sendVerificationCodeEmail)(email, user.name, code);
    }
    catch {
        await user_model_1.User.updateOne({ _id: user._id, emailVerificationCodeHash: hash }, {
            $set: { emailVerificationCodeHash: null, emailVerificationExpiresAt: null, emailVerificationLastSentAt: null },
        });
        throw new api_error_1.ApiError(503, 'Verification email could not be sent. Please try again later.');
    }
}
async function verifyEmailCode(email, code) {
    const user = await user_model_1.User.findOne({
        email,
        isEmailVerified: false,
        emailVerificationExpiresAt: after(new Date()),
    }).select('+emailVerificationCodeHash +emailVerificationExpiresAt +emailVerificationAttempts +emailVerificationLastSentAt');
    if (!user || !user.emailVerificationCodeHash)
        return false;
    const targetEmail = user.pendingEmail || user.email;
    const expected = digestCode('verify-email', targetEmail, code);
    const attempted = await user_model_1.User.findOneAndUpdate({
        _id: user._id,
        emailVerificationCodeHash: user.emailVerificationCodeHash,
        emailVerificationExpiresAt: after(new Date()),
        emailVerificationAttempts: belowAttemptLimit,
    }, { $inc: { emailVerificationAttempts: 1 } }, { new: true })
        .select('+emailVerificationCodeHash +emailVerificationAttempts');
    if (!attempted)
        return false;
    if (!matchingHex(attempted.emailVerificationCodeHash, expected)) {
        if (attempted.emailVerificationAttempts >= MAX_CODE_ATTEMPTS) {
            await user_model_1.User.updateOne({ _id: attempted._id }, {
                $set: { emailVerificationCodeHash: null, emailVerificationExpiresAt: null },
            });
        }
        return false;
    }
    const emailChanged = Boolean(user.pendingEmail);
    const update = {
        isEmailVerified: true,
        emailVerificationCodeHash: null,
        emailVerificationExpiresAt: null,
        emailVerificationAttempts: 0,
        emailVerificationLastSentAt: null,
        pendingEmail: null,
    };
    if (user.pendingEmail)
        update.email = user.pendingEmail;
    const operation = { $set: update };
    if (emailChanged)
        operation.$inc = { tokenVersion: 1 };
    const completed = await user_model_1.User.findOneAndUpdate({
        _id: attempted._id,
        emailVerificationCodeHash: attempted.emailVerificationCodeHash,
        emailVerificationAttempts: attempted.emailVerificationAttempts,
        emailVerificationExpiresAt: after(new Date()),
    }, operation, { new: true });
    if (completed && emailChanged)
        await (0, session_service_1.revokeAllUserSessions(completed._id));
    return completed ? { emailChanged } : false;
}
async function issuePasswordResetCode(email) {
    const user = await user_model_1.User.findOne({ email, isEmailVerified: true })
        .select('+resetPasswordCodeHash +resetPasswordCodeExpiresAt +resetPasswordCodeAttempts +resetPasswordCodeLastSentAt');
    if (!user)
        return false;
    ensureResendAvailable(user.resetPasswordCodeLastSentAt);
    const code = generateCode();
    const hash = digestCode('reset-password', user.email, code);
    user.resetPasswordCodeHash = hash;
    user.resetPasswordCodeExpiresAt = new Date(Date.now() + CODE_TTL_MS);
    user.resetPasswordCodeAttempts = 0;
    user.resetPasswordCodeLastSentAt = new Date();
    await user.save();
    try {
        await (0, email_service_1.sendPasswordResetCodeEmail)(user.email, user.name, code);
    }
    catch {
        await user_model_1.User.updateOne({ _id: user._id, resetPasswordCodeHash: hash }, {
            $set: { resetPasswordCodeHash: null, resetPasswordCodeExpiresAt: null, resetPasswordCodeAttempts: 0, resetPasswordCodeLastSentAt: null },
        });
        throw new api_error_1.ApiError(503, 'Reset email could not be sent. Please try again later.');
    }
    return true;
}
async function resetPasswordWithCode(email, code, password) {
    const user = await user_model_1.User.findOne({
        email,
        isEmailVerified: true,
        resetPasswordCodeExpiresAt: after(new Date()),
    }).select('+resetPasswordCodeHash +resetPasswordCodeExpiresAt +resetPasswordCodeAttempts +tokenVersion');
    if (!user || !user.resetPasswordCodeHash)
        return false;
    const expected = digestCode('reset-password', user.email, code);
    const attempted = await user_model_1.User.findOneAndUpdate({
        _id: user._id,
        resetPasswordCodeHash: user.resetPasswordCodeHash,
        resetPasswordCodeExpiresAt: after(new Date()),
        resetPasswordCodeAttempts: belowAttemptLimit,
    }, { $inc: { resetPasswordCodeAttempts: 1 } }, { new: true })
        .select('+resetPasswordCodeHash +resetPasswordCodeAttempts');
    if (!attempted)
        return false;
    if (!matchingHex(attempted.resetPasswordCodeHash, expected)) {
        if (attempted.resetPasswordCodeAttempts >= MAX_CODE_ATTEMPTS) {
            await user_model_1.User.updateOne({ _id: attempted._id }, {
                $set: { resetPasswordCodeHash: null, resetPasswordCodeExpiresAt: null },
            });
        }
        return false;
    }
    const consumed = await user_model_1.User.findOneAndUpdate({
        _id: attempted._id,
        resetPasswordCodeHash: attempted.resetPasswordCodeHash,
        resetPasswordCodeAttempts: attempted.resetPasswordCodeAttempts,
        resetPasswordCodeExpiresAt: after(new Date()),
    }, { $set: {
        resetPasswordCodeHash: null,
        resetPasswordCodeExpiresAt: null,
        resetPasswordCodeAttempts: 0,
        resetPasswordCodeLastSentAt: null,
    } }, { new: true }).select('+tokenVersion');
    if (!consumed)
        return false;
    consumed.password = password;
    consumed.tokenVersion += 1;
    await consumed.save();
    await (0, session_service_1.revokeAllUserSessions)(consumed._id);
    return true;
}
