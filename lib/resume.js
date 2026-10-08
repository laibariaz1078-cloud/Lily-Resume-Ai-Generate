import { getTemplateConfig } from '@/lib/resume-design';

export const SECTIONS={summary:'Professional summary',experience:'Experience',projects:'Projects',education:'Education',skills:'Skills',certifications:'Certifications',languages:'Languages',achievements:'Achievements',custom:'Custom section'};
export const LISTS={experience:['Role','Company','Dates'],projects:['Project','Tech used','Link / dates'],education:['Degree','School','Dates'],certifications:['Certification','Issuing organization','Date'],languages:['Language','Proficiency','Context'],achievements:['Achievement','Context','Date'],custom:['Section title','Organization','Dates']};
export const blank=()=>({id:String(Date.now()),name:'Untitled resume',fav:false,fullName:'Your Name',title:'Frontend Developer',email:'you@email.com',phone:'',location:'',
 template:'arden',color:'#2e5d4a',font:'Inter',order:Object.keys(SECTIONS),hidden:{},config:getTemplateConfig('arden',Object.keys(SECTIONS)),customSections:[],summary:'',skills:'',
 experience:[{a:'Frontend Developer',b:'',c:'6 months',text:'Worked as a frontend developer for 6 months and made websites using React.'}],projects:[],education:[],certifications:[],languages:[],achievements:[],custom:[]});

// Offline fallback: rule-based, never invents facts
export function localAI({mode,text}){
 let t=text.trim();const s=[];
 const improve=x=>x.replace(/^i\s+(worked as|was)\s+an?\s+/i,'').replace(/\b(made|built|created)\b/gi,'developed').replace(/^./,c=>c.toUpperCase()).replace(/\.?$/,'.');
 if(mode==='shorten')t=t.split(/(?<=\.)\s/)[0];else if(mode!=='suggest'&&mode!=='tailor')t=improve(t);
 if(!/\d/.test(text))s.push('Add measurable results (numbers, users, speed, size) if you have them.');
 if(!/react|vue|angular|node|python|java|sql|typescript/i.test(text))s.push('Mention the technologies or tools you used.');
 s.push('Describe your specific contribution.','Say who benefited or what problem it solved.');
 if(mode==='ats')s.unshift('Use plain headings and standard job titles; avoid icons and tables.');
 return{text:t,suggestions:s}}

export function keywordGaps(job,resume){
 const jd=job.toLowerCase(),mine=JSON.stringify(resume).toLowerCase();
 const KW=['react','typescript','javascript','node','rest','api','git','responsive','testing','css','html','sql','agile','ci/cd','docker','aws','accessibility','performance'];
 return KW.filter(k=>jd.includes(k)&&!mine.includes(k))}
