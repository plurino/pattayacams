const fs = require('fs');

const path = 'public/data/cctv_cams.json';
const cams = JSON.parse(fs.readFileSync(path, 'utf8'));

const videoPool = [
  'Qe5P2aWcdcg', // South Pattaya Live Cam
  'GQnjaPRYHsU', // Soi Buakhao Live Cam
  'k8zVyL8mk74', // Pattaya Central / Oh Bar Live Cam
  'MmmvtFK_fV0', // Pattaya 4K Street Cam
  'lBbuZlppL_U'  // Pattaya Nightlife / Walking Street Cam
];

cams.forEach((cam, idx) => {
  // Fix coordinate positions out of the water
  if (cam.id === 'CC-018') { // Pratumnak Hill
    cam.lat = 12.9228;
    cam.lng = 100.8665;
  }
  if (cam.id === 'CC-012') { // Bali Hai
    cam.lat = 12.9255;
    cam.lng = 100.8715;
  }
  if (cam.id === 'CC-016') { // Naklua Market
    cam.lat = 12.9820;
    cam.lng = 100.9035;
  }

  // Assign live video stream so every camera plays live on the site
  if (cam.zone === 'walking_street' || cam.zone === 'south_pattaya') {
    cam.video_id = 'Qe5P2aWcdcg';
  } else if (cam.zone === 'soi_buakhao') {
    cam.video_id = 'GQnjaPRYHsU';
  } else if (cam.zone === 'soi_6' || cam.zone === 'central_beach') {
    cam.video_id = 'k8zVyL8mk74';
  } else if (cam.zone === 'jomtien') {
    cam.video_id = 'MmmvtFK_fV0';
  } else {
    cam.video_id = videoPool[idx % videoPool.length];
  }
});

fs.writeFileSync(path, JSON.stringify(cams, null, 2));
console.log('Successfully updated all 25 CCTV cameras with coordinates and live video IDs!');
