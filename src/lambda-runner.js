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

// Registry of already configured TypeScript paths to avoid duplicate logs
let configuredTsConfigPaths = new Set();

// Skip TS check if environment variable is set (for development mode)
const skipTsCheck = process.env.SKIP_TS_CHECK === 'true';

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
    require.resolve('ts-node');
    tsNodeAvailable = true;

    // Check if tsconfig-paths is installed for alias support
    try {
      require.resolve('tsconfig-paths');
      tsconfigPathsAvailable = true;
    } catch (err) {
      // This is important info for users, so we don't limit to debug
      console.warn('Path aliases not supported. Install tsconfig-paths if needed.');
      tsconfigPathsAvailable = false;
    }

    // Look for project's tsconfig.json
    const projectTsConfigPath = customConfigPath || path.join(process.cwd(), 'tsconfig.json');
    
    // Check if we've already configured this tsconfig
    const normalizedPath = path.normalize(projectTsConfigPath);
    if (!forceSetup && configuredTsConfigPaths.has(normalizedPath)) {
      // Already configured, skip duplicate setup and logs
      return true;
    }
    
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
      // This is important info, but we'll use global.systemLog to respect debug mode
      if (global.systemLog) {
        global.systemLog(`Using TypeScript configuration from ${projectTsConfigPath}`);
      } else if (lambdaRunningConfig && lambdaRunningConfig.debug) {
        console.log(`Using TypeScript configuration from ${projectTsConfigPath}`);
      }
      
      // ts-node will automatically pick up the tsconfig.json from the project root
      // We still set transpileOnly for better performance
      tsNodeOptions = { transpileOnly: true };

      // Register tsconfig-paths if available to support path aliases
      if (tsconfigPathsAvailable) {
        setupTsConfigPaths(projectTsConfigPath, forceSetup);
      } else {
        // Still add to configured paths registry to avoid duplicate logs
        configuredTsConfigPaths.add(normalizedPath);
      }
    } else {
      // Only log in debug mode
      if (lambdaRunningConfig && lambdaRunningConfig.debug) {
        console.log('No tsconfig.json found, using default TypeScript configuration');
      }
    }

    // Register ts-node to import .ts files
    require('ts-node').register(tsNodeOptions);
    return true;
  } catch (err) {
    // ts-node is not installed, continue without it
    // This is an important warning, so we don't limit to debug
    console.warn(`ts-node not found: ${err.message}`);
    return false;
  }
}

/**
 * Sets up TypeScript path aliases from tsconfig.json
 * @param {string} tsconfigPath - Path to the tsconfig.json file
 * @param {boolean} [forceSetup=false] - Whether to force setup even if already configured
 * @returns {boolean} - Whether setup was successful
 */
function setupTsConfigPaths(tsconfigPath, forceSetup = false) {
  if (!tsconfigPathsAvailable) return false;
  
  try {
    // Check if we've already configured this tsconfig
    const normalizedPath = path.normalize(tsconfigPath);
    if (!forceSetup && configuredTsConfigPaths.has(normalizedPath)) {
      // Already configured, skip duplicate setup and logs
      return true;
    }
    
    // Read the tsconfig.json file content
    const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8');
    
    // First try to fix common JSON issues before parsing
    const fixedJson = tsconfigContent
      // Remove comments
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Fix trailing commas in objects and arrays
      .replace(/,(\s*[}\]])/g, '$1')
      // Ensure all property names are double-quoted
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2": ');
    
    // Parse the fixed JSON
    let tsconfig;
    try {
      tsconfig = JSON.parse(fixedJson);
    } catch (parseError) {
      // Error parsing is important, so we don't limit to debug
      console.error(`Error parsing tsconfig.json at ${tsconfigPath}: ${parseError.message}`);
      console.error('Please check your tsconfig.json for syntax errors');
      return false;
    }
    
    if (tsconfig && tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
      // Get the directory of the tsconfig.json file
      const tsconfigDir = path.dirname(tsconfigPath);
      
      // Get the baseUrl, which is relative to the tsconfig.json location
      const baseUrl = tsconfig.compilerOptions.baseUrl 
        ? path.resolve(tsconfigDir, tsconfig.compilerOptions.baseUrl)
        : tsconfigDir;
      
      // Use global.systemLog to respect debug mode
      if (global.systemLog) {
        global.systemLog(`Registering TypeScript paths with baseUrl: ${baseUrl}`);
      } else if (lambdaRunningConfig && lambdaRunningConfig.debug) {
        console.log(`Registering TypeScript paths with baseUrl: ${baseUrl}`);
      }
      
      // Register tsconfig-paths with the correct baseUrl
      require('tsconfig-paths').register({
        baseUrl,
        paths: tsconfig.compilerOptions.paths
      });
      
      // Add to configured paths registry
      configuredTsConfigPaths.add(normalizedPath);
      
      // Use global.systemLog to respect debug mode
      if (global.systemLog) {
        global.systemLog('TypeScript path aliases registered successfully');
      } else if (lambdaRunningConfig && lambdaRunningConfig.debug) {
        console.log('TypeScript path aliases registered successfully');
      }
      
      return true;
    } else {
      // Use global.systemLog to respect debug mode
      if (global.systemLog) {
        global.systemLog('No path aliases found in tsconfig.json');
      } else if (lambdaRunningConfig && lambdaRunningConfig.debug) {
        console.log('No path aliases found in tsconfig.json');
      }
      
      // Add to configured paths registry anyway to avoid duplicate checks
      configuredTsConfigPaths.add(normalizedPath);
      return false;
    }
  } catch (e) {
    // This warning is important, so we don't limit to debug
    console.warn(`Error setting up TypeScript path aliases: ${e.message}`);
    return false;
  }
}

// Initialize TypeScript support on module load (for the main project)
setupTypeScriptSupport();

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
    // Only log in debug mode - except for critical errors
    if (lambdaRunningConfig && lambdaRunningConfig.debug) {
      console.warn(`Warning: Initial JSON parse error in ${filePath}: ${initialError.message}`);
      console.log('Attempting to fix common JSON issues...');
    }
    
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
      // These are critical errors, so we show them regardless of debug mode
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
            (value.startsWith('\'') && value.endsWith('\''))
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
  // Keep track of whether we've set up TypeScript
  let tsconfigPathsRegistered = false;
  
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
      if (!tsNodeAvailable) {
        throw new Error(
          'TypeScript files require ts-node. Please install it with: npm install -g ts-node typescript'
        );
      }

      // First look for tsconfig in the handler's directory
      let dirTsConfigPath = path.join(handlerDir, 'tsconfig.json');
      
      // If not found, look in parent directories up to the project root
      if (!fs.existsSync(dirTsConfigPath)) {
        let currentDir = handlerDir;
        while (currentDir !== process.cwd() && path.dirname(currentDir) !== currentDir) {
          currentDir = path.dirname(currentDir);
          const parentTsConfig = path.join(currentDir, 'tsconfig.json');
          if (fs.existsSync(parentTsConfig)) {
            dirTsConfigPath = parentTsConfig;
            break;
          }
        }
      }
      
      // If still not found, use the project root tsconfig
      if (!fs.existsSync(dirTsConfigPath)) {
        dirTsConfigPath = path.join(process.cwd(), 'tsconfig.json');
      }
      
      // Now set up TypeScript with the found tsconfig
      // Force setup to ensure the configuration for this specific handler is used
      if (fs.existsSync(dirTsConfigPath)) {
        // For handler execution, we'll always force setup to ensure correct config is used
        tsconfigPathsRegistered = setupTypeScriptSupport(dirTsConfigPath, true);
      }
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
            // Check if it's a TypeScript file and ts-node is not available
            const isTypeScript = ext === '.ts';
            if (isTypeScript && !tsNodeAvailable) {
              if (lambdaRunningConfig && lambdaRunningConfig.debug) {
                if (global.systemLog) {
                  global.systemLog(`Skipping TypeScript file (ts-node not available): ${filePath}`);
                } else {
                  console.warn(`Skipping TypeScript file (ts-node not available): ${filePath}`);
                }
              }
              continue;
            }

            // For TypeScript files, set up proper path resolution
            let tsPathsRegistered = false;
            if (isTypeScript) {
              // Look for tsconfig in the file's directory or parent directories
              const fileDir = path.dirname(filePath);
              let tsconfigPath = null;
              
              // First check in the file's directory
              let dirTsConfigPath = path.join(fileDir, 'tsconfig.json');
              if (fs.existsSync(dirTsConfigPath)) {
                tsconfigPath = dirTsConfigPath;
              } else {
                // If not found, look in parent directories up to the project root
                let currentDir = fileDir;
                while (currentDir !== process.cwd() && path.dirname(currentDir) !== currentDir) {
                  currentDir = path.dirname(currentDir);
                  const parentTsConfig = path.join(currentDir, 'tsconfig.json');
                  if (fs.existsSync(parentTsConfig)) {
                    tsconfigPath = parentTsConfig;
                    break;
                  }
                }
              }
              
              // If no tsconfig was found in parent directories, use the project root tsconfig
              if (!tsconfigPath) {
                const rootTsConfig = path.join(process.cwd(), 'tsconfig.json');
                if (fs.existsSync(rootTsConfig)) {
                  tsconfigPath = rootTsConfig;
                }
              }
              
              // Set up TypeScript paths if a tsconfig was found, but only if not already configured
              if (tsconfigPath) {
                // Don't log again if already configured - use the improved function with registry
                tsPathsRegistered = setupTypeScriptSupport(tsconfigPath, false);
              }
            }
            
            // Activate layer resolver after TypeScript setup
            // This ensures we don't override TypeScript path resolution
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
                if (global.systemLog) {
                  global.systemLog(`Found handler: ${filePath} with methods: ${methods.join(', ')}`);
                } else {
                  console.log(`Found handler: ${filePath} with methods: ${methods.join(', ')}`);
                }
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
              error.message.includes('Cannot find module \'/opt/nodejs/') &&
              // Check if the file is not inside a 'layers' directory but is trying to use layers
              !filePath.includes(path.sep + 'layers' + path.sep) &&
              // Has 'exports.handler' or 'module.exports.handler' in its content
              fs.readFileSync(filePath, 'utf8').match(/(?:exports|module\.exports)\.handler\s*=/);

            if (isHandlerWithLayerImport) {
              // This is likely a handler that uses layers
              if (lambdaRunningConfig && lambdaRunningConfig.debug) {
                if (global.systemLog) {
                  global.systemLog(`Found handler with layer imports: ${filePath} (will be available at runtime)`);
                } else {
                  console.log(`Found handler with layer imports: ${filePath} (will be available at runtime)`);
                }
              }

              results.push({
                path: filePath,
                methods: ['handler'],
              });
            } else if (
              error.message &&
              error.message.includes('Cannot find module \'/opt/nodejs/')
            ) {
              // This is likely a layer file that imports from other layers
              if (lambdaRunningConfig && lambdaRunningConfig.debug) {
                if (global.systemLog) {
                  global.systemLog(`Skipping layer file (imports from other layers): ${filePath}`);
                } else {
                  console.warn(`Skipping layer file (imports from other layers): ${filePath}`);
                }
              }
            } else {
              // For better TypeScript path resolution issues diagnostics, add more details for this type of error
              const isTypeScriptFile = path.extname(filePath) === '.ts';
              if (error.message && error.message.includes('Cannot find module') && isTypeScriptFile) {
                // TypeScript module errors are important, so we show these regardless of debug
                if (global.systemLog) {
                  global.systemLog(`TypeScript module resolution error in ${filePath}: ${error.message}
Try configuring tsconfig.json paths or check import paths`);
                } else {
                  console.warn(`TypeScript module resolution error in ${filePath}: ${error.message}
Try configuring tsconfig.json paths or check import paths`);
                }
              } else {
                // Log other errors but only in debug mode
                if (lambdaRunningConfig && lambdaRunningConfig.debug) {
                  if (global.systemLog) {
                    global.systemLog(`Could not load potential handler: ${filePath} - ${error.message}`);
                  } else {
                    console.warn(`Could not load potential handler: ${filePath}`, error.message);
                  }
                }
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
  setupTsConfigPaths
};
