import { plotTimeDomain, plotFreqDomain } from "./js/chart.js";
import { genOscillator, genGain } from "./js/audio.js";
import { setupCallbacks } from "./js/ui.js";
import { genSignal, mixSignals, fft } from "./js/signals.js";

const OSC_A_INITIAL_FREQ = 440; // A4
const OSC_B_INITIAL_FREQ = 880; // A5
const OSC_A_INITIAL_GAIN = 1;
const OSC_B_INITIAL_GAIN = 1;
const MASTER_INITIAL_GAIN = 0.5;

var synth = {};

console.log("computing initial signals...")

synth.signals = {
    oscA: genSignal(OSC_A_INITIAL_FREQ, OSC_A_INITIAL_GAIN),
    oscB: genSignal(OSC_B_INITIAL_FREQ, OSC_B_INITIAL_GAIN)
}

synth.signals.mix = mixSignals(synth.signals.oscA, synth.signals.oscB);

console.log("computing initial spectra...")
synth.spectra = {
    oscA: fft(synth.signals.oscA),
    oscB: fft(synth.signals.oscB)
}

console.log("Creating the chart from `main.js`...")
synth.charts = {
    time: plotTimeDomain(synth.signals.oscA, synth.signals.oscB, synth.signals.mix),
    freq: plotFreqDomain(synth.spectra.oscA, synth.spectra.oscB)
}

console.log("instantiating the audio chain...")
synth.oscillators = {
    oscA: genOscillator(OSC_A_INITIAL_FREQ),
    oscB: genOscillator(OSC_B_INITIAL_FREQ)
};

synth.gains = {
    oscA: genGain(OSC_A_INITIAL_GAIN, synth.oscillators.oscA),
    oscB: genGain(OSC_B_INITIAL_GAIN, synth.oscillators.oscB)
};

synth.gains.master = genGain(MASTER_INITIAL_GAIN, synth.gains.oscA, synth.gains.oscB);

console.log("setting up the ui callbacks...")
setupCallbacks(synth);
