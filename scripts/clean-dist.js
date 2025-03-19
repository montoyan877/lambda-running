const fs = require('fs');
const path = require('path');

// Define directories
const srcDir = path.resolve(__dirname, '../src/ui-dist');
const assetsDir = path.resolve(srcDir, 'assets');
const cleanDir = path.resolve(__dirname, '../lib/ui-dist');
const cleanAssetsDir = path.resolve(cleanDir, 'assets');

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

// Clear previous clean directory if it exists
if (fs.existsSync(cleanDir)) {
  // Delete entire directory recursively
  console.log(`Eliminando directorio anterior: ${cleanDir}`);
  fs.rmSync(cleanDir, { recursive: true, force: true });
}

// Create clean directories
console.log('Creando directorios limpios');
fs.mkdirSync(cleanDir, { recursive: true });
fs.mkdirSync(cleanAssetsDir, { recursive: true });

// Copy index.html
console.log('Copiando index.html');
fs.copyFileSync(
  path.resolve(srcDir, 'index.html'),
  path.resolve(cleanDir, 'index.html')
);

// Process assets
console.log('\nProcesando archivos de assets:');
let keptCount = 0;
let totalSize = 0;

// Make sure assets directory exists
if (!fs.existsSync(assetsDir)) {
  console.error(`El directorio de assets ${assetsDir} no existe!`);
  process.exit(1);
}

// Process each file in assets
const files = fs.readdirSync(assetsDir);
for (const file of files) {
  const srcFilePath = path.join(assetsDir, file);
  const destFilePath = path.join(cleanAssetsDir, file);
  
  // Skip directories
  if (fs.statSync(srcFilePath).isDirectory()) continue;
  
  // Get file size
  const stats = fs.statSync(srcFilePath);
  const fileSizeInBytes = stats.size;
  const fileSizeInKB = fileSizeInBytes / 1024;
  
  if (isAllowed(file)) {
    // Copy allowed file
    fs.copyFileSync(srcFilePath, destFilePath);
    console.log(`Copiado: ${file} (${fileSizeInKB.toFixed(2)} KB)`);
    keptCount++;
    totalSize += fileSizeInBytes;
  }
}

// Show summary
console.log('\n' + '='.repeat(50));
console.log('Resumen de limpieza:');
console.log(`- Total de archivos procesados: ${files.length}`);
console.log(`- Archivos copiados: ${keptCount}`);
console.log(`- Archivos excluidos: ${files.length - keptCount}`);
console.log(`- Tamaño total de archivos copiados: ${(totalSize / 1024).toFixed(2)} KB`);
console.log('='.repeat(50)); 