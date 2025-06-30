// Initialize the map
const map = L.map('map', {attributionControl: false}).setView([39.5, -98.35], 4);
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