<script setup>
import { ref, nextTick } from "vue";
import { Camera } from "@capacitor/camera";
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";
// --- STATE MANAGEMENT ---
// Controls the overall UI state: 'idle', 'loading', 'running'
const appState = ref("idle");
const loadingMessage = ref("");
const errorMessage = ref("");

const videoRef = ref(null);
const recognizedGesture = ref("None");
const selectedEmoji = ref("❓");

let gestureRecognizer;
let lastVideoTime = -1;

// --- CORE FUNCTIONS ---
const initializeAndStart = async () => {
  // Prevent multiple initializations
  if (appState.value !== "idle") return;

  appState.value = "loading";
  errorMessage.value = "";

  try {
    // 1. Initialize Gesture Recognizer (The heaviest part)
    loadingMessage.value = "Initializing AI Model...";
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm",
    );
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `/models/gesture_recognizer.task`,
        delegate: "CPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
    });

    // 2. Get Camera Permissions
    loadingMessage.value = "Requesting Camera Access...";
    const hasPermission = await checkAndRequestCameraPermission();
    if (!hasPermission) {
      throw new Error("Camera permission is required.");
    }

    // --- THIS IS THE CORRECTED LOGIC ---

    // 3. Switch to the running state FIRST to render the <video> element
    appState.value = "running";

    // 4. Wait for Vue to update the DOM
    await nextTick();

    // 5. Now that the <video> exists, get the stream and attach it
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    // Check if videoRef is valid before using it
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      videoRef.value.addEventListener("loadedmetadata", () => {
        predictWebcam();
      });
    } else {
      throw new Error("Video element could not be found.");
    }
  } catch (e) {
    errorMessage.value = e.message;
    appState.value = "idle"; // Reset state on error
    console.error(e);
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
    permissions = await Camera.requestPermissions();
  }

  return true;
};

const predictWebcam = () => {
  // Only run if the app is in the 'running' state
  if (appState.value !== "running" || !gestureRecognizer || !videoRef.value)
    return;

  const currentTime = videoRef.value.currentTime;
  if (currentTime > lastVideoTime) {
    lastVideoTime = currentTime;
    const results = gestureRecognizer.recognizeForVideo(
      videoRef.value,
      Date.now(),
    );

    if (results.gestures.length > 0) {
      const gesture = results.gestures[0][0];
      recognizedGesture.value = `${gesture.categoryName} (${(gesture.score * 100).toFixed(1)}%)`;
      const gestureMap = {
        Victory: "✌️",
        Thumb_Up: "👍",
        Open_Palm: "✋",
        Closed_Fist: "✊",
        Pointing_Up: "☝️",
        ILoveYou: "🤟",
      };
      selectedEmoji.value = gestureMap[gesture.categoryName];
    } else {
      recognizedGesture.value = "None";
      selectedEmoji.value = "❓";
    }
  }

  requestAnimationFrame(predictWebcam);
};
</script>

<template>
  <div class="container">
    <div v-if="appState === 'idle'" class="idle-container">
      <h1>Gesture App</h1>
      <p>
        Press the button to start the camera and gesture recognition session.
      </p>
      <button class="start-button" @click="initializeAndStart">
        🚀 Start Session
      </button>
      <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
    </div>

    <div v-if="appState === 'loading'" class="loading-container">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>

    <div v-if="appState === 'running'" class="running-container">
      <div class="display-area">
        <div class="emoji-display">{{ selectedEmoji }}</div>
        <video ref="videoRef" class="video-feed" autoplay playsinline></video>
      </div>

      <div class="controls">
        <p><strong>Gesture:</strong> {{ recognizedGesture }}</p>
      </div>
    </div>
  </div>
</template>

<style>
/* Add new styles for idle and loading states */
.idle-container,
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  height: 80vh;
}

.start-button {
  background-color: #5c6bc0;
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 1.2rem;
  border-radius: 50px;
  cursor: pointer;
  margin-top: 20px;
  transition: background-color 0.3s;
}
.start-button:hover {
  background-color: #3f51b5;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #ccc;
  border-top-color: #5c6bc0;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
:root {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  background-color: #242424;
  color: #fff;
}

.container {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: auto;
  overflow: hidden;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 1.2rem;
}

.display-area {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

.video-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* Flip the video to make it a mirror image */
  transform: scaleX(-1);
}

.emoji-display {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  font-size: 60px;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.controls {
  padding: 1rem;
  text-align: center;
  background: #333;
  border-radius: 12px;
  margin-top: 1rem;
}

.controls p {
  font-size: 1.1rem;
}

.error {
  padding: 20px;
  background-color: #ff3b30;
  color: white;
  text-align: center;
  border-radius: 12px;
  margin-bottom: 1rem;
}
</style>
