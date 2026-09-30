'use client';
import {useEffect,useRef,useState} from 'react';
import {Sparkles} from 'lucide-react';

export default function CursorCompanion(){
 const ref=useRef(null),frame=useRef(0),point=useRef({x:-120,y:-120}),position=useRef({x:-120,y:-120}),[reaction,setReaction]=useState('idle');
 useEffect(()=>{
  const touch=matchMedia('(hover: none), (pointer: coarse)').matches;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(touch||reduced)return;
    const animate=()=>{position.current.x+=(point.current.x-position.current.x)*.16;position.current.y+=(point.current.y-position.current.y)*.16;if(ref.current){const tilt=Math.max(-5,Math.min(5,(point.current.x-innerWidth/2)/90));ref.current.style.transform=`translate3d(${position.current.x}px,${position.current.y}px,0) rotate(${tilt}deg)`;ref.current.style.opacity='1'}if(Math.abs(point.current.x-position.current.x)>.2||Math.abs(point.current.y-position.current.y)>.2)frame.current=requestAnimationFrame(animate);else frame.current=0};
    const move=e=>{point.current={x:Math.min(innerWidth-86,e.clientX+26),y:Math.min(innerHeight-86,e.clientY+22)};if(!frame.current)frame.current=requestAnimationFrame(animate)};
  const over=e=>{const target=e.target.closest?.('[data-assistant-react]');if(target){const state=target.dataset.assistantState;setReaction(['thinking','happy'].includes(state)?state:'hover')}else setReaction('following')};
  const down=e=>{const target=e.target.closest?.('[data-assistant-react]');setReaction(target?.dataset.assistantState==='success'?'success':'click');window.setTimeout(()=>setReaction('following'),520)};
  window.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerover',over,{passive:true});document.addEventListener('pointerdown',down,{passive:true});
  return()=>{cancelAnimationFrame(frame.current);window.removeEventListener('pointermove',move);document.removeEventListener('pointerover',over);document.removeEventListener('pointerdown',down)};
 },[]);
 return <div ref={ref} aria-hidden="true" className={`cursor-companion companion-${reaction}`}><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80" alt=""/><span className="companion-spark"><Sparkles size={12}/></span><span className="companion-label">Laiba · Career AI</span></div>
}
