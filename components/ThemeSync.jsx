'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  applicationThemes,
  CUSTOM_THEME_DRAFT_KEY,
  CUSTOM_THEME_STORAGE_KEY,
  customThemeDefaults,
  normalizeLegacyTheme,
  sanitizeCustomThemeColors,
  THEME_STORAGE_KEY,
} from '@/lib/theme-system';

const ThemeContext = createContext(null);
const customProperties = {
  bg: '--bg',
  surface: '--surface',
  ink: '--ink',
  inkSoft: '--ink-soft',
  accent: '--accent',
  secondaryAccent: '--theme-secondary-accent',
  line: '--line',
  button: '--primary',
  hover: '--primary-dark',
  aiAccent: '--ai-accent',
};

function readableForeground(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map((channel) => parseInt(channel, 16) / 255);
  const luminance = channels.reduce((total, channel, index) => {
    const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return total + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
  const whiteContrast = 1.05 / (luminance + 0.05);
  const darkContrast = (luminance + 0.05) / 0.05;
  return whiteContrast >= darkContrast ? '#ffffff' : '#111820';
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used within ThemeSync.');
  return theme;
}

export default function ThemeSync({ children }) {
  const [selectedTheme, setSelectedTheme] = useState('pure');
  const [customColors, setCustomColors] = useState(customThemeDefaults);
  const [customThemes, setCustomThemes] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      const storedCustom = JSON.parse(localStorage.getItem(CUSTOM_THEME_STORAGE_KEY) || '[]');
      const storedDraft = JSON.parse(localStorage.getItem(CUSTOM_THEME_DRAFT_KEY) || 'null');
      const savedThemes = Array.isArray(storedCustom)
        ? storedCustom.filter((theme) => theme && typeof theme.id === 'string' && typeof theme.name === 'string')
          .map((theme) => ({ ...theme, colors: sanitizeCustomThemeColors(theme.colors) }))
        : [];
      setCustomThemes(savedThemes);
      if (storedTheme) {
        const restoredTheme = applicationThemes[storedTheme] || storedTheme === 'custom' || savedThemes.some((theme) => theme.id === storedTheme)
          ? storedTheme
          : normalizeLegacyTheme(storedTheme);
        setSelectedTheme(restoredTheme);
      }
      setCustomColors(sanitizeCustomThemeColors(storedDraft));
    } catch (error) {
      console.error('Could not restore the saved appearance preferences.', error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const root = document.documentElement;
    const custom = customThemes.find((item) => item.id === selectedTheme);
    const preset = applicationThemes[selectedTheme];
    const activeTheme = preset || (selectedTheme === 'custom' || custom ? { id: 'custom', tokens: null } : applicationThemes.pure);
    const activeColors = custom?.colors || customColors;
    root.dataset.theme = activeTheme.id;
    root.dataset.savedTheme = custom?.id || '';
    root.classList.toggle('dark', preset ? Boolean(preset.dark) : readableForeground(activeColors.bg) === '#ffffff');
    root.classList.toggle('theme-serif', Boolean(preset?.serif && !preset?.mono));
    root.classList.toggle('theme-mono', Boolean(preset?.mono));
    if (preset) {
      for (const property of Object.values(customProperties)) root.style.removeProperty(property);
      root.style.setProperty('--primary-foreground', readableForeground(preset.tokens.primary));
    } else {
      const colors = activeColors;
      for (const [key, property] of Object.entries(customProperties)) {
        root.style.setProperty(property, colors[key] || customThemeDefaults[key]);
      }
      root.style.setProperty('--primary-foreground', readableForeground(colors.button));
    }
    root.classList.add('theme-transitioning');
    const timeout = setTimeout(() => root.classList.remove('theme-transitioning'), 480);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
      localStorage.setItem(CUSTOM_THEME_DRAFT_KEY, JSON.stringify(customColors));
      localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(customThemes));
    } catch (error) {
      console.error('Could not save the appearance preferences in this browser.', error);
    }
    return () => clearTimeout(timeout);
  }, [selectedTheme, customColors, customThemes, loaded]);

  const selectTheme = useCallback((id) => {
    if (applicationThemes[id] || id === 'custom') {
      setSelectedTheme(id);
      return;
    }
    const savedTheme = customThemes.find((item) => item.id === id);
    if (savedTheme) {
      setCustomColors({ ...customThemeDefaults, ...savedTheme.colors });
      setSelectedTheme(id);
    }
  }, [customThemes]);

  const updateCustomColor = useCallback((key, value) => {
    if (!Object.prototype.hasOwnProperty.call(customThemeDefaults, key) || !/^#[\da-f]{6}$/i.test(value)) return;
    setCustomColors((current) => ({ ...current, [key]: value }));
    setSelectedTheme('custom');
  }, []);

  const resetCustomColors = useCallback(() => {
    setCustomColors(customThemeDefaults);
    setSelectedTheme('custom');
  }, []);

  const saveCustomTheme = useCallback((name) => {
    const theme = { id: `custom-${Date.now()}`, name: name.trim() || 'My custom theme', colors: { ...customColors } };
    const nextThemes = [...customThemes, theme];
    try {
      localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(nextThemes));
      localStorage.setItem(THEME_STORAGE_KEY, theme.id);
    } catch (error) {
      console.error('Could not save the custom theme in this browser.', error);
      throw new Error('Could not save this theme in browser storage. Check available storage and try again.', { cause: error });
    }
    setCustomThemes(nextThemes);
    setSelectedTheme(theme.id);
    return theme;
  }, [customColors, customThemes]);

  const duplicateCurrentTheme = useCallback(() => {
    const preset = applicationThemes[selectedTheme];
    const savedTheme = customThemes.find((item) => item.id === selectedTheme);
    const colors = savedTheme?.colors || (preset ? {
      bg: preset.tokens.bg,
      surface: preset.tokens.surface,
      ink: preset.tokens.ink,
      inkSoft: preset.tokens.inkSoft,
      accent: preset.tokens.accent,
      secondaryAccent: preset.tokens.secondaryAccent,
      line: preset.tokens.line,
      button: preset.tokens.primary,
      hover: preset.tokens.primaryDark,
      aiAccent: preset.tokens.aiAccent,
    } : customColors);
    setCustomColors({ ...customThemeDefaults, ...colors });
    setSelectedTheme('custom');
    return `${savedTheme?.name || preset?.name || 'Theme'} copy`;
  }, [customColors, customThemes, selectedTheme]);

  const value = useMemo(() => ({
    selectedTheme,
    currentTheme: applicationThemes[selectedTheme] || customThemes.find((item) => item.id === selectedTheme) || { id: 'custom', name: 'Custom', description: 'Your own color system.' },
    customColors,
    customThemes,
    selectTheme,
    updateCustomColor,
    resetCustomColors,
    saveCustomTheme,
    duplicateCurrentTheme,
  }), [selectedTheme, customColors, customThemes, selectTheme, updateCustomColor, resetCustomColors, saveCustomTheme, duplicateCurrentTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
