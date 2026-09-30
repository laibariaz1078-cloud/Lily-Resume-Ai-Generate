'use client';
import {useEffect} from 'react';

export default function ThemeSync(){
 useEffect(()=>{
  const media=window.matchMedia('(prefers-color-scheme: dark)');
  const apply=()=>{
   const preference=localStorage.getItem('Lily-theme')||'System';
   document.documentElement.classList.toggle('dark',preference==='Dark'||preference==='System'&&media.matches);
   document.querySelectorAll('.appearance-options button').forEach(button=>{
    const selected=button.querySelector('span')?.textContent.trim()===preference;
    button.classList.toggle('appearance-selected',selected);
   });
  };
  const choose=e=>{
   const button=e.target.closest?.('.appearance-options button');
   const preference=button?.querySelector('span')?.textContent.trim();
   if(['Light','Dark','System'].includes(preference)){localStorage.setItem('Lily-theme',preference);requestAnimationFrame(apply)}
  };
  const observer=new MutationObserver(apply);
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('click',choose);
  media.addEventListener('change',apply);
  apply();
  return()=>{observer.disconnect();document.removeEventListener('click',choose);media.removeEventListener('change',apply)};
 },[]);
 return null;
}
