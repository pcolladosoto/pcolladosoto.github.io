import { SIGNAL_SAMPLE_PERIOD } from "./signals.js";

const timeDomainCanvas = document.getElementById("timeDomain");
const freqDomainCanvas = document.getElementById("freqDomain");

const defaultTimeOptions = {
    elements: {
        point: {
            pointStyle: false
        }
    },
    plugins: {
        zoom: {
            zoom: {
                wheel: {
                    enabled: true,
                },
                pinch: {
                    enabled: true
                },
                mode: 'x',
            }
        }
    },
    scales: {
        x: {
            title: {
                display: true,
                text: "Time [ms]"
            }
        },
        y: {
            title: {
                display: true,
                text: "Amplitude"
            }
        }
    }
}

const defaultFreqOptions = {
    elements: {
        point: {
            pointStyle: false
        }
    },
    plugins: {
        zoom: {
            zoom: {
                wheel: {
                    enabled: true,
                },
                pinch: {
                    enabled: true
                },
                mode: 'x',
            }
        }
    },
    scales: {
        x: {
            type: "logarithmic",
            title: {
                display: true,
                text: "Frequency [Hz]"
            }
        },
        y: {
            title: {
                display: true,
                text: "Power"
            }
        }
    }
}

const oscADataset = {
    label: "Oscillator A",
    data: [],
    lineTension: 0,
    backgroundColor: 'transparent',
    borderColor: '#007bff',
    borderWidth: 4,
    pointBackgroundColor: '#007bff'
}

const oscBDataset = {
    label: "Oscillator B",
    data: [],
    lineTension: 0,
    backgroundColor: 'transparent',
    borderColor: '#007b00',
    borderWidth: 4,
    pointBackgroundColor: '#007b00'
}

const mixDataset = {
    label: "Mix",
    data: [],
    lineTension: 0,
    backgroundColor: 'transparent',
    borderColor: '#ff8a01',
    borderWidth: 4,
    pointBackgroundColor: '#008a01',
}

function genSampleLabels(n) {
    var sampleIndices = [];

    for (var i = 0; i < n; i++) {
        sampleIndices.push(i);
    }

    return sampleIndices;
}

function genTimeLabels(n) {
    var sampleTimes = [];

    for (var i = 0; i < n; i++) {
        sampleTimes.push(1000 * i * SIGNAL_SAMPLE_PERIOD);
    }

    return sampleTimes;
}

function genTimeDatasets(samplesA, samplesB, samplesC) {
    var oscA = JSON.parse(JSON.stringify(oscADataset));
    var oscB = JSON.parse(JSON.stringify(oscBDataset));
    var mix = JSON.parse(JSON.stringify(mixDataset));

    oscA.data = samplesA;
    oscB.data = samplesB;
    mix.data = samplesC;

    return [oscA, oscB, mix];
}

function genFreqDatasets(samplesA, samplesB) {
    var oscA = JSON.parse(JSON.stringify(oscADataset));
    var oscB = JSON.parse(JSON.stringify(oscBDataset));

    oscA.data = samplesA;
    oscB.data = samplesB;

    return [oscA, oscB];
}

export function updateTimeDomain(synth) {
    synth.charts.time.data.datasets = genTimeDatasets(synth.signals.oscA, synth.signals.oscB, synth.signals.mix);
    synth.charts.time.update();
}

export function updateFreqDomain(synth) {
    synth.charts.freq.data.datasets = genFreqDatasets(synth.spectra.oscA.spectrum, synth.spectra.oscB.spectrum);
    synth.charts.freq.update();
}

export function plotTimeDomain(samplesA, samplesB, samplesC) {
    return new Chart(timeDomainCanvas, {
        type: 'line',
        data: {
            // labels: genSampleLabels(samplesA.length),
            labels: genTimeLabels(samplesA.length).map(time => time.toFixed(2)),
            datasets: genTimeDatasets(samplesA, samplesB, samplesC)
        },
        options: defaultTimeOptions
    });
}

export function plotFreqDomain(spectrumA, spectrumB) {
    return new Chart(freqDomainCanvas, {
        type: 'line',
        data: {
            labels: spectrumA.freqBins.map(freq => Math.round(freq)),
            datasets: genFreqDatasets(spectrumA.spectrum, spectrumB.spectrum)
        },
        options: defaultFreqOptions
    });
}
