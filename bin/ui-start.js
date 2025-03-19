#!/usr/bin/env node

/**
 * Lambda Running UI Starter
 * Stand-alone script to start the UI server
 */

const path = require('path');
const fs = require('fs');

// Resolve the module's root path
const moduleRoot = path.resolve(__dirname, '..');

// Path to the compiled UI dist folder
const uiDistPath = path.join(moduleRoot, 'lib', 'ui-dist');

// Load the UI server module
let uiServer;
try {
  uiServer = require('../src/ui-server');
} catch (error) {
  console.error(`Error loading UI server: ${error.message}`);
  process.exit(1);
}

// Start the UI server in production mode
async function startUI() {
  try {
    const port = process.env.PORT || 3000;

    await uiServer.start({
      port,
      open: true,
      developmentMode: false,
      moduleRoot: moduleRoot
    });

    // Keep the process running for SIGINT handling
    process.stdin.resume();

    process.on('SIGINT', async () => {
      console.log('\nShutting down UI server...');
      await uiServer.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error(`Error starting UI server: ${error.message}`);
    process.exit(1);
  }
}

startUI();
