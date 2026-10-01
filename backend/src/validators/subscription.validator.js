"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionUpgradeSchema = void 0;
const zod_1 = require("zod");
exports.subscriptionUpgradeSchema = zod_1.z.object({ plan: zod_1.z.literal('PREMIUM') }).strict();
