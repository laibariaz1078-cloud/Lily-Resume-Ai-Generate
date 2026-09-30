import './globals.css';
import ThemeSync from '@/components/ThemeSync';
export const metadata={title:'Lily — A more thoughtful resume studio',description:'Create, refine, and share a professional story that feels like yours.'};
export default function RootLayout({children}){return(
<html lang="en" suppressHydrationWarning><head>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Lora:wght@400;500;600&display=swap" rel="stylesheet"/></head>
<body><ThemeSync/>{children}</body></html>)}
