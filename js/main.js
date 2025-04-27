// Initialize the map
const map = L.map('map').setView([39.8283, -98.5795], 4); // Centered on USA

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);
