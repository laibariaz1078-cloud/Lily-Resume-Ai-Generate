import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeJobSchema } from '../validators/job.validator';
import { templateSpecSchema } from '../validators/template.validator';
import { resumeCreateSchema } from '../validators/resume.validator';

const validTemplateSpec = {
  layout: { columns: 'single', pageSize: 'A4' },
  typography: { headingFont: 'Inter', bodyFont: 'Inter', baseFontSize: 11, headingScale: 1.3, lineHeight: 1.4 },
  spacing: { density: 'standard', sectionGap: 10, lineGap: 4 },
  colors: { primary: '#000000', accent: '#FFFFFF', text: '#111111', muted: '#777777', background: '#FFFFFF' },
  sectionOrder: ['summary', 'experience'],
  headerStyle: 'classic',
  sidebar: { enabled: false, position: 'left', widthPercent: 25 },
  borders: { style: 'none', color: '#000000' },
  icons: 'none',
};

test('accepts complete renderer-ready template specifications', () => {
  assert.equal(templateSpecSchema.safeParse(validTemplateSpec).success, true);
});

test('rejects malformed renderer tokens and color values', () => {
  const invalid = { ...validTemplateSpec, colors: { ...validTemplateSpec.colors, primary: 'ultraviolet' } };
  assert.equal(templateSpecSchema.safeParse(invalid).success, false);
});

test('requires a useful bounded job description', () => {
  assert.equal(analyzeJobSchema.safeParse({ jobDescription: 'Too short' }).success, false);
  assert.equal(analyzeJobSchema.safeParse({ jobDescription: 'A '.repeat(30) }).success, true);
  assert.equal(analyzeJobSchema.safeParse({ jobDescription: 'x'.repeat(12001) }).success, false);
});

test('rejects resume data above its storage and processing budget', () => {
  assert.equal(resumeCreateSchema.safeParse({ title: 'Valid', data: { summary: 'x'.repeat(100_001) } }).success, false);
});