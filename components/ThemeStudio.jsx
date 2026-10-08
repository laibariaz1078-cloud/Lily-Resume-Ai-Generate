'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, ChevronDown, Palette, Plus, RotateCcw, Save, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useTheme } from '@/components/ThemeSync';
import {
  applicationThemes,
  customThemeFields,
  themeCategories,
} from '@/lib/theme-system';

function themeColors(theme, customColors) {
  if (theme.tokens) return {
    bg: theme.tokens.bg,
    surface: theme.tokens.surface,
    ink: theme.tokens.ink,
    inkSoft: theme.tokens.inkSoft,
    accent: theme.tokens.primary,
    secondary: theme.tokens.secondaryAccent,
    border: theme.tokens.line,
  };
  return {
    bg: customColors.bg,
    surface: customColors.surface,
    ink: customColors.ink,
    inkSoft: customColors.inkSoft,
    accent: customColors.button,
    secondary: customColors.secondaryAccent,
    border: customColors.line,
  };
}

function contrastRatio(first, second) {
  const luminance = (color) => {
    const values = color.slice(1).match(/.{2}/g).map((channel) => parseInt(channel, 16) / 255);
    return values.reduce((total, channel, index) => {
      const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      return total + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);
  };
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

export function ThemePreview({ theme, customColors, compact = false }) {
  const colors = themeColors(theme, customColors);
  return (
    <div
      className={`theme-preview ${compact ? 'theme-preview-compact' : ''}`}
      style={{
        '--preview-bg': colors.bg,
        '--preview-surface': colors.surface,
        '--preview-ink': colors.ink,
        '--preview-muted': colors.inkSoft,
        '--preview-accent': colors.accent,
        '--preview-secondary': colors.secondary,
        '--preview-border': colors.border,
      }}
      aria-hidden="true"
    >
      <div className="theme-preview-sidebar"><span/><i/><i/><i/></div>
      <div className="theme-preview-workspace">
        <div className="theme-preview-top"><span/><i/></div>
        <div className="theme-preview-heading"><i/><b/><small/></div>
        <div className="theme-preview-dashboard">
          <div className="theme-preview-card">
            <span><i/><i/><i/></span>
            <div><b/><small/><small/></div>
            <button/>
          </div>
          <div className="theme-preview-resume"><b>Alex Morgan</b><i/><small/><small/><em/><small/><small/></div>
        </div>
      </div>
    </div>
  );
}

function ThemeCard({ theme, customColors, selected, onApply }) {
  return (
    <motion.article className={`theme-card ${selected ? 'theme-card-active' : ''}`} layout>
      <div className="theme-card-preview"><ThemePreview theme={theme} customColors={customColors}/></div>
      <div className="theme-card-copy">
        <div><span className="eyebrow">{theme.mood || 'CUSTOM WORKSPACE'}</span><h3>{theme.name}</h3></div>
        {selected && <span className="theme-active-badge"><Check size={12}/> Active</span>}
      </div>
      <p>{theme.description || 'A personal color system for your workspace.'}</p>
      <button className={selected ? 'secondary-button' : 'primary-button'} onClick={onApply} aria-label={selected ? `${theme.name} theme applied` : `Apply ${theme.name} theme`} aria-pressed={selected}>
        {selected ? <><Check size={14}/> Applied</> : <>Apply theme <ArrowRight size={14}/></>}
      </button>
    </motion.article>
  );
}

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const { selectedTheme, currentTheme, customColors, customThemes, selectTheme } = useTheme();
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  return (
    <div className="theme-switcher">
      <button className={`theme-switcher-trigger ${open ? 'theme-switcher-open' : ''}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Palette size={16}/><span>Theme</span><i className="theme-trigger-dot"/><span className="theme-trigger-name">{currentTheme.name}</span><ChevronDown size={13}/>
      </button>
      <AnimatePresence>
        {open && <motion.div className="theme-switcher-popover" role="dialog" aria-label="Choose workspace theme" initial={{opacity:0,y:-6,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-5,scale:.98}} transition={{duration:.16}} onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }}>
          <div className="theme-popover-heading"><span><small>YOUR WORKSPACE</small><b>Current theme</b></span><button aria-label="Close theme menu" onClick={() => setOpen(false)}><X size={15}/></button></div>
          <div className="theme-current-summary"><i style={{background:applicationThemes[selectedTheme]?.tokens.primary || customColors.button}}/><span><b>{currentTheme.name}</b><small>{currentTheme.description}</small></span><Check size={14}/></div>
          <span className="theme-quick-label">QUICK THEMES</span>
          <div className="theme-quick-grid">{Object.values(applicationThemes).map((theme) => <button key={theme.id} className={selectedTheme===theme.id?'theme-quick-active':''} onClick={() => selectTheme(theme.id)} aria-pressed={selectedTheme===theme.id}><i style={{background:theme.tokens.bg,borderColor:theme.tokens.line}}><b style={{background:theme.tokens.primary}}/><em style={{background:theme.tokens.surface}}/></i><span>{theme.name}</span>{selectedTheme===theme.id&&<Check size={12}/>}</button>)}</div>
          {customThemes.length>0&&<div className="theme-saved-quick"><span className="theme-quick-label">SAVED THEMES</span>{customThemes.map((theme)=><button key={theme.id} onClick={()=>selectTheme(theme.id)} className={selectedTheme===theme.id?'theme-saved-active':''}><i style={{background:theme.colors.button}}/>{theme.name}{selectedTheme===theme.id&&<Check size={12}/>}</button>)}</div>}
          <Link className="theme-customize-link" href="/theme-studio" onClick={()=>setOpen(false)}><Sparkles size={14}/> Customize your workspace <ArrowRight size={14}/></Link>
        </motion.div>}
      </AnimatePresence>
      {open&&<button className="theme-popover-dismiss" tabIndex={-1} aria-label="Close theme menu" onClick={()=>setOpen(false)}/>}
    </div>
  );
}

export default function ThemeStudio() {
  const {
    selectedTheme, customColors, customThemes, selectTheme, updateCustomColor,
    resetCustomColors, saveCustomTheme, duplicateCurrentTheme,
  } = useTheme();
  const [themeName, setThemeName] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const customPreview = { id:'custom',name:'Your custom theme',description:'Fine-tune every color to suit your creative workspace.',mood:'YOUR COLOR SYSTEM' };
  const primaryContrast = contrastRatio(customColors.ink, customColors.bg);
  const secondaryContrast = contrastRatio(customColors.inkSoft, customColors.bg);

  const saveTheme = () => {
    try {
      const saved = saveCustomTheme(themeName);
      setThemeName('');
      setSaveNotice(`${saved.name} saved in this browser.`);
      setTimeout(() => setSaveNotice(''), 3000);
    } catch (error) {
      setSaveNotice(error.message);
    }
  };
  const duplicateTheme = () => {
    const suggestedName = duplicateCurrentTheme();
    setThemeName(suggestedName);
  };

  return <div className="theme-studio-page">
    <div className="theme-studio-heading"><div><span className="eyebrow"><Palette size={13}/> YOUR CREATIVE WORKSPACE</span><h1>Theme Studio<span>.</span></h1><p>Set the atmosphere for your work. Your resume’s own template, colors, and typography stay independent.</p></div><Link href="/settings" className="secondary-button">Workspace settings <ArrowRight size={14}/></Link></div>
    <div className="theme-current-banner"><div><span className="eyebrow">CURRENT APPLICATION THEME</span><h2>{(applicationThemes[selectedTheme] || customThemes.find((theme)=>theme.id===selectedTheme) || {name:'Your custom theme'}).name}</h2><p>Application colors shape the editor around your document—not the document itself.</p></div><div className="theme-banner-preview"><ThemePreview theme={applicationThemes[selectedTheme] || customThemes.find((theme)=>theme.id===selectedTheme) || customPreview} customColors={customThemes.find((theme)=>theme.id===selectedTheme)?.colors || customColors}/></div></div>
    {themeCategories.map((category) => <section className="theme-category-section" key={category.name}><div className="theme-category-heading"><span><small>THEME COLLECTION</small><h2>{category.name}</h2></span><span>{category.themes.length} considered palettes</span></div><div className="theme-card-grid">{category.themes.map((id) => <ThemeCard key={id} theme={applicationThemes[id]} customColors={customColors} selected={selectedTheme===id} onApply={() => selectTheme(id)}/>)}</div></section>)}
    {customThemes.length>0&&<section className="theme-category-section"><div className="theme-category-heading"><span><small>MADE BY YOU</small><h2>Your saved themes</h2></span><span>{customThemes.length} personal palettes</span></div><div className="theme-card-grid">{customThemes.map((theme)=><ThemeCard key={theme.id} theme={{...theme,mood:'YOUR SAVED THEME'}} customColors={theme.colors} selected={selectedTheme===theme.id} onApply={()=>selectTheme(theme.id)}/>)}</div></section>}
    <section className="custom-theme-studio">
      <div className="custom-theme-heading"><div><span className="eyebrow"><Sparkles size={13}/> MAKE IT PERSONAL</span><h2>Create your own theme.</h2><p>Your application preview changes as you choose colors. Resume-page design remains separate.</p></div><button className="secondary-button" onClick={duplicateTheme}><CopyIcon/> Duplicate theme</button></div>
      <div className="custom-theme-layout">
        <div className="custom-theme-controls"><div className="custom-theme-fields">{customThemeFields.map(([key,label])=><label className="custom-theme-field" key={key}><span><i style={{background:customColors[key]}}/>{label}</span><input type="color" value={customColors[key]} aria-label={label} onChange={(event)=>updateCustomColor(key,event.target.value)}/><code>{customColors[key].toUpperCase()}</code></label>)}</div>
          <div className={`theme-contrast-note ${primaryContrast>=4.5&&secondaryContrast>=4.5?'theme-contrast-pass':'theme-contrast-review'}`} role="status"><ShieldCheck size={14}/><span>Text contrast: <b>{primaryContrast>=4.5&&secondaryContrast>=4.5?'WCAG AA met':'Review recommended'}</b><small>Primary {primaryContrast.toFixed(1)}:1 · Secondary {secondaryContrast.toFixed(1)}:1. Button label contrast adjusts automatically.</small></span></div>
          <div className="custom-theme-actions"><button className="secondary-button" onClick={resetCustomColors}><RotateCcw size={14}/> Reset colors</button><label className="custom-theme-name"><span className="sr-only">Theme name</span><input value={themeName} onChange={(event)=>setThemeName(event.target.value)} placeholder="Name your theme"/></label><button className="primary-button" onClick={saveTheme}><Save size={14}/> Save theme</button></div>{saveNotice&&<p className={`theme-save-notice ${saveNotice.startsWith('Could not save')?'theme-save-error':''}`} role="status">{saveNotice.startsWith('Could not save')?<X size={13} />:<Check size={13} />}{saveNotice}</p>}
        </div>
        <div className="custom-theme-live"><div className="custom-theme-live-label"><span><i/> LIVE APPLICATION PREVIEW</span><span>Resume design stays independent</span></div><ThemePreview theme={customPreview} customColors={customColors}/></div>
      </div>
    </section>
  </div>;
}

function CopyIcon() {
  return <span aria-hidden="true" className="theme-copy-glyph"><Plus size={13}/></span>;
}
