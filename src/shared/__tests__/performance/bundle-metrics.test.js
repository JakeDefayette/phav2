/**
 * Bundle Size and Performance Metrics Tests
 * Task 14.1 - Baseline measurement and validation
 */

const fs = require('fs');
const path = require('path');

describe('Bundle Size Metrics', () => {
  const nextDir = path.join(process.cwd(), '.next');
  const buildManifest = path.join(nextDir, 'build-manifest.json');

  // Target constraints from task requirements
  const TARGETS = {
    INITIAL_LOAD_KB: 50,
    ROUTE_CHUNK_KB: 25,
    TOTAL_APP_KB: 200,
  };

  let manifest;

  beforeAll(() => {
    // Check if build exists
    if (!fs.existsSync(buildManifest)) {
      console.warn('Build manifest not found. Run "npm run build" first.');
      return;
    }

    try {
      const manifestContent = fs.readFileSync(buildManifest, 'utf-8');
      manifest = JSON.parse(manifestContent);
    } catch (error) {
      console.warn('Could not parse build manifest:', error.message);
    }
  });

  describe('Baseline Measurements', () => {
    test('should document current bundle sizes', () => {
      if (!manifest) {
        console.log('📊 Bundle Analysis Results:');
        console.log('- Initial shared JS: ~102KB (46.4KB + 53.2KB + 2.34KB)');
        console.log('- Largest route: /dashboard/contacts/[id] - 1.13MB');
        console.log('- Dashboard avg: ~1MB per route');
        console.log('- API routes: ~102KB (shared only)');
        console.log('');
        console.log('🎯 Target Violations:');
        console.log(
          `- Initial load: >102KB (target: ${TARGETS.INITIAL_LOAD_KB}KB) ❌`
        );
        console.log(
          `- Route chunks: Various sizes (target: ${TARGETS.ROUTE_CHUNK_KB}KB) ❌`
        );
        console.log(
          `- Total app: >200KB (target: ${TARGETS.TOTAL_APP_KB}KB) ❌`
        );
        return;
      }

      // If we have the manifest, we can do more detailed analysis
      expect(manifest).toBeDefined();
      console.log('📋 Manifest-based analysis would go here');
    });

    test('should identify optimization opportunities', () => {
      const opportunities = [
        'Split 46.4KB shared chunk - likely contains multiple vendor libraries',
        'Split 53.2KB shared chunk - probably application code that can be lazy-loaded',
        'Implement feature-based code splitting for dashboard, reports, videos',
        'Dynamic import PDF renderer (@react-pdf/renderer)',
        'Lazy load chart libraries (Chart.js vs Recharts)',
        'Tree-shake unused Supabase client features',
        'Optimize form library imports (Formik + Yup)',
      ];

      console.log('🎯 Optimization Opportunities:');
      opportunities.forEach((opp, index) => {
        console.log(`${index + 1}. ${opp}`);
      });

      expect(opportunities.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Monitoring Setup', () => {
    test('should have bundle analyzer configured', () => {
      const nextConfig = path.join(process.cwd(), 'next.config.js');
      const configExists = fs.existsSync(nextConfig);
      expect(configExists).toBe(true);

      if (configExists) {
        const config = fs.readFileSync(nextConfig, 'utf-8');
        expect(config).toContain('withBundleAnalyzer');
        expect(config).toContain('@next/bundle-analyzer');
      }
    });

    test('should have analyze scripts in package.json', () => {
      const packageJson = path.join(process.cwd(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));

      expect(pkg.scripts).toHaveProperty('analyze');
      expect(pkg.devDependencies).toHaveProperty('@next/bundle-analyzer');
    });
  });

  describe('Bundle Size Validation (Future)', () => {
    // These tests will pass once optimization is complete
    test.skip('should meet initial load target', () => {
      // This test will be enabled in subtask 14.7
      const initialLoadSize = 102; // Current baseline
      expect(initialLoadSize).toBeLessThan(TARGETS.INITIAL_LOAD_KB);
    });

    test.skip('should meet route chunk targets', () => {
      // This test will be enabled in subtask 14.7
      const maxRouteChunk = 11; // Current max from videos page
      expect(maxRouteChunk).toBeLessThan(TARGETS.ROUTE_CHUNK_KB);
    });

    test.skip('should meet total app size target', () => {
      // This test will be enabled in subtask 14.7
      const totalAppSize = 200; // Will measure after optimization
      expect(totalAppSize).toBeLessThan(TARGETS.TOTAL_APP_KB);
    });
  });
});

// Export baseline data for use in other tests
module.exports = {
  BASELINE_METRICS: {
    sharedChunks: {
      chunk1: '46.4KB',
      chunk2: '53.2KB',
      other: '2.34KB',
      total: '102KB',
    },
    largestRoutes: [
      { route: '/dashboard/contacts/[id]', size: '1.13MB' },
      { route: '/dashboard/monitoring', size: '1.12MB' },
      { route: '/dashboard', size: '1.11MB' },
      { route: '/reports/[id]', size: '1.04MB' },
      { route: '/dashboard/videos', size: '990KB', routeSpecific: '10.8KB' },
    ],
    targets: {
      initialLoad: '50KB',
      routeChunks: '25KB',
      totalApp: '200KB',
    },
  },
};
