/**
 * Script to create Lambda Running configuration files
 * Run with: node src/scripts/create-config-files.js [--force]
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const force = args.includes('--force');

// Get the output directory (current working directory)
const outputDir = process.cwd();

// Default configuration
const defaultConfig = {
  layers: [],
  layerMappings: {},
  envFiles: ['.env'],
  ignorePatterns: [
    '**/*.test.js',
    '**/*.spec.js',
    '**/__tests__/**'
  ],
  ignoreLayerFilesOnScan: true,
  debug: false
};

// Generate lambda-running.json
function generateConfigFile() {
  const configPath = path.join(outputDir, 'lambda-running.json');
  
  // Check if file already exists
  if (fs.existsSync(configPath) && !force) {
    console.log(`Config file already exists at ${configPath}. Use --force to overwrite.`);
    return false;
  }
  
  // Write the file with nice formatting
  fs.writeFileSync(
    configPath, 
    JSON.stringify(defaultConfig, null, 2)
  );
  
  console.log(`Created configuration file at ${configPath}`);
  return true;
}

// Generate .lambdarunignore
function generateIgnoreFile() {
  const ignorePath = path.join(outputDir, '.lambdarunignore');
  
  // Check if file already exists
  if (fs.existsSync(ignorePath) && !force) {
    console.log(`Ignore file already exists at ${ignorePath}. Use --force to overwrite.`);
    return false;
  }
  
  // Default ignore patterns
  const ignorePatterns = [
    '# Lambda Running ignore file',
    '# Files and directories matching these patterns will be ignored when scanning for handlers',
    '',
    '# Dependencies',
    'node_modules/',
    'package-lock.json',
    'yarn.lock',
    '',
    '# Tests',
    'test/',
    'tests/',
    '**/*.test.js',
    '**/*.spec.js',
    '**/__tests__/',
    '**/__mocks__/',
    '',
    '# Build files',
    'dist/',
    'build/',
    'coverage/',
    '',
    '# Config files',
    '*.config.js',
    '.eslintrc*',
    '.prettier*',
    '',
    '# Documentation',
    'docs/',
    'README.md',
    'LICENSE',
    '',
    '# Version control',
    '.git/',
    '.github/',
    '.gitignore',
    '',
    '# IDE files',
    '.vscode/',
    '.idea/',
    '*.sublime-*',
    '# CDK',
    'cdk.out/',
  ].join('\n');
  
  // Write the file
  fs.writeFileSync(ignorePath, ignorePatterns);
  
  console.log(`Created ignore file at ${ignorePath}`);
  return true;
}

// Run the script
console.log('Initializing Lambda Running configuration...');
const configCreated = generateConfigFile();
const ignoreCreated = generateIgnoreFile();

if (configCreated || ignoreCreated) {
  console.log('Initialization complete. You may need to customize the files for your project.');
} else {
  console.log('No files were created. Use --force to overwrite existing files.');
} 