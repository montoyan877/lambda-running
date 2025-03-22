/**
 * Lambda Layer Resolver
 * Handles path resolution for Lambda layers
 */

const Module = require('module');
const path = require('path');
const fs = require('fs');

// Keep a reference to the original Module._resolveFilename
const originalResolveFilename = Module._resolveFilename;

/**
 * Initialize the layer resolver with the provided layer mappings
 * @param {Object} config - Configuration object with layerMappings
 */
function initializeLayerResolver(config) {
  // Guard to ensure we have a configuration
  if (!config) {
    // Only log in debug mode or for critical errors
    console.warn('[SYSTEM] No configuration provided to layer resolver');
    return;
  }

  // First, normalize the config to include all layer mappings
  // This processes the 'layers' array and adds them to layerMappings
  const mappings = {}; 
  const debug = config.debug || false;
  
  // Process the 'layers' array first
  if (Array.isArray(config.layers) && config.layers.length > 0) {
    config.layers.forEach(layer => {
      const layerPath = `/opt/nodejs/${layer}`;
      // Support AWS Lambda layer structure: layers/[nameOfLayer]/nodejs
      // Use the directory where config was found as base if available
      const baseDir = config._configDir 
        ? path.join(config._configDir, 'layers', layer)
        : path.join(process.cwd(), 'layers', layer);
      
      // Check if [layer]/nodejs exists (AWS Lambda standard)
      const awsStylePath = path.join(baseDir, 'nodejs');
      let localPath = fs.existsSync(awsStylePath) ? awsStylePath : baseDir;
      
      // Add mapping for the layer directly
      mappings[layerPath] = localPath;
      
      // Add direct mappings for modules inside the nodejs directory
      if (fs.existsSync(awsStylePath) && fs.statSync(awsStylePath).isDirectory()) {
        try {
          // List all modules inside the nodejs directory
          const awsModules = fs.readdirSync(awsStylePath).filter(item => {
            const itemPath = path.join(awsStylePath, item);
            return fs.statSync(itemPath).isDirectory() || 
                   (fs.statSync(itemPath).isFile() && item.endsWith('.js'));
          });
          
          // Create direct mappings for each module
          awsModules.forEach(moduleName => {
            // Remove .js extension if present
            const cleanModuleName = moduleName.endsWith('.js') 
              ? moduleName.slice(0, -3)
              : moduleName;
              
            const moduleLayerPath = `/opt/nodejs/${cleanModuleName}`;
            const moduleLocalPath = path.join(awsStylePath, moduleName);
            
            // Only add if there's no explicit mapping already
            if (!mappings[moduleLayerPath]) {
              mappings[moduleLayerPath] = moduleLocalPath;
              // Only log in debug mode
              if (debug) {
                console.log(`[SYSTEM] Added AWS module mapping: ${moduleLayerPath} -> ${moduleLocalPath}`);
              }
            }
          });
        } catch (error) {
          // Ignore errors when scanning modules
          if (debug) {
            console.error(`[SYSTEM] Error scanning AWS modules: ${error.message}`);
          }
        }
      }
      
      // Only log in debug mode
      if (debug) {
        console.log(`[SYSTEM] Processing layer from config: ${layer} -> ${localPath}`);
      }
    });
  }
  
  // Then add any explicit layerMappings
  if (config.layerMappings && Object.keys(config.layerMappings).length > 0) {
    for (const [layerPath, localPath] of Object.entries(config.layerMappings)) {
      // Ensure layer path starts with /opt
      const normalizedLayerPath = layerPath.startsWith('/opt') 
        ? layerPath 
        : `/opt/nodejs/${layerPath}`;
      
      // Ensure local path is absolute
      let normalizedLocalPath = path.isAbsolute(localPath)
        ? localPath
        : path.join(process.cwd(), localPath);
      
      // Check for AWS Lambda structure with /nodejs directory
      if (fs.existsSync(path.join(normalizedLocalPath, 'nodejs'))) {
        normalizedLocalPath = path.join(normalizedLocalPath, 'nodejs');
      }
      
      mappings[normalizedLayerPath] = normalizedLocalPath;
    }
  }
  
  // If no mappings were configured, only warn in debug mode
  if (Object.keys(mappings).length === 0) {
    if (debug) {
      console.warn('[SYSTEM] No layer mappings found in configuration. Layer resolution may not work.');
    }
    return;
  }

  // Only log in debug mode
  if (debug) {
    console.log('[SYSTEM] Layer resolver initialized with mappings');
  }
  
  // Check if mappings point to existing directories
  for (const [layerPath, localPath] of Object.entries(mappings)) {
    if (!fs.existsSync(localPath)) {
      if (debug) {
        console.warn(`[SYSTEM] Layer mapping target does not exist: ${localPath}`);
        console.log(`[SYSTEM] Creating directory: ${localPath}`);
      }
      
      try {
        // Create the directory if it doesn't exist
        fs.mkdirSync(localPath, { recursive: true });
      } catch (error) {
        // This is a critical error, so log it regardless of debug mode
        console.error(`[SYSTEM] Error creating layer directory: ${error.message}`);
      }
    }
  }
  
  // Override Module._resolveFilename to intercept requires for layer paths
  Module._resolveFilename = function(request, parent, isMain, options) {
    // Only log in debug mode
    if (debug) {
      console.log(`[SYSTEM] Layer resolver intercepted request: ${request}`);
    }
    
    // First check direct mappings
    for (const [layerPath, localPath] of Object.entries(mappings)) {
      if (request.startsWith(layerPath)) {
        // Replace the layer path with the local path
        const localRequest = request.replace(layerPath, localPath);
        
        // Only log in debug mode
        if (debug) {
          console.log(`[SYSTEM] Layer resolver direct mapping: ${request} -> ${localRequest}`);
        }
        
        try {
          return originalResolveFilename.call(this, localRequest, parent, isMain, options);
        } catch (error) {
          // Only log in debug mode
          if (debug) {
            console.error(`[SYSTEM] Layer resolver error for ${localRequest}: ${error.message}`);
          }
          // If local path resolution fails, continue with alternative resolutions
        }
      }
    }
    
    // Special case for /opt/nodejs requires without a mapping
    if (request.startsWith('/opt/nodejs/')) {
      const parts = request.split('/');
      // Extract the package name (the part after /opt/nodejs/)
      const packageName = parts[3]; // 0=/,1=opt,2=nodejs,3=package
      
      if (debug) {
        console.log(`[SYSTEM] Attempting to auto-resolve layer package: ${packageName}`);
      }
      
      // Build a list of potential locations to check
      const potentialLocalPaths = [];
      
      // First try already configured layer paths
      Object.values(mappings).forEach(mappedPath => {
        // 1. Direct match (path ends with package name)
        if (mappedPath.endsWith(packageName) || mappedPath.endsWith(`/${packageName}`)) {
          potentialLocalPaths.push(mappedPath);
        }
        
        // 2. Check if it's inside a nodejs directory (AWS Lambda standard structure)
        // For layer structure: layers/[layerName]/nodejs/[packageName]
        const awsStyleModulePath = path.join(mappedPath, packageName);
        if (fs.existsSync(awsStyleModulePath)) {
          potentialLocalPaths.push(awsStyleModulePath);
        }
      });
      
      // Try to resolve from standard paths
      potentialLocalPaths.push(
        // Try to resolve from layers directory
        path.join(process.cwd(), 'layers', packageName),
        // Check common AWS structure in all layer directories
        ...findAwsStylePaths(process.cwd(), packageName, debug),
        // Try to resolve from node_modules
        path.join(process.cwd(), 'node_modules', packageName)
      );
      
      for (const localPath of potentialLocalPaths) {
        if (fs.existsSync(localPath)) {
          // For single file modules, adjust the remainder of the path
          const remainingPath = parts.slice(4).join('/');
          
          // Try to find the most appropriate module path
          let resolvedPath;
          
          if (remainingPath) {
            // If there's a specific subpath, try to resolve it
            resolvedPath = findModulePath(localPath, remainingPath);
          } else {
            // Otherwise, treat the module as the main entry point
            if (fs.statSync(localPath).isDirectory()) {
              // If it's a directory, try to find an index.js or package.json main
              resolvedPath = findModulePath(localPath, '');
            } else {
              // If it's a file, use it directly
              resolvedPath = localPath;
            }
          }
          
          if (resolvedPath) {
            if (debug) {
              console.log(`[SYSTEM] Auto-resolved layer: ${request} -> ${resolvedPath}`);
            }
            
            try {
              return originalResolveFilename.call(this, resolvedPath, parent, isMain, options);
            } catch (error) {
              if (debug) {
                console.error(`[SYSTEM] Layer auto-resolver error for ${resolvedPath}: ${error.message}`);
              }
              // Continue trying other paths
            }
          }
        }
      }
      
      // Extra debug for troubleshooting
      if (debug) {
        console.log(`[SYSTEM] Failed to auto-resolve ${request}. Tried paths:`, potentialLocalPaths);
      }
    }
    
    // If no layer path matched, use the original resolver
    return originalResolveFilename.call(this, request, parent, isMain, options);
  };
}

/**
 * Restore the original Module._resolveFilename
 */
function restoreOriginalResolver() {
  if (Module._resolveFilename !== originalResolveFilename) {
    Module._resolveFilename = originalResolveFilename;
  }
}

/**
 * Helper function to find the correct module path
 * @param {string} baseDir - Base directory to search in
 * @param {string} requestedPath - The path requested by the module
 * @returns {string|null} - The resolved path or null if not found
 */
function findModulePath(baseDir, requestedPath) {
  // If the base directory itself is a file, use it directly
  if (fs.existsSync(baseDir) && fs.statSync(baseDir).isFile()) {
    return baseDir;
  }
  
  // Handle empty requested path (resolving to the module itself)
  if (!requestedPath || requestedPath === '') {
    // Check for index.js in the base directory
    const indexPath = path.join(baseDir, 'index.js');
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
    
    // Check for package.json to find main file
    const packageJsonPath = path.join(baseDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (pkg.main) {
          const mainPath = path.join(baseDir, pkg.main);
          if (fs.existsSync(mainPath)) {
            return mainPath;
          }
          // Try with .js extension
          if (fs.existsSync(`${mainPath}.js`)) {
            return `${mainPath}.js`;
          }
        }
      } catch (error) {
        // Ignore package.json parsing errors
      }
    }
  }

  // Check if the requested path exists directly
  const directPath = path.join(baseDir, requestedPath);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  // Check for common patterns like index.js, main file in package.json, etc.
  const possiblePaths = [
    directPath,
    `${directPath}.js`,
    `${directPath}.json`,
    path.join(directPath, 'index.js')
  ];

  // Try each possible path
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }

  return null;
}

/**
 * Helper function to find AWS-style layer paths for a module
 * Searches for pattern: [baseDir]/layers/{layerName}/nodejs/[moduleName]
 * @param {string} baseDir - Base directory to search in
 * @param {string} moduleName - The module name to search for
 * @param {boolean} debug - Whether to enable debug logging
 * @returns {Array<string>} - Array of found paths
 */
function findAwsStylePaths(baseDir, moduleName, debug = false) {
  const foundPaths = [];
  const layersDir = path.join(baseDir, 'layers');
  
  // Check if layers directory exists
  if (!fs.existsSync(layersDir)) {
    return foundPaths;
  }
  
  try {
    // Get all layer directories
    const layerDirs = fs.readdirSync(layersDir).filter(item => {
      const itemPath = path.join(layersDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
    
    // For each layer directory, check for nodejs/moduleName
    for (const layerDir of layerDirs) {
      const nodejsPath = path.join(layersDir, layerDir, 'nodejs');
      if (fs.existsSync(nodejsPath)) {
        const modulePath = path.join(nodejsPath, moduleName);
        if (fs.existsSync(modulePath)) {
          foundPaths.push(modulePath);
          // Only log in debug mode
          if (debug) {
            console.log(`[SYSTEM] Found AWS-style module: ${modulePath}`);
          }
        }
      }
    }
  } catch (error) {
    // Ignore errors when searching
    // Only log in debug mode
    if (debug) {
      console.error(`[SYSTEM] Error searching for AWS-style paths: ${error.message}`);
    }
  }
  
  return foundPaths;
}

module.exports = {
  initializeLayerResolver,
  restoreOriginalResolver
}; 