'use client';
import {useState} from 'react';
import {localAI} from '@/lib/resume';
const MODES=[['improve','✨ Improve'],['expand','Expand'],['shorten','Shorten'],['professional','Make professional'],['ats','ATS-friendly'],['suggest','Suggestions'],['tailor','Tailor to job']];
export default function AiBar({text,job,onAccept,notify}){
 const[mode,setMode]=useState('improve'),[ins,setIns]=useState(''),[res,setRes]=useState(null),[busy,setBusy]=useState(false),[sel,setSel]=useState([]);
 async function call(p){return localAI(p)}
 async function run(){if(!text.trim())return notify('Write a few facts first');setBusy(true);setSel([]);setRes(await call({mode,text,instruction:ins,job}));setBusy(false)}
 async function apply(){if(!sel.length)return notify('Tick at least one suggestion');setBusy(true);const r=await call({mode:'improve',text,instruction:ins,selected:sel});setBusy(false);onAccept(r.text);setRes(null);notify('Only selected suggestions applied')}
 return(<div>
  <div className="mt-1.5 flex flex-wrap gap-1">
   <select aria-label="AI action" className="btn" value={mode} onChange={e=>setMode(e.target.value)}>{MODES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
   <input className="inp !mt-0 min-w-[120px] flex-1" placeholder="Optional: tell AI what to change" value={ins} onChange={e=>setIns(e.target.value)}/>
   <button className="btn btn-sm btn-pri" onClick={run} disabled={busy}>Run</button></div>
  {busy&&<><div className="skel"/><div className="skel w-2/3"/></>}
  {res&&!busy&&<div className="mt-1.5 animate-pop rounded-lg border border-indigo-500 bg-stone-50 p-2 dark:bg-slate-900">
   {mode!=='suggest'&&<p className="mb-1.5 text-sm">{res.text}</p>}
   {res.suggestions?.length>0&&<><b className="text-sm">Suggestions</b>{res.suggestions.map(s=><label key={s} className="flex gap-1.5 text-sm"><input type="checkbox" checked={sel.includes(s)} onChange={e=>setSel(e.target.checked?[...sel,s]:sel.filter(x=>x!==s))}/>{s}</label>)}</>}
   <div className="mt-1.5 flex gap-1.5">
    {mode!=='suggest'&&<button className="btn btn-sm btn-pri" onClick={()=>{onAccept(res.text);setRes(null);notify('Applied')}}>Accept</button>}
    {res.suggestions?.length>0&&<button className="btn btn-sm" onClick={apply}>Apply selected suggestions</button>}
    <button className="btn btn-sm" onClick={()=>setRes(null)}>Discard</button></div></div>}
 </div>)}
