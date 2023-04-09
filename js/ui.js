import { setGain } from "./audio.js";

const masterVolume = document.getElementById("masterVolume");

export function setupCallbacks(synthElements) {
    masterVolume.oninput = function() {
        console.log(`current master volume: ${this.value}`);
        setGain(synthElements.gains[2], this.value);
    }
}
