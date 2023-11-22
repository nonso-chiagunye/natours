/* eslint-disable */
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoibm9uc28tY2hpYWd1bnllIiwiYSI6ImNsb3kxN295dzFrNDQybHMxdDVuNGxsZDAifQ.BaSb7_ugLx7mA6S4zIbskg';

  // mapboxgl.accessToken =
  //   'pk.eyJ1Ijoibm9uc28tY2hpYWd1bnllIiwiYSI6ImNsb3kyYzVkdTA4cWgyaW1xY3ZyaXd3eWEifQ.oPHutz1E9x20Cv7NK_m7pg';

  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v12', // style URL
    // center: [-118.27797801478653, 34.054413593834866], // starting position [lng, lat]
    // zoom: 9, // starting zoom
    // interactive: false,
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';
    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    // Extend map bounds to include current location

    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
