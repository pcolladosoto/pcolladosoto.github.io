import { createChart, plotWave, plotWaves } from "./js/chart.js";
import { DSP, Oscillator } from "./js/dsp.js";
import { soundPlayer } from "./js/audio.js";

// var chart = createChart()

console.log("Creating the signal from `main.js`...")
// var osc = new Oscillator(DSP.SINE, 440, 1, 2048, 22050);
// osc.generate();
// var signal = osc.signal;
// console.log(signal)

var oscA = new Oscillator(DSP.SINE, 10, 1, 2048, 22050);
oscA.generate();

var oscB = new Oscillator(DSP.SINE, 20, 1, 2048, 22050);
oscB.generate();

console.log("Creating the chart from `main.js`...")
var chart = plotWaves(oscA.signal, oscB.signal);

console.log("Generating sound player...")
var player = soundPlayer(440);

console.log("Let the music begin!")

// Exporting the function to the global namesapace
window.playSound = function () {
    console.log("Playing sound!")
    player.start();
}

window.stopSound = function () {
    console.log("Stopping sound!")
    player.stop();
}
