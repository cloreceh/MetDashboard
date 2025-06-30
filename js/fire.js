// Track state
let currentDayLayer = null;
let outlookLayer    = null;
let selectedMarker  = null;
let currentDay      = 1;

// Initialize the map
const map = L.map('map', {attributionControl: false}).setView([39.5, -98.35], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Panes for correct z-order
map.createPane('pointsPane').style.zIndex  = 650;
map.createPane('polygonPane').style.zIndex = 200;

/** Reset to default “no selection” message */
function setDefaultLocationInfo() {
  document.querySelector('.location-info').innerHTML = `
    <div style="display:flex; align-items:center; justify-content:center; height:100%;">
      <h2>Select a location for specific risk information</h2>
    </div>
  `;
}

/**
 * Update the info-box.
 * Accepts either a full GeoJSON Feature (with .properties) or just the properties object.
 */
function updateLocationInfo(input) {
  console.log("▶ updateLocationInfo got:", input);

  let props;
  if (input && input.properties) props = input.properties;
  else if (input && typeof input === 'object') props = input;
  else return setDefaultLocationInfo();

  const {
    LOCATION   = 'Unknown Facility',
    cat_color       = '#ffffff',
    outlook        = 'N/A',
    fireweather_risk       = 'N/A',
    dryT_risk   = 'N/A'
  } = props;

  document.querySelector('.location-info').innerHTML = `
    <div style="padding:1rem;">
      <h3>Facility: ${LOCATION}</h3>
      <h2 style="color:${cat_color}; margin-top:1rem;">
        Overall Fire Risk: ${outlook}
      </h2>
      <p style="margin-top:1rem;"><strong>Fire Weather Risk:</strong><br>${fireweather_risk}</p>
      <p><strong>Dry T risk:</strong><br>${dryT_risk}</p>
    </div>
  `;
}

/**
 * Load both the facility points and outlook polygons for a given day.
 */
function loadDay(dayNumber) {
  currentDay = dayNumber;
  const ts        = `?t=${Date.now()}`;
  // ◀ Changed here to point at your Fire_Data folder
  const pointsFP  = `data/Fire_Data/Fire_day_${dayNumber}.geojson${ts}`;
  // ◀ And here to point at your Fire_Outlooks folder
  const outlookFP = `data/Fire_Outlooks/FireOutlook_day_${dayNumber}.geojson${ts}`;

  console.log(`→ Loading Day ${dayNumber}`, { pointsFP, outlookFP });

  // Remove old layers, reset selection & info
  if (currentDayLayer) map.removeLayer(currentDayLayer);
  if (outlookLayer)    map.removeLayer(outlookLayer);
  selectedMarker = null;
  setDefaultLocationInfo();

  // 1) Facility points
  fetch(pointsFP)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(geojson => {
      const prevName = selectedMarker?.feature?.properties?.LOCATION || null;
      currentDayLayer = L.geoJSON(geojson, {
        pane: 'pointsPane',
        pointToLayer: (feature, latlng) => {
          const fill = feature.properties.cat_color || '#888888';
          const m = L.circleMarker(latlng, {
            radius: 6,
            fillColor: fill,
            color: '#000',
            weight: 1,
            fillOpacity: 0.8,
            pane: 'pointsPane'
          });
          m.options._originalStyle = { radius:6, fillColor:fill, color:'#000', weight:1, fillOpacity:0.8 };
          m.feature = feature;
          return m;
        },
        onEachFeature: (feature, layer) => {
          layer.on('click', e => {
            L.DomEvent.stopPropagation(e);
            if (selectedMarker) selectedMarker.setStyle(selectedMarker.options._originalStyle);
            layer.setStyle({ radius:10, weight:2 });
            selectedMarker = layer;
            updateLocationInfo(feature);
          });
          if (feature.properties.FACILITY_NAME === prevName) {
            layer.setStyle({ radius:10, weight:2 });
            selectedMarker = layer;
            updateLocationInfo(feature);
          }
        }
      }).addTo(map);
      if (!selectedMarker) setDefaultLocationInfo();
    })
    .catch(err => console.error('Facility fetch error:', err));

  // 2) Outlook polygons
  fetch(outlookFP)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(geojson => {
      outlookLayer = L.geoJSON(geojson, {
        pane: 'polygonPane',
        style: f => ({
          color: f.properties.stroke   || '#3388ff',
          weight: 2,
          fillColor: f.properties.fill || 'transparent',
          fillOpacity: 0.3
        }),
        onEachFeature: (feature, layer) => {
          const L1 = feature.properties.LABEL  || 'Outlook';
          const L2 = feature.properties.LABEL2 || '';
          layer.bindPopup(`<h3>${L1}</h3><p>${L2}</p>`);
        }
      }).addTo(map);
    })
    .catch(err => console.error('Outlook fetch error:', err));
}

// Clicking the map (not a marker) clears selection & panel
map.on('click', () => {
  if (selectedMarker) {
    selectedMarker.setStyle(selectedMarker.options._originalStyle);
    selectedMarker = null;
  }
  setDefaultLocationInfo();
});

// On page-load, grab Day 1
window.addEventListener('DOMContentLoaded', () => loadDay(1));