const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function genOscillator(freqHz) {
    const oscillator = audioCtx.createOscillator();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freqHz, audioCtx.currentTime);

   return oscillator;
}

export function genGain(gain, oscillator, ...other) {
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(gain, audioCtx.currentTime);
    oscillator.connect(gainNode);

    for (var aNode of other)
        aNode.connect(gainNode);

    return gainNode;
}

export function genAnalyser(fftSize, gain) {
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = fftSize;

    gain.connect(analyser);

    return analyser;
}

export function periodicSoundPlayer(freqHz) {
    // const real = new Float32Array(2*Math.PI*freqHz);
    const real = new Float32Array(4);
    const imag = new Float32Array(4);
    const osc = audioCtx.createOscillator();
    osc.frequency.setValueAtTime(freqHz, audioCtx.currentTime);

    real[0] = 0;
    imag[0] = 0;
    real[1] = 0;
    imag[1] = 0.1;
    real[2] = 0;
    imag[2] = 0.5;
    real[3] = 0;
    imag[4] = 1;

    const wave = audioCtx.createPeriodicWave(real, imag, { disableNormalization: true });
    osc.setPeriodicWave(wave);
    // osc.connect(audioCtx.destination);
    return osc;
}

export function connectToDest(aNode) {
    aNode.connect(audioCtx.destination);
}

export function disconnectFromDest(aNode) {
    aNode.disconnect();
}

export function triggerOscillators(oscillators) {
    for (var oscName in oscillators) {
        console.log(`Starting oscillator ${oscName}`);
        oscillators[oscName].start();
    }
}

export function setGain(gainNode, gain) {
    gainNode.gain.setValueAtTime(gain, audioCtx.currentTime);
}

export function setFreq(oscillatorNode, freqHz) {
    oscillatorNode.frequency.setValueAtTime(freqHz, audioCtx.currentTime);
}