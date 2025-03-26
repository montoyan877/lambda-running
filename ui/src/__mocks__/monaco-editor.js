/**
 * Mock implementation of monaco-editor for testing
 */

const editorMock = {
  onDidChangeModelContent: vi.fn(() => ({
    dispose: vi.fn()
  })),
  getValue: vi.fn(() => 'test code'),
  setValue: vi.fn(),
  getModel: vi.fn(() => ({ dispose: vi.fn() })),
  dispose: vi.fn(),
  layout: vi.fn(),
  getAction: vi.fn(() => ({ run: vi.fn() })),
  revealLineInCenter: vi.fn(),
  setPosition: vi.fn(),
  focus: vi.fn(),
  updateOptions: vi.fn(),
  addCommand: vi.fn()
};

export const editor = {
  create: vi.fn(() => editorMock),
  setModelLanguage: vi.fn(),
  setTheme: vi.fn(),
  defineTheme: vi.fn()
};

export const KeyMod = {
  CtrlCmd: 2048
};

export const KeyCode = {
  KeyS: 31
};

// Default export for ES module compatibility
export default {
  editor,
  KeyMod,
  KeyCode
}; 