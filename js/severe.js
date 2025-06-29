// Track currently loaded layers
var currentDayLayer = null;
var outlookLayer = null;
var selectedMarker = null;
var currentDay = 1;

// Initialize the Leaflet map centered on the U.S.
var map = L.map('map').setView([39.5, -98.35], 4);

// Create a pane for facility points so they display above polygons
map.createPane('pointsPane');
map.getPane('pointsPane').style.zIndex = 650; // Ensure it's on top

// Add OpenStreetMap tile layer as the base map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

/**
 * Reset the info box to default message when no location is selected.
 */
function setDefaultLocationInfo() {
  document.querySelector('.location-info').innerHTML = `
    <div style="text-align:center; padding: 1rem;">
      <h2>Select a location for specific risk information</h2>
    </div>
  `;
}

/**
 * Update the info panel on the right with feature-specific risk data.
 * @param {Object} properties - The properties of the clicked GeoJSON feature
 */
function updateLocationInfo(properties) {
  let riskColor = properties.cat_color || '#ffffff'; // Use default color if missing

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
 * Load and display GeoJSON data for the selected day.
 * This includes facility point markers and SPC outlook polygons.
 * @param {number} dayNumber
 */
function loadDay(dayNumber) {
  currentDay = dayNumber;

  // Build file paths
  const pointFilePath = `data/SPC_Data/SPC_day_${dayNumber}.geojson`;
  const outlookFilePath = `data/SPC_Outlooks/SPCOutlook_day_${dayNumber}.geojson`;

  // Remove previously loaded facility layer
  if (currentDayLayer) {
    map.removeLayer(currentDayLayer);
  }

  // Remove previously loaded outlook polygon layer
  if (outlookLayer) {
    map.removeLayer(outlookLayer);
  }

  // Load facility points
  fetch(pointFilePath)
    .then(response => response.json())
    .then(data => {
      currentDayLayer = L.geoJSON(data, {
        onEachFeature: function (feature, layer) {
          layer.on('click', function () {
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
        },
        pointToLayer: function (feature, latlng) {
          let color = feature.properties.cat_color || '#808080';

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

          return marker;
        }
      }).addTo(map);

      setDefaultLocationInfo();
    });

  // Load outlook polygons
  fetch(outlookFilePath)
    .then(response => response.json())
    .then(data => {
      outlookLayer = L.geoJSON(data, {
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
    });
  }

/**
 * Handle clicks on empty parts of the map.
 * This resets the selected marker and location info panel.
 */
map.on('click', function () {
  if (selectedMarker) {
    selectedMarker.setStyle(selectedMarker.options._originalStyle);
    selectedMarker = null;
  }
  setDefaultLocationInfo();
});
