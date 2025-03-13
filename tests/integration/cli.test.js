/**
 * Integration tests for CLI
 */
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the CLI script
const CLI_PATH = path.resolve(__dirname, '../../bin/lambda-run.js');

// Helper function to run CLI commands
function runCommand(args = []) {
  return new Promise((resolve, reject) => {
    exec(`node ${CLI_PATH} ${args.join(' ')}`, (error, stdout, stderr) => {
      if (error && !stderr.includes('No potential handlers found')) {
        reject(error);
      }
      resolve({ stdout, stderr });
    });
  });
}

// Only run these tests if not in CI environment (they require actual file access)
const runTests = process.env.CI !== 'true';

// Skip or run the tests based on the environment
(runTests ? describe : describe.skip)('CLI Integration', () => {
  // Create a temporary test handler
  const testHandlerPath = path.join(__dirname, 'test-handler.js');

  beforeAll(() => {
    // Create a simple test handler file
    const handlerContent = `
      exports.handler = async (event) => {
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Test successful', event })
        };
      };
    `;
    fs.writeFileSync(testHandlerPath, handlerContent);
  });

  afterAll(() => {
    // Clean up test handler file
    if (fs.existsSync(testHandlerPath)) {
      fs.unlinkSync(testHandlerPath);
    }
  });

  test('should display help information', async () => {
    const { stdout } = await runCommand(['--help']);

    // Verify help output contains expected sections
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('Options:');
    expect(stdout).toContain('Commands:');
  });

  test('should scan for handlers', async () => {
    const { stdout } = await runCommand(['scan', path.dirname(testHandlerPath)]);

    // Verify handler scanning output
    expect(stdout).toContain('handler.js');
    expect(stdout).toContain('Methods:');
    expect(stdout).toContain('handler');
  });

  test('should run a handler with an empty event', async () => {
    const { stdout } = await runCommand(['run', testHandlerPath, 'handler', '--event', '{}']);

    // Verify handler execution output
    expect(stdout).toContain('Running Lambda handler');
    expect(stdout).toContain('Execution completed');
    expect(stdout).toContain('Test successful');
  });
});
