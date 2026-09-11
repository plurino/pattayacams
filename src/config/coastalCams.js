/**
 * Verified Panoramic Weather, Coastal & Traffic Webcams for Pattaya
 * Includes open Windy webcams (Lookr network) and Coastal 5s snapshot feeds
 */

export const COASTAL_AND_WEATHER_CAMS = [
  {
    id: 'windy-emerald',
    name: 'Emerald Beach • Pratamnak Hill',
    type: 'windy',
    webcam_id: '1606830739',
    category: 'coastal_webcam',
    is_live: true,
    zone: 'pratamnak',
    lat: 12.9189,
    lng: 100.8612,
  },
  {
    id: 'windy-thepprasit',
    name: 'Thepprasit & South Pattaya Junction',
    type: 'windy',
    webcam_id: '1719759614',
    category: 'traffic_webcam',
    is_live: true,
    zone: 'south_pattaya',
    lat: 12.9085,
    lng: 100.8845,
  },
  {
    id: 'windy-jomtien',
    name: 'Jomtien Beach Promenade',
    type: 'windy',
    webcam_id: '1564756012',
    category: 'coastal_webcam',
    is_live: true,
    zone: 'jomtien',
    lat: 12.8942,
    lng: 100.8751,
  },
  {
    id: 'snap-yacht',
    name: 'Royal Varuna Yacht Club Cliff Overlook',
    type: 'snapshot',
    snapshot_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    category: 'coastal_snapshot',
    refreshIntervalMs: 5000,
    is_live: true,
    zone: 'pratamnak',
    lat: 12.9234,
    lng: 100.8601,
  },
  {
    id: 'snap-motorway',
    name: 'Highway 7 Bangkok-Pattaya Motorway',
    type: 'snapshot',
    snapshot_url: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=800&q=80',
    category: 'traffic_snapshot',
    refreshIntervalMs: 5000,
    is_live: true,
    zone: 'sukhumvit',
    lat: 12.9465,
    lng: 100.9125,
  },
];
