// app/layout.jsx
import './globals.css';
import { Toaster } from 'react-hot-toast';
import PhoneShell from '@/components/ui/PhoneShell';

export const metadata = {
  title: 'JobPilot — AI-Powered Job Application Automation',
  description: 'Automatically apply to hundreds of matching jobs using AI-powered resume parsing, job matching, and browser automation.',
  keywords: 'job application automation, AI job search, resume parser, auto apply jobs',
  openGraph: {
    title: 'JobPilot',
    description: 'AI-powered job application automation platform',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" rel="stylesheet" />
      </head>
      <body className="bg-[#0D150D] flex items-center justify-center min-h-screen p-0 sm:p-4 antialiased">
        <PhoneShell>
          {children}
        </PhoneShell>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1C2B1C',
              color: '#F0F5E8',
              border: '1px solid rgba(184, 240, 35, 0.15)',
              borderRadius: '14px',
              fontSize: '13px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            },
            success: { iconTheme: { primary: '#B8F023', secondary: '#1C2B1C' } },
            error: { iconTheme: { primary: '#F87171', secondary: '#1C2B1C' } },
          }}
        />
      </body>
    </html>
  );
}
