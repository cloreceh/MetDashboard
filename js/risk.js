// Load CSV and build dashboard
fetch('data/LocationsRisk.csv')
  .then(response => response.text())
  .then(csvText => {
    const riskData = parseCSV(csvText);

    // Count overall risk categories
    const riskCategories = { "Extreme": 0, "High": 0, "Moderate": 0, "Low": 0, "None": 0 };
    let totalRisks = 0;

    riskData.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== "Location") {
          const risk = row[key];
          if (riskCategories[risk] !== undefined) {
            riskCategories[risk]++;
            totalRisks++;
          }
        }
      });
    });

    // Create Gauges
    createGauge('extremeGauge', (riskCategories['Extreme'] / totalRisks) * 100, 'Extreme');
    createGauge('highGauge', (riskCategories['High'] / totalRisks) * 100, 'High');
    createGauge('mediumGauge', (riskCategories['Moderate'] / totalRisks) * 100, 'Moderate');
    createGauge('lowGauge', (riskCategories['Low'] / totalRisks) * 100, 'Low');
    createGauge('slightGauge', (riskCategories['None'] / totalRisks) * 100, 'None');

    // Create Pie Chart (% of Total Risks)
    const ctxPie = document.getElementById('riskPieChart').getContext('2d');
    new Chart(ctxPie, {
      type: 'pie',
      data: {
        labels: Object.keys(riskCategories),
        datasets: [{
          data: Object.values(riskCategories).map(x => ((x / totalRisks) * 100).toFixed(2)),
          backgroundColor: ['#d73027', '#fc8d59', '#fee08b', '#d9ef8b', '#91cf60']
        }]
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.label}: ${ctx.parsed}%`
            }
          }
        }
      }
    });

    // Create Bar Chart (% of Moderate+ Risks per Location) - Want to change to 100% Bar chart in future
    const locationLabels = riskData.map(r => r.Location);
    const moderateOrHigherPercentages = riskData.map(row => {
      const total = Object.keys(row).filter(k => k !== "Location").length;
      const moderateOrHigher = Object.values(row).filter(v => ['Moderate', 'High', 'Extreme'].includes(v)).length;
      return (moderateOrHigher / total * 100).toFixed(2);
    });

    const ctxBar = document.getElementById('riskBarChart').getContext('2d');
    new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: locationLabels,
        datasets: [{
          label: '% Moderate+ Risks',
          data: moderateOrHigherPercentages,
          backgroundColor: '#66c2a5'
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: '% of Risks'
            }
          }
        }
      }
    });

    // Build Risk Table
    const tableContainer = document.getElementById('riskTable');

    // Create header
    const headers = ['Location', 'Fire', 'Flood', 'Severe', 'Hurricane', 'Wind'];
    headers.forEach(header => {
      const div = document.createElement('div');
      div.className = 'cell header';
      div.textContent = header;
      tableContainer.appendChild(div);
    });

    // Create data rows
    riskData.forEach(row => {
      // Location name (first column)
      const locationDiv = document.createElement('div');
      locationDiv.className = 'cell location';
      locationDiv.textContent = row.Location;
      tableContainer.appendChild(locationDiv);

      // Risk columns
      ['Fire Risk', 'Flooding Risk', 'Severe Risk', 'Hurricane Risk', 'High Wind Risk'].forEach(riskType => {
        const riskDiv = document.createElement('div');
        riskDiv.className = 'cell';
        riskDiv.style.backgroundColor = riskColor(row[riskType]);
        tableContainer.appendChild(riskDiv);
      });
    });
  });

// ==============================
// HELPER FUNCTIONS
// ==============================

// CSV Parser
function parseCSV(csv) {
  const [headerLine, ...lines] = csv.trim().split('\n');
  const headers = headerLine.split(',').map(h => h.trim());
  return lines.map(line => {
    const values = line.split(',').map(v => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });
}

// Create a Gauge (half-doughnut chart)
function createGauge(canvasId, percent, label) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [label, ''],
      datasets: [{
        data: [percent, 100 - percent],
        backgroundColor: ['#d73027', '#eee'],
        borderWidth: 0
      }]
    },
    options: {
      circumference: 180,
      rotation: 270,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });
}

// Color Mapping for Risk Levels
function riskColor(level) {
  switch (level) {
    case 'Extreme': return '#FF337A';
    case 'High': return '#C9183B';
    case 'Moderate': return '#E0793E';
    case 'Low': return '#0E8142';
    case 'None': return '#91cf60';
    default: return '#ccc';
  }
}
