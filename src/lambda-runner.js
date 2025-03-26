/**
 * Lambda Runner module
 * Handles the execution of Lambda handlers with custom events for lambda-running library
 */

const path = require('path');
const fs = require('fs');
const { loadConfig } = require('./config-loader');
const { initializeLayerResolver, restoreOriginalResolver } = require('./layer-resolver');

// Global config object
let lambdaRunningConfig = null;

// Registry of already configured TypeScript paths to avoid duplicate logs
let configuredTsConfigPaths = new Set();

// Skip TS check if environment variable is set (for development mode)
const skipTsCheck = process.env.SKIP_TS_CHECK === 'true';

/**
 * Find the closest tsconfig.json file from a given path
 * @param {string} startPath - Path to start searching from
 * @returns {string|null} - Path to the closest tsconfig.json or null if not found
 */
function findClosestTsConfig(startPath) {
  let currentDir = startPath;

  // First check in the current directory
  let tsConfigPath = path.join(currentDir, 'tsconfig.json');
  if (fs.existsSync(tsConfigPath)) {
    return tsConfigPath;
  }

  // Look in parent directories up to the project root
  while (currentDir !== process.cwd() && path.dirname(currentDir) !== currentDir) {
    currentDir = path.dirname(currentDir);
    tsConfigPath = path.join(currentDir, 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      return tsConfigPath;
    }
  }

  // If not found in parent directories, check project root
  const rootTsConfig = path.join(process.cwd(), 'tsconfig.json');
  if (fs.existsSync(rootTsConfig)) {
    return rootTsConfig;
  }

  return null;
}

/**
 * Sets up TypeScript support for the project
 * @param {string} [customConfigPath] - Optional path to a specific tsconfig.json file
 * @param {boolean} [forceSetup=false] - Whether to force setup even if already configured
 * @returns {boolean} - Whether setup was successful
 */
function setupTypeScriptSupport(customConfigPath, forceSetup = false) {
  if (skipTsCheck) {
    // Only log in debug mode
    if (lambdaRunningConfig && lambdaRunningConfig.debug) {
      console.log('Skipping TypeScript setup as SKIP_TS_CHECK is true');
    }
    return false;
  }

  try {
    // Only try to resolve ts-node if we have a custom config path (meaning we found a TypeScript file)
    if (customConfigPath) {
      require.resolve('ts-node');
    } else {
      // If no custom config path, we don't need ts-node
      return false;
    }

    // Use the provided config path or find the closest one
    const projectTsConfigPath = customConfigPath || findClosestTsConfig(process.cwd());

    if (!projectTsConfigPath) {
      // Only log in debug mode
      if (lambdaRunningConfig && lambdaRunningConfig.debug) {
        console.log('No tsconfig.json found, skipping TypeScript setup');
      }
      return false;
    }

    // Check if we've already configured this tsconfig
    const normalizedPath = path.normalize(projectTsConfigPath);
    if (!forceSetup && configuredTsConfigPaths.has(normalizedPath)) {
      // Already configured, skip duplicate setup and logs
      return true;
    }

    // This is important info, but we'll use global.systemLog to respect debug mode
    if (global.systemLog) {
      global.systemLog(`Using TypeScript configuration from ${projectTsConfigPath}`);
    } else if (lambdaRunningConfig && lambdaRunningConfig.debug) {
      console.log(`Using TypeScript configuration from ${projectTsConfigPath}`);
    }

    // Set TS_NODE_PROJECT environment variable to the absolute path of tsconfig.json
    process.env.TS_NODE_PROJECT = projectTsConfigPath;

    // Register ts-node with the project's tsconfig.json and tsconfig-paths support
    require('ts-node').register({
      project: projectTsConfigPath,
      transpileOnly: true,
      require: ['tsconfig-paths/register'],
    });

    // Add to configured paths registry
    configuredTsConfigPaths.add(normalizedPath);
    return true;
  } catch (err) {
    // ts-node is not installed, continue without it
    // This is an important warning, so we don't limit to debug
    console.warn(`ts-node not found: ${err.message}`);
    return false;
  }
}

/**
 * Read and parse .lambdarunignore file in the specified directory
 * @param {string} directory - Directory to look for .lambdarunignore
 * @returns {Array<string>} - Array of patterns to ignore
 */
function readIgnoreFile(directory) {
  const ignorePatterns = ['node_modules']; // Default ignore pattern

  try {
    const ignoreFilePath = path.join(directory, '.lambdarunignore');

    if (fs.existsSync(ignoreFilePath)) {
      const content = fs.readFileSync(ignoreFilePath, 'utf8');
      const lines = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));

      ignorePatterns.push(...lines);
    }
  } catch (error) {
    // Only log in debug mode
    if (lambdaRunningConfig && lambdaRunningConfig.debug) {
      console.warn('Could not read .lambdarunignore file:', error.message);
    }
  }

  return ignorePatterns;
}

/**
 * Check if a path should be ignored based on ignore patterns
 * @param {string} filePath - Path to check
 * @param {Array<string>} ignorePatterns - Patterns to ignore
 * @returns {boolean} - True if path should be ignored
 */
function shouldIgnore(filePath, ignorePatterns) {
  // Normalize the path to use forward slashes for consistent matching
  const normalizedPath = filePath.replace(/\\/g, '/');
  const fileName = path.basename(filePath);

  for (const pattern of ignorePatterns) {
    // Normalize pattern to use forward slashes
    const normalizedPattern = pattern.replace(/\\/g, '/');

    // Check for ** glob patterns (matches any directory recursively)
    if (normalizedPattern.includes('**')) {
      // Convert ** to regex: dir/** becomes dir/.*
      const regexPattern = normalizedPattern
        .replace(/\./g, '\\.') // Escape dots
        .replace(/\*\*/g, '.*'); // ** becomes .*

      const regex = new RegExp(regexPattern);
      if (regex.test(normalizedPath)) {
        return true;
      }
    }
    // Check for * glob pattern (matches any characters in a single directory)
    else if (normalizedPattern.includes('*')) {
      // Convert * to regex: *.js becomes .*\.js
      const regexPattern = normalizedPattern
        .replace(/\./g, '\\.') // Escape dots
        .replace(/\*/g, '.*'); // * becomes .*

      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(fileName) || regex.test(normalizedPath)) {
        return true;
      }
    }
    // Simple direct matching - check both filename and full path
    else if (fileName === normalizedPattern || normalizedPath.includes(`/${normalizedPattern}/`)) {
      return true;
    }
  }

  return false;
}

/**
 * Load environment variables from .env file
 * @param {string} directory - Directory containing .env file
 * @param {string} envFile - Name of the env file (default: '.env')
 * @returns {object} - Object with environment variables
 */
function loadEnvFile(directory, envFile = '.env') {
  const dotenv = {};

  try {
    const dotenvPath = path.join(directory, envFile);
    if (fs.existsSync(dotenvPath)) {
      const content = fs.readFileSync(dotenvPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line) => {
        line = line.trim();
        // Skip empty lines and comments
        if (line === '' || line.startsWith('#')) {
          return;
        }

        // Parse line as KEY=VALUE
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          let [, key, value] = match;
          key = key.trim();
          value = value.trim();

          // Remove quotes around the value if present
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.substring(1, value.length - 1);
          }

          dotenv[key] = value;
        }
      });

      // This information is only meaningful in debug mode
      global.systemLog(`Loading environment variables from ${dotenvPath}`);
    } else {
      // Env file doesn't exist, but that's okay - just continue without it
      if (envFile === '.env') {
        // This information is only meaningful in debug mode
        global.systemLog('No .env file found, continuing without it');
      }
    }
  } catch (error) {
    // This is an error, but still only meaningful in debug mode
    global.systemLog(`Error loading ${envFile}: ${error.message}`);
  }

  return dotenv;
}

// Add global function to facilitate explicit logging for Lambda Running
function setupGlobalLogging() {
  // Global function to print explicit Lambda logs
  global.lambdaLog = (...args) => {
    console.log(`[LAMBDA] ${args.join(' ')}`);
  };

  // Global function to print system logs (which will be filtered and won't appear in the Output)
  // Only log if debug mode is enabled in the config
  global.systemLog = (...args) => {
    // Only show system logs in debug mode
    if (lambdaRunningConfig && lambdaRunningConfig.debug) {
      console.info(`[SYSTEM] ${args.join(' ')}`);
    }
  };
}

/**
 * Run a Lambda handler with the provided event
 * @param {string} handlerPath - Path to the handler file
 * @param {string} handlerMethod - Method name to call in the handler file
 * @param {Object} event - Event object to pass to the handler
 * @param {Object} context - Lambda context object (optional)
 * @param {Object} options - Additional options
 * @param {boolean} options.loadEnv - Whether to load environment variables from .env file (default: true)
 * @returns {Promise<any>} - Result from the Lambda handler
 */
async function runHandler(handlerPath, handlerMethod, event, context = {}, options = {}) {
  try {
    // Setup global logging functions
    setupGlobalLogging();

    // Set default options
    const opts = {
      loadEnv: true,
      ...options,
    };

    // Resolve the absolute path if it's relative
    const absolutePath = path.isAbsolute(handlerPath)
      ? handlerPath
      : path.resolve(process.cwd(), handlerPath);

    // Get the directory of the handler file
    const handlerDir = path.dirname(absolutePath);

    // Load configuration based on handler directory first, then fallback to cwd
    // This ensures that we find the config appropriate for this specific handler
    lambdaRunningConfig = loadConfig(handlerDir);

    // Check if it's a TypeScript file and setup TypeScript support
    const isTypeScript = absolutePath.endsWith('.ts');
    if (isTypeScript) {
      // Find the closest tsconfig.json to the handler
      const closestTsConfig = findClosestTsConfig(handlerDir);

      if (!closestTsConfig) {
        throw new Error(
          'TypeScript file found but no tsconfig.json was found in the handler directory or parent directories'
        );
      }

      // Set up TypeScript with the found tsconfig
      setupTypeScriptSupport(closestTsConfig, true);
    }

    // Initialize layer resolver AFTER TypeScript setup to avoid overriding path mappings
    if (lambdaRunningConfig.debug) {
      global.systemLog(`Initializing layer resolver for ${path.basename(absolutePath)}`);
    }

    // Initialize the layer resolver for running a handler
    initializeLayerResolver(lambdaRunningConfig);

    // System log using systemLog - won't be visible in the Output
    global.systemLog(`Starting execution of handler: ${handlerPath} -> ${handlerMethod}`);

    // Load environment variables from .env if enabled
    if (opts.loadEnv) {
      // If config specifies env files, use those, otherwise use default .env
      const envFiles =
        lambdaRunningConfig && lambdaRunningConfig.envFiles
          ? lambdaRunningConfig.envFiles
          : ['.env'];
      let envVars = {};

      // Load each env file in order
      for (const envFile of envFiles) {
        const vars = loadEnvFile(process.cwd(), envFile);
        envVars = { ...envVars, ...vars };
      }

      // Apply environment variables
      for (const [key, value] of Object.entries(envVars)) {
        process.env[key] = value;
      }
    }

    // Check if the file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Handler file not found: ${absolutePath}`);
    }

    // Clear cache to reload the handler if it's been changed
    try {
      delete require.cache[require.resolve(absolutePath)];
    } catch (e) {
      // Ignore errors when clearing cache
    }

    // Import the handler
    const handler = require(absolutePath);

    // Check if the handler method exists
    if (typeof handler[handlerMethod] !== 'function') {
      throw new Error(`Handler method '${handlerMethod}' is not a function`);
    }

    // Default Lambda context properties
    const defaultContext = {
      awsRequestId: `lambda-test-${Date.now()}`,
      functionName: `local-${path.basename(handlerPath)}`,
      functionVersion: 'local',
      memoryLimitInMB: '128',
      getRemainingTimeInMillis: () => 30000, // 30 seconds
      ...context,
    };

    // Execute the handler
    return await handler[handlerMethod](event, defaultContext);
  } catch (error) {
    // Handler execution errors are important, so we show them regardless of debug mode
    console.error('Error executing handler:', error);
    throw error;
  } finally {
    // Restore the original module resolver
    restoreOriginalResolver();
  }
}

/**
 * Scan a directory for potential Lambda handlers
 * @param {string} directory - Directory to scan
 * @param {Array<string>} extensions - File extensions to include (default: ['.js', '.ts'])
 * @param {Object} options - Additional options (default: {})
 * @param {boolean} options.ignoreNodeModules - Whether to ignore node_modules (default: true)
 * @param {boolean} options.useIgnoreFile - Whether to use .lambdarunignore file (default: true)
 * @returns {Array<Object>} - Array of handler objects with path and exported methods
 */
function scanForHandlers(directory, extensions = ['.js', '.ts'], options = {}) {
  // Set default options
  const opts = {
    ignoreNodeModules: true,
    useIgnoreFile: true,
    ...options,
  };

  // Load configuration if not already loaded
  if (!lambdaRunningConfig) {
    lambdaRunningConfig = loadConfig(directory);
    if (lambdaRunningConfig.debug) {
      global.systemLog('Lambda Running configuration loaded for handler scanning');
    }
  }

  // Get ignore patterns
  let ignorePatterns = [];
  if (opts.ignoreNodeModules) {
    ignorePatterns.push('node_modules/**');
  }
  if (opts.useIgnoreFile) {
    const ignoreFilePatterns = readIgnoreFile(directory);
    ignorePatterns = [...ignorePatterns, ...ignoreFilePatterns];
  }

  // Add any additional ignore patterns from configuration
  if (
    lambdaRunningConfig &&
    lambdaRunningConfig.ignorePatterns &&
    Array.isArray(lambdaRunningConfig.ignorePatterns)
  ) {
    ignorePatterns = [...ignorePatterns, ...lambdaRunningConfig.ignorePatterns];
  }

  // If ignoreLayerFilesOnScan is enabled, ignore files in layers directory
  if (lambdaRunningConfig && lambdaRunningConfig.ignoreLayerFilesOnScan) {
    const layersDir = path.join(directory, 'layers/**');
    if (lambdaRunningConfig.debug) {
      global.systemLog(`Ignoring layer files during scan: ${layersDir}`);
    }
    ignorePatterns.push(layersDir);

    // Also ignore layer paths from layerMappings
    if (lambdaRunningConfig.layerMappings) {
      Object.values(lambdaRunningConfig.layerMappings).forEach((localPath) => {
        // If path is relative, make it absolute
        const absolutePath = path.isAbsolute(localPath)
          ? localPath
          : path.join(directory, localPath);

        if (lambdaRunningConfig.debug) {
          global.systemLog(`Ignoring layer mapping path during scan: ${absolutePath}`);
        }
        ignorePatterns.push(absolutePath + '/**');
      });
    }
  }

  return scanDirectory(directory, extensions, ignorePatterns);
}

/**
 * Internal function to recursively scan a directory
 * @private
 */
function scanDirectory(directory, extensions, ignorePatterns) {
  const results = [];

  try {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);

      // Skip files/directories that match ignore patterns
      if (shouldIgnore(filePath, ignorePatterns)) {
        if (lambdaRunningConfig && lambdaRunningConfig.debug) {
          if (global.systemLog) {
            global.systemLog(`Ignoring file due to pattern match: ${filePath}`);
          } else {
            console.log(`Ignoring file due to pattern match: ${filePath}`);
          }
        }
        continue;
      }

      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        results.push(...scanDirectory(filePath, extensions, ignorePatterns));
      } else {
        const ext = path.extname(file);

        if (extensions.includes(ext)) {
          try {
            // Read file content to check if it's a handler
            const content = fs.readFileSync(filePath, 'utf8');
            
            // More inclusive pattern that matches:
            // - exports.handler = ...
            // - module.exports.handler = ...
            // - export const handler = ...
            // - export async function handler() ...
            // - export default { handler: ... }
            const handlerPatterns = [
              /(?:exports|module\.exports)\.handler\s*=/,
              /export\s+(?:const|async\s+function)\s+handler\b/,
              /export\s+default\s*{[^}]*handler\s*:/,
            ];

            const isHandler = handlerPatterns.some(pattern => pattern.test(content));
            
            if (isHandler) {
              if (lambdaRunningConfig && lambdaRunningConfig.debug) {
                if (global.systemLog) {
                  global.systemLog(`Found handler: ${filePath}`);
                } else {
                  console.log(`Found handler: ${filePath}`);
                }
              }

              results.push({
                path: filePath,
                methods: ['handler'],
              });
            }
          } catch (error) {
            // Log errors but only in debug mode
            if (lambdaRunningConfig && lambdaRunningConfig.debug) {
              if (global.systemLog) {
                global.systemLog(`Could not read potential handler: ${filePath} - ${error.message}`);
              } else {
                console.warn(`Could not read potential handler: ${filePath}`, error.message);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    // Directory scanning errors are important, show them regardless of debug mode
    if (global.systemLog) {
      global.systemLog(`Error scanning directory ${directory}: ${error.message}`);
    } else {
      console.error(`Error scanning directory ${directory}:`, error);
    }
  }

  return results;
}

module.exports = {
  runHandler,
  scanForHandlers,
  setupTypeScriptSupport,
};

