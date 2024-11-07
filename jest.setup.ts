import '@testing-library/jest-dom';
import 'jest-extended';

// Add custom matchers
expect.extend({
  toBeInDocument(received) {
    const pass = received !== null;
    return {
      message: () => `expected ${received} to be in document`,
      pass
    };
  }
});
