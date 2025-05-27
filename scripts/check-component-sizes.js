#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Configuration for max lines per component type
const MAX_LINES = {
  'atoms': 100,
  'molecules': 150,
  'organisms': 200,
  'templates': 250,
  'pages': 100,
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

function checkFileSize(filePath, maxLines) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
  }).length;

  return { lines, exceeds: lines > maxLines };
}

function scanDirectory(dir, componentType) {
  if (!fs.existsSync(dir)) return [];

  const results = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results.push(...scanDirectory(filePath, componentType));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // Skip test and story files
      if (file.includes('.test.') || file.includes('.stories.')) return;

      const maxLines = MAX_LINES[componentType];
      const { lines, exceeds } = checkFileSize(filePath, maxLines);

      results.push({
        path: filePath,
        lines,
        maxLines,
        exceeds,
        componentType,
      });
    }
  });

  return results;
}

function main() {
  console.log('🔍 Checking component sizes...\n');

  const componentsDir = path.join(process.cwd(), 'src', 'components');
  let hasErrors = false;
  const allResults = [];

  // Check each component type
  Object.keys(MAX_LINES).forEach(componentType => {
    const dir = path.join(componentsDir, componentType);
    const results = scanDirectory(dir, componentType);
    allResults.push(...results);
  });

  // Sort by line count (descending)
  allResults.sort((a, b) => b.lines - a.lines);

  // Display results
  allResults.forEach(result => {
    const relativePath = path.relative(process.cwd(), result.path);
    const percentage = Math.round((result.lines / result.maxLines) * 100);
    
    let color = colors.green;
    let symbol = '✓';
    
    if (result.exceeds) {
      color = colors.red;
      symbol = '✗';
      hasErrors = true;
    } else if (percentage > 80) {
      color = colors.yellow;
      symbol = '⚠';
    }

    console.log(
      `${color}${symbol} ${relativePath}${colors.reset}\n` +
      `  Lines: ${result.lines}/${result.maxLines} (${percentage}%)\n`
    );
  });

  // Summary
  const totalFiles = allResults.length;
  const oversizedFiles = allResults.filter(r => r.exceeds).length;
  const warningFiles = allResults.filter(r => !r.exceeds && (r.lines / r.maxLines) > 0.8).length;

  console.log('\n📊 Summary:');
  console.log(`Total files checked: ${totalFiles}`);
  console.log(`${colors.green}✓ Within limits: ${totalFiles - oversizedFiles - warningFiles}${colors.reset}`);
  console.log(`${colors.yellow}⚠ Warning (>80%): ${warningFiles}${colors.reset}`);
  console.log(`${colors.red}✗ Exceeds limits: ${oversizedFiles}${colors.reset}`);

  if (hasErrors) {
    console.log(`\n${colors.red}❌ Some components exceed size limits!${colors.reset}`);
    console.log('Consider splitting large components into smaller, reusable parts.');
    process.exit(1);
  } else {
    console.log(`\n${colors.green}✅ All components are within size limits!${colors.reset}`);
  }
}

// Run the script
main();
