// Track the selected location marker
var selectedMarker = null;

// Track the currently loaded GeoJSON layer for a given day
var currentDayLayer = null;

// Track the SPC Outlook (polygon) layer
var outlookLayer = null;

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
 * Load and display the GeoJSON file for a given day.
 * This replaces any previous day's data on the map.
 * @param {number} dayNumber - The day (1 through 8) to load
 */
function loadDay(dayNumber) {
  const filePath = `data/SPC_Data/SPC_day_${dayNumber}.geojson`; // Construct file path

  // Remove the previously loaded day layer from the map, if it exists
  if (currentDayLayer) {
    map.removeLayer(currentDayLayer);
  }

  // Fetch and display the GeoJSON for the selected day
  fetch(filePath)
    .then(response => response.json())
    .then(data => {
      // Add the GeoJSON data to the map with custom marker and interactivity
      currentDayLayer = L.geoJSON(data, {
        onEachFeature: function (feature, layer) {
          // When a marker is clicked
          layer.on('click', function () {
            // Reset previous selection
            if (selectedMarker) {
              selectedMarker.setStyle(selectedMarker.options._originalStyle);
            }

            // Highlight the selected marker
            layer.setStyle({ radius: 10, weight: 2 });
            selectedMarker = layer;

            // Show feature info in side panel
            updateLocationInfo(feature.properties);
          });

          // Marker hover styling
          layer.on('mouseover', function () {
            if (layer !== selectedMarker) {
              layer.setStyle({ radius: 8, weight: 2 });
            }
          });

          // Reset styling on mouse out
          layer.on('mouseout', function () {
            if (layer !== selectedMarker) {
              layer.setStyle(layer.options._originalStyle);
            }
          });
        },
        pointToLayer: function (feature, latlng) {
          let color = feature.properties.cat_color || '#808080'; // Default gray color

          // Create a circle marker for the facility
          let marker = L.circleMarker(latlng, {
            radius: 6,
            fillColor: color,
            color: "#000",
            weight: 1,
            fillOpacity: 0.8,
            pane: 'pointsPane'
          });

          // Save original style to reset later
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

      // Set default instructions in the info panel
      setDefaultLocationInfo();
    });
}

// Load Day 1 by default when the page loads
loadDay(1);

/**
 * Load and display the SPC Outlook polygons.
 */
fetch('data/SPCOutlook.geojson')
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
        // Add popup with label info
        let label = feature.properties.LABEL || 'SPC Outlook';
        let label2 = feature.properties.LABEL2 || '';
        layer.bindPopup(`<h3>${label}</h3><p>${label2}</p>`);
      }
    }).addTo(map);
  });

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
