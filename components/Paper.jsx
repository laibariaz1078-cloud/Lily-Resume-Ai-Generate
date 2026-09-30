import {LISTS,SECTIONS} from '@/lib/resume';
// Template engine: all layout lives here. AI never touches it.
export default function Paper({r}){
 const t=r.template,c=r.color;
 const pad={modern:'p-11',classic:'p-11 text-center',minimal:'p-14'}[t];
 const h2c={modern:'border-b-2 text-[13px]',classic:'border-b border-gray-400 text-center text-[13px]',minimal:'text-[15px]'}[t];
 const h2s={color:t==='classic'?'#222':c,borderColor:c};
 const H=({k})=><h2 className={`mb-1.5 mt-5 pb-0.5 font-semibold tracking-wide ${h2c}`} style={h2s}>{t==='minimal'?SECTIONS[k]:SECTIONS[k].toUpperCase()}</h2>;
 return(<div id="paper" className={`mx-auto min-h-[1000px] w-full max-w-[794px] bg-white text-[13px] leading-snug text-slate-900 shadow-2xl ${pad}`} style={{fontFamily:`'${r.font}',sans-serif`}}>
  <h1 className="text-3xl font-semibold leading-tight">{r.fullName}</h1>
  <div className="font-semibold" style={{color:c}}>{r.title}</div>
  <div className="text-xs text-gray-600">{[r.email,r.phone,r.location].filter(Boolean).join(' | ')}</div>
  {r.order.map(k=>{if(r.hidden[k])return null;
   if((k==='summary'||k==='skills')&&r[k])return<div key={k}><H k={k}/><p className="whitespace-pre-wrap">{r[k]}</p></div>;
   if(LISTS[k]&&r[k].length)return<div key={k}><H k={k}/>{r[k].map((x,i)=><div key={i} className="text-left"><div className="flex justify-between gap-2 font-semibold"><span>{x.a}{x.b&&<span className="font-normal text-gray-500"> — {x.b}</span>}</span><span className="font-normal text-gray-500">{x.c}</span></div><p className="mb-2 whitespace-pre-wrap">{x.text}</p></div>)}</div>;
   return null})}
 </div>)}
