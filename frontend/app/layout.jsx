// app/layout.jsx
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'ApplyAI — AI-Powered Job Application Automation',
  description: 'Upload your resume, get AI-matched job recommendations, and automatically apply to hundreds of jobs while you sleep.',
  keywords: 'job application automation, AI job search, resume parser, auto apply jobs',
  openGraph: {
    title: 'ApplyAI',
    description: 'AI-powered job application automation platform',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-background text-text antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FFFFFF',
              color: '#121214',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.06)',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#FFFFFF' } },
            error: { iconTheme: { primary: '#EF4D5E', secondary: '#FFFFFF' } },
          }}
        />
      </body>
    </html>
  );
}
