'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import venuesData from '@/public/data/venues.json';
import cctvData from '@/public/data/cctv_cams.json';
import busRoutes from '@/public/data/pattaya_baht_bus.geojson';
import LayerToggleHUD from './LayerToggleHUD';
import streamStatus from '@/public/data/stream_status.json';

export default function MapCanvas({ onSelectEntity, onMapInstance }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const layersRef = useRef({
    cctvActiveGroup: null,
    cctvDormantGroup: null,
    venueGroup: null,
    transitGroup: null,
  });

  const [showVenues, setShowVenues] = useState(true);
  const [showCams, setShowCams] = useState(false);
  const [showTransit, setShowTransit] = useState(true);
  const [bearing, setBearing] = useState(0);
  const [mapTheme, setMapTheme] = useState('dark');

  const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY || 'cb1_33su_1_683c1b500e92ad8b2069c2d2';

  const getTileUrl = useCallback((theme) => {
    return theme === 'light'
      ? `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`
      : `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`;
  }, [cartoKey]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('pattayacams_map_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setMapTheme(savedTheme);
      }
    }
  }, []);

  const handleToggleTheme = useCallback(() => {
    const nextTheme = mapTheme === 'dark' ? 'light' : 'dark';
    setMapTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pattayacams_map_theme', nextTheme);
    }
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(getTileUrl(nextTheme));
    }
  }, [mapTheme, getTileUrl]);

  const handleRotateBy = useCallback((delta) => {
    if (!mapRef.current) return;
    if (typeof mapRef.current.setBearing === 'function') {
      const current = mapRef.current.getBearing ? mapRef.current.getBearing() : 0;
      const next = (current + delta + 360) % 360;
      mapRef.current.setBearing(next);
      setBearing(Math.round(next));
    }
  }, []);

  const handleResetNorth = useCallback(() => {
    if (!mapRef.current) return;
    if (typeof mapRef.current.setBearing === 'function') {
      mapRef.current.setBearing(0);
      setBearing(0);
    }
  }, []);

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

      // Determine initial theme
      const currentTheme = typeof window !== 'undefined'
        ? localStorage.getItem('pattayacams_map_theme') || 'dark'
        : 'dark';

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

      Leaflet.control.zoom({ position: 'topright' }).addTo(map);

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
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          const tooltipContent = `
            <div style="font-family: inherit; font-size: 11px;">
              <div style="font-weight: 700; color: ${p.color}; margin-bottom: 2px;">${p.name}</div>
              <div style="color: #94A3B8; margin-bottom: 4px;">${p.name_th || ''}</div>
              <div style="display: flex; gap: 8px; font-family: monospace;">
                <span style="background: #26354A; padding: 2px 6px; border-radius: 4px; color: #10B981; font-weight: 700;">${p.fare_thb} THB</span>
                <span style="color: #E2E8F0;">${p.frequency || ''}</span>
              </div>
              <div style="margin-top: 4px; color: #CBD5E1; font-size: 10px;">${p.direction || ''}</div>
            </div>
          `;
          layer.bindTooltip(tooltipContent, {
            className: 'pattaya-dark-tooltip',
            sticky: true,
            direction: 'top',
          });
        },
      });
      transitGroup.addTo(map);

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

      // Add dormant group initially since showCams is false by default
      cctvDormantGroup.addTo(map);

      // 3. Hero Venues Layer Group (Live Pulsing vs Offline Dim Pins, 404 Pruned)
      const venueGroup = Leaflet.layerGroup();

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

      // Prune 404 / broken venues
      const activeVenues = venuesData.filter((venue) => {
        const statusInfo = streamStatus?.entities?.[`venue-${venue.slug}`];
        return statusInfo?.status !== 'error_404';
      });

      activeVenues.forEach((venue) => {
        const isSponsor = venue.is_sponsored;
        const iconEmoji = getCategoryIcon(venue.category, isSponsor);
        const statusInfo = streamStatus?.entities?.[`venue-${venue.slug}`];
        const isLive = statusInfo ? statusInfo.is_live : (venue.video_id != null);

        let htmlIcon;
        if (isLive) {
          htmlIcon = `
            <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <span style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${isSponsor ? '#EAB308' : '#FF2A6D'}; opacity: 0.7; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              <div style="position: relative; width: 32px; height: 32px; border-radius: 50%; background: ${isSponsor ? 'linear-gradient(135deg, #FACC15, #CA8A04)' : 'linear-gradient(135deg, #FF2A6D, #BE185D)'}; border: 2px solid #FFFFFF; box-shadow: 0 0 16px ${isSponsor ? '#EAB308' : '#FF2A6D'}; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
                ${iconEmoji}
              </div>
              <span style="position: absolute; top: -6px; right: -8px; background: #FF2A6D; color: white; font-size: 8px; font-weight: 900; font-family: monospace; padding: 1px 4px; border-radius: 4px; box-shadow: 0 0 8px #FF2A6D; border: 1px solid rgba(255,255,255,0.6); z-index: 10;">LIVE</span>
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

        const venueIcon = Leaflet.divIcon({
          className: 'custom-venue-marker-container',
          iconSize: isLive ? [38, 38] : [30, 30],
          iconAnchor: isLive ? [19, 19] : [15, 15],
          html: htmlIcon,
        });

        const marker = Leaflet.marker([venue.lat, venue.lng], {
          icon: venueIcon,
          zIndexOffset: isLive ? 1200 : 800,
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
          if (onSelectEntity) {
            onSelectEntity({
              ...venue,
              type: 'venue',
              is_live: isLive,
              last_live_at: statusInfo?.last_live_at || null,
            });
          }
        });
        venueGroup.addLayer(marker);
      });
      venueGroup.addTo(map);

      mapRef.current = map;
      layersRef.current = {
        cctvActiveGroup,
        cctvDormantGroup,
        venueGroup,
        transitGroup,
      };

      if (onMapInstance) {
        onMapInstance(map);
      }
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onSelectEntity, onMapInstance, getTileUrl]);

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
    const { transitGroup } = layersRef.current;
    if (!transitGroup) return;

    if (showTransit) {
      if (!mapRef.current.hasLayer(transitGroup)) mapRef.current.addLayer(transitGroup);
    } else {
      if (mapRef.current.hasLayer(transitGroup)) mapRef.current.removeLayer(transitGroup);
    }
  }, [showTransit]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-canvas">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls & Layer Toggle HUD */}
      <LayerToggleHUD
        showVenues={showVenues}
        setShowVenues={setShowVenues}
        showCams={showCams}
        setShowCams={setShowCams}
        showTransit={showTransit}
        setShowTransit={setShowTransit}
        venueCount={venuesData.filter(v => streamStatus?.entities?.[`venue-${v.slug}`]?.status !== 'error_404').length}
        camCount={cctvData.length}
        transitCount={busRoutes.features.length}
        bearing={bearing}
        onRotateLeft={() => handleRotateBy(-45)}
        onRotateRight={() => handleRotateBy(45)}
        onResetNorth={handleResetNorth}
        mapTheme={mapTheme}
        onToggleTheme={handleToggleTheme}
      />
    </div>
  );
}
