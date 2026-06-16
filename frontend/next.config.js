/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/login', destination: '/', permanent: false },
      { source: '/register', destination: '/', permanent: false },
      { source: '/onboarding', destination: '/', permanent: false },
      { source: '/dashboard', destination: '/', permanent: false },
      { source: '/dashboard/:path*', destination: '/', permanent: false },
    ];
  },
};

module.exports = nextConfig;

