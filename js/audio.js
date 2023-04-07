const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function soundPlayer(freqHz) {
    // const oscillator = audioCtx.createOscillator();
    const oscillator = audioCtx.createOscillator();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freqHz, audioCtx.currentTime); // value in hertz
    oscillator.connect(audioCtx.destination);

   return oscillator;
}
