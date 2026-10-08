'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown, ArrowLeft, ArrowUp, Check, ChevronDown, Columns2, Eye, EyeOff, FileText,
  GripVertical, LayoutTemplate, Minus, Plus, Redo2, RotateCcw, Save, Settings2,
  Sparkles, Trash2, Type, Undo2, X,
} from 'lucide-react';
import Paper from '@/components/Paper';
import AiBar from '@/components/AiBar';
import { LISTS, SECTIONS, blank, keywordGaps } from '@/lib/resume';
import { colorPalettes, getTemplateConfig, normalizeResumeConfig, resumeTemplates } from '@/lib/resume-design';

const clone = (value) => JSON.parse(JSON.stringify(value));
const oldTemplateIds = { modern: 'arden', classic: 'scholar', minimal: 'plain' };
const fontOptions = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Merriweather', 'Georgia', 'Arial', 'Times New Roman'];
const sectionOptions = [
  ['summary', 'Professional summary'],
  ['experience', 'Experience'],
  ['projects', 'Projects'],
  ['education', 'Education'],
  ['skills', 'Skills'],
  ['certifications', 'Certifications'],
  ['languages', 'Languages'],
  ['achievements', 'Achievements'],
];
const customSectionOptions = ['Publications', 'Awards', 'Volunteer Experience', 'Interests', 'References', 'Other'];
const tabs = [
  ['content', FileText, 'Content'],
  ['design', Type, 'Design'],
  ['sections', Settings2, 'Sections'],
  ['templates', LayoutTemplate, 'Templates'],
  ['ai', Sparkles, 'AI'],
];

function normalizeResume(resume) {
  const order = resume.order?.length ? resume.order : Object.keys(SECTIONS);
  const template = oldTemplateIds[resume.template] || resume.template || 'arden';
  const legacyConfig = getTemplateConfig(template, order);
  if (!resume.config) {
    legacyConfig.colors.accent = resume.color || legacyConfig.colors.accent;
    legacyConfig.typography.bodyFont = resume.font || legacyConfig.typography.bodyFont;
    legacyConfig.typography.nameFont = resume.font || legacyConfig.typography.nameFont;
  }
  return {
    ...blank(),
    ...resume,
    template,
    order,
    config: normalizeResumeConfig(resume.config || legacyConfig, order),
    hidden: resume.hidden || {},
    customSections: resume.customSections || [],
    certifications: resume.certifications || [],
    languages: resume.languages || [],
    achievements: resume.achievements || [],
    custom: resume.custom || [],
  };
}

function ControlGroup({ title, children, hint }) {
  return <section className="design-control-group"><div className="design-group-heading"><h3>{title}</h3>{hint && <span>{hint}</span>}</div>{children}</section>;
}

function ChoiceRow({ label, value, options, onChange }) {
  return (
    <label className="studio-control-row">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => {
          const [optionValue, optionLabel] = Array.isArray(option) ? option : [option, option];
          return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
        })}
      </select>
    </label>
  );
}

function RangeRow({ label, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <label className="studio-range-row">
      <span>{label}<b>{value}{unit}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))}/>
    </label>
  );
}

function ColorField({ label, value, onChange }) {
  return <label className="studio-color-field"><span>{label}</span><span className="studio-color-input"><input type="color" value={value} onChange={(event) => onChange(event.target.value)}/><code>{value}</code></span></label>;
}

function TemplatePreview({ template, selected, onPreview, onUse }) {
  return (
    <article className={`studio-template-card ${selected ? 'is-selected' : ''}`}>
      <button className="studio-template-art" onClick={onPreview} aria-label={`Preview ${template.name} template`}>
        <span className={`studio-template-sheet studio-sheet-${template.id}`} style={{ '--template-accent': template.config?.colors?.accent || '#2e5d4a' }}>
          <b>Alex Morgan</b><i>PRODUCT DESIGNER</i><span/><span/><strong>EXPERIENCE</strong><span/><span/><strong>EDUCATION</strong><span/>
        </span>
      </button>
      <div className="studio-template-info"><b>{template.name}{selected && <Check size={13}/>}</b><small>{template.category} · Free</small><span>{template.tags.join(' · ')}</span><p>{template.description}</p><div><button onClick={onPreview}>Preview</button><button onClick={onUse}>Use template</button></div></div>
    </article>
  );
}

export default function BuilderWorkspace() {
  const [store, setStore] = useState(null);
  const [tab, setTab] = useState('content');
  const [toast, setToast] = useState('');
  const [job, setJob] = useState('');
  const [gaps, setGaps] = useState(null);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [zoom, setZoom] = useState(80);
  const [templateModal, setTemplateModal] = useState(false);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [resumeManagerOpen, setResumeManagerOpen] = useState(false);
  const [customType, setCustomType] = useState('');
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const saveTimer = useRef(null);
  const toastTimer = useRef(null);
  const dragItem = useRef(null);
  const didLoad = useRef(false);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    try {
      const saved = JSON.parse(localStorage.getItem('rs-next') || 'null');
      const list = saved?.list?.length ? saved.list.map(normalizeResume) : [];
      let cur = list.some((item) => item.id === saved?.cur) ? saved.cur : list[0]?.id;
      const params = new URLSearchParams(window.location.search);
      const selectedTemplate = resumeTemplates.find((item) => item.id === params.get('template'));
      const mode = params.get('mode');

      if (selectedTemplate && mode === 'use') {
        const nextResume = blank();
        nextResume.template = selectedTemplate.id;
        nextResume.config = getTemplateConfig(selectedTemplate.id, nextResume.order);
        nextResume.color = nextResume.config.colors.accent;
        nextResume.font = nextResume.config.typography.bodyFont;
        const normalized = normalizeResume(nextResume);
        list.push(normalized);
        cur = normalized.id;
      }
      if (!list.length) {
        const firstResume = normalizeResume(blank());
        list.push(firstResume);
        cur = firstResume.id;
      }
      setStore({ cur, list });
      if (selectedTemplate && mode === 'preview') setTemplatePreview(selectedTemplate);
      if (selectedTemplate) window.history.replaceState(window.history.state, '', '/builder');
    } catch (error) {
      console.error('Could not load saved resumes.', error);
      const firstResume = normalizeResume(blank());
      setStore({ cur: firstResume.id, list: [firstResume] });
      setSaveStatus('Could not load saved data');
    }
  }, []);

  useEffect(() => {
    if (!store) return undefined;
    setSaveStatus('Saving…');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem('rs-next', JSON.stringify(store));
        setSaveStatus('Saved');
      } catch (error) {
        console.error('Could not save resumes to this browser.', error);
        setSaveStatus('Could not save');
      }
    }, 450);
    return () => clearTimeout(saveTimer.current);
  }, [store]);

  const resume = useMemo(
    () => store?.list.find((item) => item.id === store.cur) || store?.list[0],
    [store],
  );

  const notify = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  };

  const changeResume = (mutate, { history = true } = {}) => {
    if (!resume || !store) return;
    if (history) {
      setPast((items) => [...items.slice(-29), clone(resume)]);
      setFuture([]);
    }
    setStore((current) => ({
      ...current,
      list: current.list.map((item) => item.id === current.cur ? mutate(clone(item)) : item),
    }));
  };

  const updateField = (key, value) => changeResume((item) => ({ ...item, [key]: value }));
  const updateConfig = (group, key, value) => changeResume((item) => {
    item.config[group][key] = value;
    if (group === 'colors' && key === 'accent') item.color = value;
    if (group === 'typography' && key === 'bodyFont') item.font = value;
    return item;
  });
  const updateNestedConfig = (group, nested, key, value) => changeResume((item) => {
    item.config[group][nested][key] = value;
    return item;
  });

  const applyTemplate = (templateId) => {
    const template = resumeTemplates.find((item) => item.id === templateId);
    if (!template) return;
    changeResume((item) => {
      item.template = template.id;
      item.config = getTemplateConfig(template.id, item.order);
      item.color = item.config.colors.accent;
      item.font = item.config.typography.bodyFont;
      return item;
    });
    setTemplateModal(false);
    notify(`${template.name} design applied. Your resume content is unchanged.`);
  };

  const undo = () => {
    if (!past.length || !resume) return;
    const previous = past[past.length - 1];
    setFuture((items) => [clone(resume), ...items].slice(0, 30));
    setPast((items) => items.slice(0, -1));
    setStore((current) => ({ ...current, list: current.list.map((item) => item.id === current.cur ? previous : item) }));
  };
  const redo = () => {
    if (!future.length || !resume) return;
    const next = future[0];
    setPast((items) => [...items.slice(-29), clone(resume)]);
    setFuture((items) => items.slice(1));
    setStore((current) => ({ ...current, list: current.list.map((item) => item.id === current.cur ? next : item) }));
  };

  const reorderSection = (from, to) => {
    if (!from || from === to) return;
    changeResume((item) => {
      const order = [...item.order];
      const fromIndex = order.indexOf(from);
      const toIndex = order.indexOf(to);
      if (fromIndex < 0 || toIndex < 0) return item;
      order.splice(fromIndex, 1);
      order.splice(toIndex, 0, from);
      item.order = order;
      item.config.layout.sectionOrder = order;
      return item;
    });
    dragItem.current = null;
  };

  const addSection = (key) => {
    if (!key) return;
    changeResume((item) => {
      if (key === 'custom-section') {
        const id = `custom-${Date.now()}`;
        item.customSections.push({ id, title: customType || 'Other', entries: [] });
        item.order.push(id);
      } else if (!item.order.includes(key)) {
        item.order.push(key);
      }
      item.config.layout.sectionOrder = item.order;
      return item;
    });
    setCustomType('');
  };

  const deleteCustomSection = (sectionId) => changeResume((item) => {
    item.order = item.order.filter((key) => key !== sectionId);
    item.customSections = item.customSections.filter((section) => section.id !== sectionId);
    item.config.layout.pageBreaks = item.config.layout.pageBreaks.filter((index) => index < item.order.length);
    item.config.layout.sectionOrder = item.order;
    return item;
  });

  const updateEntry = (section, index, field, value) => changeResume((item) => {
    item[section][index][field] = value;
    return item;
  });
  const sectionName = (key) => key.startsWith('custom-')
    ? resume.customSections.find((section) => section.id === key)?.title || 'Custom section'
    : SECTIONS[key] || key;
  const entriesFor = (key) => key.startsWith('custom-')
    ? resume.customSections.find((section) => section.id === key)?.entries || []
    : resume[key] || [];
  const createResume = (source) => {
    const next = source ? { ...clone(source), id: String(Date.now()), name: `${source.name} (copy)` } : blank();
    setStore((current) => ({ ...current, cur: next.id, list: [...current.list, normalizeResume(next)] }));
    setPast([]);
    setFuture([]);
    setResumeManagerOpen(false);
    notify(source ? 'Resume duplicated.' : 'New resume created.');
  };
  const openResume = (id) => {
    setStore((current) => ({ ...current, cur: id }));
    setPast([]);
    setFuture([]);
    setResumeManagerOpen(false);
  };

  if (!store || !resume) return <div className="studio-builder-loading" aria-label="Loading resume editor"><span/><span/><span/></div>;

  const config = normalizeResumeConfig(resume.config, resume.order);

  const renderContentSection = (key) => {
    if (key === 'summary' || key === 'skills') {
      return (
        <div className="studio-content-card" key={key}>
          <div className="studio-content-card-heading"><div><small>CONTENT</small><h3>{sectionName(key)}</h3></div><button className="studio-icon-action" onClick={() => updateField('hidden', { ...resume.hidden, [key]: !resume.hidden[key] })} aria-label={`${resume.hidden[key] ? 'Show' : 'Hide'} ${sectionName(key)}`}>{resume.hidden[key] ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
          <textarea className="studio-input studio-content-textarea" aria-label={sectionName(key)} value={resume[key] || ''} placeholder={key === 'summary' ? 'A few lines about your experience and strengths…' : 'Add skills separated by commas'} onChange={(event) => updateField(key, event.target.value)}/>
          <AiBar text={resume[key] || ''} job={job} notify={notify} onAccept={(text) => updateField(key, text)}/>
        </div>
      );
    }

    const entries = entriesFor(key);
    const listKey = key.startsWith('custom-') ? key : key;
    return (
      <div className="studio-content-card" key={key}>
        <div className="studio-content-card-heading"><div><small>CONTENT</small><h3>{sectionName(key)}</h3></div><button className="studio-icon-action" onClick={() => updateField('hidden', { ...resume.hidden, [key]: !resume.hidden[key] })} aria-label={`${resume.hidden[key] ? 'Show' : 'Hide'} ${sectionName(key)}`}>{resume.hidden[key] ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
        {entries.map((entry, index) => (
          <div className="studio-entry-form" key={entry.id || index}>
            <div className="studio-entry-grid">
              <label>{key.startsWith('custom-') ? 'Entry title' : LISTS[listKey]?.[0]}<input className="studio-input" value={entry.a || ''} onChange={(event) => key.startsWith('custom-') ? changeResume((item) => { item.customSections.find((section) => section.id === key).entries[index].a = event.target.value; return item; }) : updateEntry(key, index, 'a', event.target.value)}/></label>
              <label>{key.startsWith('custom-') ? 'Details' : LISTS[listKey]?.[1]}<input className="studio-input" value={entry.b || ''} onChange={(event) => key.startsWith('custom-') ? changeResume((item) => { item.customSections.find((section) => section.id === key).entries[index].b = event.target.value; return item; }) : updateEntry(key, index, 'b', event.target.value)}/></label>
            </div>
            <div className="studio-entry-grid">
              <label>{key.startsWith('custom-') ? 'Date' : LISTS[listKey]?.[2]}<input className="studio-input" value={entry.c || ''} onChange={(event) => key.startsWith('custom-') ? changeResume((item) => { item.customSections.find((section) => section.id === key).entries[index].c = event.target.value; return item; }) : updateEntry(key, index, 'c', event.target.value)}/></label>
              <label>Location<input className="studio-input" value={entry.location || ''} onChange={(event) => key.startsWith('custom-') ? changeResume((item) => { item.customSections.find((section) => section.id === key).entries[index].location = event.target.value; return item; }) : updateEntry(key, index, 'location', event.target.value)}/></label>
            </div>
            <label>Description<textarea className="studio-input" rows="3" value={entry.text || ''} onChange={(event) => key.startsWith('custom-') ? changeResume((item) => { item.customSections.find((section) => section.id === key).entries[index].text = event.target.value; return item; }) : updateEntry(key, index, 'text', event.target.value)}/></label>
            <AiBar text={entry.text || ''} job={job} notify={notify} onAccept={(text) => key.startsWith('custom-') ? changeResume((item) => { item.customSections.find((section) => section.id === key).entries[index].text = text; return item; }) : updateEntry(key, index, 'text', text)}/>
            <button className="studio-remove-entry" onClick={() => changeResume((item) => { if (key.startsWith('custom-')) item.customSections.find((section) => section.id === key).entries.splice(index, 1); else item[key].splice(index, 1); return item; })}><Trash2 size={14}/> Remove entry</button>
          </div>
        ))}
        <button className="studio-add-entry" onClick={() => changeResume((item) => {
          const entry = { id: `${Date.now()}-${entries.length}`, a: '', b: '', c: '', location: '', text: '' };
          if (key.startsWith('custom-')) item.customSections.find((section) => section.id === key).entries.push(entry);
          else item[key].push(entry);
          return item;
        })}><Plus size={15}/> Add {sectionName(key).toLowerCase()} entry</button>
      </div>
    );
  };

  return (
    <div className="resume-studio">
      <header className="resume-studio-toolbar">
        <div className="resume-studio-brand">
          <Link href="/dashboard" aria-label="Back to dashboard"><ArrowLeft size={17}/></Link>
          <span className="brand-mark">R</span>
          <span className="resume-studio-wordmark">Lily <b>Studio</b></span>
        </div>
        <div className="resume-studio-title">
          <input aria-label="Resume name" value={resume.name} onChange={(event) => updateField('name', event.target.value)}/>
          <span className={`resume-save-status ${saveStatus === 'Could not save' ? 'save-error' : ''}`}><i/>{saveStatus}</span>
        </div>
        <div className="resume-studio-actions">
          <button className="studio-toolbar-button" onClick={undo} disabled={!past.length} aria-label="Undo"><Undo2 size={16}/></button>
          <button className="studio-toolbar-button" onClick={redo} disabled={!future.length} aria-label="Redo"><Redo2 size={16}/></button>
          <button className="studio-toolbar-button studio-toolbar-template" onClick={() => setResumeManagerOpen(true)}><FileText size={15}/> My resumes</button>
          <button className="studio-toolbar-button studio-toolbar-template" onClick={() => setTemplateModal(true)}><LayoutTemplate size={15}/> Change template</button>
          <button className="studio-export-button" onClick={() => window.print()}><Save size={15}/> Download PDF</button>
        </div>
      </header>

      <div className="resume-studio-workspace">
        <aside className="resume-studio-sidebar">
          <nav className="resume-studio-tabs" aria-label="Resume editor panels">
            {tabs.map(([id, Icon, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={17}/><span>{label}</span></button>)}
          </nav>
          <div className="resume-studio-panel">
            {tab === 'content' && <>
              <div className="studio-panel-title"><span>YOUR STORY</span><h2>Content</h2><p>Write and organize the details in your resume.</p></div>
              <section className="studio-content-card">
                <div className="studio-content-card-heading"><div><small>CONTACT</small><h3>Personal details</h3></div></div>
                {[['fullName', 'Full name'], ['title', 'Professional title'], ['email', 'Email address'], ['phone', 'Phone number'], ['location', 'Location']].map(([key, label]) => <label className="studio-field" key={key}>{label}<input className="studio-input" value={resume[key] || ''} onChange={(event) => updateField(key, event.target.value)}/></label>)}
              </section>
                {resume.order.map(renderContentSection)}
              <div className="studio-content-card">
                <div className="studio-content-card-heading"><div><small>OPTIONAL</small><h3>Target a role</h3></div></div>
                <textarea className="studio-input studio-content-textarea" placeholder="Paste a job description to find relevant keywords" value={job} onChange={(event) => setJob(event.target.value)}/>
                <button className="studio-add-entry" onClick={() => job.trim() ? setGaps(keywordGaps(job, resume)) : notify('Paste a job description first')}><Sparkles size={15}/> Find keyword gaps</button>
                {gaps && <p className="studio-hint">{gaps.length ? `Keywords to consider: ${gaps.join(', ')}. Only add skills that reflect your experience.` : 'No obvious keyword gaps found.'}</p>}
              </div>
            </>}

            {tab === 'design' && <>
              <div className="studio-panel-title"><span>MAKE IT YOURS</span><h2>Design</h2><p>Every change updates your preview as you work.</p></div>
              <ControlGroup title="Document">
                <ChoiceRow label="Language" value={config.document.language} options={['English (US)', 'English (UK)', 'English (Canada)', 'Spanish', 'French', 'Other']} onChange={(value) => updateConfig('document', 'language', value)}/>
                <ChoiceRow label="Date format" value={config.document.dateFormat} options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'Month YYYY', 'MM/YYYY']} onChange={(value) => updateConfig('document', 'dateFormat', value)}/>
                <ChoiceRow label="Page format" value={config.document.pageFormat} options={['A4', 'US Letter']} onChange={(value) => updateConfig('document', 'pageFormat', value)}/>
              </ControlGroup>
              <ControlGroup title="Typography">
                <ChoiceRow label="Font family" value={config.typography.bodyFont} options={fontOptions} onChange={(value) => changeResume((item) => { item.config.typography.bodyFont = value; item.config.typography.nameFont = value; item.font = value; return item; })}/>
                <RangeRow label="Body size" value={config.typography.baseFontSize} min={8} max={14} step={0.5} unit=" pt" onChange={(value) => updateConfig('typography', 'baseFontSize', value)}/>
                <RangeRow label="Full name" value={config.typography.headingSizes.fullName} min={16} max={38} step={0.5} unit=" pt" onChange={(value) => updateNestedConfig('typography', 'headingSizes', 'fullName', value)}/>
                <RangeRow label="Professional title" value={config.typography.headingSizes.title} min={9} max={22} step={0.5} unit=" pt" onChange={(value) => updateNestedConfig('typography', 'headingSizes', 'title', value)}/>
                <RangeRow label="Section heading" value={config.typography.headingSizes.sectionHeading} min={8} max={18} step={0.5} unit=" pt" onChange={(value) => updateNestedConfig('typography', 'headingSizes', 'sectionHeading', value)}/>
                <ChoiceRow label="Font weight" value={config.typography.fontWeight} options={[[300, 'Light'], [400, 'Regular'], [500, 'Medium']]} onChange={(value) => updateConfig('typography', 'fontWeight', Number(value))}/>
              </ControlGroup>
              <ControlGroup title="Spacing">
                <RangeRow label="Line height" value={config.spacing.lineHeight} min={1} max={2} step={0.05} onChange={(value) => updateConfig('spacing', 'lineHeight', value)}/>
                <RangeRow label="Between sections" value={config.spacing.spaceBetweenSections} min={4} max={28} unit=" pt" onChange={(value) => updateConfig('spacing', 'spaceBetweenSections', value)}/>
                <RangeRow label="Between entries" value={config.spacing.spaceBetweenEntries} min={2} max={22} unit=" pt" onChange={(value) => updateConfig('spacing', 'spaceBetweenEntries', value)}/>
                <RangeRow label="Heading to content" value={config.spacing.headingContentGap} min={1} max={16} unit=" pt" onChange={(value) => updateConfig('spacing', 'headingContentGap', value)}/>
                <RangeRow label="Paragraph spacing" value={config.spacing.paragraphSpacing} min={0} max={16} unit=" pt" onChange={(value) => updateConfig('spacing', 'paragraphSpacing', value)}/>
                <RangeRow label="Left margin" value={config.spacing.marginLeft} min={8} max={30} unit=" mm" onChange={(value) => updateConfig('spacing', 'marginLeft', value)}/>
                <RangeRow label="Right margin" value={config.spacing.marginRight} min={8} max={30} unit=" mm" onChange={(value) => updateConfig('spacing', 'marginRight', value)}/>
                <RangeRow label="Top margin" value={config.spacing.marginTop} min={8} max={30} unit=" mm" onChange={(value) => updateConfig('spacing', 'marginTop', value)}/>
                <RangeRow label="Bottom margin" value={config.spacing.marginBottom} min={8} max={30} unit=" mm" onChange={(value) => updateConfig('spacing', 'marginBottom', value)}/>
              </ControlGroup>
              <ControlGroup title="Columns">
                <div className="studio-layout-choices">{[['one', 'One column'], ['two', 'Two columns'], ['mix', 'Mix']].map(([value, label]) => <button key={value} className={config.layout.columns === value ? 'selected' : ''} onClick={() => updateConfig('layout', 'columns', value)}><span className={`layout-icon layout-${value}`}><i/><i/></span>{label}</button>)}</div>
                {config.layout.columns !== 'one' && <div className="studio-secondary-picks"><span>Place sections in the side column</span>{resume.order.map((key) => <label key={key}><input type="checkbox" checked={config.layout.secondarySections.includes(key)} onChange={(event) => updateConfig('layout', 'secondarySections', event.target.checked ? [...config.layout.secondarySections, key] : config.layout.secondarySections.filter((item) => item !== key))}/>{sectionName(key)}</label>)}</div>}
              </ControlGroup>
              <ControlGroup title="Section headings">
                <div className="studio-heading-choices">{[['underline', 'Underline'], ['left-border', 'Left border'], ['filled', 'Filled'], ['top-bottom', 'Top + bottom'], ['plain', 'Plain']].map(([value, label]) => <button key={value} className={`heading-style-sample sample-${value} ${config.style.headingStyle === value ? 'selected' : ''}`} onClick={() => updateConfig('style', 'headingStyle', value)}><b>HEADING</b><span>{label}</span></button>)}</div>
                <ChoiceRow label="Capitalization" value={config.style.headingCapitalization} options={['original', 'capitalize', 'uppercase', 'lowercase']} onChange={(value) => updateConfig('style', 'headingCapitalization', value)}/>
                <ChoiceRow label="Heading icons" value={config.style.headingIconStyle} options={['none', 'outline', 'filled']} onChange={(value) => updateConfig('style', 'headingIconStyle', value)}/>
              </ControlGroup>
              <ControlGroup title="Entry layout">
                <ChoiceRow label="Entry width" value={config.layout.entryStructure} options={[['full-width', 'Full width'], ['columns', 'Columns']]} onChange={(value) => updateConfig('layout', 'entryStructure', value)}/>
                <ChoiceRow label="Date position" value={config.layout.datePosition} options={['left', 'right', 'split']} onChange={(value) => updateConfig('layout', 'datePosition', value)}/>
                <ChoiceRow label="Location position" value={config.layout.locationPosition} options={[['left', 'Left'], ['right', 'Right'], ['same-line', 'Same line'], ['separate-line', 'Separate line']]} onChange={(value) => updateConfig('layout', 'locationPosition', value)}/>
                <ChoiceRow label="Subtitle" value={config.layout.subtitlePlacement} options={[['below-title', 'Below title'], ['same-line', 'Same line']]} onChange={(value) => updateConfig('layout', 'subtitlePlacement', value)}/>
              </ControlGroup>
              <ControlGroup title="Color palettes">
                <div className="studio-palette-grid">{colorPalettes.map((palette) => <button key={palette.name} className={config.colors.accent === palette.accent ? 'selected' : ''} title={`${palette.name} · ${palette.group}`} onClick={() => changeResume((item) => { item.config.colors = { text: palette.text, background: palette.background, accent: palette.accent }; item.color = palette.accent; return item; })}><span><i style={{ background: palette.text }}/><i style={{ background: palette.background }}/><i style={{ background: palette.accent }}/></span><small>{palette.name}</small></button>)}</div>
              </ControlGroup>
              <ControlGroup title="Custom colors">
                <ColorField label="Text" value={config.colors.text} onChange={(value) => updateConfig('colors', 'text', value)}/>
                <ColorField label="Background" value={config.colors.background} onChange={(value) => updateConfig('colors', 'background', value)}/>
                <ColorField label="Accent" value={config.colors.accent} onChange={(value) => updateConfig('colors', 'accent', value)}/>
              </ControlGroup>
              <ControlGroup title="Accent targets" hint="Choose where the accent color appears">
                {Object.entries({ name: 'Name', headings: 'Section headings', headingsLine: 'Heading lines', jobTitle: 'Professional title', dates: 'Dates', headerIcons: 'Header icons', linkIcons: 'Link icons' }).map(([key, label]) => <label className="studio-switch-row" key={key}><span>{label}</span><input type="checkbox" checked={config.accentTargets[key]} onChange={(event) => updateConfig('accentTargets', key, event.target.checked)}/></label>)}
              </ControlGroup>
              <button className="studio-reset-button" onClick={() => changeResume((item) => { item.config = getTemplateConfig(item.template, item.order); item.color = item.config.colors.accent; item.font = item.config.typography.bodyFont; return item; })}><RotateCcw size={14}/> Reset design to template</button>
            </>}

            {tab === 'sections' && <>
              <div className="studio-panel-title"><span>STRUCTURE</span><h2>Sections</h2><p>Reorder, hide, or add sections without losing their content.</p></div>
              <div className="studio-content-card studio-section-manager">
                {resume.order.map((key, index) => <div className="studio-section-row" key={key} onDragOver={(event) => event.preventDefault()} onDrop={() => reorderSection(dragItem.current, key)}>
                  <span className="studio-drag-handle" draggable onDragStart={() => { dragItem.current = key; }} aria-label={`Drag ${sectionName(key)}`}><GripVertical size={17}/></span>
                  {key.startsWith('custom-') ? <input className="studio-section-name" aria-label="Custom section name" value={sectionName(key)} onChange={(event) => changeResume((item) => { item.customSections.find((section) => section.id === key).title = event.target.value; return item; })}/> : <span className="studio-section-name">{sectionName(key)}</span>}
                  <button className={`studio-icon-action ${resume.hidden[key] ? 'muted' : ''}`} onClick={() => changeResume((item) => { item.hidden[key] = !item.hidden[key]; return item; })} aria-label={resume.hidden[key] ? 'Show section' : 'Hide section'}>{resume.hidden[key] ? <EyeOff size={15}/> : <Eye size={15}/>}</button>
                  <button className="studio-icon-action" disabled={index === 0} onClick={() => reorderSection(key, resume.order[index - 1])} aria-label="Move section up"><ArrowUp size={15}/></button>
                  <button className="studio-icon-action" disabled={index === resume.order.length - 1} onClick={() => reorderSection(key, resume.order[index + 1])} aria-label="Move section down"><ArrowDown size={15}/></button>
                  {key.startsWith('custom-') && <button className="studio-icon-action danger" onClick={() => deleteCustomSection(key)} aria-label="Delete custom section"><Trash2 size={15}/></button>}
                  <button className="studio-page-break" onClick={() => changeResume((item) => { const breaks = item.config.layout.pageBreaks; item.config.layout.pageBreaks = breaks.includes(index) ? breaks.filter((point) => point !== index) : [...breaks, index]; return item; })}>{config.layout.pageBreaks.includes(index) ? 'Remove break' : 'Page break'}</button>
                </div>)}
                <div className="studio-add-section-row">
                  <select aria-label="Choose a section to add" value={customType ? 'custom-section' : ''} onChange={(event) => { if (event.target.value === 'custom-section') setCustomType(customSectionOptions[0]); else { setCustomType(''); addSection(event.target.value); } }}>
                    <option value="">+ Add section</option>
                    {sectionOptions.filter(([key]) => !resume.order.includes(key)).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
                    <option value="custom-section">Custom section…</option>
                  </select>
                  <select aria-label="Choose custom section type" value={customType} onChange={(event) => setCustomType(event.target.value)}><option value="">Section type</option>{customSectionOptions.map((type) => <option key={type}>{type}</option>)}</select>
                  <button className="studio-add-entry compact" disabled={!customType} onClick={() => addSection('custom-section')}><Plus size={15}/> Add</button>
                </div>
              </div>
              <ControlGroup title="Entry layout">
                <ChoiceRow label="Entry width" value={config.layout.entryStructure} options={['full-width', 'columns']} onChange={(value) => updateConfig('layout', 'entryStructure', value)}/>
                <ChoiceRow label="Date position" value={config.layout.datePosition} options={['left', 'right', 'split']} onChange={(value) => updateConfig('layout', 'datePosition', value)}/>
              </ControlGroup>
            </>}

            {tab === 'templates' && <>
              <div className="studio-panel-title"><span>DESIGN STARTING POINTS</span><h2>Templates</h2><p>Switch designs any time. Your content stays right where it is.</p></div>
              <div className="studio-template-list">{resumeTemplates.map((template) => <TemplatePreview key={template.id} template={template} selected={resume.template === template.id} onPreview={() => setTemplatePreview(template)} onUse={() => applyTemplate(template.id)}/>)}</div>
            </>}

            {tab === 'ai' && <>
              <div className="studio-panel-title"><span>WRITING COMPANION</span><h2>AI assistant</h2><p>Suggestions are optional. You decide what becomes part of your resume.</p></div>
              <div className="studio-content-card"><label className="studio-field">Job description<textarea className="studio-input studio-content-textarea" value={job} onChange={(event) => setJob(event.target.value)} placeholder="Paste a role description to find relevant keywords."/></label><button className="studio-add-entry" onClick={() => job.trim() ? setGaps(keywordGaps(job, resume)) : notify('Paste a job description first')}><Sparkles size={15}/> Analyze keywords</button>{gaps && <p className="studio-hint">{gaps.length ? `Keywords to consider: ${gaps.join(', ')}. Add only what matches your experience.` : 'No obvious keyword gaps found.'}</p>}</div>
              {resume.order.filter((key) => key === 'summary' || key === 'experience' || key.startsWith('custom-')).map((key) => <div className="studio-content-card" key={key}><div className="studio-content-card-heading"><div><small>WRITING SUPPORT</small><h3>{sectionName(key)}</h3></div></div>{key === 'summary' ? <AiBar text={resume.summary || ''} job={job} notify={notify} onAccept={(text) => updateField('summary', text)}/> : entriesFor(key).map((entry, index) => <AiBar key={entry.id || index} text={entry.text || ''} job={job} notify={notify} onAccept={(text) => key.startsWith('custom-') ? changeResume((item) => { item.customSections.find((section) => section.id === key).entries[index].text = text; return item; }) : updateEntry(key, index, 'text', text)}/>)}</div>)}
            </>}
          </div>
        </aside>

        <main className="resume-studio-preview-area" aria-label="Live resume preview">
          <div className="studio-preview-toolbar">
            <span><i/> Live preview <small>· {config.document.pageFormat}</small></span>
            <div><button aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(45, value - 5))}><Minus size={14}/></button><span>{zoom}%</span><button aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(115, value + 5))}><Plus size={14}/></button><button aria-label="Fit page" onClick={() => setZoom(80)}><Columns2 size={15}/></button></div>
          </div>
          <div className="studio-preview-scroll">
              <div className="studio-paper-scale" style={{ '--paper-scale': zoom / 100, '--paper-width': config.document.pageFormat === 'US Letter' ? '8.5in' : '210mm' }}><Paper r={resume} preview/></div>
          </div>
          <div className="studio-preview-footer"><span><Check size={13}/> Changes saved automatically</span><button onClick={() => setTemplateModal(true)}>Change template <ChevronDown size={13}/></button></div>
        </main>
      </div>

      {templateModal && <div className="studio-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setTemplateModal(false); }}><section className="studio-template-modal" role="dialog" aria-modal="true" aria-labelledby="template-modal-title"><div className="studio-modal-heading"><div><span>THE LILY COLLECTION</span><h2 id="template-modal-title">Choose a starting design</h2><p>Your content and sections will be preserved.</p></div><button className="studio-icon-action" onClick={() => setTemplateModal(false)} aria-label="Close template picker"><X size={19}/></button></div><div className="studio-modal-grid">{resumeTemplates.map((template) => <TemplatePreview key={template.id} template={template} selected={resume.template === template.id} onPreview={() => setTemplatePreview(template)} onUse={() => applyTemplate(template.id)}/>)}</div></section></div>}
      {templatePreview && <div className="studio-modal-backdrop studio-template-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setTemplatePreview(null); }}><section className="studio-template-modal studio-template-preview-modal" role="dialog" aria-modal="true" aria-labelledby="template-preview-title"><div className="studio-modal-heading"><div><span>{templatePreview.category.toUpperCase()} · FREE</span><h2 id="template-preview-title">{templatePreview.name}</h2><p>{templatePreview.description}</p></div><button className="studio-icon-action" onClick={() => setTemplatePreview(null)} aria-label="Close template preview"><X size={19}/></button></div><div className="studio-template-real-preview"><Paper r={{ ...resume, template: templatePreview.id, config: getTemplateConfig(templatePreview.id, resume.order), color: getTemplateConfig(templatePreview.id, resume.order).colors.accent, font: getTemplateConfig(templatePreview.id, resume.order).typography.bodyFont }} preview/></div><div className="studio-template-preview-actions"><span>{templatePreview.tags.join(' · ')}</span><button className="studio-export-button" onClick={() => { setTemplatePreview(null); applyTemplate(templatePreview.id); }}>Use this template</button></div></section></div>}
      {resumeManagerOpen && <div className="studio-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setResumeManagerOpen(false); }}><section className="studio-template-modal studio-resume-manager" role="dialog" aria-modal="true" aria-labelledby="resume-manager-title"><div className="studio-modal-heading"><div><span>YOUR WORKSPACE</span><h2 id="resume-manager-title">My resumes</h2><p>Saved in this browser. Pick up where you left off.</p></div><button className="studio-icon-action" onClick={() => setResumeManagerOpen(false)} aria-label="Close resume list"><X size={19}/></button></div><div className="studio-resume-list">{store.list.map((item) => <div className="studio-resume-row" key={item.id}><button className={`studio-icon-action ${item.fav ? 'is-favorite' : ''}`} onClick={() => setStore((current) => ({ ...current, list: current.list.map((resumeItem) => resumeItem.id === item.id ? { ...resumeItem, fav: !resumeItem.fav } : resumeItem) }))} aria-label={item.fav ? 'Remove favorite' : 'Favorite resume'}>★</button><button className="studio-resume-open" onClick={() => openResume(item.id)}><b>{item.name}</b><span>{resumeTemplates.find((template) => template.id === item.template)?.name || item.template} · {item.fullName}</span></button><button className="studio-icon-action" onClick={() => createResume(item)} aria-label="Duplicate resume"><Plus size={15}/></button><button className="studio-icon-action danger" disabled={store.list.length < 2} onClick={() => setStore((current) => { const list = current.list.filter((resumeItem) => resumeItem.id !== item.id); return { ...current, list, cur: current.cur === item.id ? list[0].id : current.cur }; })} aria-label="Delete resume"><Trash2 size={15}/></button></div>)}</div><button className="studio-export-button studio-new-resume" onClick={() => createResume()}><Plus size={15}/> Create a new resume</button></section></div>}
      <div className={`studio-toast ${toast ? 'visible' : ''}`} role="status">{toast}</div>
    </div>
  );
}
