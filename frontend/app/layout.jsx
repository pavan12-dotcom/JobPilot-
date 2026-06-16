// app/layout.jsx
import './globals.css';

export const metadata = {
  title: 'JobPilot – Dark Green Theme',
  description: 'Find Your Dream Job Faster. 58,000+ live roles matched to your skills. Updated daily, built for you.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" rel="stylesheet" />
      </head>
      <body className="bg-[#0D150D] flex items-center justify-center min-h-screen p-0 sm:p-4 antialiased">
        {children}
      </body>
    </html>
  );
}

