import { Schema, model, models, type Document, type Types } from 'mongoose';
import type { TemplateSpec } from '../validators/template.validator';
import { TEMPLATE_CATEGORIES, templateSpecSchema } from '../validators/template.validator';

export interface TemplateDocument extends Document {
  name: string;
  slug: string;
  description: string;
  category: (typeof TEMPLATE_CATEGORIES)[number];
  previewImage: string | null;
  templateSpec: TemplateSpec;
  supportedSections: string[];
  isPremium: boolean;
  isActive: boolean;
  ownerId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = new Schema<TemplateDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 1000 },
    category: { type: String, enum: TEMPLATE_CATEGORIES, required: true },
    previewImage: { type: String, default: null, maxlength: 2048 },
    templateSpec: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: (value: unknown) => templateSpecSchema.safeParse(value).success,
        message: 'Template specification is invalid',
      },
    },
    supportedSections: { type: [String], required: true },
    isPremium: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  },
  { timestamps: true },
);

templateSchema.index({ name: 'text', description: 'text' });
templateSchema.index({ isActive: 1, category: 1, isPremium: 1, createdAt: -1 });

export const Template = models.Template || model<TemplateDocument>('Template', templateSchema);