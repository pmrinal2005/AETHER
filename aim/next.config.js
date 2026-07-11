/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // did:web document is served from /.well-known/did.json via an API rewrite
  async rewrites() {
    return [
      {
        source: '/.well-known/did.json',
        destination: '/api/did/well-known',
      },
    ];
  },
};

module.exports = nextConfig;
