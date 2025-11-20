#!/usr/bin/env node

/**
 * Script to remove or wrap console.log statements
 * Keeps critical logs wrapped in development checks
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to identify critical logs that should be kept (wrapped)
const KEEP_PATTERNS = [
  /console\.log\(['"].*Service (loaded|initialized|ready)/i,
  /console\.log\(['"].*API endpoint/i,
  /console\.error/,
  /console\.warn/
];

// Process a single file
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let changes = 0;

  // Find all console.log statements
  const consoleLogRegex = /console\.(log|debug|info)\([^)]*\);?/g;

  content = content.replace(consoleLogRegex, (match) => {
    // Check if this is a critical log to keep
    const shouldKeep = KEEP_PATTERNS.some(pattern => pattern.test(match));

    if (shouldKeep) {
      // Wrap in development check if not already wrapped
      if (!content.slice(Math.max(0, content.indexOf(match) - 100), content.indexOf(match)).includes('NODE_ENV')) {
        changes++;
        return `if (process.env.NODE_ENV === 'development') { ${match} }`;
      }
      return match;
    } else {
      // Remove the console.log
      changes++;
      return ''; // Remove it
    }
  });

  // Clean up empty lines left behind
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Processed ${filePath} - ${changes} changes`);
    return changes;
  }

  return 0;
}

// Main execution
console.log('🧹 Removing console.log statements...\n');

const patterns = [
  'src/**/*.js',
  'src/**/*.jsx',
  'api/**/*.js'
];

let totalFiles = 0;
let totalChanges = 0;

patterns.forEach(pattern => {
  const files = glob.sync(pattern, {
    cwd: path.join(__dirname, '..'),
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });

  files.forEach(file => {
    totalFiles++;
    totalChanges += processFile(file);
  });
});

console.log(`\n✨ Complete! Processed ${totalFiles} files, made ${totalChanges} changes.`);