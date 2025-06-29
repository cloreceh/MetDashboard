// Track currently loaded layers
var currentDayLayer = null;
var outlookLayer = null;
var selectedMarker = null;
var currentDay = 1;

// Initialize the Leaflet map centered on the U.S.
var map = L.map('map').setView([39.5, -98.35], 4);

// Create custom panes to manage layer order
map.createPane('pointsPane');
map.getPane('pointsPane').style.zIndex = 650;

map.createPane('polygonPane');
map.getPane('polygonPane').style.zIndex = 200;

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

/**
 * Set default right-side info panel content.
 */
function setDefaultLocationInfo() {
  document.querySelector('.location-info').innerHTML = `
    <div style="text-align:center; padding: 1rem;">
      <h2>Select a location for specific risk information</h2>
    </div>
  `;
}

/**
 * Update info panel with clicked feature properties.
 */
function updateLocationInfo(properties) {
  let riskColor = properties.cat_color || '#ffffff';

  document.querySelector('.location-info').innerHTML = `
    <div style="padding:1rem;">
      <h3>Facility: ${properties.FACILITY_NAME || 'Unknown Facility'}</h3>
      <h2 style="color:${riskColor}; margin-top: 1rem;">Overall Severe Risk: ${properties.cat_risk || 'N/A'}</h2>

      <p><strong>Tornado Risk:</strong><br> ${properties.TORN_RISK || 'N/A'}</p>
      <p><strong>Significant Tornado Risk:</strong><br> ${properties.TORN_SIG_RISK || 'N/A'}</p>

      <p><strong>Hail Risk:</strong><br> ${properties.HAIL_RISK || 'N/A'}</p>
      <p><strong>Significant Hail Risk:</strong><br> ${properties.HAIL_SIG_RISK || 'N/A'}</p>

      <p><strong>High Wind Risk:</strong><br> ${properties.WIND_RISK || 'N/A'}</p>
      <p><strong>Significant High Wind Risk:</strong><br> ${properties.WIND_SIG_RISK || 'N/A'}</p>
    </div>
  `;
}

/**
 * Load facility and outlook data for selected day.
 */
function loadDay(dayNumber) {
  currentDay = dayNumber;

  const timestamp = `?t=${new Date().getTime()}`;
  const pointFilePath = `data/SPC_Data/SPC_day_${dayNumber}.geojson${timestamp}`;
  const outlookFilePath = `data/SPC_Outlooks/SPCOutlook_day_${dayNumber}.geojson${timestamp}`;

  console.log(`Loading Day ${dayNumber}`);
  console.log("Facility file:", pointFilePath);
  console.log("Outlook file:", outlookFilePath);

  if (currentDayLayer) map.removeLayer(currentDayLayer);
  if (outlookLayer) map.removeLayer(outlookLayer);

  // Load facilities
  fetch(pointFilePath)
    .then(response => {
      if (!response.ok) throw new Error(`Error loading facility data: ${response.status}`);
      return response.json();
    })
    .then(data => {
      currentDayLayer = L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          const color = feature.properties.cat_color || '#808080';

          let marker = L.circleMarker(latlng, {
            radius: 6,
            fillColor: color,
            color: "#000",
            weight: 1,
            fillOpacity: 0.8,
            pane: 'pointsPane'
          });

          marker.options._originalStyle = {
            radius: 6,
            fillColor: color,
            color: "#000",
            weight: 1,
            fillOpacity: 0.8
          };

          marker.on('add', function () {
            this.bringToFront();
          });

          return marker;
        },
        onEachFeature: function (feature, layer) {
          layer.on('click', function () {
            console.log("Clicked marker:", feature.properties);

            if (selectedMarker) {
              selectedMarker.setStyle(selectedMarker.options._originalStyle);
            }

            layer.setStyle({ radius: 10, weight: 2 });
            selectedMarker = layer;

            updateLocationInfo(feature.properties);
          });

          layer.on('mouseover', function () {
            if (layer !== selectedMarker) {
              layer.setStyle({ radius: 8, weight: 2 });
            }
          });

          layer.on('mouseout', function () {
            if (layer !== selectedMarker) {
              layer.setStyle(layer.options._originalStyle);
            }
          });
        }
      }).addTo(map);

      setDefaultLocationInfo();
    })
    .catch(error => console.error("Facility fetch error:", error));

  // Load polygons
  fetch(outlookFilePath)
    .then(response => {
      if (!response.ok) throw new Error(`Error loading outlook data: ${response.status}`);
      return response.json();
    })
    .then(data => {
      outlookLayer = L.geoJSON(data, {
        pane: 'polygonPane',
        style: function (feature) {
          return {
            color: feature.properties.stroke || '#3388ff',
            weight: 2,
            fillColor: feature.properties.fill || '#3388ff',
            fillOpacity: 0.3
          };
        },
        onEachFeature: function (feature, layer) {
          let label = feature.properties.LABEL || 'SPC Outlook';
          let label2 = feature.properties.LABEL2 || '';
          layer.bindPopup(`<h3>${label}</h3><p>${label2}</p>`);
        }
      }).addTo(map);
    })
    .catch(error => console.error("Outlook fetch error:", error));
}

// Handle map clicks to deselect markers
map.on('click', function () {
  if (selectedMarker) {
    selectedMarker.setStyle(selectedMarker.options._originalStyle);
    selectedMarker = null;
  }
  setDefaultLocationInfo();
});

// Load default day
loadDay(1);
