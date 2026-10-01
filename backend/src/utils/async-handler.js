"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
function asyncHandler(handler) {
    return (req, res, next) => {
        try {
            Promise.resolve(handler(req, res, next)).catch(next);
        }
        catch (error) {
            next(error);
        }
    };
}
