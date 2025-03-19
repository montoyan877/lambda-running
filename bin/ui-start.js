#!/usr/bin/env node

/**
 * Lambda Runner UI Start
 * This script automatically sets up and starts the entire Lambda Runner UI environment
 * including both the frontend and backend with all necessary dependencies
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const { EventEmitter } = require('events');

// Try to load chalk for colored output, or create a fallback
let chalk;
try {
  chalk = require('chalk');
} catch (e) {
  // Simple fallback implementation if chalk is not installed
  chalk = {
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    grey: (text) => `\x1b[90m${text}\x1b[0m`,
  };
}

/**
 * Check if a port is in use
 * @param {number} port - Port to check
 * @returns {Promise<boolean>} - True if port is in use, false otherwise
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
}

/**
 * Find an available port starting from the given port
 * @param {number} startPort - Port to start checking from
 * @param {number} maxAttempts - Maximum number of ports to check
 * @returns {Promise<number>} - Available port
 */
async function findAvailablePort(startPort, maxAttempts = 10) {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    if (!(await isPortInUse(port))) {
      return port;
    }
    console.log(chalk.yellow(`Port ${port} is in use, trying another one...`));
  }
  throw new Error(`Could not find an available port after ${maxAttempts} attempts`);
}

/**
 * Check if a package is installed and install it if it's not
 * @param {string} packageName - Package name to check
 * @param {boolean} isDev - Whether to install as dev dependency
 * @param {string} [cwd=process.cwd()] - Working directory
 * @returns {boolean} - Whether the package was already installed
 */
function ensurePackageInstalled(packageName, isDev = false, cwd = process.cwd()) {
  try {
    require.resolve(packageName);
    console.log(chalk.green(`✓ ${packageName} is already installed`));
    return true;
  } catch (e) {
    console.log(chalk.yellow(`${packageName} not found, installing...`));
    try {
      // Detect if we're running on Windows
      const isWindows = process.platform === 'win32';

      // Determine the correct npm command for the current platform
      const npmCmd = isWindows ? 'npm.cmd' : 'npm';

      execSync(`${npmCmd} install ${isDev ? '--save-dev' : ''} ${packageName}`, {
        stdio: 'inherit',
        cwd,
      });
      console.log(chalk.green(`✓ ${packageName} installed successfully`));
      return false;
    } catch (err) {
      console.error(chalk.red(`Failed to install ${packageName}: ${err.message}`));
      process.exit(1);
    }
  }
}

/**
 * Ensure all required dependencies are installed
 * @param {Object} options - Options for dependency checking
 * @param {string} [options.rootDir=process.cwd()] - Root directory of the project
 * @param {string} [options.uiDir] - UI directory
 * @returns {Promise<void>}
 */
async function ensureDependencies(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  
  // Try different possible UI directory locations
  let uiDir = options.uiDir;
  if (!uiDir) {
    // First try the standard location
    uiDir = path.join(rootDir, 'ui');
    
    // If not found, try to find from the module location (npm install case)
    if (!fs.existsSync(uiDir)) {
      const moduleRoot = findModuleRoot();
      if (moduleRoot) {
        const npmUiDir = path.join(moduleRoot, 'ui');
        if (fs.existsSync(npmUiDir)) {
          uiDir = npmUiDir;
          console.log(chalk.green(`Found UI directory at: ${uiDir}`));
        }
      }
    }
  }

  console.log(chalk.blue('Checking required dependencies...'));

  // Make sure chalk is installed (it's used throughout the codebase)
  ensurePackageInstalled('chalk', false, rootDir);

  // Check for TypeScript dependencies
  ensurePackageInstalled('ts-node', false, rootDir);
  ensurePackageInstalled('tsconfig-paths', false, rootDir);

  // Only check UI dependencies if the UI directory exists
  if (fs.existsSync(uiDir)) {
    // Check if UI dependencies folder exists
    const uiNodeModulesPath = path.join(uiDir, 'node_modules');
    if (!fs.existsSync(uiNodeModulesPath)) {
      console.log(chalk.yellow('UI dependencies not found, installing...'));
      try {
        // Detect if we're running on Windows
        const isWindows = process.platform === 'win32';

        // Determine the correct npm command for the current platform
        const npmCmd = isWindows ? 'npm.cmd' : 'npm';

        execSync(`${npmCmd} install`, {
          stdio: 'inherit',
          cwd: uiDir,
        });
        console.log(chalk.green('✓ UI dependencies installed successfully'));
      } catch (err) {
        console.error(chalk.red(`Failed to install UI dependencies: ${err.message}`));
        process.exit(1);
      }
    } else {
      console.log(chalk.green('✓ UI dependencies are already installed'));
    }
  } else {
    console.log(chalk.yellow('UI directory not found, assuming executing in linked mode'));
  }
  
  return { uiDir };
}

/**
 * Try to kill processes using a specific port
 * @param {number} port - Port to free up
 */
function attemptToFreePort(port) {
  try {
    // Detect if we're running on Windows
    const isWindows = process.platform === 'win32';

    if (isWindows) {
      // For Windows
      execSync(`netstat -ano | findstr :${port}`, { shell: true });
    } else {
      // For Unix-like systems
      execSync(`lsof -i :${port} | grep LISTEN`, { shell: true });
    }
  } catch (err) {
    // If the command fails, it likely means no process is using that port
    console.log(chalk.yellow(`No process found using port ${port}`));
  }
}

/**
 * Start a process and handle its output
 * @param {string} command - Command to run
 * @param {string[]} args - Command arguments
 * @param {Object} options - Additional options
 * @param {function} onData - Optional callback for output data
 * @param {Array} childProcesses - Array to store processes for cleanup
 * @returns {ChildProcess} - The spawned child process
 */
function startProcess(command, args, options = {}, onData = null, childProcesses = []) {
  console.log(chalk.blue(`Starting: ${command} ${args.join(' ')}`));

  const env = {
    ...process.env,
    FORCE_COLOR: true, // Ensure colors in child process logs
    ...options.env,
  };

  const proc = spawn(command, args, {
    ...options,
    stdio: 'pipe',
    env,
    shell: true, // Use shell: true to support Windows commands
  });

  // Add to child processes array for cleanup
  if (Array.isArray(childProcesses)) {
    childProcesses.push(proc);
  }

  // Handle output
  proc.stdout.on('data', (data) => {
    process.stdout.write(data);
    if (onData) onData(data.toString());
  });

  proc.stderr.on('data', (data) => {
    process.stderr.write(data);
    if (onData) onData(data.toString(), true);
  });

  // Handle process exit
  proc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.log(chalk.red(`Process exited with code ${code}`));
    }
  });

  // Handle errors (especially for Windows)
  proc.on('error', (err) => {
    console.error(chalk.red(`Error starting process: ${err.message}`));
    if (err.code === 'ENOENT') {
      console.error(chalk.red(`Command not found: ${command}`));
      console.error(
        chalk.yellow(`Hint: On Windows, try using "${command}.cmd" instead of "${command}"`)
      );
    }
  });

  return proc;
}

/**
 * Start the UI (frontend) server
 * @param {Object} options - UI server options
 * @param {string} options.uiDir - UI directory path
 * @param {Array} options.childProcesses - Array to store processes
 * @returns {ChildProcess} - The UI server process
 */
function startUiServer(options = {}) {
  console.log(chalk.blue('Starting UI development server...'));

  // Detect if we're running on Windows
  const isWindows = process.platform === 'win32';

  // Determine the correct npm command for the current platform
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';

  return startProcess(
    npmCmd,
    ['run', 'dev'],
    {
      cwd: options.uiDir,
    },
    null,
    options.childProcesses
  );
}

/**
 * Start the API (backend) server
 * @param {Object} options - API server options
 * @param {number} options.port - Port to use
 * @param {string} options.rootDir - Root directory path
 * @param {Array} options.childProcesses - Array to store processes
 * @returns {Promise<void>} - Promise that resolves when the server is started
 */
async function startApiServer(options = {}) {
  console.log(chalk.blue(`Starting Lambda API server on port ${options.port}...`));

  try {
    // Try to require ui-server directly instead of running lambda-run ui
    let uiServer;
    try {
      // First try to find it relative to this file
      const moduleRoot = findModuleRoot();
      
      // Try lib directory first
      const libUiServerPath = path.join(moduleRoot, 'lib', 'ui-server.js');
      const srcUiServerPath = path.join(moduleRoot, 'src', 'ui-server.js');

      if (fs.existsSync(libUiServerPath)) {
        uiServer = require(libUiServerPath);
      } else if (fs.existsSync(srcUiServerPath)) {
        uiServer = require(srcUiServerPath);
      } else {
        // If not found, try using the provided rootDir
        const projectLibUiServerPath = path.join(options.rootDir, 'lib', 'ui-server.js');
        const projectSrcUiServerPath = path.join(options.rootDir, 'src', 'ui-server.js');

        if (fs.existsSync(projectLibUiServerPath)) {
          uiServer = require(projectLibUiServerPath);
        } else if (fs.existsSync(projectSrcUiServerPath)) {
          uiServer = require(projectSrcUiServerPath);
        } else {
          // As a last resort, try resolving it directly
          try {
            uiServer = require('lambda-running/lib/ui-server');
          } catch (err) {
            uiServer = require('lambda-running/src/ui-server');
          }
        }
      }
    } catch (e) {
      console.error(chalk.red(`Error loading UI server module: ${e.message}`));
      console.error(chalk.yellow('Falling back to command-line approach. This may cause issues.'));

      // Fallback to using the command-line but with a special flag to prevent recursion
      return startProcess(
        'node',
        [options.lambdaRunnerPath, 'ui-server', '--port', options.port.toString()],
        {
          cwd: options.rootDir,
          env: {
            SKIP_TS_CHECK: 'true',
            LAMBDA_UI_NO_RECURSION: 'true',
          },
        },
        null,
        options.childProcesses
      );
    }

    // Now start the UI server using the module directly
    await uiServer.start({
      port: options.port,
      open: false, // Don't open browser automatically
      cwd: options.rootDir,
    });

    console.log(chalk.green(`Lambda API server started on http://localhost:${options.port}`));

    // Return a mock process for consistency with the API
    const mockProcess = new EventEmitter();
    mockProcess.kill = () => {
      console.log(chalk.yellow('Shutting down API server...'));
      // Here we would shut down the server if it had an exposed method
    };

    // Add to child processes array for cleanup
    if (Array.isArray(options.childProcesses)) {
      options.childProcesses.push(mockProcess);
    }

    return mockProcess;
  } catch (error) {
    console.error(chalk.red(`Failed to start API server: ${error.message}`));
    throw error;
  }
}

/**
 * Main function to start the development environment
 * @param {Object} options - Options for starting the development environment
 * @param {string} [options.rootDir=process.cwd()] - Root directory of the project
 * @param {string} [options.lambdaRunnerPath] - Path to lambda-run.js
 * @param {boolean} [options.printBanner=true] - Whether to print the banner
 * @returns {Promise<Object>} - Object containing port information and child processes
 */
async function startLambdaEnv(options = {}) {
  // Set default options
  const rootDir = options.rootDir || process.cwd();

  // Print banner if enabled
  const printBanner = options.printBanner !== false;
  if (printBanner) {
    console.log(chalk.cyan('==================================================='));
    console.log(chalk.cyan('  Lambda Runner - UI Server Startup'));
    console.log(chalk.cyan('==================================================='));
  }

  // Ensure required dependencies are installed
  const { uiDir } = await ensureDependencies({ rootDir, uiDir: options.uiDir });

  // Determine the lambda-run.js path
  const lambdaRunnerPath = options.lambdaRunnerPath || path.join(__dirname, 'lambda-run.js');

  // Array to store child processes for cleanup
  const childProcesses = [];

  // Find an available port for the API server, starting from 3000
  let apiPort;
  try {
    apiPort = await findAvailablePort(3000);
    console.log(chalk.green(`Found available port for API: ${apiPort}`));
  } catch (err) {
    console.error(chalk.red(err.message));
    console.log(chalk.yellow('Attempting to continue with default port 3000...'));
    apiPort = 3000;

    // Try to help user free up the port
    console.log(chalk.yellow('Attempting to identify process using port 3000...'));
    attemptToFreePort(3000);
  }

  // Start API server - now with await since it's async
  try {
    await startApiServer({
      port: apiPort,
      rootDir,
      lambdaRunnerPath,
      childProcesses,
    });

    // Only start UI server if UI directory exists
    if (fs.existsSync(uiDir)) {
      startUiServer({
        uiDir,
        childProcesses,
      });

      console.log(chalk.green('\n✓ Development environment started successfully'));
      console.log(chalk.green('  UI Server: http://localhost:5173')); // Vite will select available port
      console.log(chalk.green(`  API Server: http://localhost:${apiPort}`));
    } else {
      console.log(chalk.green('\n✓ API server started successfully'));
      console.log(chalk.green(`  API Server: http://localhost:${apiPort}`));
      console.log(chalk.yellow('  UI Server not started (directory not found)'));
      console.log(chalk.yellow('  You can still access the API server directly'));
    }

    console.log(chalk.grey('\nPress Ctrl+C to stop all servers\n'));

    // Setup handler for process termination
    setupTerminationHandler(childProcesses);

    // Return information about the started environment
    return {
      apiPort,
      uiPort: fs.existsSync(uiDir) ? 5173 : null, // Only set if UI server started
      childProcesses,
    };
  } catch (error) {
    console.error(chalk.red(`Failed to start development environment: ${error.message}`));
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Setup handler for graceful termination of child processes
 * @param {Array} childProcesses - Array of child processes to terminate
 */
function setupTerminationHandler(childProcesses) {
  // Handle clean shutdown of child processes on exit
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\nShutting down development servers...'));

    childProcesses.forEach((proc) => {
      proc.kill('SIGINT');
    });

    setTimeout(() => {
      console.log(chalk.green('All servers stopped. Goodbye!'));
      process.exit(0);
    }, 500);
  });
}

/**
 * Find the root directory of the lambda-running module
 * This is useful when the module is linked and we need to find its actual location
 * @returns {string} - Path to the module root
 */
function findModuleRoot() {
  try {
    // First check if we're running from the module itself
    const pkgJsonPath = path.join(__dirname, '..', 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      const pkg = require(pkgJsonPath);
      if (pkg.name === 'lambda-running') {
        return path.join(__dirname, '..');
      }
    }

    // If not, try to find the module in node_modules
    const nodeModulesPath = path.join(process.cwd(), 'node_modules', 'lambda-running');
    if (fs.existsSync(nodeModulesPath)) {
      return nodeModulesPath;
    }

    // If still not found, check in global node_modules
    // This is a simplified approach and might not work in all environments
    const pathSep = process.platform === 'win32' ? ';' : ':';
    const nodePath = (process.env.NODE_PATH || '').split(pathSep);

    for (const dir of nodePath) {
      const possiblePath = path.join(dir, 'lambda-running');
      if (fs.existsSync(possiblePath)) {
        return possiblePath;
      }
    }

    // As a last resort, try to resolve the module
    try {
      const modulePath = require.resolve('lambda-running');
      return path.dirname(path.dirname(modulePath)); // Go up two directories from the resolved file
    } catch (e) {
      // Could not resolve
    }

    // If we can't find it, return the current directory as a fallback
    return __dirname;
  } catch (err) {
    console.warn(chalk.yellow(`Warning: Could not find module root: ${err.message}`));
    return __dirname;
  }
}

// If this file is being executed directly (not imported)
if (require.main === module) {
  // Run the main function
  startLambdaEnv().catch((err) => {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  });
}

// Export functions for use in other files
module.exports = {
  startLambdaEnv,
  startApiServer,
  startUiServer,
  findAvailablePort,
  ensureDependencies,
  findModuleRoot
};
