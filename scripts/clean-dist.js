const fs = require('fs');
const path = require('path');

// Define directory
const distDir = path.resolve(__dirname, '../lib/ui-dist');
const assetsDir = path.resolve(distDir, 'assets');

// List of allowed patterns for assets
const allowedPatterns = [
  /^index-.*\.js$/,
  /^index-.*\.css$/,
  /^vendor-.*\.js$/,
  /^xterm-.*\.js$/,
  /^xterm-.*\.css$/,
  /^CodeEditor-.*\.js$/,
  /^CodeEditor-.*\.css$/,
  /^Events-.*\.js$/,
  /^HandlerView-.*\.js$/,
  /^HandlerView-.*\.css$/,
  /^NotFound-.*\.js$/
];

// Function to check if a file is allowed
function isAllowed(filename) {
  return allowedPatterns.some(pattern => pattern.test(filename));
}

// Make sure assets directory exists
if (!fs.existsSync(assetsDir)) {
  console.error(`The assets directory ${assetsDir} does not exist!`);
  process.exit(1);
}

// Process assets
console.log('Cleaning unwanted files from lib/ui-dist/assets:');
let removedCount = 0;
let keptCount = 0;
let totalSize = 0;
let removedSize = 0;

// Process each file in assets
const files = fs.readdirSync(assetsDir);
for (const file of files) {
  const filePath = path.join(assetsDir, file);
  
  // Skip directories
  if (fs.statSync(filePath).isDirectory()) continue;
  
  // Get file size
  const stats = fs.statSync(filePath);
  const fileSizeInBytes = stats.size;
  const fileSizeInKB = fileSizeInBytes / 1024;
  
  totalSize += fileSizeInBytes;
  
  if (!isAllowed(file)) {
    // Remove unwanted file
    fs.unlinkSync(filePath);
    console.log(`Deleted: ${file} (${fileSizeInKB.toFixed(2)} KB)`);
    removedCount++;
    removedSize += fileSizeInBytes;
  } else {
    console.log(`Kept: ${file} (${fileSizeInKB.toFixed(2)} KB)`);
    keptCount++;
  }
}

// Show summary
console.log('\n' + '='.repeat(50));
console.log('Summary of cleanup:');
console.log(`- Total files processed: ${files.length}`);
console.log(`- Files kept: ${keptCount}`);
console.log(`- Files deleted: ${removedCount}`);
console.log(`- Original size: ${(totalSize / 1024).toFixed(2)} KB`);
console.log(`- Deleted size: ${(removedSize / 1024).toFixed(2)} KB`);
console.log(`- Final size: ${((totalSize - removedSize) / 1024).toFixed(2)} KB`);
console.log(`- Reduction: ${(removedSize / totalSize * 100).toFixed(2)}%`);
console.log('='.repeat(50)); 