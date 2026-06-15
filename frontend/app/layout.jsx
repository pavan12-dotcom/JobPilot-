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
              background: '#1A1A24',
              color: '#F8FAFC',
              border: '1px solid #2A2A38',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22C55E', secondary: '#F8FAFC' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#F8FAFC' } },
          }}
        />
      </body>
    </html>
  );
}
