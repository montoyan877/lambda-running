/**
 * Tests for event-store.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { saveEvent, getEvents, getEvent, deleteEvent } = require('../../src/event-store');

// Mock filesystem and os functions
jest.mock('fs');
jest.mock('path');
jest.mock('os');

// Mock console to prevent noise during tests
global.console = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

// Mock process
const mockCwd = '/project/dir';
Object.defineProperty(process, 'cwd', { value: jest.fn().mockReturnValue(mockCwd) });

describe('Event Store', () => {
  // Mock data for our tests
  const mockProjectEventDir = '/project/dir/.lambdaRunning/events';
  const mockEventData = {
    default: {
      'test-event.json': JSON.stringify({
        name: 'test-event',
        category: 'default',
        timestamp: Date.now(),
        data: { test: 'data' },
      }),
      'another-event.json': JSON.stringify({
        name: 'another-event',
        category: 'default',
        timestamp: Date.now(),
        data: { more: 'test data' },
      }),
    },
    'custom-category': {
      'custom-event.json': JSON.stringify({
        name: 'custom-event',
        category: 'custom-category',
        timestamp: Date.now(),
        data: { custom: 'data' },
      }),
    },
  };

  const mockHomedir = '/home/user';

  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();

    // Setup common mocks
    os.homedir.mockReturnValue(mockHomedir);

    // Mock path.join to just concatenate with a slash
    path.join.mockImplementation((...args) => {
      return args.join('/');
    });

    // Make existsSync return true for the project directory and event files
    fs.existsSync.mockImplementation((filePath) => {
      if (filePath === mockProjectEventDir) return true;

      if (filePath.includes('.write-test')) return false; // initially doesn't exist

      // Check for category directories
      for (const category in mockEventData) {
        if (filePath.endsWith(`/${category}`)) return true;

        // Check for event files
        for (const event in mockEventData[category]) {
          if (filePath.endsWith(`/${category}/${event}`)) return true;
        }
      }

      return false;
    });

    // Mock directory creation (do nothing)
    fs.mkdirSync.mockImplementation(() => undefined);

    // Mock test file creation (do nothing)
    fs.writeFileSync.mockImplementation(() => undefined);
    fs.unlinkSync.mockImplementation(() => undefined);

    // Mock directory reading to return categories and events
    fs.readdirSync.mockImplementation((dirPath) => {
      if (dirPath === mockProjectEventDir) {
        return Object.keys(mockEventData);
      }

      for (const category in mockEventData) {
        if (dirPath.endsWith(`/${category}`)) {
          return Object.keys(mockEventData[category]);
        }
      }

      return [];
    });

    // Mock file reading to return mock event data
    fs.readFileSync.mockImplementation((filePath) => {
      for (const category in mockEventData) {
        for (const event in mockEventData[category]) {
          if (filePath.endsWith(`/${category}/${event}`)) {
            return mockEventData[category][event];
          }
        }
      }
      return '';
    });

    // Mock file stats to identify directories
    fs.statSync.mockImplementation((filePath) => {
      return {
        isDirectory: () => {
          for (const category in mockEventData) {
            if (filePath.endsWith(`/${category}`)) {
              return true;
            }
          }
          return false;
        },
      };
    });
  });

  describe('saveEvent', () => {
    test('should save an event to the correct location', () => {
      const eventName = 'new-event';
      const eventData = { test: 'new data' };
      const category = 'new-category';

      saveEvent(eventName, eventData, category);

      // Check that mkdir was called with the category path
      expect(fs.mkdirSync).toHaveBeenCalled();

      // Check that writeFileSync was called with the right file path
      expect(fs.writeFileSync).toHaveBeenCalled();

      // We can't check exact parameters because getEventStoreDir() is called internally
      // and we don't want to mock it directly
    });
  });

  describe('getEvents', () => {
    test('should return events when available', () => {
      // Point getEventStoreDir to the project dir
      fs.writeFileSync.mockImplementationOnce(() => {});
      fs.unlinkSync.mockImplementationOnce(() => {});

      // First we need to return directories for readdirSync
      fs.readdirSync.mockImplementationOnce(() => ['default', 'custom-category']); // Categories
      fs.readdirSync.mockImplementationOnce(() => ['test-event.json', 'another-event.json']); // Files in default
      fs.readdirSync.mockImplementationOnce(() => []); // No files in custom-category

      // Next, handle statSync for checking directories
      fs.statSync.mockImplementation((path) => ({
        isDirectory: () => path.endsWith('default') || path.endsWith('custom-category'),
        mtime: new Date(),
      }));

      // Finally, handle readFileSync to return data
      fs.readFileSync.mockImplementation((path) => {
        if (path.endsWith('test-event.json')) {
          return JSON.stringify({ test: 'data' });
        }
        if (path.endsWith('another-event.json')) {
          return JSON.stringify({ more: 'test data' });
        }
        return '{}';
      });

      const events = getEvents();

      // Should return some events
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].name).toBe('test-event');
      expect(events[0].category).toBe('default');
      expect(events[0].data).toEqual({ test: 'data' });
    });

    test('should filter events by category when specified', () => {
      // Setup mocks for this test
      fs.writeFileSync.mockImplementationOnce(() => {});
      fs.unlinkSync.mockImplementationOnce(() => {});

      // Return the event file in the given category
      fs.readdirSync.mockImplementationOnce(() => ['custom-event.json']);

      // Setup stats for the file
      fs.statSync.mockImplementationOnce(() => ({
        mtime: new Date(),
      }));

      // Setup content for the file
      fs.readFileSync.mockImplementationOnce(() => JSON.stringify({ custom: 'data' }));

      // Run the test
      const events = getEvents('custom-category');

      // Should return the filtered event
      expect(events.length).toBe(1);
      expect(events[0].category).toBe('custom-category');
      expect(events[0].data).toEqual({ custom: 'data' });
    });

    test('should return empty array when no events found', () => {
      // Mock empty directory for this test
      fs.readdirSync.mockReturnValue([]);

      const events = getEvents();

      // Should return an empty array
      expect(events).toEqual([]);
    });
  });

  describe('getEvent', () => {
    test('should return a specific event by name and category', () => {
      // Setup mocks for this test
      fs.writeFileSync.mockImplementationOnce(() => {});
      fs.unlinkSync.mockImplementationOnce(() => {});

      // Make sure existsSync returns true for this file
      fs.existsSync.mockReturnValueOnce(true);

      // Return the timestamp for the file
      fs.statSync.mockReturnValueOnce({
        mtime: new Date(),
      });

      // Return mock event data
      fs.readFileSync.mockReturnValueOnce(JSON.stringify({ test: 'data' }));

      const event = getEvent('test-event', 'default');

      // Should return the correct event
      expect(event).toBeDefined();
      expect(event.name).toBe('test-event');
      expect(event.category).toBe('default');
      expect(event.data).toEqual({ test: 'data' });
    });

    test('should return null if event not found', () => {
      // Mock not finding the file
      fs.existsSync.mockReturnValueOnce(false);

      const event = getEvent('nonexistent-event', 'default');

      // Should return null
      expect(event).toBeNull();
    });
  });

  describe('deleteEvent', () => {
    test('should delete an event and return true if successful', () => {
      // Mock finding and deleting the file
      fs.existsSync.mockReturnValueOnce(true);

      const result = deleteEvent('test-event', 'default');

      // Should call unlinkSync and return true
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should return false if event not found', () => {
      // Mock not finding the file
      fs.existsSync.mockReturnValueOnce(false);

      const result = deleteEvent('nonexistent-event', 'default');

      // Should not call unlinkSync and return false
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
