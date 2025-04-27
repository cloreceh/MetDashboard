var selectedMarker = null; // Track selected location

// Initialize the Leaflet map
var map = L.map('map').setView([39.5, -98.35], 4);

// Create a pane for points so they appear above polygons
map.createPane('pointsPane');
map.getPane('pointsPane').style.zIndex = 650; // Higher than polygons

// Add a base tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Set default instruction message
function setDefaultLocationInfo() {
  const infoBox = document.querySelector('.location-info');
  infoBox.innerHTML = `
    <div style="text-align:center; padding: 1rem;">
      <h2>Select a location for specific risk information</h2>
    </div>
  `;
}

// Update location info with feature properties
function updateLocationInfo(feature) {
  const infoBox = document.querySelector('.location-info');
  const properties = feature.properties;

  let riskColor = properties.CAT_COLOR || '#ffffff'; // Use RISK_COLOR if available

  infoBox.innerHTML = `
    <div style="padding:1rem;">
      <h3>Facility: ${properties.FACILITY_NAME || 'Unknown Facility'}</h3>
      <h2 style="color:${riskColor}; margin-top: 1rem;">Overall Severe Risk: ${properties.CAT_RISK || 'N/A'}</h2>

      <p style="margin-top:1rem;"><strong>Tornado Risk:</strong><br> ${properties.TORN_RISK || 'N/A'}</p>
      <p><strong>Significant Tornado Risk:</strong><br> ${properties.TORN_SIG_RISK || 'N/A'}</p>

      <p style="margin-top:1rem;"><strong>Hail Risk:</strong><br> ${properties.HAIL_RISK || 'N/A'}</p>
      <p><strong>Significant Hail Risk:</strong><br> ${properties.HAIL_SIG_RISK || 'N/A'}</p>

      <p style="margin-top:1rem;"><strong>High Wind Risk:</strong><br> ${properties.WIND_RISK || 'N/A'}</p>
      <p><strong>Significant High Wind Risk:</strong><br> ${properties.WIND_SIG_RISK || 'N/A'}</p>

      <div style="margin-top:2rem;">
        <p><strong>Forecaster Discussion:</strong><br>${properties.FORECASTER_DISCUSSION || 'No discussion available.'}</p>
      </div>
    </div>
  `;
}

// Load and add SPC.geojson points
fetch('data/SPC.geojson')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
        onEachFeature: function (feature, layer) {
            layer.on('click', function (e) {
              L.DomEvent.stopPropagation(e);
          
              if (selectedMarker) {
                selectedMarker.setStyle(selectedMarker.options._originalStyle);
              }
          
              // Highlight the clicked marker
              layer.setStyle({
                radius: 10,
                weight: 2
              });
          
              selectedMarker = layer;
          
              updateLocationInfo(feature);
            });
          
            // Hover effect: mouseover
            layer.on('mouseover', function (e) {
              if (layer !== selectedMarker) { // Only if not currently selected
                layer.setStyle({
                  radius: 8,
                  weight: 2
                });
              }
            });
          
            // Hover effect: mouseout
            layer.on('mouseout', function (e) {
              if (layer !== selectedMarker) { // Only if not currently selected
                layer.setStyle(layer.options._originalStyle);
              }
            });
      },
      pointToLayer: function (feature, latlng) {
        let color = feature.properties.CAT_COLOR || '#808080'; // Default to grey if missing

        const marker = L.circleMarker(latlng, { 
          radius: 6,
          fillColor: color,
          color: "#000",
          weight: 1,
          fillOpacity: 0.8,
          pane: 'pointsPane'
        });

        // Store the original style for easy resetting later
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

    // Set default instruction
    setDefaultLocationInfo();
  });

// Load and add SPCOutlook.geojson (polygons)
fetch('data/SPCOutlook.geojson')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
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

        layer.bindPopup(`
          <h3>${label}</h3>
          <p>${label2}</p>
        `);
      }
    }).addTo(map);
  });

// Handle clicks on empty map areas to reset selection
map.on('click', function (e) {
  if (selectedMarker) {
    selectedMarker.setStyle(selectedMarker.options._originalStyle);
    selectedMarker = null;
  }

  setDefaultLocationInfo();
});