"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeResumeData = mergeResumeData;
function mergeResumeData(current, updates) {
    const documentData = current.toObject?.() ?? current;
    const merged = { ...documentData };
    for (const [key, value] of Object.entries(updates)) {
        const existing = merged[key];
        const bothObjects = existing !== null && value !== null
            && typeof existing === 'object' && typeof value === 'object'
            && !Array.isArray(existing) && !Array.isArray(value);
        merged[key] = bothObjects
            ? mergeResumeData(existing, value)
            : value;
    }
    return merged;
}
