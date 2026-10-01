import mongoose from 'mongoose';
import { Template } from '../models/template.model';
import { ApiError } from '../utils/api-error';
import { TEMPLATE_CATEGORIES, type TemplateCreateInput, type TemplateUpdateInput } from '../validators/template.validator';

export interface TemplateListOptions {
  category?: string;
  premium?: 'true' | 'false';
  free?: 'true' | 'false';
  search?: string;
  sort: 'newest' | 'name-asc' | 'name-desc' | 'relevance';
  page: number;
  limit: number;
}

export const templateService = {
  async list(options: TemplateListOptions) {
    const filter: Record<string, unknown> = { isActive: true, ownerId: null };
    if (options.category) {
      const normalizedCategory = TEMPLATE_CATEGORIES.find((category) => category.toLowerCase() === options.category?.toLowerCase());
      if (!normalizedCategory) throw new ApiError(400, 'Unsupported template category');
      filter.category = normalizedCategory;
    }
    const premium = options.premium ?? (options.free ? (options.free === 'true' ? 'false' : 'true') : undefined);
    if (premium) filter.isPremium = premium === 'true';
    if (options.search) filter.$text = { $search: options.search };

    const sort: Record<string, 1 | -1> = options.sort === 'name-asc'
      ? { name: 1 }
      : options.sort === 'name-desc'
        ? { name: -1 }
        : options.sort === 'relevance' && options.search
          ? { score: -1 }
          : { createdAt: -1 };
    const projection = options.sort === 'relevance' && options.search ? {
      name: 1,
      slug: 1,
      description: 1,
      category: 1,
      previewImage: 1,
      templateSpec: 1,
      supportedSections: 1,
      isPremium: 1,
      isActive: 1,
      ownerId: 1,
      createdAt: 1,
      updatedAt: 1,
      score: { $meta: 'textScore' as const },
    } : undefined;
    const [items, total] = await Promise.all([
      Template.find(filter, projection).sort(sort).skip((options.page - 1) * options.limit).limit(options.limit).lean().exec(),
      Template.countDocuments(filter),
    ]);
    return { items, pagination: { page: options.page, limit: options.limit, total, pages: Math.ceil(total / options.limit) } };
  },

  async get(id: string) {
    const filter = { isActive: true, ownerId: null, ...(mongoose.isValidObjectId(id) ? { _id: id } : { slug: id }) };
    const template = await Template.findOne(filter).lean().exec();
    if (!template) throw new ApiError(404, 'Template not found');
    return template;
  },

  async create(input: TemplateCreateInput) {
    const template = await Template.create({ ...input, ownerId: null });
    return template.toObject();
  },

  async update(id: string, input: TemplateUpdateInput) {
    const template = await Template.findByIdAndUpdate(id, input, { new: true, runValidators: true }).lean().exec();
    if (!template) throw new ApiError(404, 'Template not found');
    return template;
  },

  async remove(id: string) {
    const template = await Template.findByIdAndDelete(id).lean().exec();
    if (!template) throw new ApiError(404, 'Template not found');
  },
};