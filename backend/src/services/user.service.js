"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSafeUser = toSafeUser;
function toSafeUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        settings: user.settings,
        role: user.role,
        plan: user.plan,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
