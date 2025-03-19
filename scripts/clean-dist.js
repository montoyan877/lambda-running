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
  console.error(`El directorio de assets ${assetsDir} no existe!`);
  process.exit(1);
}

// Process assets
console.log('Limpiando archivos no deseados de lib/ui-dist/assets:');
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
    console.log(`Eliminado: ${file} (${fileSizeInKB.toFixed(2)} KB)`);
    removedCount++;
    removedSize += fileSizeInBytes;
  } else {
    console.log(`Conservado: ${file} (${fileSizeInKB.toFixed(2)} KB)`);
    keptCount++;
  }
}

// Show summary
console.log('\n' + '='.repeat(50));
console.log('Resumen de limpieza:');
console.log(`- Total de archivos procesados: ${files.length}`);
console.log(`- Archivos conservados: ${keptCount}`);
console.log(`- Archivos eliminados: ${removedCount}`);
console.log(`- Tamaño original: ${(totalSize / 1024).toFixed(2)} KB`);
console.log(`- Tamaño eliminado: ${(removedSize / 1024).toFixed(2)} KB`);
console.log(`- Tamaño final: ${((totalSize - removedSize) / 1024).toFixed(2)} KB`);
console.log(`- Reducción: ${(removedSize / totalSize * 100).toFixed(2)}%`);
console.log('='.repeat(50)); 