// src/__mocks__/@mediapipe/tasks-vision.js
export const GestureRecognizer = {
  createFromOptions: vi.fn().mockResolvedValue({
    recognizeForVideo: vi.fn().mockReturnValue({ gestures: [] }),
  }),
};

export const FilesetResolver = {
  forVisionTasks: vi.fn().mockResolvedValue({}),
};
