// Initialize the map
const map = L.map('map').setView([39.8283, -98.5795], 4); // Centered on USA

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Load Locations points into Leaflet
fetch('data/Locations.geojson')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      onEachFeature: function (feature, layer) {
        // Customize popup to show location-specific information
        let popupContent = `<b>${feature.properties.Name || "Location"}</b><br>`;
        
        for (const key in feature.properties) {
          if (key !== "Name") {
            popupContent += `${key}: ${feature.properties[key]}<br>`;
          }
        }
        
        layer.bindPopup(popupContent);
      }
    }).addTo(map);
  });