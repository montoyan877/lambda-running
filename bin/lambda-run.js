#!/usr/bin/env node

/**
 * Lambda Running CLI
 * Command line interface for running AWS Lambda functions locally with lambda-running library
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { Command } = require('commander');
const inquirer = require('inquirer');
const readline = require('readline');

const { runHandler, scanForHandlers } = require('../src/lambda-runner');
const { saveEvent, getEvents, getEvent, deleteEvent } = require('../src/event-store');

const program = new Command();

// Set up the CLI
program
  .name('lambda-run')
  .description('Test AWS Lambda functions locally')
  .version('0.1.0');

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
      
      // Run the handler
      const startTime = Date.now();
      const result = await runHandler(handlerPath, handlerMethod, eventData);
      const duration = Date.now() - startTime;
      
      console.log(chalk.green(`\nExecution completed in ${duration}ms`));
      console.log(chalk.cyan('--- Result ---'));
      console.log(JSON.stringify(result, null, 2));
      console.log('\n')
      
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
  .option('-e, --extensions <extensions>', 'Comma-separated list of file extensions to include', '.js,.ts')
  .action((directory, options) => {
    try {
      const extensions = options.extensions.split(',');
      const handlers = scanForHandlers(directory, extensions);
      
      if (handlers.length === 0) {
        console.log(chalk.yellow('No potential handlers found'));
        return;
      }
      
      console.log(chalk.green(`Found ${handlers.length} potential handlers:`));
      handlers.forEach((handler, index) => {
        console.log(chalk.cyan(`\n${index + 1}. ${path.relative(process.cwd(), handler.path)}`));
        console.log(chalk.white('   Methods:'));
        handler.methods.forEach(method => {
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

// Helper function for input in the most basic way possible
function readInput(prompt, defaultValue = '') {
  return new Promise((resolve) => {
    process.stdout.write(`${prompt}${defaultValue ? ' (' + defaultValue + ')' : ''}: `);
    
    // Array to store chunks
    const inputChunks = [];
    
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
    // Scan for handlers
    console.log(chalk.blue('Scanning for handlers...'));
    const handlers = scanForHandlers(process.cwd());
    
    if (handlers.length === 0) {
      console.log(chalk.yellow('No potential handlers found in the current directory'));
      return;
    }
    
    // Prepare handler choices
    const handlerChoices = handlers.flatMap(handler => 
      handler.methods.map(method => ({
        name: `${path.relative(process.cwd(), handler.path)} -> ${method}`,
        value: { path: handler.path, method }
      }))
    );
    
    // Ask user to select a handler
    const { selectedHandler } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedHandler',
        message: 'Select a handler to run:',
        choices: handlerChoices
      }
    ]);
    
    // Load saved events
    const savedEvents = getEvents();
    
    // Ask for event input method
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
        ]
      }
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
          message: 'Enter the path to the event file:'
        }
      ]);
      
      try {
        const eventContent = fs.readFileSync(eventFile, 'utf8');
        eventData = JSON.parse(eventContent);
        // No marcamos isNewEvent como true ya que viene de un archivo
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
          choices: savedEvents.map(event => ({
            name: `${event.name} (${event.category})`,
            value: event
          }))
        }
      ]);
      
      eventData = selectedEvent.data;
      // No marcamos isNewEvent como true ya que viene de un evento guardado
    } else if (eventSource === 'empty') {
      // Para eventos vacíos, no preguntamos si quiere guardarlo
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
          default: false
        }
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
      const startTime = Date.now();
      const result = await runHandler(selectedHandler.path, selectedHandler.method, eventData);
      const duration = Date.now() - startTime;
      
      console.log(chalk.green(`\nExecution completed in ${duration}ms`));
      console.log(chalk.cyan('--- Result ---'));
      console.log(JSON.stringify(result, null, 2));
      console.log('\n')
    } catch (error) {
      console.error(chalk.red(`Error running Lambda handler: ${error.message}`));
      if (error.stack) {
        console.error(error.stack);
      }
      console.log('\n');
    }
    
    // Preguntar si quiere probar otro handler
    const { runAnother } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'runAnother',
        message: 'Would you like to test another handler?',
        default: true
      }
    ]);
    
    continueRunning = runAnother;
    
    if (continueRunning) {
      console.log(chalk.blue('\n----------------------------------------'));
      console.log(chalk.blue('Starting new test session'));
      console.log(chalk.blue('----------------------------------------\n'));
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