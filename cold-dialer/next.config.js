/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app is designed to run only on localhost. It has no auth layer
  // because it is not intended to ever be exposed to a network or the
  // internet. See README "Security" section before changing the host binding.
  serverExternalPackages: ['better-sqlite3'],
  // `next dev` only trusts the hostname it was started with (localhost) and
  // 403s dev assets for any other origin. Without this, opening the app at
  // http://127.0.0.1:3000 — the same machine, just spelled differently —
  // fails to load its JS chunks and the UI silently does nothing. Both
  // spellings are the same local loopback interface, so both are trusted.
  allowedDevOrigins: ['localhost', '127.0.0.1'],
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
