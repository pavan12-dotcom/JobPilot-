// app/layout.jsx
import './globals.css';

export const metadata = {
  title: 'JobPilot – AI Job Application Automation',
  description: 'Find your dream job faster. AI-powered resume matching, auto-apply, and application tracking. Install the app on your phone.',
  applicationName: 'JobPilot',
  keywords: ['jobs', 'ai', 'resume', 'automation', 'career', 'job search'],
  authors: [{ name: 'JobPilot' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'JobPilot',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    title: 'JobPilot – AI Job Application Automation',
    description: 'Apply to hundreds of matching jobs automatically with AI.',
    siteName: 'JobPilot',
  },
  twitter: {
    card: 'summary',
    title: 'JobPilot – AI Job Application Automation',
    description: 'Apply to hundreds of matching jobs automatically with AI.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0D150D',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" rel="stylesheet" />

        {/* PWA — Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* PWA — iOS (Safari) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="JobPilot" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />

        {/* PWA — Android / Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0D150D" />

        {/* PWA — Microsoft Tile */}
        <meta name="msapplication-TileColor" content="#0D150D" />
        <meta name="msapplication-TileImage" content="/icons/icon-192x192.png" />

        {/* Disable automatic phone number linking */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body style={{ background: '#0D150D', margin: 0, padding: 0, minHeight: '100vh', minHeight: '100dvh' }}>
        {children}
      </body>
    </html>
  );
}
