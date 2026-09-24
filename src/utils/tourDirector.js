// src/utils/tourDirector.js
// Automated cinematic drone tour director across Pattaya hotspots

export const TOUR_WAYPOINTS = [
  // Durations shortened to 5s per stop (Sep 2026) — the previous 10–11s dwell
  // made the tour feel stuck in one spot. The cinematic flyTo animation is
  // 2.5s, so 5s gives ~2.5s of settled "look around" time before moving on.
  { name: 'Bali Hai Pier', subtitle: 'Koh Larn Ferries & Harbor', coords: [12.9255, 100.8675], zoom: 16.5, duration: 5000 },
  { name: 'Walking Street', subtitle: 'Nightclubs & Neon Strip', coords: [12.9255, 100.8725], zoom: 17, duration: 5000 },
  { name: 'Soi Buakhao', subtitle: 'Tree Town & Bar Strip', coords: [12.9315, 100.8870], zoom: 17, duration: 5000 },
  { name: 'Central Beach Road', subtitle: 'Promenade & Waterfront', coords: [12.9380, 100.8840], zoom: 16.5, duration: 5000 },
  { name: 'Soi 6', subtitle: 'Party Corridor & Day Bars', coords: [12.9430, 100.8885], zoom: 17, duration: 5000 },
  { name: 'Pratumnak Hill Viewpoint', subtitle: 'Pattaya Bay Panorama', coords: [12.9221, 100.8659], zoom: 16, duration: 5000 },
];

export class TourDirector {
  constructor(map, onWaypointChange, onStop) {
    this.map = map;
    this.onWaypointChange = onWaypointChange;
    this.onStop = onStop;
    this.currentIndex = 0;
    this.timer = null;
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    this.currentIndex = 0;
    this.playNext();
  }

  playNext() {
    if (!this.isRunning || !this.map) return;
    const wp = TOUR_WAYPOINTS[this.currentIndex];
    if (this.onWaypointChange) {
      this.onWaypointChange(wp, this.currentIndex, TOUR_WAYPOINTS.length);
    }
    try {
      if (typeof this.map.flyTo === 'function' && this.map._loaded) {
        this.map.flyTo(wp.coords, wp.zoom, { duration: 2.5, easeLinearity: 0.25 });
      }
    } catch (e) {
      console.warn('Tour flyTo warning:', e);
    }

    this.timer = setTimeout(() => {
      if (!this.isRunning) return;
      this.currentIndex = (this.currentIndex + 1) % TOUR_WAYPOINTS.length;
      this.playNext();
    }, wp.duration);
  }

  stop() {
    this.isRunning = false;
    if (this.timer) clearTimeout(this.timer);
    if (this.onStop) this.onStop();
  }
}
