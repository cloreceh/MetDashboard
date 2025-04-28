// Load CSV
fetch('data/LocationsRisk.csv')
  .then(response => response.text())
  .then(csvText => {
    const riskData = parseCSV(csvText);

    // Count risk categories
    const riskCategories = {
      "Extreme": 0,
      "High": 0,
      "Moderate": 0,
      "Low": 0,
      "None": 0
    };

    riskData.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== "Location") {
          const risk = row[key];
          if (riskCategories[risk] !== undefined) {
            riskCategories[risk]++;
          }
        }
      });
    });

    // Gauge Setup
    createGauge('extremeGauge', riskCategories['Extreme'], 'Extreme');
    createGauge('highGauge', riskCategories['High'], 'High');
    createGauge('mediumGauge', riskCategories['Moderate'], 'Moderate');
    createGauge('lowGauge', riskCategories['Low'], 'Low');
    createGauge('slightGauge', riskCategories['None'], 'None');

    // Pie Chart
    const ctxPie = document.getElementById('riskPieChart').getContext('2d');
    new Chart(ctxPie, {
      type: 'pie',
      data: {
        labels: Object.keys(riskCategories),
        datasets: [{
          data: Object.values(riskCategories),
          backgroundColor: ['#d73027', '#fc8d59', '#fee08b', '#d9ef8b', '#91cf60']
        }]
      }
    });

    // Bar Chart
    const locationLabels = riskData.map(r => r.Location);
    const moderateOrHigherCounts = riskData.map(r => {
      return Object.values(r).filter(v => ['Moderate', 'High', 'Extreme'].includes(v)).length;
    });

    const ctxBar = document.getElementById('riskBarChart').getContext('2d');
    new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: locationLabels,
        datasets: [{
          label: '% Moderate+ Risk',
          data: moderateOrHigherCounts,
          backgroundColor: '#66c2a5'
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

    // Risk Table
    const tableContainer = document.getElementById('riskTable');
    const header = document.createElement('div');
    header.className = 'risk-table-header';
    header.innerHTML = `<div style="width:150px">Location</div>
      <div style="width:50px">Fire</div>
      <div style="width:50px">Flood</div>
      <div style="width:50px">Severe</div>
      <div style="width:50px">Hurricane</div>
      <div style="width:50px">Wind</div>`;
    tableContainer.appendChild(header);

    riskData.forEach(row => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'risk-table-row';

      const locationDiv = document.createElement('div');
      locationDiv.style.width = '150px';
      locationDiv.style.textAlign = 'left';
      locationDiv.textContent = row.Location;
      rowDiv.appendChild(locationDiv);

      ['Fire Risk', 'Flooding Risk', 'Severe Risk', 'Hurricane Risk', 'High Wind Risk'].forEach(riskType => {
        const cell = document.createElement('div');
        cell.className = 'risk-table-cell';
        cell.style.backgroundColor = riskColor(row[riskType]);
        rowDiv.appendChild(cell);
      });

      tableContainer.appendChild(rowDiv);
    });

  });

// Parse CSV
function parseCSV(csv) {
  const [headerLine, ...lines] = csv.trim().split('\n');
  const headers = headerLine.split(',').map(h => h.trim());
  return lines.map(line => {
    const values = line.split(',').map(v => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });
}

// Create Gauge (half doughnut)
function createGauge(canvasId, value, label) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [label, ''],
      datasets: [{
        data: [value, 100 - value],
        backgroundColor: ['#d73027', '#eee'],
        borderWidth: 0
      }]
    },
    options: {
      circumference: 180,
      rotation: 270,
      cutout: '70%',
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// Color coding
function riskColor(level) {
  switch (level) {
    case 'Extreme': return '#d73027';
    case 'High': return '#fc8d59';
    case 'Moderate': return '#fee08b';
    case 'Low': return '#d9ef8b';
    case 'None': return '#91cf60';
    default: return '#ccc';
  }
}