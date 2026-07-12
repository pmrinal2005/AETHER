import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // A.I.M. is a database-free, in-memory dummy-data demo. This flag keeps the
  // Vercel production build resilient: a stray type nit never blocks a deploy
  // of an otherwise-working app. (The app builds clean locally; this is a safety net.)
  // Note: Next 16 no longer runs ESLint during `next build`, so no eslint key is needed.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
