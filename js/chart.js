const timeDomainCanvas = document.getElementById("timeDomain");
const freqDomainCanvas = document.getElementById("freqDomain");

function genLabels(n) {
    var labels = [];

    for (var i = 1; i <= n; i++) {
        labels.push(i);
    }

    return labels
}

export function createTimeChart() {
    return new Chart(timeDomainCanvas, {
        type: 'bar',
        data: {
            labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
            datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

export function createFreqChart() {
    return new Chart(freqDomainCanvas, {
        type: 'bar',
        data: {
            labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
            datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

export function plotWave(samples) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: genLabels(samples.length),
            datasets: [{
              data: samples,
              lineTension: 0,
              backgroundColor: 'transparent',
              borderColor: '#007bff',
              borderWidth: 4,
              pointBackgroundColor: '#007bff',
            }]
          },
          options: {
            elements: {
                point: {
                    pointStyle: false
                }
            }
          }
    });
}

export function plotTimeDomain(samplesA, samplesB, samplesC) {
    return new Chart(timeDomainCanvas, {
        type: 'line',
        data: {
            labels: genLabels(samplesA.length),
            datasets: [
                {
                    label: "Wave 1",
                    data: samplesA,
                    lineTension: 0,
                    backgroundColor: 'transparent',
                    borderColor: '#007bff',
                    borderWidth: 4,
                    pointBackgroundColor: '#007bff',
                },
                {
                    label: "Wave 2",
                    data: samplesB,
                    lineTension: 0,
                    backgroundColor: 'transparent',
                    borderColor: '#007b00',
                    borderWidth: 4,
                    pointBackgroundColor: '#007b00',
                },
                {
                    label: "Sum",
                    data: samplesC,
                    lineTension: 0,
                    backgroundColor: 'transparent',
                    borderColor: '#ff8a01',
                    borderWidth: 4,
                    pointBackgroundColor: '#008a01',
                }
            ]
          },
          options: {
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
              }
          }
    });
}

export function plotFreqDomain(samplesA, samplesB) {
    return new Chart(freqDomainCanvas, {
        type: 'line',
        data: {
            labels: genLabels(samplesA.length),
            datasets: [
                {
                    label: "Wave 1",
                    data: samplesA,
                    lineTension: 0,
                    backgroundColor: 'transparent',
                    borderColor: '#007bff',
                    borderWidth: 4,
                    pointBackgroundColor: '#007bff',
                },
                {
                    label: "Wave 2",
                    data: samplesB,
                    lineTension: 0,
                    backgroundColor: 'transparent',
                    borderColor: '#007b00',
                    borderWidth: 4,
                    pointBackgroundColor: '#007b00',
                },
            ]
          },
          options: {
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
            }
          }
    });
}
