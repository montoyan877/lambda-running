/**
 * Tests for lambda-runner.js
 */
const path = require('path');
const fs = require('fs');
const { runHandler, scanForHandlers } = require('../../src/lambda-runner');

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
        readFileSync: jest.fn().mockReturnValue(''),
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

      // Mock handler modules
      jest.mock(
        '/test-dir/handler.js',
        () => ({
          handler: jest.fn(),
        }),
        { virtual: true }
      );

      jest.mock(
        '/test-dir/not-a-handler.js',
        () => ({
          notAHandler: jest.fn(),
        }),
        { virtual: true }
      );

      jest.mock(
        '/test-dir/subdir/sub-handler.js',
        () => ({
          handler: jest.fn(),
        }),
        { virtual: true }
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should scan a directory and find handler files', () => {
      const lambdaRunner = require('../../src/lambda-runner');

      const handlers = lambdaRunner.scanForHandlers('/test-dir');

      // Should find two handlers
      expect(handlers).toHaveLength(2);

      // Check the first handler
      expect(handlers[0]).toEqual({
        path: '/test-dir/handler.js',
        methods: ['handler'],
      });

      // Check the second handler
      expect(handlers[1]).toEqual({
        path: '/test-dir/subdir/sub-handler.js',
        methods: ['handler'],
      });
    });

    it('should respect ignore patterns', () => {
      // Create a new instance of the module with mocked shouldIgnore function
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
          if (path.includes('.lambdarunignore')) {
            return 'subdir';
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

      // Mock handler modules
      jest.mock(
        '/test-dir/handler.js',
        () => ({
          handler: jest.fn(),
        }),
        { virtual: true }
      );

      jest.mock(
        '/test-dir/not-a-handler.js',
        () => ({
          notAHandler: jest.fn(),
        }),
        { virtual: true }
      );

      jest.mock(
        '/test-dir/subdir/sub-handler.js',
        () => ({
          handler: jest.fn(),
        }),
        { virtual: true }
      );

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
  });

  describe('runHandler', () => {
    // Set up the mock paths and handlers before tests run
    const handlerPath = '/test-handler.js';
    const handlerMethod = 'handler';
    const mockEvent = { test: 'event' };
    const expectedResult = { success: true };
    let mockHandler;
    let originalRequire;
    let fs;
    let path;

    beforeEach(() => {
      jest.resetModules();

      // Setup module mocks before requiring lambda-runner
      jest.mock('fs', () => ({
        existsSync: jest.fn().mockReturnValue(true),
        readdirSync: jest.fn().mockReturnValue([]),
        readFileSync: jest.fn().mockReturnValue(''),
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
      originalRequire = jest.requireActual;
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

      // Verify the handler was called with the correct event
      expect(mockHandler).toHaveBeenCalledWith(
        mockEvent,
        expect.objectContaining({
          awsRequestId: expect.any(String),
          functionName: expect.any(String),
          functionVersion: 'local',
          memoryLimitInMB: '128',
          getRemainingTimeInMillis: expect.any(Function),
        })
      );

      // Verify the result matches the expected output
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
