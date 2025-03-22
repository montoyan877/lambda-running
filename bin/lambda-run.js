#!/usr/bin/env node

/**
 * Lambda Running CLI
 * Command line interface for running AWS Lambda functions locally with lambda-running library
 */

const chalk = require('chalk');
const { Command } = require('commander');
const inquirer = require('inquirer');
const Enquirer = require('enquirer');
const fs = require('fs');
const path = require('path');

// Load modules from src directory
// During babel compilation, '../src/*' paths will be transformed to '../*'
const { runHandler, scanForHandlers } = require('../src/lambda-runner');
const { saveEvent, getEvents, getEvent, deleteEvent } = require('../src/event-store');

// Import UI server module
let uiServer;
try {
  uiServer = require('../src/ui-server');
} catch (e) {
  // We'll check for existence more explicitly in the UI command
  // UI server is optional, so we'll gracefully handle missing dependency
}

const program = new Command();

// Set up the CLI
program.name('lambda-run').description('Test AWS Lambda functions locally').version('0.1.0');

// Run a handler with an event
program
  .command('run')
  .description('Run a Lambda handler with a specified event')
  .argument('<handler-path>', 'Path to handler file')
  .argument('<handler-method>', 'Method name in the handler file')
  .option('-e, --event <event-json>', 'JSON string or path to JSON file for the event')
  .option('-n, --event-name <name>', 'Name of saved event to use')
  .option('-c, --category <category>', 'Category of saved event to use')
  .option('-s, --save <name>', 'Save the event for future use with this name')
  .option('--no-env', 'Do not load environment variables from .env file')
  .action(async (handlerPath, handlerMethod, options) => {
    try {
      let eventData = {};

      // Load event data from various sources
      if (options.eventName) {
        const savedEvent = getEvent(options.eventName, options.category || 'default');
        if (savedEvent) {
          eventData = savedEvent.data;
          console.log(chalk.blue(`Using saved event: ${options.eventName}`));
        } else {
          console.error(chalk.red(`Event '${options.eventName}' not found`));
          process.exit(1);
        }
      } else if (options.event) {
        // Check if the event parameter is a path to a file
        if (fs.existsSync(options.event)) {
          try {
            const eventContent = fs.readFileSync(options.event, 'utf8');
            eventData = JSON.parse(eventContent);
            console.log(chalk.blue(`Loaded event from file: ${options.event}`));
          } catch (error) {
            console.error(chalk.red(`Error loading event file: ${error.message}`));
            process.exit(1);
          }
        } else {
          // Try to parse as JSON string
          try {
            eventData = JSON.parse(options.event);
          } catch (error) {
            console.error(chalk.red(`Invalid event JSON: ${error.message}`));
            process.exit(1);
          }
        }
      }

      // Save the event if requested
      if (options.save && Object.keys(eventData).length > 0) {
        saveEvent(options.save, eventData, options.category || 'default');
        console.log(chalk.green(`Event saved as: ${options.save}`));
      }

      console.log(chalk.yellow('Running Lambda handler...'));

      // Run the handler with options
      const handlerOptions = {
        loadEnv: options.env !== false,
      };

      if (handlerOptions.loadEnv) {
        console.log(chalk.blue('Loading environment variables from .env file if present'));
      }

      const startTime = Date.now();
      const result = await runHandler(handlerPath, handlerMethod, eventData, {}, handlerOptions);
      const duration = Date.now() - startTime;

      console.log(chalk.green(`\nExecution completed in ${duration}ms`));
      console.log(chalk.cyan('--- Result ---'));
      console.log(JSON.stringify(result, null, 2));
      console.log('\n');
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      console.error(error.stack);
      process.exit(1);
    }
  });

// Scan a directory for handlers
program
  .command('scan')
  .description('Scan a directory for potential Lambda handlers')
  .argument('[directory]', 'Directory to scan', process.cwd())
  .option(
    '-e, --extensions <extensions>',
    'Comma-separated list of file extensions to include',
    '.js,.ts'
  )
  .option('--include-node-modules', 'Include node_modules directory in scan (not recommended)')
  .option('--no-ignore-file', 'Ignore the .lambdarunignore file')
  .action((directory, options) => {
    try {
      const extensions = options.extensions.split(',');

      // Configure scanning options
      const scanOptions = {
        ignoreNodeModules: !options.includeNodeModules,
        useIgnoreFile: options.ignoreFile !== false,
      };

      if (scanOptions.useIgnoreFile) {
        console.log(chalk.blue('Using .lambdarunignore file if present'));
      }

      if (!scanOptions.ignoreNodeModules) {
        console.log(
          chalk.yellow('Warning: Including node_modules may slow down scanning significantly')
        );
      }

      const handlers = scanForHandlers(directory, extensions, scanOptions);

      if (handlers.length === 0) {
        console.log(chalk.yellow('No potential handlers found'));
        return;
      }

      console.log(chalk.green(`Found ${handlers.length} potential handlers:`));
      handlers.forEach((handler, index) => {
        console.log(chalk.cyan(`\n${index + 1}. ${path.relative(process.cwd(), handler.path)}`));
        console.log(chalk.white('   Methods:'));
        handler.methods.forEach((method) => {
          console.log(chalk.white(`   - ${method}`));
        });
      });
    } catch (error) {
      console.error(chalk.red(`Error scanning for handlers: ${error.message}`));
      process.exit(1);
    }
  });

// List saved events
program
  .command('events')
  .description('List saved events')
  .option('-c, --category <category>', 'Filter events by category')
  .action((options) => {
    try {
      const events = getEvents(options.category || null);

      if (events.length === 0) {
        console.log(chalk.yellow('No saved events found'));
        return;
      }

      console.log(chalk.green(`Found ${events.length} saved events:`));
      events.forEach((event, index) => {
        console.log(chalk.cyan(`\n${index + 1}. ${event.name} (${event.category})`));
        console.log(chalk.white(`   Created: ${new Date(event.timestamp).toLocaleString()}`));
        // Show a summary of the event data to be more informative
        const dataStr = JSON.stringify(event.data);
        const summary = dataStr.length > 100 ? dataStr.substring(0, 100) + '...' : dataStr;
        console.log(chalk.dim(`   Data: ${summary}`));
      });
    } catch (error) {
      console.error(chalk.red(`Error listing events: ${error.message}`));
      process.exit(1);
    }
  });

// Delete a saved event
program
  .command('delete-event')
  .description('Delete a saved event')
  .argument('<name>', 'Name of the event to delete')
  .option('-c, --category <category>', 'Category of the event', 'default')
  .action((name, options) => {
    try {
      const success = deleteEvent(name, options.category);

      if (success) {
        console.log(chalk.green(`Event '${name}' deleted successfully`));
      } else {
        console.log(chalk.yellow(`Event '${name}' not found`));
      }
    } catch (error) {
      console.error(chalk.red(`Error deleting event: ${error.message}`));
      process.exit(1);
    }
  });

// Interactive mode
program
  .command('interactive')
  .alias('i')
  .description('Launch interactive mode')
  .action(async () => {
    try {
      await runInteractiveMode();
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      console.error(error.stack);
      process.exit(1);
    }
  });

// UI server only mode (internal command to prevent recursion)
program
  .command('ui-server')
  .description('Launch only the API server for the UI (internal command)')
  .option('-p, --port <port>', 'Port to run the UI server on', '3000')
  .option('--no-open', 'Do not automatically open browser')
  .action(async (options) => {
    try {
      // Check if we're already in a recursive call
      if (process.env.LAMBDA_UI_NO_RECURSION !== 'true') {
        console.error(
          chalk.red('This command should not be called directly. Use "lambda-run ui" instead.')
        );
        process.exit(1);
      }

      // Try to require ui-server if not already loaded
      if (!uiServer) {
        try {
          uiServer = require('../src/ui-server');
        } catch (e) {
          // Check if ui-server.js file exists
          const uiServerPath = path.join(__dirname, '../src/ui-server.js');
          
          if (!fs.existsSync(uiServerPath)) {
            console.error(
              chalk.red('UI server module not found. The file ui-server.js is missing.')
            );
            process.exit(1);
          }

          // If file exists but still fails, it might be missing dependencies
          console.error(chalk.red('UI dependencies not found. Run "npm install" to install them.'));
          process.exit(1);
        }
      }

      console.log(chalk.blue('Starting Lambda Running UI server...'));

      // Start UI server directly
      await uiServer.start({
        port: parseInt(options.port, 10),
        open: options.open !== false,
        cwd: process.cwd(),
      });

      console.log(
        chalk.green(`Lambda Running UI server started on http://localhost:${options.port}`)
      );

      // Keep the process running
      process.stdin.resume();

      // Handle Ctrl+C
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\nShutting down UI server...'));
        process.exit(0);
      });
    } catch (error) {
      console.error(chalk.red(`Error starting UI server: ${error.message}`));
      console.error(error.stack);
      process.exit(1);
    }
  });

// Init command - generate configuration files
program
  .command('init')
  .description('Create initial configuration files (lambda-running.json and .lambdarunignore)')
  .option('--force', 'Overwrite existing files if they exist')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Initializing Lambda Running configuration...'));
      
      const outputDir = process.cwd();
      const force = options.force || false;
      let filesCreated = 0;
      
      // Generate lambda-running.json
      const configPath = path.join(outputDir, 'lambda-running.json');
      if (fs.existsSync(configPath) && !force) {
        console.log(chalk.yellow(`Config file already exists at ${configPath}. Use --force to overwrite.`));
      } else {
        // Create a readable configuration
        const config = {
          layers: [],
          layerMappings: {},
          envFiles: ['.env'],
          ignorePatterns: [
            '**/*.test.js',
            '**/*.spec.js',
            '**/__tests__/**'
          ],
          ignoreLayerFilesOnScan: true,
          debug: false
        };
        
        // Write the file with nice formatting
        fs.writeFileSync(
          configPath, 
          JSON.stringify(config, null, 2)
        );
        
        console.log(chalk.green(`Created configuration file at ${configPath}`));
        filesCreated++;
      }
      
      // Generate .lambdarunignore
      const ignorePath = path.join(outputDir, '.lambdarunignore');
      if (fs.existsSync(ignorePath) && !force) {
        console.log(chalk.yellow(`Ignore file already exists at ${ignorePath}. Use --force to overwrite.`));
      } else {
        // Default ignore patterns
        const ignorePatterns = [
          '# Lambda Running ignore file',
          '# Files and directories matching these patterns will be ignored when scanning for handlers',
          '',
          '# Dependencies',
          'node_modules/',
          'package-lock.json',
          'yarn.lock',
          'cdk.out',
          '',
          '# Tests',
          'test/',
          'tests/',
          '**/*.test.js',
          '**/*.spec.js',
          '**/__tests__/',
          '**/__mocks__/',
          '',
          '# Build files',
          'dist/',
          'build/',
          'coverage/',
          '',
          '# Config files',
          '*.config.js',
          '.eslintrc*',
          '.prettier*',
          '',
          '# Documentation',
          'docs/',
          'README.md',
          'LICENSE',
          '',
          '# Version control',
          '.git/',
          '.github/',
          '.gitignore',
          '',
          '# IDE files',
          '.vscode/',
          '.idea/',
          '*.sublime-*',
          ''
        ].join('\n');
        
        // Write the file
        fs.writeFileSync(ignorePath, ignorePatterns);
        
        console.log(chalk.green(`Created ignore file at ${ignorePath}`));
        filesCreated++;
      }
      
      if (filesCreated > 0) {
        console.log(chalk.green('Initialization complete. You may need to customize the files for your project.'));
      } else {
        console.log(chalk.yellow('No files were created. Use --force to overwrite existing files.'));
      }
    } catch (error) {
      console.error(chalk.red(`Error initializing configuration: ${error.message}`));
      console.error(error.stack);
      process.exit(1);
    }
  });

// UI mode
program
  .command('ui')
  .description('Launch interactive web UI for testing Lambda functions')
  .option('-p, --port <port>', 'Port to run the UI server on', '3000')
  .option('--no-open', 'Do not automatically open browser')
  .action(async (options) => {
    try {
      // Try to require ui-start.js
      try {
        require('../lib/bin/ui-start');
      } catch (e) {
        // If it fails, try directly using the UI server
        try {
          uiServer = require('../src/ui-server');
        } catch (e) {
          console.error(
            chalk.red('UI server module not found. The file ui-server.js is missing.')
          );
          process.exit(1);
        }

        console.log(chalk.blue('Starting Lambda Running UI server...'));

        // Start UI server directly with API only (not development mode)
        await uiServer.start({
          port: parseInt(options.port, 10),
          open: options.open !== false,
          cwd: process.cwd(),
          developmentMode: false,
        });

        console.log(
          chalk.green(`Lambda Running UI server started on http://localhost:${options.port}`)
        );
      }
    } catch (error) {
      console.error(chalk.red(`Error starting UI server: ${error.message}`));
      console.error(error.stack);
      process.exit(1);
    }
  });

// Helper function for input in the most basic way possible
function readInput(prompt, defaultValue = '') {
  return new Promise((resolve) => {
    process.stdout.write(`${prompt}${defaultValue ? ' (' + defaultValue + ')' : ''}: `);

    // Handle input
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (chunk) => {
      // Stop listening after the first chunk
      process.stdin.pause();
      process.stdin.removeAllListeners('data');

      // Clean the chunk (remove line breaks and spaces)
      const input = chunk.toString().trim();

      // Resolve with the entered value or the default value
      resolve(input || defaultValue);
    });
  });
}

// New function for interactive mode that allows execution in a loop
async function runInteractiveMode() {
  let continueRunning = true;

  while (continueRunning) {
    try {
      // Preload: scan handlers and prepare everything BEFORE the interactive interface
      console.log(chalk.blue('Scanning for handlers...'));

      // Configure scanning options
      const scanOptions = {
        ignoreNodeModules: true,
        useIgnoreFile: true,
      };

      console.log(chalk.green('Using .lambdarunignore file if present'));

      // Scan handlers - this will trigger AWS SDK warnings
      const handlers = scanForHandlers(process.cwd(), ['.js', '.ts'], scanOptions);

      if (handlers.length === 0) {
        console.log(chalk.yellow('No potential handlers found in the current directory'));
        return;
      }

      // Prepare handler options
      const handlerChoices = handlers.flatMap((handler) =>
        handler.methods.map((method) => ({
          name: `${path.relative(process.cwd(), handler.path)} -> ${method}`,
          path: handler.path,
          method,
        }))
      );

      // Allow all warnings to be displayed
      await new Promise((resolve) => setTimeout(resolve, 100));

      // -----------------------------------------------------------------
      // Completely clear the console before displaying the interface
      // -----------------------------------------------------------------
      console.clear();

      // Display clean title for selection
      console.log(chalk.blue('\nSelect a handler (use arrow keys):\n'));

      // Use enquirer with proper response handling
      const response = await Enquirer.prompt({
        type: 'select',
        name: 'selectedHandler',
        message: '',
        choices: handlerChoices.map((handler) => ({
          name: handler.name,
          value: handler.name,
        })),
      });

      // Extract the selected handler
      const selectedString = response.selectedHandler;
      const selectedHandler = handlerChoices.find((h) => h.name === selectedString);

      if (!selectedHandler) {
        throw new Error(`Could not find handler matching: ${selectedString}`);
      }

      // Use the selected handler
      const handler = selectedHandler;

      // Load saved events
      const savedEvents = getEvents();

      // Display the selected handler for clarity
      console.log(
        chalk.cyan(
          `\nSelected handler: ${path.relative(process.cwd(), handler.path)} -> ${handler.method}`
        )
      );

      // Ask for event input method - continue using inquirer for the rest
      const { eventSource } = await inquirer.prompt([
        {
          type: 'list',
          name: 'eventSource',
          message: 'How would you like to provide the event?',
          choices: [
            { name: 'Load from file', value: 'file' },
            ...(savedEvents.length > 0 ? [{ name: 'Use saved event', value: 'saved' }] : []),
            { name: 'Empty event ({})', value: 'empty' },
            { name: 'Enter JSON manually', value: 'manual' },
          ],
          pageSize: 10, // Maximum number of options to show at once
          loop: false, // Prevent cursor from returning to beginning when reaching the end
          prefix: chalk.cyan('➤ '),
          suffix: ' ', // Additional space
        },
      ]);

      let eventData = {};
      let isNewEvent = false; // Indicator to know if it's a new event that could be saved

      // Handle event source selection
      if (eventSource === 'manual') {
        // Open the editor directly without using additional inquirer.prompt
        const editor = require('external-editor');
        let manualEvent = editor.edit('{\n  \n}');

        try {
          eventData = JSON.parse(manualEvent);
          isNewEvent = true; // It's a manually created event, could be saved
        } catch (error) {
          console.error(chalk.red(`Invalid JSON: ${error.message}`));
          continue;
        }
      } else if (eventSource === 'file') {
        const { eventFile } = await inquirer.prompt([
          {
            type: 'input',
            name: 'eventFile',
            message: 'Enter the path to the event file:',
            prefix: chalk.cyan('➤ '),
            suffix: ' ',
          },
        ]);

        try {
          const eventContent = fs.readFileSync(eventFile, 'utf8');
          eventData = JSON.parse(eventContent);
          // We don't mark isNewEvent as true since it comes from a file
        } catch (error) {
          console.error(chalk.red(`Error loading event file: ${error.message}`));
          continue;
        }
      } else if (eventSource === 'saved') {
        const { selectedEvent } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedEvent',
            message: 'Select a saved event:',
            choices: savedEvents.map((event) => ({
              name: `${event.name} (${event.category})`,
              value: event,
            })),
            pageSize: 10,
            loop: false,
            prefix: chalk.cyan('➤ '),
            suffix: ' ',
          },
        ]);

        eventData = selectedEvent.data;
        // We don't mark isNewEvent as true since it comes from a saved event
      } else if (eventSource === 'empty') {
        // For empty events, we don't ask if they want to save it
        eventData = {};
      }

      // Only ask if you want to save the event if it's new (manual) and has content
      if (isNewEvent && Object.keys(eventData).length > 0) {
        console.log(chalk.dim('─────────────────────────────────────'));
        const { shouldSave } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'shouldSave',
            message: 'Do you want to save this event for future use?',
            default: false,
            prefix: chalk.cyan('➤ '),
            suffix: ' ',
          },
        ]);

        if (shouldSave) {
          // Use the direct approach to get the event name
          const eventName = await readInput('Enter a name for this event', 'my-event');
          // Show what was entered in cyan color
          console.log(chalk.cyan(`Event name: ${eventName}`));

          // Use the same direct approach for the category
          const eventCategory = await readInput('Enter a category (optional)', 'default');
          console.log(chalk.cyan(`Event category: ${eventCategory}`));

          // Save the event with the collected data
          saveEvent(eventName, eventData, eventCategory);
          console.log(chalk.green(`Event saved as: ${eventName} in category: ${eventCategory}`));
        }
      }

      // Run the handler
      console.log(chalk.yellow('\nRunning Lambda handler...'));

      try {
        // Handler options
        const handlerOptions = {
          loadEnv: true, // In interactive mode, always load environment variables
        };

        console.log(chalk.blue('Loading environment variables from .env file if present'));

        const startTime = Date.now();
        const result = await runHandler(
          handler.path,
          handler.method,
          eventData,
          {},
          handlerOptions
        );
        const duration = Date.now() - startTime;

        console.log(chalk.green(`\nExecution completed in ${duration}ms`));
        console.log(chalk.cyan('--- Result ---'));
        console.log(JSON.stringify(result, null, 2));
        console.log('\n');
      } catch (error) {
        console.error(chalk.red(`Error running Lambda handler: ${error.message}`));
        if (error.stack) {
          console.error(error.stack);
        }
        console.log('\n');
      }

      // Ask if the user wants to test another handler
      const { runAnother } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'runAnother',
          message: 'Would you like to test another handler?',
          default: true,
          prefix: chalk.cyan('➤ '),
          suffix: ' ',
        },
      ]);

      continueRunning = runAnother;

      if (continueRunning) {
        console.log(chalk.blue('\n----------------------------------------'));
        console.log(chalk.blue('Starting new test session'));
        console.log(chalk.blue('----------------------------------------\n'));
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      console.error(error.stack);
      process.exit(1);
    }
  }

  console.log(chalk.green('\nThanks for using Lambda Running!'));
}

// Parse command line arguments
program.parse(process.argv);

// If no command is specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
