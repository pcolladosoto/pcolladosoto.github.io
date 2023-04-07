const ctx = document.getElementById('myChart');

function genLabels(n) {
    var labels = [];

    for (var i = 1; i <= n; i++) {
        labels.push(i);
    }

    return labels
}

export function createChart() {
    return new Chart(ctx, {
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

export function plotWaves(samplesA, samplesB) {
    return new Chart(ctx, {
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
            }
          }
    });
}