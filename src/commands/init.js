/**
 * Init command for Lambda Running
 * Creates lambda-running.json and .lambdarunignore files in the project root
 */

const fs = require('fs');
const path = require('path');
const { defaultConfig } = require('../config-loader');

/**
 * Generate a default lambda-running.json file
 * @param {string} outputDir - Directory to create the file in
 * @param {boolean} force - Whether to overwrite existing file
 * @returns {boolean} - Whether the file was created
 */
function generateConfigFile(outputDir, force = false) {
  const configPath = path.join(outputDir, 'lambda-running.json');

  // Check if file already exists
  if (fs.existsSync(configPath) && !force) {
    console.log(`Config file already exists at ${configPath}. Use --force to overwrite.`);
    return false;
  }

  // Create a readable configuration with comments
  const configWithComments = {
    // Include default config values
    ...defaultConfig,

    // Add example layers
    layers: ['example-layer'],

    // Add example ignore patterns
    ignorePatterns: ['**/*.test.js', '**/*.spec.js', '**/__tests__/**', '**/__mocks__/**'],
  };

  // Write the file with nice formatting
  fs.writeFileSync(configPath, JSON.stringify(configWithComments, null, 2));

  console.log(`Created configuration file at ${configPath}`);
  return true;
}

/**
 * Generate a default .lambdarunignore file
 * @param {string} outputDir - Directory to create the file in
 * @param {boolean} force - Whether to overwrite existing file
 * @returns {boolean} - Whether the file was created
 */
function generateIgnoreFile(outputDir, force = false) {
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
    '',
  ].join('\n');

  // Write the file
  fs.writeFileSync(ignorePath, ignorePatterns);

  console.log(`Created ignore file at ${ignorePath}`);
  return true;
}

/**
 * Run the init command
 * @param {Object} options - Command options
 * @param {boolean} options.force - Whether to overwrite existing files
 * @returns {Promise<void>}
 */
async function init(options = {}) {
  const outputDir = process.cwd();
  const force = options.force || false;

  console.log('Initializing Lambda Running configuration...');

  // Generate both files
  const configCreated = generateConfigFile(outputDir, force);
  const ignoreCreated = generateIgnoreFile(outputDir, force);

  if (configCreated || ignoreCreated) {
    console.log('Initialization complete. You may need to customize the files for your project.');
  } else {
    console.log('No files were created. Use --force to overwrite existing files.');
  }
}

module.exports = init;
