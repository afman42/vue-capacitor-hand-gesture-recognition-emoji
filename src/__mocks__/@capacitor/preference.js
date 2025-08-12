// src/__mocks__/@capacitor/preferences.js
let store = {};

export const Preferences = {
  set: vi.fn(async ({ key, value }) => {
    store[key] = value;
  }),
  get: vi.fn(async ({ key }) => {
    return { value: store[key] || null };
  }),
  // Helper for tests to clear the mock storage
  _clear: () => {
    store = {};
  },
};
