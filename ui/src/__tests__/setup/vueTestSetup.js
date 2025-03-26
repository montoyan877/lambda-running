/**
 * Global setup for Vue tests
 * Provides mocks for Vue components like Teleport that aren't natively supported in JSDOM
 */

import { config } from '@vue/test-utils';

// Mock teleport component to make it functional in tests
config.global.stubs = {
  Teleport: {
    template: '<div><slot /></div>'
  }
};

// Add any other global mocks or setup needed for tests 