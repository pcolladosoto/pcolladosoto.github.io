import { DSP, Oscillator, FFT } from "./dsp.js";
import { indexOfMax } from "./util.js";

const SIGNAL_BUFFER_SIZE = 4096;
const SIGNAL_SAMPLE_RATE = 44100;

export const SIGNAL_SAMPLE_PERIOD = 1 / SIGNAL_SAMPLE_RATE;

const FFT_BUFFER_SIZE = 4096;
const FFT_SAMPLE_RATE = 44100;

export function genSignal(freqHz, amplitude) {
    return new Oscillator(DSP.SINE, freqHz, amplitude, SIGNAL_BUFFER_SIZE, SIGNAL_SAMPLE_RATE).generate();
}

export function mixSignals(signalA, signalB) {
    var sum = []
    for (var i = 0; i < signalA.length; i++) {
        sum.push(signalA[i] + signalB[i]);
    }
    return sum;
}

function genFreqBins(fftResult) {
    var freqBins = [];
    for (var i = 0; i < fftResult.spectrum.length; i++)
        freqBins.push(fftResult.getBandFrequency(i));
    return freqBins;
}

export function fft(signal) {
    var fft = new FFT(FFT_BUFFER_SIZE, FFT_SAMPLE_RATE);
    fft.forward(signal);
    return {
        spectrum: fft.spectrum,
        maxBand: fft.getBandFrequency(indexOfMax(fft.spectrum)),
        bandwidth: fft.bandwidth,
        freqBins: genFreqBins(fft)
    }
}
