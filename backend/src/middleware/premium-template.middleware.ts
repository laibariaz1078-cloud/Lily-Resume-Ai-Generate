import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { Template } from '../models/template.model';
import { requirePlan } from './require-plan.middleware';

const requirePremium = requirePlan('PREMIUM');

export const premiumTemplateMiddleware: RequestHandler = async (req, res, next) => {
  const templateId = req.body?.templateId;
  if (typeof templateId !== 'string' || !templateId) return next();

  try {
    const alternatives = [{ slug: templateId }, ...(mongoose.isValidObjectId(templateId) ? [{ _id: templateId }] : [])];
    const template = await Template.findOne({ isActive: true, ownerId: null, $or: alternatives }).select('isPremium').exec();
    if (!template?.isPremium) return next();
    return requirePremium(req, res, next);
  } catch (error) {
    next(error);
  }
};