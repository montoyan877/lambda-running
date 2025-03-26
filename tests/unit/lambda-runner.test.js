/**
 * Tests for lambda-runner.js
 */

// Mock fs and path for testing
jest.mock('fs');
jest.mock('path');

// Mock console to prevent noise during tests
global.console = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

describe('Lambda Runner', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
  });

  describe('scanForHandlers', () => {
    beforeEach(() => {
      jest.resetModules();

      // Mock fs functions
      jest.mock('fs', () => ({
        existsSync: jest.fn().mockReturnValue(true),
        readdirSync: jest.fn().mockImplementation((dir) => {
          if (dir === '/test-dir') {
            return ['handler.js', 'not-a-handler.js', 'subdir'];
          }
          if (dir === '/test-dir/subdir') {
            return ['sub-handler.js', 'node_modules'];
          }
          return [];
        }),
        statSync: jest.fn().mockImplementation((path) => ({
          isDirectory: () => path.endsWith('subdir') || path.endsWith('node_modules'),
        })),
        readFileSync: jest.fn().mockImplementation((path) => {
          // Return different content based on the file
          if (path.includes('handler.js')) {
            return 'exports.handler = () => {}';
          }
          if (path.includes('sub-handler.js')) {
            return 'export const handler = async () => {};';
          }
          if (path.includes('not-a-handler.js')) {
            return 'function notAHandler() { console.log("Not a handler"); }';
          }
          if (path.includes('.lambdarunignore')) {
            return 'not-a-handler.js'; // Only ignore not-a-handler.js for the first test
          }
          return '';
        }),
      }));

      // Mock path functions
      jest.mock('path', () => ({
        isAbsolute: jest.fn().mockReturnValue(true),
        dirname: jest.fn().mockReturnValue('/'),
        resolve: jest.fn().mockReturnValue('/test-dir'),
        join: jest.fn().mockImplementation((...args) => args.join('/')),
        extname: jest.fn().mockImplementation((file) => {
          if (file.includes('.js')) return '.js';
          if (file.includes('.ts')) return '.ts';
          return '';
        }),
        basename: jest.fn().mockImplementation((path) => path.split('/').pop()),
      }));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should scan a directory and find handler files', () => {
      const lambdaRunner = require('../../src/lambda-runner');

      const handlers = lambdaRunner.scanForHandlers('/test-dir');

      // Should find two handlers
      expect(handlers).toHaveLength(2);

      // Check the handlers (order doesn't matter)
      const handlerPaths = handlers.map(h => h.path).sort();
      expect(handlerPaths).toEqual([
        '/test-dir/handler.js',
        '/test-dir/subdir/sub-handler.js'
      ].sort());

      // Verify each handler has the correct methods
      handlers.forEach(handler => {
        expect(handler.methods).toEqual(['handler']);
      });
    });

    it('should respect ignore patterns', () => {
      // Update the mock readFileSync to return a different ignore pattern for this test
      jest.resetModules();
      
      // Mock fs functions with different ignore file content
      jest.mock('fs', () => ({
        existsSync: jest.fn().mockReturnValue(true),
        readdirSync: jest.fn().mockImplementation((dir) => {
          if (dir === '/test-dir') {
            return ['handler.js', 'not-a-handler.js', 'subdir'];
          }
          if (dir === '/test-dir/subdir') {
            return ['sub-handler.js', 'node_modules'];
          }
          return [];
        }),
        statSync: jest.fn().mockImplementation((path) => ({
          isDirectory: () => path.endsWith('subdir') || path.endsWith('node_modules'),
        })),
        readFileSync: jest.fn().mockImplementation((path) => {
          // Return different content based on the file
          if (path.includes('handler.js')) {
            return 'exports.handler = () => {}';
          }
          if (path.includes('sub-handler.js')) {
            return 'export const handler = async () => {};';
          }
          if (path.includes('not-a-handler.js')) {
            return 'function notAHandler() { console.log("Not a handler"); }';
          }
          if (path.includes('.lambdarunignore')) {
            return 'not-a-handler.js\nsubdir/**'; // Ignore both not-a-handler.js and subdir for the second test
          }
          return '';
        }),
      }));

      const lambdaRunner = require('../../src/lambda-runner');

      const handlers = lambdaRunner.scanForHandlers('/test-dir', ['.js'], { useIgnoreFile: true });

      // Should only find one handler (the one in the root directory)
      expect(handlers).toHaveLength(1);

      // Check the handler
      expect(handlers[0]).toEqual({
        path: '/test-dir/handler.js',
        methods: ['handler'],
      });
    });

    it('should detect different handler export patterns', () => {
      // Mock fs with different handler patterns
      jest.mock('fs', () => ({
        existsSync: jest.fn().mockReturnValue(true),
        readdirSync: jest.fn().mockReturnValue(['handler1.js', 'handler2.js', 'handler3.js']),
        statSync: jest.fn().mockReturnValue({ isDirectory: () => false }),
        readFileSync: jest.fn().mockImplementation((path) => {
          if (path.includes('handler1.js')) {
            return 'exports.handler = () => {}';
          }
          if (path.includes('handler2.js')) {
            return 'export const handler = () => {}';
          }
          if (path.includes('handler3.js')) {
            return 'export default { handler: () => {} }';
          }
          if (path.includes('.lambdarunignore')) {
            return '';
          }
          return '';
        }),
      }));

      const lambdaRunner = require('../../src/lambda-runner');
      const handlers = lambdaRunner.scanForHandlers('/test-dir');

      // Should find all three handlers
      expect(handlers).toHaveLength(3);
      expect(handlers.map(h => h.path).sort()).toEqual([
        '/test-dir/handler1.js',
        '/test-dir/handler2.js',
        '/test-dir/handler3.js'
      ].sort());
    });
  });

  describe('runHandler', () => {
    // Set up the mock paths and handlers before tests run
    const handlerPath = '/test-handler.js';
    const handlerMethod = 'handler';
    const mockEvent = { test: 'event' };
    const expectedResult = { success: true };
    let mockHandler;
    let fs;
    let path;

    beforeEach(() => {
      jest.resetModules();

      // Setup module mocks before requiring lambda-runner
      jest.mock('fs', () => ({
        existsSync: jest.fn().mockReturnValue(true),
        readdirSync: jest.fn().mockReturnValue([]),
        readFileSync: jest.fn().mockReturnValue('exports.handler = () => {}'),
      }));

      jest.mock('path', () => ({
        isAbsolute: jest.fn().mockReturnValue(true),
        dirname: jest.fn().mockReturnValue('/'),
        resolve: jest.fn((...args) => args[args.length - 1]),
        join: jest.fn((...args) => args.join('/')),
        extname: jest.fn(),
        basename: jest.fn().mockReturnValue('test-handler.js'),
      }));

      // Cache the modules for easy access in tests
      fs = require('fs');
      path = require('path');

      // Create mock handler
      mockHandler = jest.fn().mockResolvedValue(expectedResult);

      // Setup mock for require
      const mockRequireResult = { [handlerMethod]: mockHandler };

      // Mock the require function
      jest.mock(handlerPath, () => mockRequireResult, { virtual: true });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should run a handler function with the provided event', async () => {
      // Import lambda-runner after all mocks are set up
      const lambdaRunner = require('../../src/lambda-runner');

      // Run the handler
      const result = await lambdaRunner.runHandler(handlerPath, handlerMethod, mockEvent);

      // Assert path.isAbsolute was called with handlerPath
      expect(path.isAbsolute).toHaveBeenCalledWith(handlerPath);

      // Assert fs.existsSync was called
      expect(fs.existsSync).toHaveBeenCalled();

      // Assert the handler was called with the event
      expect(mockHandler).toHaveBeenCalledWith(mockEvent, expect.any(Object));

      // Assert the result matches the expected result
      expect(result).toEqual(expectedResult);
    });

    it('should throw an error if the handler file does not exist', async () => {
      // Clean require cache and configure new mocks for this test
      jest.resetModules();

      // Setup fs.existsSync to always return false
      jest.mock('fs', () => ({
        existsSync: jest.fn().mockReturnValue(false),
        readdirSync: jest.fn().mockReturnValue([]),
        readFileSync: jest.fn().mockReturnValue(''),
      }));

      // Mock path.isAbsolute to return true
      jest.mock('path', () => ({
        isAbsolute: jest.fn().mockReturnValue(true),
        dirname: jest.fn().mockReturnValue('/'),
        resolve: jest.fn().mockReturnValue('/test-handler.js'),
        join: jest.fn((...args) => args.join('/')),
        extname: jest.fn(),
        basename: jest.fn().mockReturnValue('test-handler.js'),
      }));

      // Import the module under test
      const lambdaRunner = require('../../src/lambda-runner');

      await expect(
        lambdaRunner.runHandler('/test-handler.js', handlerMethod, mockEvent)
      ).rejects.toThrow('Handler file not found');
    });

    it('should throw an error if the handler method does not exist', async () => {
      // Clean require cache and configure new mocks
      jest.resetModules();

      // Mock fs.existsSync to return true
      jest.mock('fs', () => ({
        existsSync: jest.fn().mockReturnValue(true),
        readdirSync: jest.fn().mockReturnValue([]),
        readFileSync: jest.fn().mockReturnValue(''),
      }));

      // Mock path functions
      jest.mock('path', () => ({
        isAbsolute: jest.fn().mockReturnValue(true),
        dirname: jest.fn().mockReturnValue('/'),
        resolve: jest.fn().mockReturnValue('/test-handler.js'),
        join: jest.fn((...args) => args.join('/')),
        extname: jest.fn(),
        basename: jest.fn().mockReturnValue('test-handler.js'),
      }));

      // Create a handler with no methods
      jest.mock('/test-handler.js', () => ({}), { virtual: true });

      // Import the module under test
      const lambdaRunner = require('../../src/lambda-runner');

      await expect(
        lambdaRunner.runHandler('/test-handler.js', 'nonexistentMethod', mockEvent)
      ).rejects.toThrow('is not a function');
    });
  });
});
