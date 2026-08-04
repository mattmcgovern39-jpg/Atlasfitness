/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app is designed to run only on localhost. It has no auth layer
  // because it is not intended to ever be exposed to a network or the
  // internet. See README "Security" section before changing the host binding.
  serverExternalPackages: ['better-sqlite3'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
