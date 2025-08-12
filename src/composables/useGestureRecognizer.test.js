// src/composables/useGestureRecognizer.test.js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGestureRecognizer } from "./useGestureRecognizer";
import { Preferences } from "@capacitor/preferences";
import { Camera } from "@capacitor/camera";
import { ref } from "vue";

// Mock the global navigator object
global.navigator.mediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue({
    getTracks: () => [{ stop: vi.fn() }],
  }),
};

describe("useGestureRecognizer", () => {
  // Clear mock storage before each test
  beforeEach(async () => {
    await Preferences._clear();
    vi.clearAllMocks();
  });

  it("should have correct initial state", () => {
    const { isLoading, isRunning, errorMessage, recognizedGesture } =
      useGestureRecognizer();
    expect(isLoading.value).toBe(false);
    expect(isRunning.value).toBe(false);
    expect(errorMessage.value).toBe("");
    expect(recognizedGesture.value).toBe("None");
  });

  it("start function should handle successful initialization", async () => {
    const { start, isRunning, errorMessage } = useGestureRecognizer();
    const videoRef = ref({ addEventListener: vi.fn() });

    await start(videoRef);

    expect(isRunning.value).toBe(true);
    expect(errorMessage.value).toBe("");
    expect(Preferences.set).toHaveBeenCalledWith({
      key: "sessionActive",
      value: "true",
    });
  });

  it("start function should handle camera permission denial", async () => {
    Camera._setPermissionState("denied"); // Simulate user denying permission
    const { start, isRunning, errorMessage } = useGestureRecognizer();
    const videoRef = ref({ addEventListener: vi.fn() });

    await start(videoRef);

    expect(isRunning.value).toBe(false);
    expect(errorMessage.value).toBe(
      "Camera permission is required to continue.",
    );
    expect(Preferences.set).not.toHaveBeenCalled();
  });

  it("stop function should clean up the session", async () => {
    const { start, stop, isRunning } = useGestureRecognizer();
    const videoRef = ref({ addEventListener: vi.fn() });

    // Start a session first
    await start(videoRef);
    expect(isRunning.value).toBe(false);
    // Now stop it
    await stop(videoRef);

    expect(isRunning.value).toBe(false);
    expect(Preferences.set).toHaveBeenCalledWith({
      key: "sessionActive",
      value: "false",
    });
  });
});
