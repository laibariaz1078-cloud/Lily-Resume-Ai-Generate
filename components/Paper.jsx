import { Award, BriefcaseBusiness, Code2, ExternalLink, GraduationCap, Languages, Lightbulb, Mail, MapPin, Phone, Settings2, UserRound } from 'lucide-react';
import { LISTS, SECTIONS } from '@/lib/resume';
import { normalizeResumeConfig } from '@/lib/resume-design';

const sectionIcons = {
  summary: UserRound,
  experience: BriefcaseBusiness,
  projects: Code2,
  education: GraduationCap,
  skills: Settings2,
  certifications: Award,
  languages: Languages,
  achievements: Lightbulb,
};

function sectionTitle(resume, key) {
  if (key.startsWith('custom-')) {
    return resume.customSections?.find((section) => section.id === key)?.title || 'Custom section';
  }
  return SECTIONS[key] || key;
}

function sectionEntries(resume, key) {
  if (key.startsWith('custom-')) {
    return resume.customSections?.find((section) => section.id === key)?.entries || [];
  }
  return resume[key] || [];
}

function formatDate(value, config) {
  if (!value) return value;
  const language = config.document.language === 'English (UK)' ? 'en-GB' : config.document.language === 'English (Canada)' ? 'en-CA' : 'en-US';
  return value.replace(/\b(?:(\d{4})-(\d{2})-(\d{2})|(\d{4})-(\d{2})|(\d{1,2})\/(\d{4}))\b/g, (match, year, month, day, shortYear, shortMonth, slashMonth, slashYear) => {
    const parsedYear = Number(year || shortYear || slashYear);
    const parsedMonth = Number(month || shortMonth || slashMonth || 1);
    const parsedDay = Number(day || 1);
    if (!parsedYear || parsedMonth < 1 || parsedMonth > 12) return match;
    const date = new Date(Date.UTC(parsedYear, parsedMonth - 1, parsedDay));
    const format = config.document.dateFormat;
    if (format === 'Month YYYY') return new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
    if (format === 'MM/YYYY') return `${String(parsedMonth).padStart(2, '0')}/${parsedYear}`;
    if (format === 'YYYY-MM-DD') return `${parsedYear}-${String(parsedMonth).padStart(2, '0')}-${String(parsedDay).padStart(2, '0')}`;
    if (format === 'DD/MM/YYYY') return `${String(parsedDay).padStart(2, '0')}/${String(parsedMonth).padStart(2, '0')}/${parsedYear}`;
    if (format === 'MM/DD/YYYY') return `${String(parsedMonth).padStart(2, '0')}/${String(parsedDay).padStart(2, '0')}/${parsedYear}`;
    return match;
  });
}

function EntryDate({ entry, config }) {
  const isLink = /^https?:\/\//i.test(entry.c || '');
  return (
    <span className="resume-entry-date" style={{ color: config.accentTargets.dates ? config.colors.accent : undefined }}>
      {isLink
        ? <a href={entry.c} target="_blank" rel="noreferrer">{config.accentTargets.linkIcons && <ExternalLink size={10} color={config.colors.accent}/>} {entry.c}</a>
        : formatDate(entry.c, config)}
    </span>
  );
}

function Section({ resume, config, sectionKey, index }) {
  const title = sectionTitle(resume, sectionKey);
  const Icon = sectionIcons[sectionKey];
  const customEntries = sectionEntries(resume, sectionKey);
  const isTextSection = sectionKey === 'summary' || sectionKey === 'skills';
  const text = resume[sectionKey];
  const entries = isTextSection ? [] : customEntries;
  if (resume.hidden?.[sectionKey]) return null;
  if (isTextSection && !text?.trim()) return null;
  if (!isTextSection && !entries.length) return null;

  const capitalization = config.style.headingCapitalization;
  const heading = capitalization === 'uppercase'
    ? title.toUpperCase()
    : capitalization === 'lowercase'
      ? title.toLowerCase()
      : capitalization === 'capitalize'
        ? title.replace(/\b\w/g, (character) => character.toUpperCase())
        : title;
  const headingStyle = config.style.headingStyle;
  const accentHeadings = config.accentTargets.headings;
  const headingColor = accentHeadings ? config.colors.accent : config.colors.text;
  const headingLine = config.accentTargets.headingsLine ? config.colors.accent : config.colors.text;

  return (
    <section
      className={`resume-section resume-heading-${headingStyle}`}
      style={{
        '--section-space': `${config.spacing.spaceBetweenSections}pt`,
        '--heading-gap': `${config.spacing.headingContentGap}pt`,
        '--heading-color': headingColor,
        '--heading-line': headingLine,
        '--section-index': index,
      }}
      data-page-break={config.layout.pageBreaks.includes(index) ? 'true' : undefined}
    >
      <h2 className="resume-section-heading">
        {config.style.headingIconStyle !== 'none' && Icon && (
          <Icon
            aria-hidden="true"
            size={config.typography.headingSizes.sectionHeading + 1}
            strokeWidth={config.style.headingIconStyle === 'filled' ? 2.7 : 1.8}
            fill={config.style.headingIconStyle === 'filled' ? 'currentColor' : 'none'}
          />
        )}
        {heading}
      </h2>
      {isTextSection ? (
        <p className="resume-section-copy">{text}</p>
      ) : (
        <div className={`resume-entries ${config.layout.entryStructure === 'columns' ? 'resume-entries-columns' : ''}`}>
          {entries.map((entry, entryIndex) => (
            <article className="resume-entry-preview" key={entry.id || entryIndex}>
              <div className={`resume-entry-heading date-${config.layout.datePosition}`}>
                {['left', 'split'].includes(config.layout.datePosition) && <EntryDate entry={entry} config={config}/>}
                <div className="resume-entry-title">
                  <strong>{entry.a || entry.title || 'Untitled'}</strong>
                  {entry.b && config.layout.subtitlePlacement === 'same-line' && (
                    <span className="resume-entry-subtitle inline-subtitle"> · {entry.b}</span>
                  )}
                </div>
                {config.layout.datePosition === 'right' && <EntryDate entry={entry} config={config}/>}
              </div>
              {entry.b && config.layout.subtitlePlacement === 'below-title' && (
                <div className="resume-entry-subtitle">{entry.b}</div>
              )}
              {entry.location && <div className={`resume-entry-location location-${config.layout.locationPosition}`}>{entry.location}</div>}
              {(entry.text || entry.description) && <p className="resume-entry-copy">{entry.text || entry.description}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Paper({ r, preview = false }) {
  const config = normalizeResumeConfig(r.config, r.order || []);
  const sections = r.order || config.layout.sectionOrder || Object.keys(SECTIONS);
  const primarySections = sections.filter((section) => !config.layout.secondarySections.includes(section));
  const secondarySections = sections.filter((section) => config.layout.secondarySections.includes(section));
  const renderSections = (keys) => keys.map((key) => (
    <Section key={key} resume={r} config={config} sectionKey={key} index={sections.indexOf(key)} />
  ));
  const pageWidth = config.document.pageFormat === 'US Letter' ? '8.5in' : '210mm';
  const pageMinHeight = config.document.pageFormat === 'US Letter' ? '11in' : '297mm';
  const nameColor = config.accentTargets.name ? config.colors.accent : config.colors.text;
  const titleColor = config.accentTargets.jobTitle ? config.colors.accent : config.colors.text;

  return (
    <article
      className={`resume-paper ${config.document.pageFormat === 'US Letter' ? 'page-us-letter' : 'page-a4'} ${preview ? 'resume-paper-preview' : ''} columns-${config.layout.columns}`}
      style={{
        width: pageWidth,
        minHeight: pageMinHeight,
        background: config.colors.background,
        color: config.colors.text,
        fontFamily: config.typography.bodyFont,
        fontSize: `${config.typography.baseFontSize}pt`,
        fontWeight: config.typography.fontWeight,
        lineHeight: config.spacing.lineHeight,
        padding: `${config.spacing.marginTop}mm ${config.spacing.marginRight}mm ${config.spacing.marginBottom}mm ${config.spacing.marginLeft}mm`,
        '--name-size': `${config.typography.headingSizes.fullName}pt`,
        '--title-size': `${config.typography.headingSizes.title}pt`,
        '--section-heading-size': `${config.typography.headingSizes.sectionHeading}pt`,
        '--entry-space': `${config.spacing.spaceBetweenEntries}pt`,
        '--paragraph-space': `${config.spacing.paragraphSpacing}pt`,
        '--accent': config.colors.accent,
        '--name-color': nameColor,
        '--title-color': titleColor,
      }}
    >
      <header className="resume-paper-header">
        <h1 style={{ fontFamily: config.typography.nameFont }}>{r.fullName || 'Your Name'}</h1>
        {r.title && <div className="resume-paper-title">{r.title}</div>}
        <div className="resume-contact">
          {[[r.email, Mail], [r.phone, Phone], [r.location, MapPin]].filter(([value]) => value).map(([value, Icon], index) => (
            <span key={`${value}-${index}`}>
              {config.accentTargets.headerIcons && <Icon size={10} color={config.colors.accent}/>}
              {value}
            </span>
          ))}
        </div>
      </header>
      {config.layout.columns === 'one' ? (
        <div className="resume-one-column">{renderSections(sections)}</div>
      ) : (
        <div className={`resume-columns-layout ${config.layout.columns === 'mix' ? 'resume-mix-layout' : ''}`}>
          <div className="resume-primary-column">{renderSections(primarySections)}</div>
          <aside className="resume-secondary-column">{renderSections(secondarySections)}</aside>
        </div>
      )}
      <span className="resume-page-format">{config.document.pageFormat}</span>
    </article>
  );
}
