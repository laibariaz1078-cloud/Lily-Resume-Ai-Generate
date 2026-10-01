import mongoose from 'mongoose';
import { Resume } from '../models/resume.model';
import { ResumeVersion } from '../models/resume-version.model';
import { Template } from '../models/template.model';
import { ApiError } from '../utils/api-error';
import { subscriptionService } from './subscription.service';
import type { ResumeCreateInput, ResumeUpdateInput } from '../validators/resume.validator';

const FREE_RESUME_LIFETIME_MS = 10 * 24 * 60 * 60 * 1000;

function assertResumeId(id: string): void {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid resume identifier');
}

export function expirationInfo(resume: { isPermanent: boolean; expiresAt: Date | null }) {
  if (resume.isPermanent) return { state: 'PERMANENT' as const, isActive: true, isExpired: false, expiresAt: null };
  const isExpired = !!resume.expiresAt && resume.expiresAt <= new Date();
  return { state: isExpired ? 'EXPIRED' as const : 'ACTIVE' as const, isActive: !isExpired, isExpired, expiresAt: resume.expiresAt };
}

async function ensureTemplateAccess(userId: string, templateId: string | null | undefined, existingTemplateId?: string | null): Promise<void> {
  if (!templateId || templateId === existingTemplateId) return;
  const alternatives = [{ slug: templateId }, ...(mongoose.isValidObjectId(templateId) ? [{ _id: templateId }] : [])];
  const template = await Template.findOne({ isActive: true, ownerId: null, $or: alternatives }).exec();
  if (!template) throw new ApiError(404, 'Template not found');
  if (template.isPremium && await subscriptionService.planForUser(userId) !== 'PREMIUM') {
    throw new ApiError(403, 'A premium plan is required to use this template');
  }
}

async function getOwned(userId: string, id: string) {
  assertResumeId(id);
  const resume = await Resume.findOne({ _id: id, userId }).exec();
  if (!resume) throw new ApiError(404, 'Resume not found');
  return resume;
}

function snapshot(resume: { _id: unknown; userId: unknown; title: string; data: Record<string, unknown>; favorite: boolean; templateId: string | null }) {
  return {
    resumeId: resume._id,
    userId: resume.userId,
    title: resume.title,
    data: resume.data,
    favorite: resume.favorite,
    templateId: resume.templateId,
  };
}

async function saveVersion(resume: Awaited<ReturnType<typeof getOwned>>): Promise<void> {
  await ResumeVersion.create(snapshot(resume));
}

export const resumeService = {
  async list(userId: string, options: { page: number; limit: number; favorite?: 'true' | 'false' }) {
    const filter: Record<string, unknown> = { userId };
    if (options.favorite) filter.favorite = options.favorite === 'true';
    type ResumeListItem = { _id: unknown; isPermanent: boolean; expiresAt: Date | null; [key: string]: unknown };
    const [items, total] = await Promise.all([
      Resume.find(filter).sort({ updatedAt: -1 }).skip((options.page - 1) * options.limit).limit(options.limit).lean().exec() as unknown as Promise<ResumeListItem[]>,
      Resume.countDocuments(filter),
    ]);
    return {
      items: items.map((item) => ({ ...item, expiration: expirationInfo(item) })),
      pagination: { page: options.page, limit: options.limit, total, pages: Math.ceil(total / options.limit) },
    };
  },

  async get(userId: string, id: string) {
    const resume = await getOwned(userId, id);
    return { ...resume.toObject(), expiration: expirationInfo(resume) };
  },

  async create(userId: string, input: ResumeCreateInput) {
    await ensureTemplateAccess(userId, input.templateId);
    const plan = await subscriptionService.planForUser(userId);
    const now = new Date();
    const resume = await Resume.create({
      userId,
      title: input.title,
      data: input.data,
      favorite: input.favorite,
      templateId: input.templateId ?? null,
      isPermanent: plan === 'PREMIUM',
      expiresAt: plan === 'PREMIUM' ? null : new Date(now.getTime() + FREE_RESUME_LIFETIME_MS),
    });
    await saveVersion(resume);
    return { ...resume.toObject(), expiration: expirationInfo(resume) };
  },

  async update(userId: string, id: string, input: ResumeUpdateInput) {
    const resume = await getOwned(userId, id);
    const expiration = expirationInfo(resume);
    if (expiration.isExpired) throw new ApiError(410, 'This resume has expired');
    await ensureTemplateAccess(userId, input.templateId, resume.templateId);
    await saveVersion(resume);
    if (input.title !== undefined) resume.title = input.title;
    if (input.data !== undefined) resume.data = input.data;
    if (input.favorite !== undefined) resume.favorite = input.favorite;
    if (input.templateId !== undefined) resume.templateId = input.templateId;
    await resume.save();
    return { ...resume.toObject(), expiration: expirationInfo(resume) };
  },

  async remove(userId: string, id: string): Promise<void> {
    const resume = await getOwned(userId, id);
    await resume.deleteOne();
    await ResumeVersion.deleteMany({ resumeId: resume._id, userId });
  },

  async versions(userId: string, id: string, page: number, limit: number) {
    const resume = await getOwned(userId, id);
    const filter = { resumeId: resume._id, userId };
    const [items, total] = await Promise.all([
      ResumeVersion.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
      ResumeVersion.countDocuments(filter),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  },

  async restoreVersion(userId: string, id: string, versionId: string) {
    const resume = await getOwned(userId, id);
    assertResumeId(versionId);
    const version = await ResumeVersion.findOne({ _id: versionId, resumeId: resume._id, userId }).exec();
    if (!version) throw new ApiError(404, 'Resume version not found');
    if (expirationInfo(resume).isExpired) throw new ApiError(410, 'This resume has expired');
    await saveVersion(resume);
    resume.title = version.title;
    resume.data = version.data;
    resume.favorite = version.favorite;
    resume.templateId = version.templateId;
    await resume.save();
    return { ...resume.toObject(), expiration: expirationInfo(resume) };
  },
};