'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, BriefcaseBusiness, Check, ChevronRight, CirclePlus, FileText, Lightbulb,
  Plus, Sparkles, Trash2,
} from 'lucide-react';

const pipeline = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];
const readResume = () => {
  if (typeof window === 'undefined') return null;
  try {
    const state = JSON.parse(localStorage.getItem('rs-next') || '{}');
    return state.list?.find((item) => item.id === state.cur) || state.list?.[0] || null;
  } catch (error) {
    console.error('Could not read the saved resume for analysis.', error);
    return null;
  }
};

function ToolHeading({ eyebrow, title, copy, action }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{action}</div>;
}

function getAnalysis(resume, jobDescription) {
  const text = resume ? JSON.stringify(resume).toLowerCase() : '';
  const keywords = ['leadership', 'communication', 'analysis', 'strategy', 'collaboration', 'project management', 'research', 'design', 'development', 'customer'];
  const present = jobDescription ? keywords.filter((word) => jobDescription.toLowerCase().includes(word) && text.includes(word)) : [];
  const missing = jobDescription ? keywords.filter((word) => jobDescription.toLowerCase().includes(word) && !text.includes(word)) : [];
  const checks = [
    ['Contact details', Boolean(resume?.email && resume?.fullName), resume?.email && resume?.fullName ? 'Name and email are present.' : 'Add your name and email address.'],
    ['Professional summary', Boolean(resume?.summary?.trim()), resume?.summary?.trim() ? 'A summary helps readers understand your focus.' : 'Add a short professional summary.'],
    ['Experience details', Boolean(resume?.experience?.some((entry) => entry.a || entry.text)), resume?.experience?.some((entry) => entry.a || entry.text) ? 'Your experience section has content.' : 'Add a role and a few details about your work.'],
    ['Skills', Boolean(resume?.skills?.trim()), resume?.skills?.trim() ? 'Skills are listed for quick scanning.' : 'Add relevant skills you can speak to.'],
    ['Readable structure', Boolean(resume?.order?.length && resume?.template), resume?.order?.length ? 'Your resume uses a clear section order.' : 'Choose a template and organize your sections.'],
    ['Role relevance', !jobDescription || present.length > 0, jobDescription ? `${present.length} matching terms found${missing.length ? `; consider relevant terms such as ${missing.slice(0, 3).join(', ')}.` : '.'}` : 'Paste a job description to check role relevance.'],
  ];
  const score = Math.round(checks.reduce((total, [, passes]) => total + (passes ? 1 : 0), 0) / checks.length * 100);
  return { checks, score, missing };
}

export function AtsAnalyzer() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [revealedScore, setRevealedScore] = useState(0);
  useEffect(() => setResume(readResume()), []);
  const analysis = useMemo(() => getAnalysis(resume, jobDescription), [resume, jobDescription]);
  useEffect(() => {
    setAnalyzing(true);
    setRevealedScore(0);
    const delay = setTimeout(() => {
      setAnalyzing(false);
      setRevealedScore(analysis.score);
    }, 420);
    return () => clearTimeout(delay);
  }, [analysis.score]);

  const suggestions = analysis.checks.filter(([, passes]) => !passes);
  return (
    <div className="tool-page ats-tool-page">
      <ToolHeading eyebrow="RESUME HEALTH CHECK" title="A clearer path to the shortlist." copy="A practical, transparent review of structure and role relevance. Your resume stays in this browser." action={<Link href="/builder" className="primary-button"><FileText size={15}/> Edit resume</Link>}/>
      <div className="ats-tool-layout">
        <section className="ats-score-card">
          <div className="ats-score-orbit" style={{ '--score': `${revealedScore * 3.6}deg` }}><div><span>{analyzing ? '…' : revealedScore}</span><small>OUT OF 100</small></div></div>
          <span className="eyebrow">YOUR ATS READINESS</span>
          <h2>{analyzing ? 'Reviewing your resume…' : revealedScore >= 80 ? 'A strong foundation.' : 'A good place to start.'}</h2>
          <p>This is a local checklist, not a hiring prediction. Use it to spot useful next steps.</p>
          <button className="secondary-button" onClick={() => { setResume(readResume()); setRevealedScore(0); }}>Recheck resume <ArrowRight size={14}/></button>
        </section>
        <section className="ats-checklist">
          <div className="tool-section-heading"><span><small>THE DETAILS</small><h2>Readiness checks</h2></span><span>{analysis.checks.filter(([, pass]) => pass).length} / {analysis.checks.length} complete</span></div>
          {analysis.checks.map(([title, passes, copy], index) => <motion.article key={title} className="ats-check-row" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:index*.045}}><span className={`ats-check-icon ${passes?'passed':''}`}>{passes?<Check size={15}/>:<ChevronRight size={15}/>}</span><span><b>{title}</b><small>{copy}</small></span><i>{passes?'Ready':'Review'}</i></motion.article>)}
        </section>
      </div>
      <section className="ats-job-match"><div><span className="eyebrow">OPTIONAL · ROLE MATCH</span><h2>Check against a job description.</h2><p>Terms are compared locally against the resume content you saved. Only add a skill when it reflects your real experience.</p></div><label><span>Job description</span><textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste a role description to see relevant terms…"/></label>{analysis.missing.length > 0 && <div className="ats-keyword-note"><Lightbulb size={15}/><span>Potentially relevant terms to review: <b>{analysis.missing.join(', ')}</b></span></div>}</section>
      {suggestions.length > 0 && <section className="ats-next-steps"><span className="eyebrow">A FEW THOUGHTFUL NEXT STEPS</span><div>{suggestions.map(([title, , copy]) => <article key={title}><Sparkles size={15}/><span><b>{title}</b><small>{copy}</small></span><Link href="/builder">Make an edit <ArrowRight size={13}/></Link></article>)}</div></section>}
    </div>
  );
}

const letterDefault = {
  company: '',
  position: '',
  tone: 'Warm and professional',
  length: 'Concise',
  opening: 'I’m excited to apply for this opportunity. My experience has taught me how to bring thoughtful work and clear collaboration to a team.',
  body: 'In my recent work, I have focused on turning complex needs into practical, considered outcomes. I enjoy working across disciplines, learning from feedback, and taking responsibility for details through delivery.',
  closing: 'Thank you for your time and consideration. I would welcome the opportunity to share more about how my experience could support your team.',
};

export function CoverLetterStudio() {
  const [letter, setLetter] = useState(letterDefault);
  const [resumeName, setResumeName] = useState('Your name');
  const [letterDate, setLetterDate] = useState('');
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState('');
  useEffect(() => {
    try {
      const current = JSON.parse(localStorage.getItem('lily-cover-letter') || 'null');
      if (current) setLetter({ ...letterDefault, ...current });
      setResumeName(readResume()?.fullName || 'Your name');
      setLetterDate(new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()));
    } catch (error) {
      console.error('Could not load the saved cover letter.', error);
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('lily-cover-letter', JSON.stringify(letter));
        setSaved(true);
      } catch (error) {
        console.error('Could not save the cover letter to this browser.', error);
        setSaved(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [letter]);
  const set = (key, value) => { setSaved(false); setLetter((current) => ({ ...current, [key]: value })); };
  return <div className="tool-page cover-letter-page">
    <ToolHeading eyebrow="A LETTER, IN YOUR VOICE" title="Make the introduction count." copy="Shape a considered cover letter, review every line, and print a polished copy." action={<button className="primary-button" onClick={() => { window.print(); setToast('Choose “Save as PDF” in the print dialog.'); }}><FileText size={15}/> Export letter</button>}/>
    <div className="letter-editor-layout">
      <section className="letter-inspector"><div className="tool-section-heading"><span><small>LETTER DETAILS</small><h2>Your introduction</h2></span><span className="letter-save-status">{saved ? 'Saved' : 'Saving…'}</span></div>
        <label className="studio-field">Company<input className="studio-input" value={letter.company} onChange={(event) => set('company', event.target.value)} placeholder="Company name"/></label>
        <label className="studio-field">Position<input className="studio-input" value={letter.position} onChange={(event) => set('position', event.target.value)} placeholder="Role title"/></label>
        <label className="studio-field">Tone<select className="studio-input" value={letter.tone} onChange={(event) => set('tone', event.target.value)}>{['Warm and professional', 'Direct and confident', 'Thoughtful and personal', 'Formal'].map((tone) => <option key={tone}>{tone}</option>)}</select></label>
        <label className="studio-field">Length<select className="studio-input" value={letter.length} onChange={(event) => set('length', event.target.value)}><option>Concise</option><option>Standard</option><option>Detailed</option></select></label>
        {[['opening', 'Opening'], ['body', 'Experience and fit'], ['closing', 'Closing']].map(([key, label]) => <label className="studio-field" key={key}>{label}<textarea className="studio-input letter-copy-input" value={letter[key]} onChange={(event) => set(key, event.target.value)}/></label>)}
        <div className="letter-ai-note"><Sparkles size={15}/><span><b>Keep it true to you.</b><small>Review and personalize every detail before sending.</small></span></div>
      </section>
      <section className="letter-preview-wrap"><div className="letter-preview-top"><span><i/> LIVE DOCUMENT</span><span>{saved ? 'Saved in this browser' : 'Saving changes…'}</span></div><article className="letter-paper"><small>{letterDate}</small><p>Hiring team{letter.company ? ` · ${letter.company}` : ''}</p><p>Dear hiring team,</p><p>{letter.opening}{letter.position && ` I am particularly interested in the ${letter.position} role${letter.company ? ` at ${letter.company}` : ''}.`}</p><p>{letter.body}</p><p>{letter.closing}</p><p>Warm regards,<br/><b>{resumeName}</b></p></article></section>
    </div>
    {toast && <div className="tool-toast" role="status">{toast}</div>}
  </div>;
}

const blankApplication = () => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, company: '', position: '', date: new Date().toISOString().slice(0, 10), resumeId: '', notes: '', status: 'Saved' });

export function JobTracker() {
  const [applications, setApplications] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [draft, setDraft] = useState(blankApplication());
  useEffect(() => {
    try {
      const current = JSON.parse(localStorage.getItem('lily-job-tracker') || '[]');
      setApplications(Array.isArray(current) ? current : []);
      setResumes(JSON.parse(localStorage.getItem('rs-next') || '{}').list || []);
    } catch (error) {
      console.error('Could not load the job tracker.', error);
      setApplications([]);
    } finally {
      setLoaded(true);
    }
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem('lily-job-tracker', JSON.stringify(applications));
    } catch (error) {
      console.error('Could not save applications to this browser.', error);
    }
  }, [applications, loaded]);
  const add = (event) => {
    event.preventDefault();
    if (!draft.company.trim() || !draft.position.trim()) return;
    setApplications((current) => [{ ...draft, company: draft.company.trim(), position: draft.position.trim() }, ...current]);
    setDraft(blankApplication());
    setDialog(false);
  };
  const move = (id, status) => setApplications((current) => current.map((application) => application.id === id ? { ...application, status } : application));
  return <div className="tool-page tracker-page">
    <ToolHeading eyebrow="YOUR NEXT MOVE, IN VIEW" title="A little momentum, organized." copy="Keep your opportunities together and move them through the stages at your own pace." action={<button className="primary-button" onClick={() => { setDraft(blankApplication()); setDialog(true); }}><Plus size={15}/> Add opportunity</button>}/>
    <div className="tracker-summary"><span><b>{applications.length}</b><small>OPPORTUNITIES</small></span><span><b>{applications.filter((item) => item.status === 'Interview').length}</b><small>IN CONVERSATION</small></span><span><b>{applications.filter((item) => item.status === 'Offer').length}</b><small>OFFERS</small></span><Link href="/builder"><FileText size={15}/> Refine a resume <ArrowRight size={13}/></Link></div>
    <div className="pipeline-board">{pipeline.map((status) => {
      const list = applications.filter((application) => application.status === status);
      return <section className="pipeline-column" key={status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const id = event.dataTransfer.getData('text/plain'); if (id) move(id, status); }}>
        <header><span><i className={`pipeline-dot dot-${status.toLowerCase()}`}/>{status}</span><small>{list.length}</small></header>
        <div className="pipeline-cards">{list.map((application) => <motion.article layout key={application.id} className="application-card" draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', application.id)}>
          <div className="application-card-top"><span>{application.company.slice(0, 2).toUpperCase()}</span><button aria-label={`Delete ${application.company} opportunity`} onClick={() => setApplications((current) => current.filter((item) => item.id !== application.id))}><Trash2 size={14}/></button></div>
          <h3>{application.position}</h3><p><BriefcaseBusiness size={13}/>{application.company}</p><small className="application-date">{application.date}</small>
          {application.notes && <p className="application-notes">{application.notes}</p>}
          <div className="application-card-footer"><span>{resumes.find((item) => item.id === application.resumeId)?.name || 'No resume linked'}</span><select aria-label={`Move ${application.company} to another stage`} value={application.status} onChange={(event) => move(application.id, event.target.value)}>{pipeline.map((stage) => <option key={stage}>{stage}</option>)}</select></div>
        </motion.article>)}</div>
        <button className="pipeline-add" onClick={() => { setDraft({ ...blankApplication(), status }); setDialog(true); }}><CirclePlus size={14}/> Add to {status}</button>
      </section>;
    })}</div>
    {applications.length === 0 && <div className="tracker-empty"><span><BriefcaseBusiness size={22}/></span><h2>Your next opportunity starts here.</h2><p>Add a role to start a simple, private application tracker.</p><button className="secondary-button" onClick={() => setDialog(true)}>Add your first opportunity <ArrowRight size={14}/></button></div>}
    {dialog && <div className="studio-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(false); }}><form className="studio-template-modal application-dialog" onSubmit={add}><div className="studio-modal-heading"><div><span>NEW OPPORTUNITY</span><h2>Add a role to follow</h2><p>Keep a few useful details in one place.</p></div><button type="button" className="studio-icon-action" onClick={() => setDialog(false)}>×</button></div><label className="studio-field">Company<input required autoFocus className="studio-input" value={draft.company} onChange={(event) => setDraft((current) => ({ ...current, company: event.target.value }))}/></label><label className="studio-field">Position<input required className="studio-input" value={draft.position} onChange={(event) => setDraft((current) => ({ ...current, position: event.target.value }))}/></label><label className="studio-field">Stage<select className="studio-input" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>{pipeline.map((stage) => <option key={stage}>{stage}</option>)}</select></label><label className="studio-field">Date<input type="date" className="studio-input" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}/></label><label className="studio-field">Resume used<select className="studio-input" value={draft.resumeId} onChange={(event) => setDraft((current) => ({ ...current, resumeId: event.target.value }))}><option value="">Not selected</option>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.name}</option>)}</select></label><label className="studio-field">Notes<textarea className="studio-input" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}/></label><button className="primary-button" type="submit">Save opportunity <Check size={14}/></button></form></div>}
  </div>;
}

export function StartingPoints() {
  const choices = [
    ['Start from scratch', 'A clean page, your experience, and a clear structure.', '/builder?mode=start&source=scratch', FileText],
    ['Use a template', 'Choose a considered design and make it your own.', '/workspace/templates', Sparkles],
    ['Build with a guide', 'Use thoughtful prompts to shape your first draft.', '/builder?mode=start&source=guided', Lightbulb],
  ];
  return <div className="tool-page starting-points"><ToolHeading eyebrow="A GOOD PLACE TO BEGIN" title="How would you like to start?" copy="Choose a starting point. You can change direction whenever you like."/><div className="starting-point-grid">{choices.map(([title, copy, href, Icon], index) => <motion.article key={title} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:index*.08}}><span><Icon size={20}/></span><small>0{index + 1}</small><h2>{title}</h2><p>{copy}</p><Link href={href}>Choose this path <ArrowRight size={14}/></Link></motion.article>)}</div></div>;
}
