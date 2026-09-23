'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import venuesData from '@/public/data/venues.json';
import liveCamsData from '@/public/data/live_cams.json';
import cctvData from '@/public/data/cctv_cams.json';
import busRoutes from '@/public/data/pattaya_baht_bus.json';
import LayerToggleHUD from './LayerToggleHUD';
import SceneSelector from './SceneSelector';
import { useStreamStatus } from '@/src/hooks/useStreamStatus';
import { useRainViewer } from '@/src/hooks/useRainViewer';
import { getSunsetStatus } from '@/src/utils/suncalc';

export default function MapCanvas({ onSelectEntity, onMapInstance, onOpenKohLarn, onStartTour }) {
  const streamStatus = useStreamStatus();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const radarTileLayerRef = useRef(null);
  const zoomControlRef = useRef(null);
  const layersRef = useRef({
    cctvActiveGroup: null,
    cctvDormantGroup: null,
    venueGroup: null,
    liveCamGroup: null,
    transitGroup: null,
    ferryGroup: null,
    flightGroup: null,
    marineGroup: null,
  });

  const [showVenues, setShowVenues] = useState(true);
  const [showLiveCams, setShowLiveCams] = useState(true);
  const [showCams, setShowCams] = useState(true);
  const [showTransit, setShowTransit] = useState(true);
  const [showRadar, setShowRadar] = useState(false);
  const [bearing, setBearing] = useState(0);
  const [mapTheme, setMapTheme] = useState('auto');

  // Derive active scenes based on currently enabled layers
  const activeSceneIds = useMemo(() => {
    const ids = [];
    if (showRadar) ids.push('weather');
    if (showTransit) ids.push('transport');
    if (showLiveCams || showCams) ids.push('cams');
    if (showVenues) ids.push('venues');
    return ids;
  }, [showRadar, showTransit, showLiveCams, showCams, showVenues]);

  const radarState = useRainViewer(showRadar);

  const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY || 'cb1_33su_1_683c1b500e92ad8b2069c2d2';

  const getTileUrl = useCallback((theme) => {
    return theme === 'light'
      ? `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`
      : `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`;
  }, [cartoKey]);

  // Resolve a theme mode to its concrete light/dark value.
  // 'auto' follows Pattaya solar time (suncalc).
  const resolveTheme = useCallback((mode) => {
    if (mode === 'auto') {
      return getSunsetStatus(new Date()).isNight ? 'dark' : 'light';
    }
    return mode;
  }, []);

  // The concrete theme currently displayed (light or dark).
  const mapThemeEffective = resolveTheme(mapTheme);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('pattayacams_map_theme');
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto') {
        setMapTheme(savedTheme);
      } else {
        // Default to auto if no saved preference.
        setMapTheme('auto');
      }
    }
  }, []);

  const handleToggleScene = useCallback((scene) => {
    const isCurrentlyActive = activeSceneIds.includes(scene.id);
    const willActivate = !isCurrentlyActive;

    if (scene.id === 'weather') {
      setShowRadar(willActivate);
    } else if (scene.id === 'transport') {
      setShowTransit(willActivate);
    } else if (scene.id === 'cams') {
      setShowLiveCams(willActivate);
      setShowCams(willActivate);
    } else if (scene.id === 'venues') {
      setShowVenues(willActivate);
    }

    if (willActivate && scene.center && scene.zoom) {
      const map = mapRef.current;
      if (map) {
        try {
          if (typeof map.flyTo === 'function' && map._loaded) {
            map.flyTo(scene.center, scene.zoom, { duration: 1.5, easeLinearity: 0.25 });
          } else if (typeof map.setView === 'function') {
            map.setView(scene.center, scene.zoom);
          }
        } catch (e) {
          console.warn('Scene flyTo warning:', e);
        }
      }
    }
  }, [activeSceneIds]);

  const handleToggleTheme = useCallback(() => {
    // Cycle: auto → light → dark → auto
    const nextTheme =
      mapTheme === 'auto' ? 'light' :
      mapTheme === 'light' ? 'dark' :
      'auto';
    setMapTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pattayacams_map_theme', nextTheme);
    }
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(getTileUrl(resolveTheme(nextTheme)));
    }
  }, [mapTheme, getTileUrl, resolveTheme]);

  // Re-evaluate 'auto' theme every 60s so the map switches around sunset/sunrise.
  // Force a re-render by bumping a counter; mapThemeEffective is derived from mapTheme + current time.
  const [, setAutoTick] = useState(0);
  useEffect(() => {
    if (mapTheme !== 'auto') return undefined;
    const interval = setInterval(() => setAutoTick((n) => n + 1), 60_000);
    return () => clearInterval(interval);
  }, [mapTheme]);

  // When the resolved (effective) theme changes, swap the basemap tiles without remounting.
  useEffect(() => {
    if (!tileLayerRef.current) return;
    tileLayerRef.current.setUrl(getTileUrl(mapThemeEffective));
  }, [mapThemeEffective, getTileUrl]);

  const handleRotateBy = useCallback((delta) => {
    if (!mapRef.current) return;
    if (typeof mapRef.current.setBearing === 'function') {
      const current = mapRef.current.getBearing ? mapRef.current.getBearing() : 0;
      const next = (current + delta + 360) % 360;
      mapRef.current.setBearing(next);
      setBearing(Math.round(next));
    }
  }, []);

  const userLocationMarkerRef = useRef(null);

  const handleLocateMe = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pattayacams:toast', {
          detail: { kind: 'warn', message: 'Geolocation is not supported by your browser.' }
        }));
      }
      return;
    }

    // Pattaya + Koh Larn + Sattahip corridor — generous radius (~80 km) so
    // travellers in Bang Saen / Sattahip / Laem Chabang still get the green light.
    const PATTAYA_BBOX = { latMin: 12.40, latMax: 13.40, lonMin: 100.50, lonMax: 101.20 };
    const inPattayaArea = (lat, lon) =>
      lat >= PATTAYA_BBOX.latMin && lat <= PATTAYA_BBOX.latMax &&
      lon >= PATTAYA_BBOX.lonMin && lon <= PATTAYA_BBOX.lonMax;

    const dismissOutOfRangeToast = (() => {
      let handler = null;
      return () => {
        if (handler) window.removeEventListener('click', handler);
        handler = null;
      };
    })();

    const showOutOfRangeToast = (lat, lon) => {
      if (typeof window === 'undefined') return;
      dismissOutOfRangeToast();
      window.dispatchEvent(new CustomEvent('pattayacams:toast', {
        detail: {
          kind: 'warn',
          message:
            `📍 Whoa — you\u2019re at ${lat.toFixed(2)}\u00b0N, ${lon.toFixed(2)}\u00b0E, which is a long way from Pattaya! ` +
            `This radar only flies you to the action if you\u2019re actually on the Eastern Seaboard. ` +
            `Book a flight, captain \u2014 the Walking Street neon misses you. \ud83c\uddf9\ud83c\udded`,
        }
      }));
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        if (!inPattayaArea(latitude, longitude)) {
          showOutOfRangeToast(latitude, longitude);
          return;
        }

        const map = mapRef.current;
        if (!map) return;

        map.flyTo([latitude, longitude], 17, { duration: 1.5, easeLinearity: 0.25 });

        if (userLocationMarkerRef.current) {
          map.removeLayer(userLocationMarkerRef.current);
        }

        if (window.L) {
          const userIcon = window.L.divIcon({
            className: 'custom-user-location-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            html: `
              <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                <span style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: #00E5FF; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></span>
                <div style="width: 14px; height: 14px; border-radius: 50%; background: #00E5FF; border: 2.5px solid #FFFFFF; box-shadow: 0 0 12px #00E5FF;"></div>
              </div>
            `,
          });
          userLocationMarkerRef.current = window.L.marker([latitude, longitude], {
            icon: userIcon,
            zIndexOffset: 4000,
          }).addTo(map);

          userLocationMarkerRef.current.bindTooltip(
            '<div style="font-family: inherit; font-size: 11px; font-weight: 700; color: #00E5FF;">📍 You are here</div>',
            { className: 'pattaya-dark-tooltip', direction: 'top', offset: [0, -10] }
          ).openTooltip();
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not access your location. Please check browser location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleResetNorth = useCallback(() => {
    if (!mapRef.current) return;
    if (typeof mapRef.current.setBearing === 'function') {
      mapRef.current.setBearing(0);
      setBearing(0);
    }
  }, []);

  const populateVenueGroup = useCallback((group, Leaflet, currentStatus) => {
    if (!group || !Leaflet) return;
    group.clearLayers();

    const getCategoryIcon = (category, isSponsor) => {
      if (isSponsor) return '⭐';
      switch (category) {
        case 'dispensary': return '🌿';
        case 'webcam': return '📹';
        case 'sports_bar': return '⚽';
        case 'restaurant': return '🍜';
        case 'cafe': return '☕';
        case 'beach_club': return '🏖️';
        case 'lounge': return '✨';
        default: return '🍸';
      }
    };

    const activeVenues = venuesData.filter((venue) => {
      const statusInfo = currentStatus?.entities?.[`venue-${venue.slug}`] || currentStatus?.entities?.[venue.slug];
      return statusInfo?.status !== 'error_404';
    });

    activeVenues.forEach((venue) => {
      const isSponsor = Boolean(venue.is_sponsored);
      const iconEmoji = getCategoryIcon(venue.category, isSponsor);
      const statusInfo = currentStatus?.entities?.[`venue-${venue.slug}`] || currentStatus?.entities?.[venue.slug];
      const isLive = statusInfo ? Boolean(statusInfo.is_live) : false;

      let htmlIcon;
      if (isLive) {
        htmlIcon = `
          <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: ${isSponsor ? 50 : 20};">
            <span style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${isSponsor ? '#EAB308' : '#FF2A6D'}; opacity: 0.7; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></span>
            <div style="position: relative; width: 32px; height: 32px; border-radius: 50%; background: ${isSponsor ? 'linear-gradient(135deg, #FACC15, #CA8A04)' : 'linear-gradient(135deg, #FF2A6D, #BE185D)'}; border: 2px solid #FFFFFF; box-shadow: 0 0 18px ${isSponsor ? '#EAB308' : '#FF2A6D'}; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
              ${iconEmoji}
            </div>
            <span style="position: absolute; top: -6px; right: -8px; background: ${isSponsor ? '#EAB308' : '#FF2A6D'}; color: ${isSponsor ? '#0B0F17' : '#FFFFFF'}; font-size: 8px; font-weight: 900; font-family: monospace; padding: 1px 4px; border-radius: 4px; box-shadow: 0 0 8px ${isSponsor ? '#EAB308' : '#FF2A6D'}; border: 1px solid rgba(255,255,255,0.7); z-index: 10;">LIVE</span>
          </div>
        `;
      } else if (isSponsor) {
        htmlIcon = `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 45;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #161F30; border: 1.5px solid #475569; display: flex; align-items: center; justify-content: center; color: #94A3B8; font-size: 12px; filter: grayscale(50%); opacity: 0.65;">
              ${iconEmoji}
            </div>
            <span style="position: absolute; top: -3px; right: -3px; width: 15px; height: 15px; border-radius: 50%; background: #EAB308; color: #0B0F17; font-size: 10px; font-weight: 900; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,0.6); border: 1.5px solid #0B0F17; z-index: 50;">★</span>
          </div>
        `;
      } else {
        htmlIcon = `
          <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0.65;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #161F30; border: 1.5px solid #475569; display: flex; align-items: center; justify-content: center; color: #94A3B8; font-size: 12px; filter: grayscale(50%);">
              ${iconEmoji}
            </div>
          </div>
        `;
      }

      const iconDimension = isLive ? [38, 38] : (isSponsor ? [36, 36] : [30, 30]);
      const venueIcon = Leaflet.divIcon({
        className: 'custom-venue-marker-container',
        iconSize: iconDimension,
        iconAnchor: [iconDimension[0] / 2, iconDimension[1] / 2],
        html: htmlIcon,
      });

      // Featured venues always render on top of regular venues
      const marker = Leaflet.marker([venue.lat, venue.lng], {
        icon: venueIcon,
        zIndexOffset: isSponsor ? 3000 : (isLive ? 1200 : 800),
      });

      const categoryLabel = venue.category ? venue.category.toUpperCase().replace('_', ' ') : 'VENUE';
      marker.bindTooltip(
        `<div style="font-family: inherit; font-size: 11px;">
           <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
             <span style="background: ${isSponsor ? '#EAB308' : (isLive ? '#FF2A6D' : '#475569')}; color: ${isSponsor ? '#0B0F17' : '#FFFFFF'}; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px;">${categoryLabel}</span>
             <span style="color: ${isLive ? '#FF2A6D' : '#94A3B8'}; font-weight: 700; font-size: 10px;">${isLive ? '🔴 LIVE NOW' : '⚪ OFFLINE'}</span>
           </div>
           <strong style="color: #FFFFFF; font-size: 12px;">${venue.name}</strong>
           <div style="color: #94A3B8; font-size: 10px; margin-top: 2px;">Zone: ${venue.zone.replace('_', ' ')}</div>
         </div>`,
        { className: 'pattaya-dark-tooltip', direction: 'top', offset: [0, -14] }
      );

      marker.on('click', () => {
        const currentLiveStatus = streamStatusRef.current?.entities?.[`venue-${venue.slug}`] || streamStatusRef.current?.entities?.[venue.slug];
        const isLiveNow = currentLiveStatus ? Boolean(currentLiveStatus.is_live && !currentLiveStatus.is_upcoming) : isLive;
        const currentVideoId = currentLiveStatus?.video_id || venue.video_id;

        if (onSelectEntity) {
          onSelectEntity({
            ...venue,
            type: 'venue',
            is_live: isLiveNow,
            video_id: currentVideoId,
            last_live_at: currentLiveStatus?.last_live_at || statusInfo?.last_live_at || null,
          });
        }
      });
      group.addLayer(marker);
    });
  }, [onSelectEntity]);

  const populateLiveCamGroup = useCallback((group, Leaflet, currentStatus) => {
    if (!group || !Leaflet) return;
    group.clearLayers();

    liveCamsData.forEach((cam) => {
      const statusInfo = currentStatus?.entities?.[`livecam-${cam.slug}`] || currentStatus?.entities?.[cam.slug];
      const isLive = statusInfo ? Boolean(statusInfo.is_live) : true;

      let htmlIcon;
      if (isLive) {
        htmlIcon = `
          <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 40;">
            <span style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: #10B981; opacity: 0.75; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></span>
            <div style="position: relative; width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #10B981, #059669); border: 2px solid #FFFFFF; box-shadow: 0 0 16px #10B981; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
              📹
            </div>
            <span style="position: absolute; top: -6px; right: -8px; background: #10B981; color: #FFFFFF; font-size: 8px; font-weight: 900; font-family: monospace; padding: 1px 4px; border-radius: 4px; box-shadow: 0 0 8px #10B981; border: 1px solid rgba(255,255,255,0.7); z-index: 10;">LIVE</span>
          </div>
        `;
      } else {
        htmlIcon = `
          <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0.7;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #161F30; border: 1.5px solid #10B981; display: flex; align-items: center; justify-content: center; color: #10B981; font-size: 12px;">
              📹
            </div>
          </div>
        `;
      }

      const iconDimension = isLive ? [38, 38] : [30, 30];
      const camIcon = Leaflet.divIcon({
        className: 'custom-livecam-marker-container',
        iconSize: iconDimension,
        iconAnchor: [iconDimension[0] / 2, iconDimension[1] / 2],
        html: htmlIcon,
      });

      const marker = Leaflet.marker([cam.lat, cam.lng], {
        icon: camIcon,
        zIndexOffset: isLive ? 1500 : 900,
      });

      marker.bindTooltip(
        `<div style="font-family: inherit; font-size: 11px;">
           <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
             <span style="background: #10B981; color: #FFFFFF; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px;">24/7 LIVE CAM</span>
             <span style="color: ${isLive ? '#10B981' : '#94A3B8'}; font-weight: 700; font-size: 10px;">${isLive ? '🔴 LIVE NOW' : '⚪ OFFLINE'}</span>
           </div>
           <strong style="color: #FFFFFF; font-size: 12px;">${cam.name}</strong>
           <div style="color: #94A3B8; font-size: 10px; margin-top: 2px;">Channel: ${cam.youtube_handle}</div>
         </div>`,
        { className: 'pattaya-dark-tooltip', direction: 'top', offset: [0, -14] }
      );

      marker.on('click', () => {
        const currentLiveStatus = streamStatusRef.current?.entities?.[`livecam-${cam.slug}`] || streamStatusRef.current?.entities?.[cam.slug];
        const isLiveNow = currentLiveStatus ? Boolean(currentLiveStatus.is_live && !currentLiveStatus.is_upcoming) : isLive;
        const currentVideoId = currentLiveStatus?.video_id || cam.video_id;

        if (onSelectEntity) {
          onSelectEntity({
            ...cam,
            type: 'livecam',
            is_live: isLiveNow,
            video_id: currentVideoId,
            last_live_at: currentLiveStatus?.last_live_at || statusInfo?.last_live_at || null,
          });
        }
      });
      group.addLayer(marker);
    });
  }, [onSelectEntity]);

  const streamStatusRef = useRef(streamStatus);
  useEffect(() => {
    streamStatusRef.current = streamStatus;
  }, [streamStatus]);

  const populateVenueGroupRef = useRef(populateVenueGroup);
  useEffect(() => {
    populateVenueGroupRef.current = populateVenueGroup;
  }, [populateVenueGroup]);

  const populateLiveCamGroupRef = useRef(populateLiveCamGroup);
  useEffect(() => {
    populateLiveCamGroupRef.current = populateLiveCamGroup;
  }, [populateLiveCamGroup]);

  // Update venue and live cam markers when streamStatus changes
  useEffect(() => {
    if (layersRef.current?.venueGroup && typeof window !== 'undefined' && window.L) {
      populateVenueGroup(layersRef.current.venueGroup, window.L, streamStatus);
    }
    if (layersRef.current?.liveCamGroup && typeof window !== 'undefined' && window.L) {
      populateLiveCamGroup(layersRef.current.liveCamGroup, window.L, streamStatus);
    }
  }, [streamStatus, populateVenueGroup, populateLiveCamGroup]);

  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (!mapContainerRef.current || mapRef.current) return;

      const L = await import('leaflet');
      if (typeof window !== 'undefined') {
        window.L = L.default || L;
        try {
          require('leaflet-rotate');
        } catch (e) {
          console.warn('leaflet-rotate load warning', e);
        }
        try {
          require('leaflet.markercluster');
        } catch (e) {
          console.warn('MarkerCluster load warning', e);
        }
      }

      const Leaflet = L.default || L;

      // Determine initial theme — resolve from current mapTheme state ('auto' → light/dark).
      const currentTheme = resolveTheme(mapTheme);

      // Initialize map centered at Central Pattaya / Soi Buakhao with rotation support
      const map = Leaflet.map(mapContainerRef.current, {
        center: [12.9345, 100.8825],
        zoom: 14,
        minZoom: 11,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: true,
        rotate: true,
        bearing: 0,
        touchRotate: true,
        shiftKeyRotate: true,
      });

      // Zoom control lives at top-left (Leaflet default) — SceneSelector is at
      // top-right on mobile and centred on desktop, so no collision. Keeping
      // zoom at top-left keeps the Live Shuffle (bottom-right) and the Layers
      // panel (bottom-left) each clear of zoom buttons.
      const zoomControl = Leaflet.control.zoom({ position: 'topleft' }).addTo(map);
      zoomControlRef.current = zoomControl;

      // Listen for rotation changes
      map.on('rotate', () => {
        if (typeof map.getBearing === 'function') {
          setBearing(Math.round(map.getBearing() || 0));
        }
      });

      // CartoDB Tile Layer with API Key
      const initialTileUrl = getTileUrl(currentTheme);
      const tileLayer = Leaflet.tileLayer(initialTileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      // 1. Transit Vectors Layer Group
      const transitGroup = Leaflet.geoJSON(busRoutes, {
        style: (feature) => {
          const color = feature.properties?.color || '#3B82F6';
          return {
            color: color,
            weight: 5,
            opacity: 0.95,
            lineJoin: 'round',
            lineCap: 'round',
            className: 'leaflet-transit-flow',
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          const tooltipContent = `
            <div style="font-family: inherit; font-size: 11px; max-width: 260px;">
              <div style="font-weight: 700; color: ${p.color}; margin-bottom: 2px;">${p.name}</div>
              <div style="color: #94A3B8; margin-bottom: 4px;">${p.name_th || ''}</div>
              <div style="display: flex; gap: 8px; font-family: monospace; margin-bottom: 4px;">
                <span style="background: #26354A; padding: 2px 6px; border-radius: 4px; color: #10B981; font-weight: 700;">${p.fare_thb} THB</span>
                <span style="color: #E2E8F0;">${p.frequency || ''}</span>
              </div>
              <div style="color: #CBD5E1; font-size: 10px; margin-bottom: 3px;">${p.direction || ''}</div>
              ${p.description ? `<div style="color: #94A3B8; font-size: 10px; line-height: 1.3;">${p.description}</div>` : ''}
              ${p.streets ? `<div style="color: #64748B; font-size: 9px; margin-top: 3px; font-family: monospace;">Streets: ${p.streets}</div>` : ''}
            </div>
          `;
          layer.bindTooltip(tooltipContent, {
            className: 'pattaya-dark-tooltip',
            sticky: true,
            direction: 'top',
          });
        },
      });
      if (showTransit) {
        transitGroup.addTo(map);
      }

      // 2. Municipal CCTV Layer Groups:
      // A) Dormant Subtle Radar Dots (Default unselected view: 5px subtle dots, non-clickable, no clutter)
      const cctvDormantGroup = Leaflet.layerGroup();
      cctvData.forEach((cam) => {
        const dormantDot = Leaflet.circleMarker([cam.lat, cam.lng], {
          radius: 2.5,
          color: '#64748B',
          fillColor: '#94A3B8',
          fillOpacity: 0.35,
          weight: 0.5,
          interactive: false,
        });
        cctvDormantGroup.addLayer(dormantDot);
      });

      // B) Active CCTV Layer (Interactive 8px cyan glowing markers with tooltips and drawer trigger)
      const cctvActiveGroup = Leaflet.layerGroup();
      cctvData.forEach((cam) => {
        const cctvIcon = Leaflet.divIcon({
          className: 'custom-cctv-marker-container',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
          html: `
            <div style="width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #00E5FF; border: 1.5px solid #0B0F17; box-shadow: 0 0 6px #00E5FF; transition: transform 0.15s ease;"></div>
            </div>
          `,
        });

        const marker = Leaflet.marker([cam.lat, cam.lng], { icon: cctvIcon });
        marker.bindTooltip(
          `<div style="font-family: inherit; font-size: 11px;">
             <span style="color: #00E5FF; font-family: monospace; font-weight: 700; display: block;">${cam.camera_code || cam.id}</span>
             <strong style="color: #F8FAFC;">${cam.name_th || cam.name}</strong>
             <span style="display: block; color: #94A3B8; font-size: 10px;">District: ${cam.district || 'Pattaya'}</span>
           </div>`,
          { className: 'pattaya-dark-tooltip', direction: 'top', offset: [0, -6] }
        );
        marker.on('click', () => {
          if (onSelectEntity) {
            onSelectEntity({ ...cam, type: 'cctv' });
          }
        });
        cctvActiveGroup.addLayer(marker);
      });

      if (showCams) {
        cctvActiveGroup.addTo(map);
      } else {
        cctvDormantGroup.addTo(map);
      }

      // 3. Hero Venues Layer Group (Live Pulsing vs Offline Dim Pins, 404 Pruned)
      const venueGroup = Leaflet.layerGroup();
      if (populateVenueGroupRef.current) {
        populateVenueGroupRef.current(venueGroup, Leaflet, streamStatusRef.current);
      }
      venueGroup.addTo(map);

      // 4. 24/7 Live Webcams Layer Group (@pattayabob Beach Road & @ismannen Soi Buakhao)
      const liveCamGroup = Leaflet.layerGroup();
      if (populateLiveCamGroupRef.current) {
        populateLiveCamGroupRef.current(liveCamGroup, Leaflet, streamStatusRef.current);
      }
      liveCamGroup.addTo(map);

      // 5. Koh Larn Ferry Routes & Pier Pins (Two authentic sea routes: Bali Hai <-> Na Baan & Bali Hai <-> Tawaen)
      const ferryGroup = Leaflet.layerGroup();

      // Maritime Route 1: Bali Hai Pier ⇄ Na Baan Pier (Main Village Port - 100% Sea Navigation)
      const naBaanRouteCoords = [
        [12.9255, 100.8675], // Bali Hai Pier
        [12.9285, 100.8630], // Harbor mouth waypoint
        [12.9270, 100.8400], // Open Pattaya Bay corridor
        [12.9220, 100.8100], // Deep water channel
        [12.9189, 100.7877], // Na Baan Pier (East Koh Larn)
      ];
      const naBaanLine = Leaflet.polyline(naBaanRouteCoords, {
        color: '#06B6D4',
        weight: 2,
        opacity: 0.5,
        dashArray: '5, 8',
        lineCap: 'round',
        lineJoin: 'round',
      });
      naBaanLine.bindTooltip(
        `<div style="font-family: inherit; font-size: 11px;">
           <strong style="color: #22D3EE; font-size: 12px;">⛴️ Bali Hai ⇄ Na Baan Port (30฿)</strong>
           <div style="color: #94A3B8; font-size: 10px; margin-top: 2px;">Main Village Ferry • 45 min crossing</div>
           <div style="color: #38BDF8; font-size: 9px; margin-top: 2px; font-weight: 700;">Click to view full timetable & tide tracker</div>
         </div>`,
        { className: 'pattaya-dark-tooltip', direction: 'top' }
      );
      naBaanLine.on('click', () => {
        if (onOpenKohLarn) onOpenKohLarn();
      });
      ferryGroup.addLayer(naBaanLine);

      // Maritime Route 2: Bali Hai Pier ⇄ Tawaen Beach Pier (North Beach Port - Arcs around North Cape in Sea)
      const tawaenRouteCoords = [
        [12.9255, 100.8675], // Bali Hai Pier
        [12.9295, 100.8610], // Harbor exit
        [12.9350, 100.8350], // Northern bay open sea corridor
        [12.9370, 100.8000], // North of Koh Larn sea waypoint
        [12.9340, 100.7760], // Clearing cape in open waters
        [12.9238, 100.7788], // Tawaen Beach Pier
      ];
      const tawaenLine = Leaflet.polyline(tawaenRouteCoords, {
        color: '#06B6D4',
        weight: 2,
        opacity: 0.5,
        dashArray: '5, 8',
        lineCap: 'round',
        lineJoin: 'round',
      });
      tawaenLine.bindTooltip(
        `<div style="font-family: inherit; font-size: 11px;">
           <strong style="color: #22D3EE; font-size: 12px;">⛴️ Bali Hai ⇄ Tawaen Beach (30฿)</strong>
           <div style="color: #94A3B8; font-size: 10px; margin-top: 2px;">White Sand Beach Ferry • 45 min crossing</div>
           <div style="color: #38BDF8; font-size: 9px; margin-top: 2px; font-weight: 700;">Click to view full timetable & tide tracker</div>
         </div>`,
        { className: 'pattaya-dark-tooltip', direction: 'top' }
      );
      tawaenLine.on('click', () => {
        if (onOpenKohLarn) onOpenKohLarn();
      });
      ferryGroup.addLayer(tawaenLine);

      // Ferry Pier Pins with discreet boat emoji icon
      const piers = [
        {
          name: 'Bali Hai Pier (Pattaya)',
          sub: 'Main Ferry Terminal to Koh Larn',
          lat: 12.9255,
          lng: 100.8675,
        },
        {
          name: 'Na Baan Pier (Koh Larn)',
          sub: 'Koh Larn Village & Main Town Pier',
          lat: 12.9189,
          lng: 100.7877,
        },
        {
          name: 'Tawaen Beach Pier (Koh Larn)',
          sub: 'Direct Pier to Tawaen Beach & Watersports',
          lat: 12.9238,
          lng: 100.7788,
        },
      ];

      piers.forEach((pier) => {
        const pierIcon = Leaflet.divIcon({
          className: 'custom-ferry-marker',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
          html: `
            <div style="cursor: pointer; width: 26px; height: 26px; background: rgba(11, 19, 43, 0.85); border: 1.5px solid rgba(6, 182, 212, 0.7); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.5); font-size: 13px; transition: transform 0.2s ease, border-color 0.2s ease;" onmouseenter="this.style.transform='scale(1.25)'; this.style.borderColor='#22D3EE';" onmouseleave="this.style.transform='scale(1)'; this.style.borderColor='rgba(6, 182, 212, 0.7)';">
              <span>⛴️</span>
            </div>
          `,
        });

        const marker = Leaflet.marker([pier.lat, pier.lng], {
          icon: pierIcon,
          zIndexOffset: 2500,
        });

        marker.bindTooltip(
          `<div style="font-family: inherit; font-size: 11px;">
             <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
               <span style="background: #0891B2; color: #FFFFFF; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px;">FERRY PIER • 30฿</span>
             </div>
             <strong style="color: #FFFFFF; font-size: 12px;">${pier.name}</strong>
             <div style="color: #94A3B8; font-size: 10px; margin-top: 2px;">${pier.sub}</div>
             <div style="color: #22D3EE; font-size: 10px; margin-top: 3px; font-weight: 700;">Click to view 45-min ferry schedule & live tide tracker</div>
           </div>`,
          { className: 'pattaya-dark-tooltip', direction: 'top', offset: [0, -14] }
        );

        marker.on('click', () => {
          if (onOpenKohLarn) onOpenKohLarn();
        });

        ferryGroup.addLayer(marker);
      });

      if (showTransit) {
        ferryGroup.addTo(map);
      }

      // 6. Telemetry & Tactical Groups
      const marineGroup = Leaflet.layerGroup().addTo(map);

      mapRef.current = map;
      layersRef.current = {
        cctvActiveGroup,
        cctvDormantGroup,
        venueGroup,
        liveCamGroup,
        transitGroup,
        ferryGroup,
        marineGroup,
      };

      if (onMapInstance) {
        onMapInstance(map);
      }

      // Automatic container size observation for immediate tile recovery when unhiding
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        const resizeObserver = new ResizeObserver(() => {
          if (mapRef.current && typeof mapRef.current.invalidateSize === 'function') {
            try {
              mapRef.current.invalidateSize();
            } catch (e) {}
          }
        });
        resizeObserver.observe(mapContainerRef.current);
        map._resizeObserver = resizeObserver;
      }
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (zoomControlRef.current) {
        try {
          zoomControlRef.current.remove();
        } catch (e) {}
        zoomControlRef.current = null;
      }
      if (mapRef.current) {
        if (mapRef.current._resizeObserver) {
          mapRef.current._resizeObserver.disconnect();
        }
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onSelectEntity, onMapInstance, getTileUrl, resolveTheme]);

  // Handle Layer Visibility Toggles
  useEffect(() => {
    if (!mapRef.current) return;
    const { venueGroup } = layersRef.current;
    if (!venueGroup) return;

    if (showVenues) {
      if (!mapRef.current.hasLayer(venueGroup)) mapRef.current.addLayer(venueGroup);
    } else {
      if (mapRef.current.hasLayer(venueGroup)) mapRef.current.removeLayer(venueGroup);
    }
  }, [showVenues]);

  // 24/7 Live Cams Visibility Toggle
  useEffect(() => {
    if (!mapRef.current) return;
    const { liveCamGroup } = layersRef.current;
    if (!liveCamGroup) return;

    if (showLiveCams) {
      if (!mapRef.current.hasLayer(liveCamGroup)) mapRef.current.addLayer(liveCamGroup);
    } else {
      if (mapRef.current.hasLayer(liveCamGroup)) mapRef.current.removeLayer(liveCamGroup);
    }
  }, [showLiveCams]);

  // CCTV Toggle: Swap between Dormant subtle dots and Active cyan surveillance markers
  useEffect(() => {
    if (!mapRef.current) return;
    const { cctvActiveGroup, cctvDormantGroup } = layersRef.current;
    if (!cctvActiveGroup || !cctvDormantGroup) return;

    if (showCams) {
      if (mapRef.current.hasLayer(cctvDormantGroup)) {
        mapRef.current.removeLayer(cctvDormantGroup);
      }
      if (!mapRef.current.hasLayer(cctvActiveGroup)) {
        mapRef.current.addLayer(cctvActiveGroup);
      }
    } else {
      if (mapRef.current.hasLayer(cctvActiveGroup)) {
        mapRef.current.removeLayer(cctvActiveGroup);
      }
      if (!mapRef.current.hasLayer(cctvDormantGroup)) {
        mapRef.current.addLayer(cctvDormantGroup);
      }
    }
  }, [showCams]);

  useEffect(() => {
    if (!mapRef.current) return;
    const { transitGroup, ferryGroup } = layersRef.current;
    if (!transitGroup) return;

    if (showTransit) {
      if (!mapRef.current.hasLayer(transitGroup)) mapRef.current.addLayer(transitGroup);
      if (ferryGroup && !mapRef.current.hasLayer(ferryGroup)) mapRef.current.addLayer(ferryGroup);
    } else {
      if (mapRef.current.hasLayer(transitGroup)) mapRef.current.removeLayer(transitGroup);
      if (ferryGroup && mapRef.current.hasLayer(ferryGroup)) mapRef.current.removeLayer(ferryGroup);
    }
  }, [showTransit]);

  // Rain Radar Tile Layer Toggle & Frame Updates
  useEffect(() => {
    if (!mapRef.current) return;
    const Leaflet = typeof window !== 'undefined' ? window.L : null;
    if (!Leaflet) return;

    const tileUrl = radarState.getTileUrl ? radarState.getTileUrl(radarState.currentIdx) : null;

    if (showRadar && tileUrl) {
      if (!radarTileLayerRef.current) {
        const layer = Leaflet.tileLayer(tileUrl, {
          opacity: 0.65,
          maxNativeZoom: 7,
          maxZoom: 19,
          zIndex: 500,
        });
        layer.addTo(mapRef.current);
        radarTileLayerRef.current = layer;
      } else {
        radarTileLayerRef.current.setUrl(tileUrl);
      }
    } else {
      if (radarTileLayerRef.current) {
        if (mapRef.current.hasLayer(radarTileLayerRef.current)) {
          mapRef.current.removeLayer(radarTileLayerRef.current);
        }
        radarTileLayerRef.current = null;
      }
    }
  }, [showRadar, radarState.currentIdx, radarState]);

  // (Live Flights Layer removed — all open ADS-B sources blocked server IPs.
  //  See PLANS/2026-09-21-header-redesign.md for the architectural rationale.)
  return (
    <div className="relative w-full h-full overflow-hidden bg-canvas">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Curated Mission & Scene Selector (Top Center on md+, Top Right on mobile to avoid Leaflet zoom overlap) */}
      <div className="absolute top-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 z-20 pointer-events-auto max-w-[calc(100vw-1.5rem)] md:max-w-none">
        <SceneSelector
          activeSceneIds={activeSceneIds}
          onToggleScene={handleToggleScene}
        />
      </div>

      {/* Floating Map Controls & Layer Toggle HUD */}
      <LayerToggleHUD
        showVenues={showVenues}
        setShowVenues={setShowVenues}
        showLiveCams={showLiveCams}
        setShowLiveCams={setShowLiveCams}
        showCams={showCams}
        setShowCams={setShowCams}
        showTransit={showTransit}
        setShowTransit={setShowTransit}
        showRadar={showRadar}
        setShowRadar={setShowRadar}
        radarState={radarState}
        venueCount={venuesData.filter(v => streamStatus?.entities?.[`venue-${v.slug}`]?.status !== 'error_404').length}
        liveCamCount={liveCamsData.length}
        camCount={cctvData.length}
        transitCount={busRoutes.features.length}
        bearing={bearing}
        onRotateLeft={() => handleRotateBy(-45)}
        onRotateRight={() => handleRotateBy(45)}
        onResetNorth={handleResetNorth}
        mapTheme={mapTheme}
        mapThemeEffective={mapThemeEffective}
        onToggleTheme={handleToggleTheme}
        onLocateMe={handleLocateMe}
        onStartTour={onStartTour}
      />
    </div>
  );
}
