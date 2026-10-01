import { z } from 'zod';
import { env } from '../config/env';
import { ApiError } from '../utils/api-error';
import type {
  AnalyzeResumeInput,
  ChatInput,
  GenerateInput,
  ImproveInput,
  SuggestionsInput,
  TailorInput,
} from '../validators/ai.validator';
import { TEMPLATE_CATEGORIES, templateSpecSchema, type TemplateSpec } from '../validators/template.validator';
import type { AnalyzeJobInput, MatchResumeContextInput } from '../validators/job.validator';
import type { GenerateTemplateConceptInput } from '../validators/template.validator';

type ProviderResult<T> = { data: T; tokensUsed: number | null };
type AIResult<T> = ProviderResult<T>;

const nonEmptyString = z.string().min(1);
const suggestionsOutput = z.object({
  suggestions: z.array(z.object({
    id: nonEmptyString,
    type: z.enum(['improve', 'add', 'remove', 'reorder', 'clarify']),
    section: nonEmptyString,
    message: nonEmptyString,
    before: z.string(),
    after: z.string(),
    proposedChange: z.string(),
    reason: nonEmptyString,
    actionType: z.enum(['ADD', 'UPDATE', 'DELETE']),
    confidence: z.number().min(0).max(1),
  })),
});
const improvementOutput = z.object({ improvedContent: nonEmptyString, explanation: nonEmptyString, suggestions: z.array(z.string()) });
const generationOutput = z.object({
  content: z.record(z.unknown()),
  questions: z.array(z.string()),
  suggestions: z.array(z.string()),
});
const chatOutput = z.object({
  message: nonEmptyString,
  actions: z.array(z.object({
    type: z.enum(['UPDATE_SECTION', 'ADD_SECTION', 'DELETE_SECTION']),
    section: nonEmptyString,
    before: z.string(),
    after: z.string(),
    reason: nonEmptyString,
    actionType: z.enum(['ADD', 'UPDATE', 'DELETE']),
  })),
});
const analysisCategory = z.object({ score: z.number().min(0).max(100), findings: z.array(z.string()) });
const analysisOutput = z.object({
  overallScore: z.number().min(0).max(100),
  completeness: analysisCategory,
  clarity: analysisCategory,
  grammar: analysisCategory,
  atsCompatibility: analysisCategory,
  keywordUsage: analysisCategory,
  sectionQuality: analysisCategory,
  consistency: analysisCategory,
  measurableAchievements: analysisCategory,
  formattingRisks: z.array(z.string()),
});
const tailorOutput = z.object({
  tailoredResume: z.record(z.unknown()),
  changes: z.array(z.object({ section: nonEmptyString, before: z.string(), after: z.string(), reason: nonEmptyString, actionType: z.enum(['ADD', 'UPDATE', 'DELETE']) })),
  missingKeywords: z.array(z.string()),
  questions: z.array(z.string()),
});
const jobAnalysisOutput = z.object({
  jobTitle: z.string().nullable(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  technologies: z.array(z.string()),
  responsibilities: z.array(z.string()),
  qualifications: z.array(z.string()),
  keywords: z.array(z.string()),
});
const resumeJobMatchOutput = z.object({
  overallMatch: z.number().min(0).max(100),
  matchingSkills: z.array(z.object({ skill: nonEmptyString, evidence: nonEmptyString })),
  missingSkills: z.array(nonEmptyString),
  relevantExperience: z.array(z.object({ section: nonEmptyString, evidence: nonEmptyString, relevance: z.number().min(0).max(1) })),
  keywordAlignment: z.object({ score: z.number().min(0).max(100), matchedKeywords: z.array(z.string()), missingKeywords: z.array(z.string()) }),
  sectionRelevance: z.array(z.object({ section: nonEmptyString, relevance: z.number().min(0).max(1), reason: nonEmptyString })),
  guidance: z.array(z.string()),
});
const templateConceptOutput = z.object({
  name: nonEmptyString,
  description: nonEmptyString,
  category: z.enum(TEMPLATE_CATEGORIES),
  supportedSections: z.array(nonEmptyString).min(1),
  templateSpec: templateSpecSchema,
});

type PromptRequest = { system: string; prompt: string };

export interface AIProvider {
  generateResumeContent(input: GenerateInput): Promise<AIResult<z.infer<typeof generationOutput>>>;
  improveSection(input: ImproveInput): Promise<AIResult<z.infer<typeof improvementOutput>>>;
  generateSuggestions(input: SuggestionsInput): Promise<AIResult<z.infer<typeof suggestionsOutput>>>;
  analyzeResume(input: AnalyzeResumeInput): Promise<AIResult<z.infer<typeof analysisOutput>>>;
  tailorResumeToJob(input: TailorInput): Promise<AIResult<z.infer<typeof tailorOutput>>>;
  chatWithResumeAssistant(input: ChatInput): Promise<AIResult<z.infer<typeof chatOutput>>>;
  analyzeJobDescription(input: AnalyzeJobInput): Promise<AIResult<z.infer<typeof jobAnalysisOutput>>>;
  matchResumeToJob(input: MatchResumeContextInput): Promise<AIResult<z.infer<typeof resumeJobMatchOutput>>>;
  generateTemplateConcept(input: GenerateTemplateConceptInput): Promise<AIResult<z.infer<typeof templateConceptOutput>>>;
}

abstract class StructuredAIProvider implements AIProvider {
  protected abstract generateStructured<T>(request: PromptRequest, schema: z.ZodType<T>): Promise<AIResult<T>>;

  generateResumeContent(input: GenerateInput) {
    return this.generateStructured({
      system: 'Transform only supplied facts into professional, structured resume content. Never invent employers, titles, degrees, certifications, technologies, achievements, metrics, years, or responsibilities. For missing facts, ask questions or provide suggestions instead of filling gaps.',
      prompt: `Create resume content from these user-provided details. Preserve factual meaning. Return JSON with content (structured sections), questions (missing facts to ask), and suggestions (non-factual improvements).\n${JSON.stringify(input)}`,
    }, generationOutput);
  }

  improveSection(input: ImproveInput) {
    return this.generateStructured({
      system: 'Edit resume text without inventing or changing factual claims. Keep all dates, names, titles, tools, metrics, and responsibilities grounded in the input. Return valid JSON only.',
      prompt: `Apply the requested operation to this section. Return improvedContent, explanation, and suggestions. If expansion would require new facts, ask for them in suggestions.\n${JSON.stringify(input)}`,
    }, improvementOutput);
  }

  generateSuggestions(input: SuggestionsInput) {
    return this.generateStructured({
      system: 'Review the resume and propose optional, reviewable changes only. Never modify facts or claim a change was applied. Return valid JSON only.',
      prompt: `Return suggestions with id, type, section, message, before, after, proposedChange, reason, actionType (ADD, UPDATE, DELETE), and confidence from 0 to 1. Proposed changes must be supported by supplied resume information; otherwise suggest a question and leave before, after, and proposedChange empty.\n${JSON.stringify(input.resume)}`,
    }, suggestionsOutput);
  }

  analyzeResume(input: AnalyzeResumeInput) {
    return this.generateStructured({
      system: 'Analyze only the supplied resume. Do not infer or invent facts. Scores must reflect evidence, and findings should be actionable. Return valid JSON only.',
      prompt: `Evaluate completeness, clarity, grammar, ATS compatibility, keyword usage, section quality, consistency, measurable achievements, and formatting risks. Return overallScore 0-100, each category as {score, findings}, and formattingRisks.\n${JSON.stringify(input.resume)}`,
    }, analysisOutput);
  }

  tailorResumeToJob(input: TailorInput) {
    return this.generateStructured({
      system: 'Tailor wording and ordering to the job description using only facts already present in the resume. Never add unsupported qualifications, keywords as claimed skills, metrics, or experience. Return valid JSON only.',
      prompt: `Return tailoredResume, changes (section, before, after, reason, actionType), missingKeywords, and questions. Every change must be reviewable and supported by existing facts.\n${JSON.stringify(input)}`,
    }, tailorOutput);
  }

  chatWithResumeAssistant(input: ChatInput) {
    return this.generateStructured({
      system: 'You are a resume editing assistant. Understand the user instruction and current resume. Respect explicit constraints, such as preserving skills or wording. Never invent facts. Return structured, reviewable actions only; do not claim the resume was changed. Return valid JSON only.',
      prompt: `Respond to this instruction using the current resume context. Return message and actions with type (UPDATE_SECTION, ADD_SECTION, DELETE_SECTION), section, before, after, reason, and actionType (ADD, UPDATE, DELETE). Use no actions if clarification is needed.\nInstruction: ${input.message}\nResume: ${JSON.stringify(input.resume)}`,
    }, chatOutput);
  }

  analyzeJobDescription(input: AnalyzeJobInput) {
    return this.generateStructured({
      system: 'Extract only information explicitly stated in the job description. Distinguish required from preferred skills; do not infer candidate qualifications. Return valid JSON only.',
      prompt: `Extract jobTitle (null if unclear), requiredSkills, preferredSkills, technologies, responsibilities, qualifications, and keywords as string arrays.\n${input.jobDescription}`,
    }, jobAnalysisOutput);
  }

  matchResumeToJob(input: MatchResumeContextInput) {
    return this.generateStructured({
      system: 'Compare the supplied resume against the job description using only evidence in the resume. List absent skills as missing. Never suggest that the user claim or add a skill they do not have. Every matching skill and relevant experience item must cite an exact, verbatim short excerpt from the supplied resume. Return valid JSON only.',
      prompt: `Return overallMatch (0-100), matchingSkills ({skill,evidence}), missingSkills, relevantExperience ({section,evidence,relevance 0-1}), keywordAlignment ({score,matchedKeywords,missingKeywords}), sectionRelevance ({section,relevance,reason}), and factual guidance. Cite resume evidence verbatim so it can be verified.\nResume: ${JSON.stringify(input.resume)}\nJob description: ${input.jobDescription}`,
    }, resumeJobMatchOutput);
  }

  generateTemplateConcept(input: GenerateTemplateConceptInput) {
    return this.generateStructured({
      system: 'Design a resume template as structured renderer configuration only. Never produce or describe an image. Use supported categories and valid visual tokens, and return valid JSON only.',
      prompt: `Create a renderer-ready template concept from these preferences. Return name, description, category, supportedSections, and templateSpec with layout, typography, spacing, colors, sectionOrder, headerStyle, sidebar, borders, and icons.\n${JSON.stringify(input)}`,
    }, templateConceptOutput);
  }
}

class OpenAIProvider extends StructuredAIProvider {
  protected async generateStructured<T>(request: PromptRequest, schema: z.ZodType<T>): Promise<AIResult<T>> {
    const response = await requestProvider('https://api.openai.com/v1/chat/completions', {
      authorization: `Bearer ${env.AI_API_KEY}`,
      'content-type': 'application/json',
    }, {
      model: env.AI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: request.system }, { role: 'user', content: request.prompt }],
    });
    const payload = response.body as { choices?: Array<{ message?: { content?: string } }>; usage?: { total_tokens?: number } };
    const content = payload.choices?.[0]?.message?.content;
    return { data: parseAndValidate(content, schema), tokensUsed: payload.usage?.total_tokens ?? null };
  }
}

class AnthropicProvider extends StructuredAIProvider {
  protected async generateStructured<T>(request: PromptRequest, schema: z.ZodType<T>): Promise<AIResult<T>> {
    const response = await requestProvider('https://api.anthropic.com/v1/messages', {
      'x-api-key': env.AI_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    }, {
      model: env.AI_MODEL || 'claude-3-5-haiku-latest',
      max_tokens: 4096,
      system: `${request.system} Output a single JSON object without markdown fences.`,
      messages: [{ role: 'user', content: request.prompt }],
    });
    const payload = response.body as { content?: Array<{ type?: string; text?: string }>; usage?: { input_tokens?: number; output_tokens?: number } };
    const content = payload.content?.find((item) => item.type === 'text')?.text;
    const inputTokens = payload.usage?.input_tokens;
    const outputTokens = payload.usage?.output_tokens;
    return { data: parseAndValidate(content, schema), tokensUsed: inputTokens === undefined || outputTokens === undefined ? null : inputTokens + outputTokens };
  }
}

async function requestProvider(url: string, headers: Record<string, string>, body: Record<string, unknown>): Promise<{ body: unknown }> {
  if (!env.AI_API_KEY) throw new ApiError(503, 'AI service is not configured');

  let response: Response;
  try {
    response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(25_000) });
  } catch {
    throw new ApiError(503, 'AI service is temporarily unavailable');
  }
  if (!response.ok) throw new ApiError(503, 'AI service could not complete the request');

  try {
    return { body: await response.json() as unknown };
  } catch {
    throw new ApiError(502, 'AI service returned an invalid response');
  }
}

function parseAndValidate<T>(content: string | undefined, schema: z.ZodType<T>): T {
  if (!content) throw new ApiError(502, 'AI service returned an invalid response');
  const json = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ApiError(502, 'AI service returned an invalid response');
  }
  const validated = schema.safeParse(parsed);
  if (!validated.success) throw new ApiError(502, 'AI service returned an invalid response');
  return validated.data;
}

function createProvider(): AIProvider {
  if (env.AI_PROVIDER === 'openai') return new OpenAIProvider();
  if (env.AI_PROVIDER === 'anthropic') return new AnthropicProvider();
  throw new ApiError(503, 'AI provider is unavailable');
}

const provider = createProvider();

export const aiService = {
  generateResumeContent: (input: GenerateInput) => provider.generateResumeContent(input),
  improveSection: (input: ImproveInput) => provider.improveSection(input),
  generateSuggestions: (input: SuggestionsInput) => provider.generateSuggestions(input),
  analyzeResume: (input: AnalyzeResumeInput) => provider.analyzeResume(input),
  tailorResumeToJob: (input: TailorInput) => provider.tailorResumeToJob(input),
  chatWithResumeAssistant: (input: ChatInput) => provider.chatWithResumeAssistant(input),
  analyzeJobDescription: (input: AnalyzeJobInput) => provider.analyzeJobDescription(input),
  matchResumeToJob: (input: MatchResumeContextInput) => provider.matchResumeToJob(input),
  generateTemplateConcept: (input: GenerateTemplateConceptInput) => provider.generateTemplateConcept(input),
};