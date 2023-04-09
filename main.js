import { plotTimeDomain, plotFreqDomain } from "./js/chart.js";
import { DSP, Oscillator, FFT, DFT } from "./js/dsp.js";
import { periodicSoundPlayer, genOscillator, genGain, genAnalyser,
    triggerOscillators, connectToDest, disconnectFromDest } from "./js/audio.js";
import { indexOfMax } from "./js/util.js";
import { setupCallbacks } from "./js/ui.js";

var synthElements = {};

// var chart = createChart()

console.log("Creating the signal from `main.js`...")
// var osc = new Oscillator(DSP.SINE, 440, 1, 2048, 22050);
// osc.generate();
// var signal = osc.signal;
// console.log(signal)

var oscA = new Oscillator(DSP.SINE, 440, 1, 4096, 44100);
oscA.generate();

var oscB = new Oscillator(DSP.SINE, 1000, 1, 4096, 44100);
oscB.generate();

var oscSum = []
for (var i = 0; i < oscA.signal.length; i++) {
    oscSum.push(oscA.signal[i] + oscB.signal[i]);
}

var fftA = new FFT(4096, 44100);
fftA.forward(oscA.signal);
console.log(fftA.spectrum);

var fftB = new FFT(4096, 44100);
fftB.forward(oscB.signal);
console.log(fftA.bandwidth, fftA.getBandFrequency(indexOfMax(fftA.spectrum)));
console.log(fftB.bandwidth, fftB.getBandFrequency(indexOfMax(fftB.spectrum)));

console.log("Creating the chart from `main.js`...")
var timeChart = plotTimeDomain(oscA.signal, oscB.signal, oscSum);
var freqChart = plotFreqDomain(fftA.spectrum, fftB.spectrum);

console.log("Generating sound player...")
// var player = soundPlayer(440);
// var player = periodicSoundPlayer(100);
// player.start();
var oscA = genOscillator(440);
var oscB = genOscillator(880);
var gainA = genGain(1, oscA);
var gainB = genGain(1, oscB);
var analyserA = genAnalyser(1024, gainA);
var analyserB = genAnalyser(1024, gainB);
var gainMaster = genGain(1, analyserA);
analyserB.connect(gainMaster);

synthElements.audioOscilloscopes = [oscA, oscB];
synthElements.gains = [gainA, gainB, gainMaster];

var analyserMaster = genAnalyser(256, gainMaster);
var timeDomainA = new Float32Array(analyserA.frequencyBinCount);
var timeDomainB = new Float32Array(analyserB.frequencyBinCount);
var freqDomainA = new Float32Array(analyserA.frequencyBinCount);
var freqDomainB = new Float32Array(analyserB.frequencyBinCount);

console.log("Let the music begin!")
var flag = true;
// Exporting the function to the global namesapace
window.playSound = function () {
    console.log("Playing sound!");
    // connect(player);
    // connect(gainA);
    if (flag)
        triggerOscillators();
    flag = false
    
    analyserA.getFloatFrequencyData(freqDomainA);
    analyserB.getFloatFrequencyData(freqDomainB);
    console.log(freqDomainA);
    console.log(freqDomainB);
    // connectToDest(analyserA);
    // connectToDest(analyserB);
    connectToDest(analyserMaster);
}

window.stopSound = function () {
    console.log("Stopping sound!");
    // disconnect(player);
    // disconnectFromDest(analyserA);
    // disconnectFromDest(analyserB);
    disconnectFromDest(analyserMaster);
}

const canvas = document.getElementById('freqDomain');
const canvasCtx = canvas.getContext("2d");

var dataArray = new Float32Array(analyserA.frequencyBinCount);
var bufferLength = analyserA.frequencyBinCount;

canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
let drawVisual;
function draw() {
    drawVisual = requestAnimationFrame(draw);
    analyserA.getFloatFrequencyData(dataArray);
  
    canvasCtx.fillStyle = "rgb(200, 200, 200)";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "rgb(0, 0, 0)";
    canvasCtx.beginPath();
  
    const sliceWidth = (canvas.width * 1.0) / bufferLength;
    let x = 0;
  
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] * 200.0;
      const y = canvas.height / 2 + v;
  
      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }
      x += sliceWidth;
    }
  
    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  }

// draw();

setupCallbacks(synthElements);
