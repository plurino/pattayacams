/**
 * PattayaCams Tactical URL State Engine
 * 
 * Synchronizes map coordinates, active target locks, layer toggles, and view modes
 * with the browser URL using window.history.replaceState (zero-reload, zero-re-render overhead).
 * 
 * URL Parameters:
 * ?loc=lat,lng,zoom     e.g. ?loc=12.9345,100.8825,15
 * ?target=type:slug     e.g. ?target=venue:tree-town-market or ?target=cctv:cc-002
 * ?layers=v,c,t,r,f,m   Active map layers (venues, cctv, transit, radar, flights, marine)
 * ?view=map|grid|vids   Active application workspace view
 */

import venuesData from '@/public/data/venues.json';
import liveCamsData from '@/public/data/live_cams.json';
import cctvData from '@/public/data/cctv_cams.json';
import creatorsData from '@/public/data/creators.json';

/**
 * Synchronizes current app state into browser URL query parameters
 */
export function syncStateToUrl({ lat, lng, zoom, target, layers, view }) {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);

  // Map Coordinates & Zoom
  if (typeof lat === 'number' && typeof lng === 'number') {
    const z = typeof zoom === 'number' ? Math.round(zoom) : 14;
    url.searchParams.set('loc', `${lat.toFixed(4)},${lng.toFixed(4)},${z}`);
  }

  // Selected Target Entity
  if (target && target.slug) {
    const type = target.type || 'venue';
    url.searchParams.set('target', `${type}:${target.slug}`);
  } else if (target === null) {
    url.searchParams.delete('target');
  }

  // Active Map Layers
  if (layers && typeof layers === 'object') {
    const activeKeys = [];
    if (layers.showVenues) activeKeys.push('v');
    if (layers.showLiveCams) activeKeys.push('l');
    if (layers.showCams) activeKeys.push('c');
    if (layers.showTransit) activeKeys.push('t');
    if (layers.showRadar) activeKeys.push('r');
    if (layers.showFlights) activeKeys.push('f');
    if (layers.showMarine) activeKeys.push('m');

    if (activeKeys.length > 0) {
      url.searchParams.set('layers', activeKeys.join(','));
    } else {
      url.searchParams.delete('layers');
    }
  }

  // View Mode
  if (view) {
    if (view === 'map') {
      url.searchParams.delete('view'); // map is default
    } else {
      url.searchParams.set('view', view);
    }
  }

  // Replace URL without triggering Next.js routing transitions
  const newRelativePathQuery = url.pathname + url.search;
  window.history.replaceState({ path: newRelativePathQuery }, '', newRelativePathQuery);
}

/**
 * Parses initial URL parameters on client boot
 */
export function parseUrlState() {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);

  // Parse loc=lat,lng,zoom
  let loc = null;
  const locParam = params.get('loc');
  if (locParam) {
    const parts = locParam.split(',').map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      loc = {
        lat: parts[0],
        lng: parts[1],
        zoom: parts[2] && !isNaN(parts[2]) ? parts[2] : 15,
      };
    }
  }

  // Parse target=type:slug
  let targetSlug = null;
  let targetType = null;
  let resolvedTarget = null;
  const targetParam = params.get('target');
  if (targetParam) {
    if (targetParam.includes(':')) {
      const [t, s] = targetParam.split(':');
      targetType = t;
      targetSlug = s;
    } else {
      targetSlug = targetParam;
    }

    // Resolve target entity
    if (targetType === 'cctv') {
      const found = cctvData.find(c => c.slug === targetSlug || c.id === targetSlug || c.camera_code === targetSlug);
      if (found) resolvedTarget = { ...found, type: 'cctv' };
    } else if (targetType === 'livecam') {
      const found = liveCamsData.find(c => c.slug === targetSlug);
      if (found) resolvedTarget = { ...found, type: 'livecam' };
    } else if (targetType === 'creator' || targetType === 'streamer') {
      const found = creatorsData.find(c => c.slug === targetSlug || c.handle === targetSlug);
      if (found) resolvedTarget = { ...found, type: 'creator' };
    } else {
      // Try venue, then others
      const foundVenue = venuesData.find(v => v.slug === targetSlug);
      if (foundVenue) {
        resolvedTarget = { ...foundVenue, type: 'venue' };
      } else {
        const foundCam = liveCamsData.find(c => c.slug === targetSlug);
        if (foundCam) resolvedTarget = { ...foundCam, type: 'livecam' };
        else {
          const foundCctv = cctvData.find(c => c.slug === targetSlug || c.id === targetSlug);
          if (foundCctv) resolvedTarget = { ...foundCctv, type: 'cctv' };
        }
      }
    }
  }

  // Parse layers=v,l,c,t,r,f,m
  let layers = null;
  const layersParam = params.get('layers');
  if (layersParam) {
    const keys = layersParam.split(',').map(s => s.trim().toLowerCase());
    layers = {
      showVenues: keys.includes('v'),
      showLiveCams: keys.includes('l'),
      showCams: keys.includes('c'),
      showTransit: keys.includes('t'),
      showRadar: keys.includes('r'),
      showFlights: keys.includes('f'),
      showMarine: keys.includes('m'),
    };
  }

  // Parse view
  const view = params.get('view') || 'map';

  return {
    loc,
    target: resolvedTarget,
    layers,
    view,
  };
}
