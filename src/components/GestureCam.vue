<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useGestureRecognizer } from "../composables/useGestureRecognizer";
import { Preferences } from "@capacitor/preferences";
import { App } from "@capacitor/app";

const videoRef = ref(null);
const appStateChange = ref(false);
let listener;

// Use our custom composable to get all the logic and state
const {
  isLoading,
  loadingMessage,
  errorMessage,
  recognizedGesture,
  selectedEmoji,
  isRunning,
  start,
  stop,
} = useGestureRecognizer();

// The overall app state is now a computed property based on the composable's state
const appState = computed(() => {
  if (isLoading.value) return "loading";
  if (isRunning.value) return "running";
  return "idle";
});

const handleStartSession = () => {
  start(videoRef);
};

const handleStopSession = () => {
  stop(videoRef);
};

onMounted(async () => {
  await nextTick();
  try {
    const { value } = await Preferences.get({ key: "sessionActive" });
    if (value === "true") handleStartSession();
  } catch (e) {
    console.error("Could not read preferences", e);
    alert("Could not read preferences", e);
  }
  listener = await App.addListener("appStateChange", ({ isActive }) => {
    console.log("App when is Active", isActive);
    if (!isActive) appStateChange.value = true;
  });
});
onUnmounted(() => {
  listener?.remove();
  appStateChange.value = false;
});
</script>

<template>
  <div class="container">
    <div v-if="appState === 'idle'" class="idle-container">
      <h1>Gesture App</h1>
      <p>
        Press the button to start the camera and gesture recognition session.
      </p>
      <button class="start-button" @click="handleStartSession">
        🚀 Start Session
      </button>
      <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
    </div>

    <div v-if="appState === 'loading'" class="loading-container">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>

    <div v-show="appState === 'running'" class="running-container">
      <div class="display-area">
        <div class="emoji-display">{{ selectedEmoji }}</div>
        <video ref="videoRef" class="video-feed" autoplay playsinline></video>
      </div>
      <div class="controls">
        <p><strong>Gesture:</strong> {{ recognizedGesture }}</p>
        <button
          type="button"
          v-show="appStateChange"
          class="stop-button"
          @click="handleStopSession"
        >
          Stop Session
        </button>
      </div>
    </div>
  </div>
</template>

<style>
.stop-button {
  background-color: #ba5e36;
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 0.7rem;
  border-radius: 50px;
  cursor: pointer;
  margin-top: 20px;
  transition: background-color 0.3s;
}
.stop-button:hover {
  background-color: #db9576;
  color: black;
}
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
.controls button {
  margin: 0 0 1rem 0;
}
.error {
  padding: 20px;
  background-color: #ff3b30;
  color: white;
  text-align: center;
  border-radius: 12px;
  margin-top: 1rem;
}
</style>
