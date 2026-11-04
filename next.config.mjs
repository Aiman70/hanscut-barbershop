/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false, // Sorok header X-Powered-By: Next.js
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Halang Clickjacking (hacker tak boleh letak web kita dlm iframe palsu)
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Halang MIME-type sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()', // Hadkan akses perkakasan browser
          },
        ],
      },
    ]
  },
};

export default nextConfig;
