// src/components/GestureCam.test.js
import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import GestureCam from "./GestureCam.vue";
import { Preferences } from "@capacitor/preferences";

describe("GestureCam.vue", () => {
  beforeEach(async () => {
    await Preferences._clear();
  });

  it("renders the idle state correctly for a new user", async () => {
    const wrapper = mount(GestureCam);
    await wrapper.vm.$nextTick(); // Wait for onMounted to complete

    expect(wrapper.find("h1").text()).toBe("Gesture App");
    expect(wrapper.find(".start-button").text()).toBe("🚀 Start Session");
  });

  it("transitions to loading state when start button is clicked", async () => {
    const wrapper = mount(GestureCam);
    await wrapper.vm.$nextTick();

    const startButton = wrapper.find(".start-button");
    await startButton.trigger("click");

    // The component state will now be 'loading'
    expect(wrapper.find(".spinner").exists()).toBe(true); // This check is robust and sufficient
  });
});
