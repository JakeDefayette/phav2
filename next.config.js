const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is now stable and enabled by default
};

module.exports = withBundleAnalyzer(nextConfig);
