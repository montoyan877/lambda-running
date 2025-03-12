/**
 * Lambda Runner module
 * Handles the execution of Lambda handlers with custom events for lambda-running library
 */

const path = require('path');
const fs = require('fs');

// Check if ts-node is installed
let tsNodeAvailable = false;
try {
  require.resolve('ts-node');
  tsNodeAvailable = true;
  // Register ts-node to import .ts files
  require('ts-node').register({
    transpileOnly: true,
    compilerOptions: {
      module: 'commonjs',
      target: 'es2017'
    }
  });
} catch (err) {
  // ts-node is not installed, continue without it
}

/**
 * Run a Lambda handler with the provided event
 * @param {string} handlerPath - Path to the handler file
 * @param {string} handlerMethod - Method name to call in the handler file
 * @param {Object} event - Event object to pass to the handler
 * @param {Object} context - Lambda context object (optional)
 * @returns {Promise<any>} - Result from the Lambda handler
 */
async function runHandler(handlerPath, handlerMethod, event, context = {}) {
  try {
    // Resolve the absolute path if it's relative
    const absolutePath = path.isAbsolute(handlerPath) 
      ? handlerPath 
      : path.resolve(process.cwd(), handlerPath);
    
    // Check if the file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Handler file not found: ${absolutePath}`);
    }

    // Check if it's a TypeScript file and ts-node is not available
    const isTypeScript = absolutePath.endsWith('.ts');
    if (isTypeScript && !tsNodeAvailable) {
      throw new Error(`TypeScript files require ts-node. Please install it with: npm install -g ts-node typescript`);
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
      ...context
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
 * @returns {Array<Object>} - Array of handler objects with path and exported methods
 */
function scanForHandlers(directory, extensions = ['.js', '.ts']) {
  const results = [];
  
  try {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        results.push(...scanForHandlers(filePath, extensions));
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
            
            // Get all exported methods that could be Lambda handlers
            const methods = Object.keys(handler).filter(
              key => typeof handler[key] === 'function'
            );
            
            if (methods.length > 0) {
              results.push({
                path: filePath,
                methods
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
  scanForHandlers
}; 