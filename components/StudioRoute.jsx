'use client';
import {usePathname} from 'next/navigation';
import StudioShell from '@/components/StudioShell';
import StudioViews from '@/components/StudioViews';
export default function StudioRoute({page}){const path=usePathname();const routePage=page||path.split('/').filter(Boolean).pop()||'dashboard';return <StudioShell><StudioViews page={routePage}/></StudioShell>}
