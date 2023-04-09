import { setGain, triggerOscillators, connectToDest, disconnectFromDest, setFreq } from "./audio.js";
import { updateTimeDomain, updateFreqDomain } from "./chart.js";
import { fft, genSignal, mixSignals } from "./signals.js";

// Master buttons
const masterVolumeRange = document.getElementById("masterVolume");
const connectChainButton = document.getElementById("connectChain");
const disconnectChainButton = document.getElementById("disconnectChain");

// Oscillator A buttons
const oscAFreqInput = document.getElementById("oscAFreq");
const oscAVolumeRange = document.getElementById("oscAVolume");
const oscAApplyButton = document.getElementById("oscAApply");

// Oscillator B buttons
const oscBFreqInput = document.getElementById("oscBFreq");
const oscBVolumeRange = document.getElementById("oscBVolume");
const oscBApplyButton = document.getElementById("oscBApply");


var oscillatorsStarted = false;

export function setupCallbacks(synth) {
    console.log("setting up callbacks for the master volume slider");
    masterVolumeRange.oninput = function() {
        console.log(`current master volume: ${this.value}`);
        setGain(synth.gains.master, this.value);
    }

    console.log("setting up callbacks for the connect button");
    connectChainButton.onclick = function () {
        console.log("connecting the chain");

        if (!oscillatorsStarted) {
            console.log("triggering the oscillators")
            triggerOscillators(synth.oscillators);
            oscillatorsStarted = true;
        }

        connectToDest(synth.gains.master);
    }

    console.log("setting up callbacks for the disconnect button");
    disconnectChainButton.onclick = function () {
        console.log("disconnecting the chain sound");
        disconnectFromDest(synth.gains.master);
    }

    console.log("setting up callbacks for oscillator updates")
    oscAApplyButton.onclick = function() {
        oscillatorUpdate(synth, "oscA", oscAFreqInput.value, oscAVolumeRange.value);
    }

    oscBApplyButton.onclick = function() {
        oscillatorUpdate(synth, "oscB", oscBFreqInput.value, oscBVolumeRange.value);
    }
}

function oscillatorUpdate(synth, oscillatorName, newFreqHz, newGain) {
    console.log(`updating ${oscillatorName} signals`)
    synth.signals[oscillatorName] = genSignal(newFreqHz, newGain);
    synth.spectra[oscillatorName] = fft(synth.signals[oscillatorName]);
    synth.signals.mix = mixSignals(synth.signals.oscA, synth.signals.oscB);
    synth.spectra[oscillatorName] = fft(synth.signals[oscillatorName]);

    console.log("updating the graphs")
    updateTimeDomain(synth);
    updateFreqDomain(synth);

    console.log("updating the gain");
    setGain(synth.gains[oscillatorName], newGain);

    console.log("updating the oscillator frequency");
    setFreq(synth.oscillators[oscillatorName], newFreqHz);
}
