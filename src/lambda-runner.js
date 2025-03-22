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

// Check if ts-node is installed
let tsNodeAvailable = false;
let tsconfigPathsAvailable = false;

// Skip TS check if environment variable is set (for development mode)
const skipTsCheck = process.env.SKIP_TS_CHECK === 'true';

if (!skipTsCheck) {
  try {
    require.resolve('ts-node');
    tsNodeAvailable = true;

    // Check if tsconfig-paths is installed for alias support
    try {
      require.resolve('tsconfig-paths');
      tsconfigPathsAvailable = true;
    } catch (err) {
      console.warn('Path aliases not supported. Install tsconfig-paths if needed.');
      tsconfigPathsAvailable = false;
    }

    // Look for project's tsconfig.json
    const projectTsConfigPath = path.join(process.cwd(), 'tsconfig.json');
    let tsNodeOptions = {
      transpileOnly: true,
      compilerOptions: {
        module: 'commonjs',
        target: 'es2017',
      },
    };

    // If project has a tsconfig.json, use it instead of default options
    if (fs.existsSync(projectTsConfigPath)) {
      const chalk = require('chalk');
      console.log(chalk.green(`Using TypeScript configuration from ${projectTsConfigPath}`));
      // ts-node will automatically pick up the tsconfig.json from the project root
      // We still set transpileOnly for better performance
      tsNodeOptions = { transpileOnly: true };

      // Register tsconfig-paths if available to support path aliases
      if (tsconfigPathsAvailable) {
        // Load the tsconfig manually to check for path aliases
        let tsconfig;
        try {
          tsconfig = JSON.parse(fs.readFileSync(projectTsConfigPath, 'utf8'));
          if (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
            // Register tsconfig-paths
            require('tsconfig-paths').register({
              baseUrl: tsconfig.compilerOptions.baseUrl || '.',
              paths: tsconfig.compilerOptions.paths,
            });
          }
        } catch (e) {
          console.warn(`Error parsing tsconfig.json: ${e.message}`);
        }
      }
    } else {
      console.log('No tsconfig.json found, using default TypeScript configuration');
    }

    // Register ts-node to import .ts files
    require('ts-node').register(tsNodeOptions);
  } catch (err) {
    // ts-node is not installed, continue without it
    console.warn(`ts-node not found: ${err.message}`);
  }
} else {
  console.log('Skipping TypeScript setup as SKIP_TS_CHECK is true');
}

/**
 * Parse JSON safely, with better error handling and support for common json errors
 * like trailing commas and comments
 * @param {string} jsonString - The JSON string to parse
 * @param {string} filePath - File path for error reporting
 * @returns {Object|null} - Parsed object or null if parsing failed
 */
function safeParseJson(jsonString, filePath) {
  try {
    // First try standard JSON parsing
    return JSON.parse(jsonString);
  } catch (initialError) {
    console.warn(`Warning: Initial JSON parse error in ${filePath}: ${initialError.message}`);
    console.log('Attempting to fix common JSON issues...');
    
    try {
      // Fix common issues: 
      // 1. Remove trailing commas (very common in tsconfig.json)
      const fixedJson = jsonString
        // Remove comments
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Fix trailing commas in objects
        .replace(/,(\s*[}\]])/g, '$1')
        // Ensure all property names are double-quoted
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2": ');
      
      return JSON.parse(fixedJson);
    } catch (fixedError) {
      console.error(`Error: Failed to parse JSON after fixing in ${filePath}: ${fixedError.message}`);
      console.error('Consider validating your JSON with a linter or online tool');
      return null;
    }
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
    console.warn('Could not read .lambdarunignore file:', error.message);
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

      global.systemLog(`Loading environment variables from ${dotenvPath}`);
    } else {
      // Env file doesn't exist, but that's okay - just continue without it
      if (envFile === '.env') {
        global.systemLog('No .env file found, continuing without it');
      }
    }
  } catch (error) {
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
  global.systemLog = (...args) => {
    console.info(`[SYSTEM] ${args.join(' ')}`);
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

    // Make sure we have the layer resolver initialized
    if (lambdaRunningConfig.debug) {
      global.systemLog(`Initializing layer resolver for ${path.basename(absolutePath)}`);
    }

    // We always initialize the layer resolver for running a handler
    // This ensures that '/opt/nodejs/...' imports will be resolved
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

    // Check if it's a TypeScript file and ts-node is not available
    const isTypeScript = absolutePath.endsWith('.ts');
    if (isTypeScript) {
      if (!tsNodeAvailable) {
        throw new Error(
          'TypeScript files require ts-node. Please install it with: npm install -g ts-node typescript'
        );
      }

      // Check for a tsconfig.json specific to the handler's directory
      const dirTsConfigPath = path.join(handlerDir, 'tsconfig.json');
      if (fs.existsSync(dirTsConfigPath) && path.dirname(absolutePath) !== process.cwd()) {
        global.systemLog(
          `Using TypeScript configuration from handler directory: ${dirTsConfigPath}`
        );
      }
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
          global.systemLog
            ? global.systemLog(`Ignoring file due to pattern match: ${filePath}`)
            : console.log(`Ignoring file due to pattern match: ${filePath}`);
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
            // Check if it's a TypeScript file and ts-node is not available
            const isTypeScript = ext === '.ts';
            if (isTypeScript && !tsNodeAvailable) {
              global.systemLog
                ? global.systemLog(`Skipping TypeScript file (ts-node not available): ${filePath}`)
                : console.warn(`Skipping TypeScript file (ts-node not available): ${filePath}`);
              continue;
            }

            // Activate layer resolver temporarily to handle imports from layers
            if (lambdaRunningConfig) {
              initializeLayerResolver(lambdaRunningConfig);
            }

            // Try to require the file to see if it's a module
            const handler = require(filePath);

            // Restore original resolver right after require
            restoreOriginalResolver();

            // Only get methods named 'handler'
            const methods = Object.keys(handler).filter(
              (key) => typeof handler[key] === 'function' && key === 'handler'
            );

            if (methods.length > 0) {
              // This is a valid handler file
              if (lambdaRunningConfig && lambdaRunningConfig.debug) {
                global.systemLog
                  ? global.systemLog(
                      `Found handler: ${filePath} with methods: ${methods.join(', ')}`
                    )
                  : console.log(`Found handler: ${filePath} with methods: ${methods.join(', ')}`);
              }

              results.push({
                path: filePath,
                methods,
              });
            }
          } catch (error) {
            // Make sure to restore the resolver in case of errors
            restoreOriginalResolver();

            // If it contains code that suggests it's a handler but failed due to layers
            const isHandlerWithLayerImport =
              error.message &&
              error.message.includes("Cannot find module '/opt/nodejs/") &&
              // Check if the file is not inside a 'layers' directory but is trying to use layers
              !filePath.includes(path.sep + 'layers' + path.sep) &&
              // Has 'exports.handler' or 'module.exports.handler' in its content
              fs.readFileSync(filePath, 'utf8').match(/(?:exports|module\.exports)\.handler\s*=/);

            if (isHandlerWithLayerImport) {
              // This is likely a handler that uses layers
              if (lambdaRunningConfig.debug) {
                global.systemLog
                  ? global.systemLog(
                      `Found handler with layer imports: ${filePath} (will be available at runtime)`
                    )
                  : console.log(
                      `Found handler with layer imports: ${filePath} (will be available at runtime)`
                    );
              }

              results.push({
                path: filePath,
                methods: ['handler'],
              });
            } else if (
              error.message &&
              error.message.includes("Cannot find module '/opt/nodejs/")
            ) {
              // This is likely a layer file that imports from other layers
              global.systemLog
                ? global.systemLog(`Skipping layer file (imports from other layers): ${filePath}`)
                : console.warn(`Skipping layer file (imports from other layers): ${filePath}`);
            } else {
              // Log other errors
              global.systemLog
                ? global.systemLog(
                    `Could not load potential handler: ${filePath} - ${error.message}`
                  )
                : console.warn(`Could not load potential handler: ${filePath}`, error.message);
            }
          }
        }
      }
    }
  } catch (error) {
    global.systemLog
      ? global.systemLog(`Error scanning directory ${directory}: ${error.message}`)
      : console.error(`Error scanning directory ${directory}:`, error);
  }

  return results;
}

module.exports = {
  runHandler,
  scanForHandlers,
};
