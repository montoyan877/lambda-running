/**
 * Lambda Runner module
 * Handles the execution of Lambda handlers with custom events for lambda-running library
 */

const path = require('path');
const fs = require('fs');

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
  const relativePath = path.basename(filePath);

  for (const pattern of ignorePatterns) {
    // Simple globbing support for * as wildcard
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(relativePath)) {
        return true;
      }
    } else if (relativePath === pattern || filePath.includes(`/${pattern}/`)) {
      return true;
    }
  }

  return false;
}

/**
 * Load environment variables from .env file if it exists
 * @param {string} directory - Directory where to look for .env file
 * @returns {Object} - Environment variables loaded from .env file
 */
function loadEnvFile(directory) {
  const envVars = {};
  try {
    const envFilePath = path.join(directory, '.env');

    if (fs.existsSync(envFilePath)) {
      console.log(`Loading environment variables from ${envFilePath}`);
      const content = fs.readFileSync(envFilePath, 'utf8');
      const lines = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));

      for (const line of lines) {
        // Parse key=value format
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();

          // Remove quotes if present
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.substring(1, value.length - 1);
          }

          envVars[key] = value;
        }
      }
    }
  } catch (error) {
    console.warn('Could not read .env file:', error.message);
  }

  return envVars;
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

    // Load environment variables from .env if enabled
    if (opts.loadEnv) {
      const envVars = loadEnvFile(process.cwd());

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
        const chalk = require('chalk');
        console.log(
          chalk.green(`Using TypeScript configuration from handler directory: ${dirTsConfigPath}`)
        );
        // We don't re-register ts-node here as it's already registered globally,
        // but we log to inform the user that the handler directory's config will apply
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
    console.error('Error running Lambda handler:', error);
    throw error;
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

  // Get ignore patterns
  let ignorePatterns = [];
  if (opts.ignoreNodeModules) {
    ignorePatterns.push('node_modules');
  }

  if (opts.useIgnoreFile) {
    ignorePatterns = readIgnoreFile(directory);
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
              console.warn(`Skipping TypeScript file (ts-node not available): ${filePath}`);
              continue;
            }

            // Try to require the file to see if it's a module
            const handler = require(filePath);

            // Only get methods named 'handler'
            const methods = Object.keys(handler).filter(
              (key) => typeof handler[key] === 'function' && key === 'handler'
            );

            if (methods.length > 0) {
              results.push({
                path: filePath,
                methods,
              });
            }
          } catch (error) {
            // Skip files that can't be required
            console.warn(`Could not load potential handler: ${filePath}`, error.message);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${directory}:`, error);
  }

  return results;
}

module.exports = {
  runHandler,
  scanForHandlers,
};
