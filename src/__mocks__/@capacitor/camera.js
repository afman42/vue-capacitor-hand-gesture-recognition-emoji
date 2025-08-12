// src/__mocks__/@capacitor/camera.js
let permissionStatus = "granted";

export const Camera = {
  requestPermissions: vi.fn(async () => {
    return { camera: permissionStatus };
  }),
  // Helper for tests to simulate permission denial
  _setPermissionState: (state) => {
    permissionStatus = state;
  },
};
