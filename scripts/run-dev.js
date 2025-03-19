/**
 * Development script to run both the UI server and Vite dev server
 * This allows hot-reloading of UI components while testing with the API server
 */

const { spawn } = require('child_process');
const path = require('path');
const { platform } = require('os');

// Function to handle process exit
function handleProcessExit(childProcesses) {
  // Kill all child processes when the main process exits
  process.on('exit', () => {
    console.log('Shutting down development servers...');
    childProcesses.forEach(proc => {
      if (!proc.killed) {
        proc.kill();
      }
    });
  });

  // Handle termination signals
  ['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, () => {
      console.log(`\nReceived ${signal}, shutting down...`);
      childProcesses.forEach(proc => {
        if (!proc.killed) {
          proc.kill();
        }
      });
      process.exit(0);
    });
  });
}

// Function to run vite in development mode
function startViteDev() {
  console.log('Starting Vite development server...');
  const isWindows = platform() === 'win32';
  const viteProcess = spawn(
    isWindows ? 'npm.cmd' : 'npm', 
    ['run', 'dev'], 
    { 
      cwd: path.join(__dirname, '../ui'),
      stdio: 'inherit',
      shell: true
    }
  );

  viteProcess.on('error', (error) => {
    console.error(`Failed to start Vite server: ${error.message}`);
  });

  return viteProcess;
}

// Function to run ui-server in development mode
function startUIServer() {
  console.log('Starting UI Server API...');
  
  // Add the UI server module
  const uiServer = require('../src/ui-server');

  // Start the UI server but don't open the browser (Vite will handle that)
  uiServer.start({
    open: false,
    developmentMode: true
  }).catch(error => {
    console.error(`Failed to start UI server: ${error.message}`);
    process.exit(1);
  });

  // Return a dummy process object for consistent handling
  return {
    killed: false,
    kill: () => {
      uiServer.stop().catch(console.error);
    }
  };
}

// Main function to start all development servers
function main() {
  console.log('Starting development environment...');
  
  // Start all processes
  const viteProcess = startViteDev();
  const uiServerProcess = startUIServer();
  
  // Setup process exit handlers
  const childProcesses = [viteProcess, uiServerProcess];
  handleProcessExit(childProcesses);
}

// Run the main function
main();
