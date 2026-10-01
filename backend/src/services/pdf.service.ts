import PDFDocument from 'pdfkit';
import type { TemplateSpec } from '../validators/template.validator';
import type { ResumeDocument } from '../models/resume.model';
import { Template } from '../models/template.model';
import { ApiError } from '../utils/api-error';
import { resumeService } from './resume.service';

const defaultSpec: TemplateSpec = {
  layout: { columns: 'single', pageSize: 'A4' },
  typography: { headingFont: 'Helvetica', bodyFont: 'Helvetica', baseFontSize: 10.5, headingScale: 1.35, lineHeight: 1.35 },
  spacing: { density: 'standard', sectionGap: 12, lineGap: 4 },
  colors: { primary: '#205B4B', accent: '#C36E50', text: '#202522', muted: '#5F6963', background: '#FFFFFF' },
  sectionOrder: ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'languages', 'achievements'],
  headerStyle: 'left-aligned',
  sidebar: { enabled: false, position: 'left', widthPercent: 30 },
  borders: { style: 'subtle', color: '#D7DFDA' },
  icons: 'none',
};

function asText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  return '';
}

function sectionTitle(key: string): string {
  return ({ summary: 'Professional Summary', experience: 'Experience', projects: 'Projects', education: 'Education', skills: 'Skills', certifications: 'Certifications', languages: 'Languages', achievements: 'Achievements', custom: 'Additional Experience' } as Record<string, string>)[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase());
}

function fontName(value: string, bold = false): string {
  const normalized = value.toLowerCase();
  if (normalized.includes('serif')) return bold ? 'Times-Bold' : 'Times-Roman';
  return bold ? 'Helvetica-Bold' : 'Helvetica';
}

async function getSpec(resume: ResumeDocument): Promise<TemplateSpec> {
  if (!resume.templateId) return defaultSpec;
  const alternatives = [{ slug: resume.templateId }, ...( /^[a-f\d]{24}$/i.test(resume.templateId) ? [{ _id: resume.templateId }] : [])];
  const template = await Template.findOne({ $or: alternatives }).exec();
  return (template?.templateSpec as TemplateSpec | undefined) ?? defaultSpec;
}

export async function exportResumePdf(userId: string, resumeId: string): Promise<{ buffer: Buffer; filename: string }> {
  const result = await resumeService.get(userId, resumeId);
  if (result.expiration.isExpired) throw new ApiError(410, 'This resume has expired');
  const resume = result as unknown as ResumeDocument;
  const spec = await getSpec(resume);
  const data = resume.data;
  const margin = 48;
  const document = new PDFDocument({ size: 'A4', margins: { top: margin, right: margin, bottom: margin, left: margin }, info: { Title: resume.title, Author: asText(data.fullName) || 'Resume owner' } });
  const chunks: Buffer[] = [];
  const bufferPromise = new Promise<Buffer>((resolve, reject) => {
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);
  });

  const width = document.page.width - margin * 2;
  const colors = spec.colors;
  const bodyFont = fontName(spec.typography.bodyFont);
  const headingFont = fontName(spec.typography.headingFont, true);
  const ensureSpace = (height: number): void => {
    if (document.y + height > document.page.height - margin) document.addPage();
  };
  const writeText = (text: string, options: { font?: string; size?: number; color?: string; gap?: number; align?: 'left' | 'center' | 'right' } = {}): void => {
    if (!text) return;
    const font = options.font ?? bodyFont;
    const size = options.size ?? spec.typography.baseFontSize;
    document.font(font).fontSize(size);
    const height = document.heightOfString(text, { width, lineGap: spec.spacing.lineGap });
    ensureSpace(height + (options.gap ?? 0));
    document.font(font).fontSize(size).fillColor(options.color ?? colors.text).text(text, { width, lineGap: spec.spacing.lineGap, align: options.align ?? 'left' });
    if (options.gap) document.moveDown(options.gap / 12);
  };

  const headerAlign = spec.headerStyle === 'centered' ? 'center' : 'left';
  document.font(headingFont).fontSize(spec.headerStyle === 'compact' ? 19 : 23).fillColor(colors.primary).text(asText(data.fullName) || resume.title, { width, align: headerAlign });
  const contact = [asText(data.title), asText(data.email), asText(data.phone), asText(data.location)].filter(Boolean).join('  |  ');
  writeText(contact, { size: 9, color: colors.muted, gap: spec.spacing.sectionGap, align: headerAlign });
  if (spec.borders.style !== 'none') {
    const y = document.y + 4;
    document.moveTo(margin, y).lineTo(margin + width, y).lineWidth(spec.borders.style === 'strong' ? 1.5 : 0.6).strokeColor(spec.borders.color || colors.accent).stroke();
    document.moveDown(0.8);
  } else {
    document.moveTo(margin, document.y + 4).lineTo(margin + width, document.y + 4).lineWidth(1.2).strokeColor(colors.accent).stroke();
    document.moveDown(0.8);
  }

  const order = Array.isArray(data.order) ? data.order.filter((value): value is string => typeof value === 'string') : spec.sectionOrder;
  const hidden = data.hidden && typeof data.hidden === 'object' ? data.hidden as Record<string, unknown> : {};
  const keys = [...new Set([...order, ...spec.sectionOrder])];
  for (const key of keys) {
    if (hidden[key] === true) continue;
    const value = data[key];
    if (key === 'fullName' || key === 'title' || key === 'email' || key === 'phone' || key === 'location' || key === 'order' || key === 'hidden') continue;
    const heading = sectionTitle(key);
    if (typeof value === 'string' || typeof value === 'number') {
      const text = asText(value);
      if (!text) continue;
      ensureSpace(30);
      document.moveDown(0.5).font(headingFont).fontSize(spec.typography.baseFontSize * spec.typography.headingScale).fillColor(colors.primary).text(heading);
      writeText(text, { gap: spec.spacing.sectionGap });
      continue;
    }
    if (!Array.isArray(value) || value.length === 0) continue;
    ensureSpace(32);
    document.moveDown(0.5).font(headingFont).fontSize(spec.typography.baseFontSize * spec.typography.headingScale).fillColor(colors.primary).text(heading);
    for (const entry of value) {
      if (entry === null || typeof entry !== 'object') {
        writeText(asText(entry), { gap: spec.spacing.lineGap });
        continue;
      }
      const item = entry as Record<string, unknown>;
      const title = [asText(item.a), asText(item.b)].filter(Boolean).join('  |  ');
      const dates = asText(item.c);
      if (title) writeText([title, dates].filter(Boolean).join('  |  '), { font: headingFont, size: spec.typography.baseFontSize, color: colors.text });
      const description = asText(item.text) || asText(item.description) || asText(item.details);
      writeText(description, { color: colors.text, gap: spec.spacing.lineGap });
    }
    document.moveDown(spec.spacing.sectionGap / 12);
  }

  document.end();
  const buffer = await bufferPromise;
  const safeName = resume.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'resume';
  return { buffer, filename: `${safeName}.pdf` };
}