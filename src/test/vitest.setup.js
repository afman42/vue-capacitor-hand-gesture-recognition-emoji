// vitest.setup.js
import { vi } from "vitest";

vi.mock(
  "@capacitor/preferences",
  () => import("../__mocks__/@capacitor/preference"),
);
vi.mock("@capacitor/camera", () => import("../__mocks__/@capacitor/camera"));
vi.mock(
  "@mediapipe/tasks-vision",
  () => import("../__mocks__/@mediapipe/tasks-vision"),
);
