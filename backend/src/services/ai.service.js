"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
const zod_1 = require("zod");
const env_1 = require("../config/env");
const api_error_1 = require("../utils/api-error");
const template_validator_1 = require("../validators/template.validator");
const nonEmptyString = zod_1.z.string().min(1);
const suggestionsOutput = zod_1.z.object({
    suggestions: zod_1.z.array(zod_1.z.object({
        id: nonEmptyString,
        type: zod_1.z.enum(['improve', 'add', 'remove', 'reorder', 'clarify']),
        section: nonEmptyString,
        message: nonEmptyString,
        before: zod_1.z.string(),
        after: zod_1.z.string(),
        proposedChange: zod_1.z.string(),
        reason: nonEmptyString,
        actionType: zod_1.z.enum(['ADD', 'UPDATE', 'DELETE']),
        confidence: zod_1.z.number().min(0).max(1),
    })),
});
const improvementOutput = zod_1.z.object({ improvedContent: nonEmptyString, explanation: nonEmptyString, suggestions: zod_1.z.array(zod_1.z.string()) });
const generationOutput = zod_1.z.object({
    content: zod_1.z.record(zod_1.z.unknown()),
    questions: zod_1.z.array(zod_1.z.string()),
    suggestions: zod_1.z.array(zod_1.z.string()),
});
const chatOutput = zod_1.z.object({
    message: nonEmptyString,
    actions: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['UPDATE_SECTION', 'ADD_SECTION', 'DELETE_SECTION']),
        section: nonEmptyString,
        before: zod_1.z.string(),
        after: zod_1.z.string(),
        reason: nonEmptyString,
        actionType: zod_1.z.enum(['ADD', 'UPDATE', 'DELETE']),
    })),
});
const analysisCategory = zod_1.z.object({ score: zod_1.z.number().min(0).max(100), findings: zod_1.z.array(zod_1.z.string()) });
const analysisOutput = zod_1.z.object({
    overallScore: zod_1.z.number().min(0).max(100),
    completeness: analysisCategory,
    clarity: analysisCategory,
    grammar: analysisCategory,
    atsCompatibility: analysisCategory,
    keywordUsage: analysisCategory,
    sectionQuality: analysisCategory,
    consistency: analysisCategory,
    measurableAchievements: analysisCategory,
    formattingRisks: zod_1.z.array(zod_1.z.string()),
});
const tailorOutput = zod_1.z.object({
    tailoredResume: zod_1.z.record(zod_1.z.unknown()),
    changes: zod_1.z.array(zod_1.z.object({ section: nonEmptyString, before: zod_1.z.string(), after: zod_1.z.string(), reason: nonEmptyString, actionType: zod_1.z.enum(['ADD', 'UPDATE', 'DELETE']) })),
    missingKeywords: zod_1.z.array(zod_1.z.string()),
    questions: zod_1.z.array(zod_1.z.string()),
});
const jobAnalysisOutput = zod_1.z.object({
    jobTitle: zod_1.z.string().nullable(),
    requiredSkills: zod_1.z.array(zod_1.z.string()),
    preferredSkills: zod_1.z.array(zod_1.z.string()),
    technologies: zod_1.z.array(zod_1.z.string()),
    responsibilities: zod_1.z.array(zod_1.z.string()),
    qualifications: zod_1.z.array(zod_1.z.string()),
    keywords: zod_1.z.array(zod_1.z.string()),
});
const resumeJobMatchOutput = zod_1.z.object({
    overallMatch: zod_1.z.number().min(0).max(100),
    matchingSkills: zod_1.z.array(zod_1.z.object({ skill: nonEmptyString, evidence: nonEmptyString })),
    missingSkills: zod_1.z.array(nonEmptyString),
    relevantExperience: zod_1.z.array(zod_1.z.object({ section: nonEmptyString, evidence: nonEmptyString, relevance: zod_1.z.number().min(0).max(1) })),
    keywordAlignment: zod_1.z.object({ score: zod_1.z.number().min(0).max(100), matchedKeywords: zod_1.z.array(zod_1.z.string()), missingKeywords: zod_1.z.array(zod_1.z.string()) }),
    sectionRelevance: zod_1.z.array(zod_1.z.object({ section: nonEmptyString, relevance: zod_1.z.number().min(0).max(1), reason: nonEmptyString })),
    guidance: zod_1.z.array(zod_1.z.string()),
});
const templateConceptOutput = zod_1.z.object({
    name: nonEmptyString,
    description: nonEmptyString,
    category: zod_1.z.enum(template_validator_1.TEMPLATE_CATEGORIES),
    supportedSections: zod_1.z.array(nonEmptyString).min(1),
    templateSpec: template_validator_1.templateSpecSchema,
});
class StructuredAIProvider {
    generateResumeContent(input) {
        return this.generateStructured({
            system: 'Transform only supplied facts into professional, structured resume content. Never invent employers, titles, degrees, certifications, technologies, achievements, metrics, years, or responsibilities. For missing facts, ask questions or provide suggestions instead of filling gaps.',
            prompt: `Create resume content from these user-provided details. Preserve factual meaning. Return JSON with content (structured sections), questions (missing facts to ask), and suggestions (non-factual improvements).\n${JSON.stringify(input)}`,
        }, generationOutput);
    }
    improveSection(input) {
        return this.generateStructured({
            system: 'Edit resume text without inventing or changing factual claims. Keep all dates, names, titles, tools, metrics, and responsibilities grounded in the input. Return valid JSON only.',
            prompt: `Apply the requested operation to this section. Return improvedContent, explanation, and suggestions. If expansion would require new facts, ask for them in suggestions.\n${JSON.stringify(input)}`,
        }, improvementOutput);
    }
    generateSuggestions(input) {
        return this.generateStructured({
            system: 'Review the resume and propose optional, reviewable changes only. Never modify facts or claim a change was applied. Return valid JSON only.',
            prompt: `Return suggestions with id, type, section, message, before, after, proposedChange, reason, actionType (ADD, UPDATE, DELETE), and confidence from 0 to 1. Proposed changes must be supported by supplied resume information; otherwise suggest a question and leave before, after, and proposedChange empty.\n${JSON.stringify(input.resume)}`,
        }, suggestionsOutput);
    }
    analyzeResume(input) {
        return this.generateStructured({
            system: 'Analyze only the supplied resume. Do not infer or invent facts. Scores must reflect evidence, and findings should be actionable. Return valid JSON only.',
            prompt: `Evaluate completeness, clarity, grammar, ATS compatibility, keyword usage, section quality, consistency, measurable achievements, and formatting risks. Return overallScore 0-100, each category as {score, findings}, and formattingRisks.\n${JSON.stringify(input.resume)}`,
        }, analysisOutput);
    }
    tailorResumeToJob(input) {
        return this.generateStructured({
            system: 'Tailor wording and ordering to the job description using only facts already present in the resume. Never add unsupported qualifications, keywords as claimed skills, metrics, or experience. Return valid JSON only.',
            prompt: `Return tailoredResume, changes (section, before, after, reason, actionType), missingKeywords, and questions. Every change must be reviewable and supported by existing facts.\n${JSON.stringify(input)}`,
        }, tailorOutput);
    }
    chatWithResumeAssistant(input) {
        return this.generateStructured({
            system: 'You are a resume editing assistant. Understand the user instruction and current resume. Respect explicit constraints, such as preserving skills or wording. Never invent facts. Return structured, reviewable actions only; do not claim the resume was changed. Return valid JSON only.',
            prompt: `Respond to this instruction using the current resume context. Return message and actions with type (UPDATE_SECTION, ADD_SECTION, DELETE_SECTION), section, before, after, reason, and actionType (ADD, UPDATE, DELETE). Use no actions if clarification is needed.\nInstruction: ${input.message}\nResume: ${JSON.stringify(input.resume)}`,
        }, chatOutput);
    }
    analyzeJobDescription(input) {
        return this.generateStructured({
            system: 'Extract only information explicitly stated in the job description. Distinguish required from preferred skills; do not infer candidate qualifications. Return valid JSON only.',
            prompt: `Extract jobTitle (null if unclear), requiredSkills, preferredSkills, technologies, responsibilities, qualifications, and keywords as string arrays.\n${input.jobDescription}`,
        }, jobAnalysisOutput);
    }
    matchResumeToJob(input) {
        return this.generateStructured({
            system: 'Compare the supplied resume against the job description using only evidence in the resume. List absent skills as missing. Never suggest that the user claim or add a skill they do not have. Every matching skill and relevant experience item must cite an exact, verbatim short excerpt from the supplied resume. Return valid JSON only.',
            prompt: `Return overallMatch (0-100), matchingSkills ({skill,evidence}), missingSkills, relevantExperience ({section,evidence,relevance 0-1}), keywordAlignment ({score,matchedKeywords,missingKeywords}), sectionRelevance ({section,relevance,reason}), and factual guidance. Cite resume evidence verbatim so it can be verified.\nResume: ${JSON.stringify(input.resume)}\nJob description: ${input.jobDescription}`,
        }, resumeJobMatchOutput);
    }
    generateTemplateConcept(input) {
        return this.generateStructured({
            system: 'Design a resume template as structured renderer configuration only. Never produce or describe an image. Use supported categories and valid visual tokens, and return valid JSON only.',
            prompt: `Create a renderer-ready template concept from these preferences. Return name, description, category, supportedSections, and templateSpec with layout, typography, spacing, colors, sectionOrder, headerStyle, sidebar, borders, and icons.\n${JSON.stringify(input)}`,
        }, templateConceptOutput);
    }
}
class OpenAIProvider extends StructuredAIProvider {
    async generateStructured(request, schema) {
        const response = await requestProvider('https://api.openai.com/v1/chat/completions', {
            authorization: `Bearer ${env_1.env.AI_API_KEY}`,
            'content-type': 'application/json',
        }, {
            model: env_1.env.AI_MODEL || 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [{ role: 'system', content: request.system }, { role: 'user', content: request.prompt }],
        });
        const payload = response.body;
        const content = payload.choices?.[0]?.message?.content;
        return { data: parseAndValidate(content, schema), tokensUsed: payload.usage?.total_tokens ?? null };
    }
}
class AnthropicProvider extends StructuredAIProvider {
    async generateStructured(request, schema) {
        const response = await requestProvider('https://api.anthropic.com/v1/messages', {
            'x-api-key': env_1.env.AI_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        }, {
            model: env_1.env.AI_MODEL || 'claude-3-5-haiku-latest',
            max_tokens: 4096,
            system: `${request.system} Output a single JSON object without markdown fences.`,
            messages: [{ role: 'user', content: request.prompt }],
        });
        const payload = response.body;
        const content = payload.content?.find((item) => item.type === 'text')?.text;
        const inputTokens = payload.usage?.input_tokens;
        const outputTokens = payload.usage?.output_tokens;
        return { data: parseAndValidate(content, schema), tokensUsed: inputTokens === undefined || outputTokens === undefined ? null : inputTokens + outputTokens };
    }
}
async function requestProvider(url, headers, body) {
    if (!env_1.env.AI_API_KEY)
        throw new api_error_1.ApiError(503, 'AI service is not configured');
    let response;
    try {
        response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(25_000) });
    }
    catch {
        throw new api_error_1.ApiError(503, 'AI service is temporarily unavailable');
    }
    if (!response.ok)
        throw new api_error_1.ApiError(503, 'AI service could not complete the request');
    try {
        return { body: await response.json() };
    }
    catch {
        throw new api_error_1.ApiError(502, 'AI service returned an invalid response');
    }
}
function parseAndValidate(content, schema) {
    if (!content)
        throw new api_error_1.ApiError(502, 'AI service returned an invalid response');
    const json = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    let parsed;
    try {
        parsed = JSON.parse(json);
    }
    catch {
        throw new api_error_1.ApiError(502, 'AI service returned an invalid response');
    }
    const validated = schema.safeParse(parsed);
    if (!validated.success)
        throw new api_error_1.ApiError(502, 'AI service returned an invalid response');
    return validated.data;
}
function createProvider() {
    if (env_1.env.AI_PROVIDER === 'openai')
        return new OpenAIProvider();
    if (env_1.env.AI_PROVIDER === 'anthropic')
        return new AnthropicProvider();
    throw new api_error_1.ApiError(503, 'AI provider is unavailable');
}
const provider = createProvider();
exports.aiService = {
    generateResumeContent: (input) => provider.generateResumeContent(input),
    improveSection: (input) => provider.improveSection(input),
    generateSuggestions: (input) => provider.generateSuggestions(input),
    analyzeResume: (input) => provider.analyzeResume(input),
    tailorResumeToJob: (input) => provider.tailorResumeToJob(input),
    chatWithResumeAssistant: (input) => provider.chatWithResumeAssistant(input),
    analyzeJobDescription: (input) => provider.analyzeJobDescription(input),
    matchResumeToJob: (input) => provider.matchResumeToJob(input),
    generateTemplateConcept: (input) => provider.generateTemplateConcept(input),
};
