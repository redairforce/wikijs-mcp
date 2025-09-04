// Export all context management functionality
export * from './types.js';
export * from './detection.js';
export * from './manager.js';

// Re-export key classes and enums for convenience
export { ContextDetector } from './detection.js';
export { ContextManager } from './manager.js';
export { ContextMode } from './types.js';