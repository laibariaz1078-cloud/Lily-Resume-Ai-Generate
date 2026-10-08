export const THEME_STORAGE_KEY = 'Lily-theme';
export const CUSTOM_THEME_STORAGE_KEY = 'Lily-custom-themes';
export const CUSTOM_THEME_DRAFT_KEY = 'Lily-custom-theme-draft';

export const themeCategories = [
  {
    name: 'Professional',
    themes: ['pure', 'ocean', 'monochrome'],
  },
  {
    name: 'Creative',
    themes: ['rosewood', 'cream-ink', 'forest'],
  },
  {
    name: 'AI / Tech',
    themes: ['midnight', 'aurora', 'cyber'],
  },
];

export const applicationThemes = {
  pure: {
    id: 'pure',
    name: 'Pure',
    description: 'Clean, confident, and ready for work.',
    mood: 'Professional light',
    tokens: {
      bg: '#f5f6f8', surface: '#ffffff', surfaceSoft: '#eef0f3', ink: '#202633',
      inkSoft: '#4f5969', muted: '#7c8491', line: '#e1e5eb', lineStrong: '#cbd1da',
      primary: '#315fca', primaryDark: '#244eae', primarySoft: '#e9effd', accent: '#5574bd',
      secondaryAccent: '#8fa6dc', aiAccent: '#486bd1', warning: '#9b6b28',
      danger: '#a54843', success: '#347355', shadow: '0 18px 48px rgba(32,44,68,.09)',
      gradient: 'radial-gradient(ellipse at 78% 8%, rgba(73,111,194,.055), transparent 35%)',
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    description: 'A composed dark workspace with a precise edge.',
    mood: 'Premium dark',
    dark: true,
    tokens: {
      bg: '#11131b', surface: '#191c27', surfaceSoft: '#222634', ink: '#f0f1f7',
      inkSoft: '#c1c5d2', muted: '#9197a8', line: '#303443', lineStrong: '#42485b',
      primary: '#8c9cff', primaryDark: '#a9b4ff', primarySoft: '#272d48', accent: '#a897ef',
      secondaryAccent: '#8299ed', aiAccent: '#a695ff', warning: '#e6be77',
      danger: '#e79a9a', success: '#89c9a2', shadow: '0 20px 58px rgba(0,0,0,.32)',
      gradient: 'radial-gradient(ellipse at 82% 0%, rgba(93,85,180,.11), transparent 37%)',
    },
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora',
    description: 'Quiet AI-inspired color with soft atmospheric depth.',
    mood: 'AI atmosphere',
    dark: true,
    tokens: {
      bg: '#0e1523', surface: '#151e2e', surfaceSoft: '#1d293b', ink: '#edf4fa',
      inkSoft: '#bdcbd9', muted: '#90a1b5', line: '#2b394c', lineStrong: '#3b4d64',
      primary: '#78c6d9', primaryDark: '#9ad9e6', primarySoft: '#1e3443', accent: '#a997df',
      secondaryAccent: '#69c4c4', aiAccent: '#87cae5', warning: '#deb879',
      danger: '#e09998', success: '#89cbb0', shadow: '0 20px 60px rgba(0,0,0,.34)',
      gradient: 'radial-gradient(ellipse at 14% 0%, rgba(86,148,190,.12), transparent 38%), radial-gradient(ellipse at 88% 4%, rgba(145,106,189,.12), transparent 35%)',
    },
  },
  'cream-ink': {
    id: 'cream-ink',
    name: 'Cream & Ink',
    description: 'Warm ivory, considered typography, and a bronze note.',
    mood: 'Editorial luxury',
    tokens: {
      bg: '#f3eee5', surface: '#fbf8f1', surfaceSoft: '#ece4d8', ink: '#29251f',
      inkSoft: '#5c5349', muted: '#877c6f', line: '#e1d7c9', lineStrong: '#ccbdab',
      primary: '#805b38', primaryDark: '#6c492b', primarySoft: '#efe4d4', accent: '#a67849',
      secondaryAccent: '#c09b70', aiAccent: '#8f6944', warning: '#9a6a2d',
      danger: '#9b4f45', success: '#52715d', shadow: '0 20px 55px rgba(72,53,32,.1)',
      gradient: 'radial-gradient(ellipse at 83% 0%, rgba(170,132,83,.09), transparent 38%)',
    },
    serif: true,
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    description: 'Steady navy and soft blue for focused work.',
    mood: 'Calm professional',
    tokens: {
      bg: '#f0f5f8', surface: '#ffffff', surfaceSoft: '#e7eff4', ink: '#172a3d',
      inkSoft: '#43596d', muted: '#748697', line: '#d9e4ec', lineStrong: '#c1d1dd',
      primary: '#176c9e', primaryDark: '#10587f', primarySoft: '#dfeef6', accent: '#398eb4',
      secondaryAccent: '#73b8cb', aiAccent: '#278cb3', warning: '#9c7137',
      danger: '#a44f4b', success: '#34765f', shadow: '0 18px 52px rgba(29,66,91,.09)',
      gradient: 'radial-gradient(ellipse at 10% 2%, rgba(70,153,190,.075), transparent 38%)',
    },
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Sage accents and quiet warmth, kept professional.',
    mood: 'Natural refinement',
    tokens: {
      bg: '#f2f3ec', surface: '#fbfcf7', surfaceSoft: '#e8ebdf', ink: '#222b26',
      inkSoft: '#4d5a51', muted: '#79847a', line: '#dfe4d8', lineStrong: '#c9d2c5',
      primary: '#38634b', primaryDark: '#294e3a', primarySoft: '#e2ebe2', accent: '#8a9b74',
      secondaryAccent: '#b1bd94', aiAccent: '#52795a', warning: '#99733b',
      danger: '#a6524a', success: '#477552', shadow: '0 18px 52px rgba(38,67,47,.09)',
      gradient: 'radial-gradient(ellipse at 82% 0%, rgba(107,142,89,.075), transparent 38%)',
    },
  },
  rosewood: {
    id: 'rosewood',
    name: 'Rosewood',
    description: 'Warm ivory and a confident, restrained burgundy.',
    mood: 'Creative confidence',
    tokens: {
      bg: '#f6f0eb', surface: '#fffaf6', surfaceSoft: '#efe4dc', ink: '#30242a',
      inkSoft: '#594a50', muted: '#85757b', line: '#e7d9d4', lineStrong: '#d4c0bb',
      primary: '#873d52', primaryDark: '#713044', primarySoft: '#f2e2e5', accent: '#a45c68',
      secondaryAccent: '#c18a8b', aiAccent: '#99485c', warning: '#986a3e',
      danger: '#a4484d', success: '#4e745e', shadow: '0 20px 54px rgba(84,43,57,.1)',
      gradient: 'radial-gradient(ellipse at 86% 0%, rgba(157,77,98,.085), transparent 38%)',
    },
  },
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'A typographic system built on contrast and restraint.',
    mood: 'Swiss editorial',
    tokens: {
      bg: '#f4f4f2', surface: '#ffffff', surfaceSoft: '#e9e9e7', ink: '#171717',
      inkSoft: '#484848', muted: '#777777', line: '#ddddda', lineStrong: '#bdbdb9',
      primary: '#202020', primaryDark: '#080808', primarySoft: '#e7e7e5', accent: '#5c5c5c',
      secondaryAccent: '#92928e', aiAccent: '#343434', warning: '#795f3b',
      danger: '#8b4242', success: '#42614c', shadow: '0 16px 46px rgba(0,0,0,.08)',
      gradient: 'linear-gradient(135deg, rgba(0,0,0,.018), transparent 48%)',
    },
    serif: true,
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber',
    description: 'Graphite surfaces, crisp detail, and a measured signal.',
    mood: 'Technical focus',
    dark: true,
    tokens: {
      bg: '#121715', surface: '#191f1c', surfaceSoft: '#222b26', ink: '#eff4ef',
      inkSoft: '#c1ccc4', muted: '#94a198', line: '#303a34', lineStrong: '#46534b',
      primary: '#91cf9d', primaryDark: '#b0e2b7', primarySoft: '#25382c', accent: '#65bdc0',
      secondaryAccent: '#91cf9d', aiAccent: '#6dccd0', warning: '#dfbb74',
      danger: '#e38f87', success: '#91cf9d', shadow: '0 18px 48px rgba(0,0,0,.3)',
      gradient: 'linear-gradient(rgba(107,150,125,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(107,150,125,.025) 1px, transparent 1px)',
    },
    mono: true,
  },
};

export const customThemeDefaults = {
  bg: '#f4f3ef',
  surface: '#ffffff',
  ink: '#20251f',
  inkSoft: '#4f5a51',
  accent: '#315fca',
  secondaryAccent: '#8ba1d5',
  line: '#e0e3dc',
  button: '#315fca',
  hover: '#244eae',
  aiAccent: '#5578d0',
};

export const customThemeFields = [
  ['bg', 'Background'],
  ['surface', 'Surface'],
  ['ink', 'Primary text'],
  ['inkSoft', 'Secondary text'],
  ['accent', 'Accent'],
  ['secondaryAccent', 'Secondary accent'],
  ['line', 'Border'],
  ['button', 'Button'],
  ['hover', 'Hover'],
  ['aiAccent', 'AI accent'],
];

export function sanitizeCustomThemeColors(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...customThemeDefaults };
  return Object.fromEntries(Object.entries(customThemeDefaults).map(([key, fallback]) => [
    key,
    typeof value[key] === 'string' && /^#[\da-f]{6}$/i.test(value[key]) ? value[key] : fallback,
  ]));
}

export function normalizeLegacyTheme(value) {
  if (applicationThemes[value]) return value;
  if (value === 'Dark') return 'midnight';
  if (value === 'Light' || value === 'System') return 'pure';
  return 'pure';
}
