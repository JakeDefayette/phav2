#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Bundle size limits (in bytes)
const SIZE_LIMITS = {
  // JavaScript chunks
  'main': 50 * 1024,      // 50KB - main bundle
  'vendor': 150 * 1024,   // 150KB - vendor libraries
  'feature': 100 * 1024,  // 100KB - per feature chunk
  'shared': 120 * 1024,   // 120KB - shared components
  'charts': 80 * 1024,    // 80KB - chart libraries
  'pdf': 100 * 1024,      // 100KB - PDF generation
  'forms': 50 * 1024,     // 50KB - form libraries
  
  // CSS
  'styles': 30 * 1024,    // 30KB - main styles
  
  // Assets
  'image': 500 * 1024,    // 500KB - per image
  'font': 100 * 1024,     // 100KB - per font
  
  // Total limits
  'total_js': 200 * 1024, // 200KB - total JavaScript gzipped
  'total_css': 50 * 1024, // 50KB - total CSS gzipped
};

// File size limits for source files
const FILE_SIZE_LIMITS = {
  '.tsx': 200,  // React components: 200 lines max
  '.ts': 300,   // TypeScript files: 300 lines max
  '.js': 200,   // JavaScript files: 200 lines max
  '.css': 500,  // CSS files: 500 lines max
};

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file size
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Count lines in a file
 */
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

/**
 * Check bundle sizes after build
 */
function checkBundleSizes() {
  const buildDir = path.join(process.cwd(), '.next');
  const staticDir = path.join(buildDir, 'static');
  
  if (!fs.existsSync(staticDir)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  console.log('📊 Checking bundle sizes...\n');

  const violations = [];
  let totalJSSize = 0;
  let totalCSSSize = 0;

  // Check JavaScript chunks
  const chunksDir = path.join(staticDir, 'chunks');
  if (fs.existsSync(chunksDir)) {
    const chunkFiles = fs.readdirSync(chunksDir).filter(file => file.endsWith('.js'));
    
    for (const file of chunkFiles) {
      const filePath = path.join(chunksDir, file);
      const size = getFileSize(filePath);
      totalJSSize += size;

      // Determine chunk type and check against limits
      let chunkType = 'other';
      let limit = SIZE_LIMITS.feature; // default limit

      if (file.includes('vendor') || file.includes('node_modules')) {
        chunkType = 'vendor';
        limit = SIZE_LIMITS.vendor;
      } else if (file.includes('main') || file.includes('app')) {
        chunkType = 'main';
        limit = SIZE_LIMITS.main;
      } else if (file.includes('shared')) {
        chunkType = 'shared';
        limit = SIZE_LIMITS.shared;
      } else if (file.includes('charts')) {
        chunkType = 'charts';
        limit = SIZE_LIMITS.charts;
      } else if (file.includes('pdf')) {
        chunkType = 'pdf';
        limit = SIZE_LIMITS.pdf;
      } else if (file.includes('forms')) {
        chunkType = 'forms';
        limit = SIZE_LIMITS.forms;
      }

      const status = size <= limit ? '✅' : '❌';
      const percentage = ((size / limit) * 100).toFixed(1);
      
      console.log(`${status} ${file} (${chunkType}): ${formatBytes(size)} / ${formatBytes(limit)} (${percentage}%)`);
      
      if (size > limit) {
        violations.push({
          file,
          type: 'chunk',
          size,
          limit,
          excess: size - limit
        });
      }
    }
  }

  // Check CSS files
  const cssDir = path.join(staticDir, 'css');
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));
    
    for (const file of cssFiles) {
      const filePath = path.join(cssDir, file);
      const size = getFileSize(filePath);
      totalCSSSize += size;

      const limit = SIZE_LIMITS.styles;
      const status = size <= limit ? '✅' : '❌';
      const percentage = ((size / limit) * 100).toFixed(1);
      
      console.log(`${status} ${file} (CSS): ${formatBytes(size)} / ${formatBytes(limit)} (${percentage}%)`);
      
      if (size > limit) {
        violations.push({
          file,
          type: 'css',
          size,
          limit,
          excess: size - limit
        });
      }
    }
  }

  // Check total sizes
  console.log('\n📈 Total Bundle Sizes:');
  
  const totalJSStatus = totalJSSize <= SIZE_LIMITS.total_js ? '✅' : '❌';
  const totalJSPercentage = ((totalJSSize / SIZE_LIMITS.total_js) * 100).toFixed(1);
  console.log(`${totalJSStatus} Total JavaScript: ${formatBytes(totalJSSize)} / ${formatBytes(SIZE_LIMITS.total_js)} (${totalJSPercentage}%)`);
  
  const totalCSSStatus = totalCSSSize <= SIZE_LIMITS.total_css ? '✅' : '❌';
  const totalCSSPercentage = ((totalCSSSize / SIZE_LIMITS.total_css) * 100).toFixed(1);
  console.log(`${totalCSSStatus} Total CSS: ${formatBytes(totalCSSSize)} / ${formatBytes(SIZE_LIMITS.total_css)} (${totalCSSPercentage}%)`);

  if (totalJSSize > SIZE_LIMITS.total_js) {
    violations.push({
      file: 'Total JavaScript',
      type: 'total',
      size: totalJSSize,
      limit: SIZE_LIMITS.total_js,
      excess: totalJSSize - SIZE_LIMITS.total_js
    });
  }

  if (totalCSSSize > SIZE_LIMITS.total_css) {
    violations.push({
      file: 'Total CSS',
      type: 'total',
      size: totalCSSSize,
      limit: SIZE_LIMITS.total_css,
      excess: totalCSSSize - SIZE_LIMITS.total_css
    });
  }

  return violations;
}

/**
 * Check source file sizes
 */
function checkSourceFileSizes() {
  console.log('\n📝 Checking source file sizes...\n');

  const violations = [];
  const srcDir = path.join(process.cwd(), 'src');

  function checkDirectory(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        // Skip node_modules and build directories
        if (!['node_modules', '.next', 'coverage', 'dist'].includes(item)) {
          checkDirectory(itemPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        const limit = FILE_SIZE_LIMITS[ext];

        if (limit) {
          const lines = countLines(itemPath);
          const relativePath = path.relative(process.cwd(), itemPath);
          
          const status = lines <= limit ? '✅' : '❌';
          const percentage = ((lines / limit) * 100).toFixed(1);
          
          if (lines > limit * 0.8) { // Show files approaching the limit
            console.log(`${status} ${relativePath}: ${lines} / ${limit} lines (${percentage}%)`);
          }
          
          if (lines > limit) {
            violations.push({
              file: relativePath,
              type: 'source',
              size: lines,
              limit,
              excess: lines - limit
            });
          }
        }
      }
    }
  }

  checkDirectory(srcDir);
  return violations;
}

/**
 * Generate bundle analysis report
 */
function generateReport() {
  try {
    console.log('🔍 Generating bundle analysis...\n');
    execSync('npm run analyze', { stdio: 'inherit' });
  } catch (error) {
    console.warn('⚠️  Could not generate bundle analysis. Make sure you have @next/bundle-analyzer installed.');
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const shouldFail = args.includes('--fail');
  const shouldAnalyze = args.includes('--analyze');

  console.log('🏗️  Bundle Size Checker\n');

  let allViolations = [];

  // Check bundle sizes
  const bundleViolations = checkBundleSizes();
  allViolations = allViolations.concat(bundleViolations);

  // Check source file sizes
  const sourceViolations = checkSourceFileSizes();
  allViolations = allViolations.concat(sourceViolations);

  // Generate analysis if requested
  if (shouldAnalyze) {
    generateReport();
  }

  // Summary
  console.log('\n📊 Summary:');
  
  if (allViolations.length === 0) {
    console.log('✅ All size checks passed!');
    process.exit(0);
  } else {
    console.log(`❌ Found ${allViolations.length} size violations:\n`);
    
    for (const violation of allViolations) {
      const unit = violation.type === 'source' ? 'lines' : 'bytes';
      console.log(`  • ${violation.file}: ${violation.size} ${unit} (limit: ${violation.limit}, excess: ${violation.excess})`);
    }

    console.log('\n💡 Recommendations:');
    console.log('  - Split large components into smaller ones');
    console.log('  - Use dynamic imports for heavy dependencies');
    console.log('  - Remove unused code and dependencies');
    console.log('  - Consider code splitting for large features');

    if (shouldFail) {
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkBundleSizes,
  checkSourceFileSizes,
  SIZE_LIMITS,
  FILE_SIZE_LIMITS
};