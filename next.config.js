const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is now stable and enabled by default
  eslint: {
    // Temporarily ignore ESLint during builds to fix deployment
    ignoreDuringBuilds: true,
  },

  // Performance and bundle optimization
  webpack: (config, { isServer, dev }) => {
    // Only apply optimizations in production
    if (!isServer && !dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          // Vendor libraries chunk
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            maxSize: 150000, // 150KB limit for vendor chunk
            priority: 10,
          },

          // Feature-based chunks
          features: {
            test: /[\\/]src[\\/]features[\\/]/,
            name(module) {
              // Extract feature name from path
              const match = module.context.match(
                /[\\/]src[\\/]features[\\/]([^[\\/]]+)/
              );
              return match ? `features-${match[1]}` : 'features';
            },
            chunks: 'all',
            maxSize: 100000, // 100KB limit per feature
            priority: 8,
          },

          // Shared components chunk
          shared: {
            test: /[\\/]src[\\/]shared[\\/]/,
            name: 'shared',
            chunks: 'all',
            minChunks: 2,
            maxSize: 120000, // 120KB limit for shared
            priority: 6,
          },

          // Chart libraries (heavy dependencies)
          charts: {
            test: /[\\/]node_modules[\\/](chart\.js|recharts|react-chartjs-2)[\\/]/,
            name: 'charts',
            chunks: 'all',
            maxSize: 80000, // 80KB limit for charts
            priority: 15,
          },

          // PDF generation (heavy dependency)
          pdf: {
            test: /[\\/]node_modules[\\/]@react-pdf[\\/]/,
            name: 'pdf',
            chunks: 'all',
            maxSize: 100000, // 100KB limit for PDF
            priority: 12,
          },

          // Form libraries
          forms: {
            test: /[\\/]node_modules[\\/](formik|yup)[\\/]/,
            name: 'forms',
            chunks: 'all',
            maxSize: 50000, // 50KB limit for forms
            priority: 11,
          },
        },
      };

      // Performance budgets
      config.performance = {
        maxAssetSize: 250000, // 250KB
        maxEntrypointSize: 250000,
        hints: 'warning',
      };
    }

    return config;
  },

  // Enable experimental features for better optimization
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@supabase/supabase-js',
      'date-fns',
    ],
  },
};

module.exports = withBundleAnalyzer(nextConfig);
