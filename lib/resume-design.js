export const defaultResumeConfig = {
  document: { language: 'English (US)', dateFormat: 'MM/YYYY', pageFormat: 'A4' },
  typography: {
    bodyFont: 'Inter',
    nameFont: 'Inter',
    baseFontSize: 10.5,
    headingSizes: { fullName: 24, title: 13, sectionHeading: 11.5 },
    fontWeight: 400,
  },
  spacing: {
    lineHeight: 1.35,
    spaceBetweenSections: 12,
    spaceBetweenEntries: 9,
    headingContentGap: 5,
    paragraphSpacing: 6,
    marginHorizontal: 16,
    marginVertical: 16,
    marginLeft: 16,
    marginRight: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  layout: {
    columns: 'one',
    sectionOrder: [],
    entryStructure: 'full-width',
    datePosition: 'right',
    locationPosition: 'same-line',
    subtitlePlacement: 'below-title',
    secondarySections: ['education', 'skills', 'languages', 'certifications'],
    pageBreaks: [],
  },
  style: {
    headingStyle: 'underline',
    headingCapitalization: 'uppercase',
    headingIconStyle: 'none',
  },
  colors: { text: '#222222', background: '#FFFFFF', accent: '#2E5D4A' },
  accentTargets: {
    name: true,
    headings: true,
    headingsLine: true,
    jobTitle: false,
    dates: false,
    headerIcons: false,
    linkIcons: false,
  },
};

export const resumeTemplates = [
  {
    id: 'arden',
    name: 'Arden',
    category: 'Professional',
    description: 'A considered, polished layout for experienced professionals.',
    tags: ['Popular', 'ATS friendly'],
    config: {},
  },
  {
    id: 'forma',
    name: 'Forma',
    category: 'Modern',
    description: 'A clean two-column starting point with a confident accent.',
    tags: ['Modern', 'Two column'],
    config: {
      layout: { columns: 'two' },
      colors: { accent: '#3765A2' },
      style: { headingStyle: 'left-border' },
      accentTargets: { name: false, headings: true, headingsLine: false, jobTitle: true },
    },
  },
  {
    id: 'plain',
    name: 'Plain',
    category: 'Minimal',
    description: 'A quiet, typography-led design that keeps the focus on you.',
    tags: ['Minimal', 'ATS friendly'],
    config: {
      typography: { bodyFont: 'Arial', nameFont: 'Arial', baseFontSize: 10.5 },
      colors: { accent: '#475569' },
      style: { headingStyle: 'plain', headingCapitalization: 'original' },
      accentTargets: { name: false, headings: false, headingsLine: false, jobTitle: false },
    },
  },
  {
    id: 'fieldnote',
    name: 'Fieldnote',
    category: 'Creative',
    description: 'Warm editorial details for a portfolio-ready first impression.',
    tags: ['Creative', 'Editorial'],
    config: {
      typography: { bodyFont: 'Georgia', nameFont: 'Georgia' },
      colors: { accent: '#A65D42' },
      style: { headingStyle: 'top-bottom', headingCapitalization: 'original' },
    },
  },
  {
    id: 'signal',
    name: 'Signal',
    category: 'Technology',
    description: 'A crisp, contemporary layout for technical careers.',
    tags: ['Technology', 'Modern'],
    config: {
      layout: { columns: 'mix' },
      colors: { accent: '#176F70' },
      style: { headingStyle: 'filled' },
    },
  },
  {
    id: 'scholar',
    name: 'Scholar',
    category: 'Student',
    description: 'A structured, legible format for academic experience.',
    tags: ['Student', 'Academic'],
    config: {
      typography: { bodyFont: 'Merriweather', nameFont: 'Georgia' },
      colors: { accent: '#6B4E70' },
      layout: { datePosition: 'left' },
      style: { headingStyle: 'underline', headingCapitalization: 'original' },
    },
  },
];

export const colorPalettes = [
  { name: 'Evergreen', group: 'Green', text: '#222222', background: '#FFFFFF', accent: '#2E5D4A' },
  { name: 'Cobalt', group: 'Blue', text: '#202633', background: '#FFFFFF', accent: '#3765A2' },
  { name: 'Soft lilac', group: 'Purple', text: '#282332', background: '#FFFFFF', accent: '#74558F' },
  { name: 'Terracotta', group: 'Red', text: '#302421', background: '#FFFFFF', accent: '#A65D42' },
  { name: 'Graphite', group: 'Monochrome', text: '#222222', background: '#FFFFFF', accent: '#475569' },
  { name: 'Sandstone', group: 'Neutral', text: '#302B25', background: '#FDFBF7', accent: '#8A6A3D' },
  { name: 'Lagoon', group: 'Multi-color', text: '#243039', background: '#FFFFFF', accent: '#176F70' },
];

function mergeConfig(base, override = {}) {
  return {
    ...base,
    ...override,
    document: { ...base.document, ...override.document },
    typography: {
      ...base.typography,
      ...override.typography,
      headingSizes: { ...base.typography.headingSizes, ...override.typography?.headingSizes },
    },
    spacing: { ...base.spacing, ...override.spacing },
    layout: { ...base.layout, ...override.layout },
    style: { ...base.style, ...override.style },
    colors: { ...base.colors, ...override.colors },
    accentTargets: { ...base.accentTargets, ...override.accentTargets },
  };
}

export function getTemplateConfig(templateId, sectionOrder = []) {
  const template = resumeTemplates.find((item) => item.id === templateId);
  return mergeConfig(defaultResumeConfig, {
    ...(template?.config || {}),
    layout: { ...(template?.config?.layout || {}), sectionOrder },
  });
}

export function normalizeResumeConfig(config, sectionOrder = []) {
  const merged = mergeConfig(defaultResumeConfig, config || {});
  return {
    ...merged,
    layout: {
      ...merged.layout,
      sectionOrder: sectionOrder.length ? sectionOrder : merged.layout.sectionOrder,
    },
  };
}
