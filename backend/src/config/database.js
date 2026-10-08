"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const ai_usage_model_1 = require("../models/AIUsage");
const ai_conversation_model_1 = require("../models/AIConversation");
const ai_message_model_1 = require("../models/AIMessage");
const job_analysis_model_1 = require("../models/JobAnalysis");
const resume_analysis_model_1 = require("../models/ResumeAnalysis");
const resume_model_1 = require("../models/Resume");
const resume_version_model_1 = require("../models/ResumeVersion");
const subscription_model_1 = require("../models/Subscription");
const template_model_1 = require("../models/Template");
const user_model_1 = require("../models/User");
const user_settings_model_1 = require("../models/UserSettings");
const session_model_1 = require("../models/Session");
mongoose_1.default.set('sanitizeFilter', true);
async function connectDatabase() {
    try {
        const connection = await mongoose_1.default.connect(env_1.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10_000,
            autoIndex: env_1.env.NODE_ENV !== 'production',
        });
        await connection.connection.collection('users').createIndex({ email: 1 }, { unique: true });
        await Promise.all([
            user_model_1.User.createIndexes(),
            ai_usage_model_1.AIUsage.createIndexes(),
            ai_conversation_model_1.AIConversation.createIndexes(),
            ai_message_model_1.AIMessage.createIndexes(),
            job_analysis_model_1.JobAnalysis.createIndexes(),
            user_settings_model_1.UserSettings.createIndexes(),
            resume_model_1.Resume.createIndexes(),
            resume_version_model_1.ResumeVersion.createIndexes(),
            resume_analysis_model_1.ResumeAnalysis.createIndexes(),
            subscription_model_1.Subscription.createIndexes(),
            template_model_1.Template.createIndexes(),
            session_model_1.Session.createIndexes(),
        ]);
        if (env_1.env.NODE_ENV !== 'production') {
            console.info(`MongoDB connected (${connection.connection.name})`);
        }
    }
    catch (error) {
        const errorName = error instanceof Error ? error.name : 'UnknownError';
        console.error(`MongoDB connection failed (${errorName}). Check MONGODB_URI and database availability.`);
        throw new Error('Database connection failed');
    }
}
