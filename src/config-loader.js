/**
 * Configuration loader for Lambda Running
 * Handles loading and validation of lambda-running.json
 */

const fs = require('fs');
const path = require('path');

// Default configuration values
const defaultConfig = {
  layers: [],
  layerMappings: {
    // Maps Lambda layer paths to local paths
    // e.g. "/opt/nodejs/my-lib": "./layers/my-lib"
  },
  envFiles: ['.env'],   // Array of env files to load
  ignorePatterns: [],   // Additional patterns to ignore when scanning for handlers
  ignoreLayerFilesOnScan: true, // Ignore files in the layers directory during handler scanning
  debug: false          // Enable debug mode
};

/**
 * Find the lambda-running.json file in multiple possible locations
 * @param {string} startDir - Directory to start searching from
 * @returns {string|null} - Path to config file or null if not found
 */
function findConfigFile(startDir) {
  // Try multiple possible locations
  const possibleLocations = [
    // Direct location
    path.join(startDir, 'lambda-running.json'),
    // Look for legacy config name for backward compatibility
    path.join(startDir, 'lambdarunning.config.json'),
    // Look in parent directory
    path.join(path.dirname(startDir), 'lambda-running.json'),
    // Look in project root (process.cwd())
    path.join(process.cwd(), 'lambda-running.json'),
    // Look in examples directory if we're in the example
    path.join(startDir, '..', 'lambda-running.json'),
    // Look in .lambda-running directory
    path.join(startDir, '.lambda-running', 'config.json'),
    path.join(process.cwd(), '.lambda-running', 'config.json')
  ];

  // Try each location
  for (const location of possibleLocations) {
    if (fs.existsSync(location)) {
      return location;
    }
  }

  return null;
}

/**
 * Log a message using global.systemLog if available, otherwise console.log
 * Only logs in debug mode unless it's an error or explicitly marked as important
 * @param {string} message - Message to log
 * @param {string} level - Log level (info, warn, error)
 * @param {object} config - Configuration object with debug flag
 * @param {boolean} isImportant - Whether to log regardless of debug mode
 */
function logMessage(message, level = 'info', config = null, isImportant = false) {
  // Check debug mode - only log if we're in debug mode or it's an error or marked as important
  const debugMode = config && config.debug;
  const shouldLog = isImportant || level === 'error' || debugMode;
  
  if (!shouldLog) {
    return; // Skip logging if not in debug mode
  }
  
  // Use systemLog if available
  if (global.systemLog) {
    global.systemLog(message);
  } else if (level === 'error') {
    console.error(message);
  } else if (level === 'warn') {
    console.warn(message);
  } else {
    console.log(message);
  }
}

/**
 * Load configuration from a lambda-running.json file
 * @param {string} projectDir - Directory to search for config file
 * @returns {Object} - Configuration object
 */
function loadConfig(projectDir) {
  const configPath = findConfigFile(projectDir);
  let config = { ...defaultConfig };
  
  try {
    if (configPath) {
      // Finding configuration is important enough to always log
      logMessage(`Found configuration at ${configPath}`, 'info', config, true);
      const configContent = fs.readFileSync(configPath, 'utf8');
      const userConfig = JSON.parse(configContent);
      
      // Merge with default config
      config = { ...defaultConfig, ...userConfig };
      
      // Store the directory where the config was found
      config._configDir = path.dirname(configPath);
      
      // Only log in debug mode
      logMessage(`Configuration loaded from ${path.basename(configPath)}`, 'info', config);
    } else {
      // Only log a warning if we're in debug mode
      logMessage('No lambda-running.json found, using default configuration', 'warn', config);
    }
  } catch (error) {
    // Error loading config is important enough to always log
    logMessage(`Error loading configuration: ${error.message}`, 'error', config, true);
    // Continue with default config
  }
  
  // Normalize layer mappings to ensure consistent path formats
  if (config.layerMappings) {
    const normalizedMappings = {};
    
    for (const [layerPath, localPath] of Object.entries(config.layerMappings)) {
      // Ensure layer paths start with /opt
      const normalizedLayerPath = layerPath.startsWith('/opt') 
        ? layerPath 
        : path.join('/opt', layerPath);
        
      // Convert local paths to absolute paths
      const normalizedLocalPath = path.isAbsolute(localPath)
        ? localPath
        : config._configDir 
          ? path.join(config._configDir, localPath)
          : path.join(projectDir, localPath);
        
      normalizedMappings[normalizedLayerPath] = normalizedLocalPath;
    }
    
    config.layerMappings = normalizedMappings;
  }
  
  // Process layers array (shorthand for direct layer paths)
  if (Array.isArray(config.layers) && config.layers.length > 0) {
    // For each layer in the layers array, create a mapping if it doesn't exist
    config.layers.forEach(layer => {
      const layerPath = `/opt/nodejs/${layer}`;
      if (!config.layerMappings[layerPath]) {
        // Use the directory where config was found as the base for relative paths
        const baseDir = config._configDir || projectDir;
        let localLayerPath = path.join(baseDir, 'layers', layer);
        
        // Check if AWS Lambda standard structure exists with /nodejs directory
        const awsStylePath = path.join(localLayerPath, 'nodejs');
        if (fs.existsSync(awsStylePath)) {
          localLayerPath = awsStylePath;
          // Only log in debug mode
          logMessage(`Found AWS Lambda style layer structure for ${layer}`, 'info', config);
        }
        
        config.layerMappings[layerPath] = localLayerPath;
        
        // Only log in debug mode
        logMessage(`Added layer mapping for ${layer} -> ${localLayerPath}`, 'info', config);
      }
    });
  }
  
  return config;
}

module.exports = {
  loadConfig,
  defaultConfig,
  findConfigFile
}; 