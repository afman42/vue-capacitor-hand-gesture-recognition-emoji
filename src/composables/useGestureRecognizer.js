// src/composables/useGestureRecognizer.js

import { ref, nextTick } from "vue";
import { Camera } from "@capacitor/camera";
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";
import { GESTURE_RECOGNIZER_MODEL_PATH, GESTURE_MAP } from "../constants";
import { Preferences } from "@capacitor/preferences";
/**
 * A Vue Composable for real-time gesture recognition.
 *
 * @returns {object} Reactive state and functions to control gesture recognition.
 */
export function useGestureRecognizer() {
  // --- Reactive State ---
  const isLoading = ref(false);
  const loadingMessage = ref("");
  const errorMessage = ref("");
  const recognizedGesture = ref("None");
  const selectedEmoji = ref(GESTURE_MAP.None);
  const isRunning = ref(false);

  // --- Private Variables ---
  let gestureRecognizer;
  let lastVideoTime = -1;

  // --- Core Methods ---

  /**
   * Initializes the Gesture Recognizer, gets camera permissions, and starts the webcam feed.
   * @param {ref} videoRef - A Vue ref pointing to the <video> element.
   */
  const start = async (videoRef) => {
    if (isLoading.value || isRunning.value) return;

    isLoading.value = true;
    errorMessage.value = "";

    try {
      // 1. Initialize Gesture Recognizer
      loadingMessage.value = "Initializing AI Model...";
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm",
      );
      gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: GESTURE_RECOGNIZER_MODEL_PATH,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
      });

      // 2. Get Camera Permissions
      loadingMessage.value = "Requesting Camera Access...";
      const hasPermission = await checkAndRequestCameraPermission();
      if (!hasPermission) {
        throw new Error("Camera permission is required to continue.");
      }

      // 3. Set running state to true, which triggers the component to render the video element
      isRunning.value = true;

      // 4. Wait for Vue to update the DOM and render the video element
      await nextTick();

      // 5. Now that the video element exists, attach the stream
      if (!videoRef.value) {
        // This error should now be much less likely to occur.
        throw new Error("Video element could not be found after DOM update.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.value.srcObject = stream;
      videoRef.value.addEventListener("loadedmetadata", predictWebcam);

      // ADDED: Save the active state to device storage
      await Preferences.set({ key: "sessionActive", value: "true" });
    } catch (e) {
      errorMessage.value = e.message;
      console.error(e);
      isRunning.value = false;
    } finally {
      isLoading.value = false;
      loadingMessage.value = "";
    }
  };

  /**
   * Stops the webcam feed and cleans up resources.
   * @param {ref} videoRef - A Vue ref pointing to the <video> element.
   */
  const stop = async (videoRef) => {
    isRunning.value = false;
    if (videoRef.value && videoRef.value.srcObject) {
      videoRef.value.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.value.srcObject = null;
    }
    gestureRecognizer = undefined;
    recognizedGesture.value = "None";
    selectedEmoji.value = GESTURE_MAP.None;
    await Preferences.set({ key: "sessionActive", value: "false" });
  };

  // --- Helper Functions ---

  const predictWebcam = async (event) => {
    try {
      const videoEl = event.target;
      if (!isRunning.value || !gestureRecognizer) return;

      if (videoEl.currentTime !== lastVideoTime) {
        lastVideoTime = videoEl.currentTime;
        const results = gestureRecognizer.recognizeForVideo(
          videoEl,
          Date.now(),
        );

        if (results.gestures.length > 0) {
          const gesture = results.gestures[0][0];
          recognizedGesture.value = `${gesture.categoryName} (${(gesture.score * 100).toFixed(1)}%)`;
          selectedEmoji.value =
            GESTURE_MAP[gesture.categoryName] || GESTURE_MAP.None;
        } else {
          recognizedGesture.value = "None";
          selectedEmoji.value = GESTURE_MAP.None;
        }
      }
      requestAnimationFrame(async () => await predictWebcam(event));
    } catch (error) {
      // The active session has crashed.
      // YES, call stop() here to perform a full shutdown.
      errorMessage.value = e.message;
      await stop(videoRef); // videoRef would need to be in scope
    }
  };

  const checkAndRequestCameraPermission = async () => {
    let permissions = await Camera.requestPermissions({
      permissions: ["camera", "photos"],
    });
    if (permissions.camera === "denied" || permissions.photos === "denied") {
      errorMessage.value = "Camera and Storage permissions are required.";
      console.error("Permissions not granted:", permissions);
      return false;
    }
    if (permissions.camera === "prompt" || permissions.photos === "prompt") {
      permissions = await Camera.requestPermissions({
        permissions: ["camera", "photos"],
      });
    }

    return true;
  };

  // Expose public API
  return {
    isLoading,
    loadingMessage,
    errorMessage,
    recognizedGesture,
    selectedEmoji,
    isRunning,
    start,
    stop,
  };
}
