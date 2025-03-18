/**
 * Global test setup
 * This file is automatically loaded by Vitest before tests are run
 */

// Import Vue test setup
import './setup/vueTestSetup';

// Set up global mocks
import { vi } from 'vitest';

// Mock console methods to reduce noise during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {}); 