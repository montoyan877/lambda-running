/**
 * Library entry point
 * Only exports what's actually needed for the library consumers
 */

// Component exports
export { default as Terminal } from './components/Terminal.vue';
export { default as CodeEditor } from './components/CodeEditor.vue';
export { default as XTerminal } from './components/XTerminal.vue';
export { default as Modal } from './components/Modal.vue';
export { default as ResizablePanel } from './components/ResizablePanel.vue';
export { default as ResizablePanelVertical } from './components/ResizablePanelVertical.vue';

// Store exports
export { useExecutionStore } from './stores/execution';
export { useHandlersStore } from './stores/handlers';

// Utils and helpers - no need to export everything
export const version = '0.1.0'; 