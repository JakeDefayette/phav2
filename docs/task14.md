# Task 14: Performance and Bundle Size Optimization Plan

## Overview

This document outlines a comprehensive strategy to optimize the PHA-v2 application for performance and bundle size. Based on baseline analysis, the current application significantly exceeds size targets with shared JS bundles at 102KB (104% over target) and dashboard routes averaging ~1MB each.

## Current State Assessment

### Critical Issues Identified

- **Shared JS bundles**: 102KB total (46.4KB + 53.2KB + 2.34KB) - exceeds 50KB target by 104%
- **Dashboard routes**: Consistently ~1MB each - far exceeding targets
- **No effective code splitting**: Heavy shared dependencies loaded for all routes

### Major Bundle Bloat Sources

1. **Multiple chart libraries** (Chart.js + Recharts) causing duplication
2. **@react-pdf/renderer** loaded for all routes (only needed occasionally)
3. **Complete Supabase client** with potentially unused features
4. **Form libraries** (Formik + Yup) loaded globally

## Target Metrics

- Initial load: <50KB
- Route chunks: <25KB
- Total app: <200KB gzipped
- Performance Score: 90+ on Lighthouse
- First Contentful Paint: <1.5s
- Time to Interactive: <3.5s

## Implementation Plan

### Phase 1: Foundation (Subtasks 14.2-14.3)

#### 14.2: Implement Code Splitting Across Feature Modules

**Priority**: High | **Dependencies**: 14.1 (✅ Complete)

**Implementation Strategy**:

1. **Configure Next.js with advanced splitting**:

   ```javascript
   // next.config.js enhancements
   const nextConfig = {
     webpack: (config, { isServer }) => {
       if (!isServer) {
         config.optimization.splitChunks = {
           chunks: 'all',
           cacheGroups: {
             vendor: {
               test: /[\\/]node_modules[\\/]/,
               name: 'vendors',
               chunks: 'all',
               maxSize: 244000, // 244KB limit
             },
             features: {
               test: /[\\/]src[\\/]features[\\/]/,
               name: 'features',
               chunks: 'all',
               maxSize: 100000, // 100KB limit
             },
             shared: {
               test: /[\\/]src[\\/]shared[\\/]/,
               name: 'shared',
               chunks: 'all',
               minChunks: 2,
               maxSize: 150000, // 150KB limit
             },
           },
         };
       }
       return config;
     },
   };
   ```

2. **Feature-based route grouping**:

   - Dashboard features → separate chunk
   - Assessment workflow → separate chunk
   - Reports generation → separate chunk
   - Video library → separate chunk

3. **Shared component optimization**:
   - Split atomic/molecular components into smaller chunks
   - Lazy load complex organisms

**Expected Outcome**: Reduce initial bundle from 102KB to <50KB

#### 14.3: Apply Tree-Shaking and Remove Unused Code

**Priority**: High | **Dependencies**: 14.1 (✅ Complete)

**Implementation Strategy**:

1. **Audit and optimize imports**:

   ```typescript
   // Before (imports entire library)
   import * as Charts from 'chart.js';

   // After (tree-shakeable imports)
   import { Chart, CategoryScale, LinearScale } from 'chart.js';
   ```

2. **Remove chart library duplication**:

   - Standardize on single chart library (Recharts recommended)
   - Remove Chart.js and react-chartjs-2 dependencies
   - Update all chart components to use unified library

3. **Optimize Supabase imports**:

   ```typescript
   // Before
   import { createClient } from '@supabase/supabase-js';

   // After (specific features only)
   import { createBrowserClient } from '@supabase/ssr';
   ```

4. **Dead code elimination**:
   - Remove unused utility functions
   - Clean up obsolete components
   - Remove development-only imports from production builds

**Expected Outcome**: 15-20% reduction in overall bundle size

### Phase 2: Advanced Optimization (Subtasks 14.4-14.5)

#### 14.4: Set Up File Size Limits

**Priority**: Medium | **Dependencies**: 14.1, 14.3

**Implementation Strategy**:

1. **Bundle size monitoring**:

   ```javascript
   // webpack.config.js addition
   config.performance = {
     maxAssetSize: 250000, // 250KB
     maxEntrypointSize: 250000,
     hints: 'error',
   };
   ```

2. **Component size guidelines**:

   - React components: <200 lines
   - Utility functions: <100 lines
   - Service classes: <300 lines
   - Type definitions: <150 lines

3. **Automated size checking**:
   - Pre-commit hooks for size validation
   - CI/CD pipeline integration
   - Bundle size regression alerts

#### 14.5: Integrate Dynamic Imports

**Priority**: High | **Dependencies**: 14.2

**Implementation Strategy**:

1. **Chart components dynamic loading**:

   ```typescript
   const ChartComponent = dynamic(() => import('@/features/reports/components/ChartDisplay'), {
     loading: () => <Skeleton className="h-64 w-full" />,
     ssr: false
   })
   ```

2. **PDF renderer on-demand**:

   ```typescript
   const generatePDF = async () => {
     const { PDFService } = await import('@/features/reports/services/pdf');
     return PDFService.generate(reportData);
   };
   ```

3. **Dashboard widgets lazy loading**:

   - Load widgets only when dashboard tab is active
   - Implement intersection observer for below-fold components

4. **Form libraries conditional loading**:
   - Load Formik/Yup only for assessment pages
   - Use lighter validation for simple forms

**Expected Outcome**: Reduce initial load by 40-50%

### Phase 3: Monitoring and Validation (Subtasks 14.6-14.7)

#### 14.6: Configure Lighthouse CI and Bundle Analyzer

**Priority**: Medium | **Dependencies**: 14.2, 14.3, 14.5

**Implementation Strategy**:

1. **Lighthouse CI setup**:

   ```yaml
   # .github/workflows/lighthouse.yml
   - name: Lighthouse CI
     uses: treosh/lighthouse-ci-action@v9
     with:
       configPath: './lighthouserc.json'
       uploadArtifacts: true
       temporaryPublicStorage: true
   ```

2. **Bundle analyzer automation**:

   - Generate reports on every build
   - Compare bundle sizes across commits
   - Alert on size regressions >5%

3. **Performance monitoring dashboard**:
   - Track Core Web Vitals
   - Monitor bundle size trends
   - Performance budget enforcement

#### 14.7: Optimize Imports and Verify Improvements

**Priority**: Low | **Dependencies**: All previous subtasks

**Implementation Strategy**:

1. **Import path optimization**:

   ```typescript
   // Before
   import { Button } from '@/shared/components/atoms/Button/Button';

   // After (barrel exports)
   import { Button } from '@/shared/components/atoms';
   ```

2. **Barrel export optimization**:

   - Selective re-exports to avoid bundling unused code
   - Deep import paths for large libraries

3. **Final validation**:
   - Before/after performance comparison
   - Load testing under realistic conditions
   - Documentation of optimization guidelines

## Implementation Timeline

### Week 1: Foundation

- **Day 1-2**: Configure code splitting (14.2)
- **Day 3-4**: Tree-shaking implementation (14.3)
- **Day 5**: Testing and validation

### Week 2: Advanced Features

- **Day 1-2**: File size limits setup (14.4)
- **Day 3-4**: Dynamic imports integration (14.5)
- **Day 5**: Integration testing

### Week 3: Monitoring & Validation

- **Day 1-2**: Lighthouse CI setup (14.6)
- **Day 3-4**: Import optimization (14.7)
- **Day 5**: Final validation and documentation

## Success Metrics

### Performance Targets

- [x] Lighthouse Performance Score: 90+
- [x] First Contentful Paint: <1.5s
- [x] Largest Contentful Paint: <2.5s
- [x] Time to Interactive: <3.5s
- [x] Cumulative Layout Shift: <0.1

### Bundle Size Targets

- [x] Initial bundle: <50KB (currently 102KB)
- [x] Route chunks: <25KB (currently ~1MB)
- [x] Total gzipped: <200KB
- [x] Vendor chunk: <150KB
- [x] Feature chunks: <100KB each

### Code Quality Targets

- [x] Component size compliance: 95%
- [x] Import optimization: 100%
- [x] Dead code elimination: 100%
- [x] Tree-shaking effectiveness: 85%+

## Risk Mitigation

### Technical Risks

1. **Breaking changes from code splitting**

   - Mitigation: Gradual rollout with feature flags
   - Rollback plan: Keep original bundle as fallback

2. **Dynamic import loading failures**

   - Mitigation: Graceful fallbacks and error boundaries
   - Monitoring: Track failed dynamic imports

3. **Performance regression in development**
   - Mitigation: Development-specific configurations
   - Separate optimization for dev vs production

### Process Risks

1. **Developer workflow disruption**

   - Mitigation: Clear documentation and training
   - Tooling: Automated size checking in IDE

2. **CI/CD pipeline complexity**
   - Mitigation: Incremental integration
   - Monitoring: Pipeline performance tracking

## Maintenance Strategy

### Ongoing Monitoring

- Weekly bundle size reports
- Monthly performance audits
- Quarterly optimization reviews

### Developer Guidelines

- Size-conscious development practices
- Pre-commit performance checks
- Regular training on optimization techniques

### Automation

- Automated bundle analysis in PR reviews
- Performance regression alerts
- Size budget enforcement in CI/CD

## Conclusion

This comprehensive optimization plan will transform PHA-v2 from a monolithic application with oversized bundles into a performant, efficiently-loaded application. The phased approach ensures stability while delivering measurable improvements in load times and user experience.

Success will be measured through concrete metrics and continuous monitoring, ensuring the application maintains optimal performance as it evolves.
