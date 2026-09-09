'use client';

import React, { useEffect, useRef, useState } from 'react';
import venuesData from '@/public/data/venues.json';
import cctvData from '@/public/data/cctv_cams.json';
import busRoutes from '@/public/data/pattaya_baht_bus.geojson';
import LayerToggleHUD from './LayerToggleHUD';

export default function MapCanvas({ onSelectEntity, onMapInstance }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({
    cctvCluster: null,
    venueGroup: null,
    transitGroup: null,
  });

  const [showVenues, setShowVenues] = useState(true);
  const [showCams, setShowCams] = useState(true);
  const [showTransit, setShowTransit] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Isolate Leaflet & MarkerCluster strictly within client mount
    async function initLeaflet() {
      if (!mapContainerRef.current || mapRef.current) return;

      const L = await import('leaflet');
      // Ensure markercluster plugin is attached to L
      // window.L must be defined for leaflet.markercluster if required
      if (typeof window !== 'undefined') {
        window.L = L.default || L;
        try {
          require('leaflet.markercluster');
        } catch (e) {
          console.warn('MarkerCluster load warning', e);
        }
      }

      const Leaflet = L.default || L;

      // Initialize map instance centered on Central Pattaya
      const map = Leaflet.map(mapContainerRef.current, {
        center: [12.9345, 100.8825],
        zoom: 14,
        minZoom: 11,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: true,
      });

      // Zoom control in top right
      Leaflet.control.zoom({ position: 'topright' }).addTo(map);

      // CartoDB Dark Matter Tile Layer
      Leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // 1. Transit Vectors Layer Group
      const transitGroup = Leaflet.geoJSON(busRoutes, {
        style: (feature) => ({
          color: feature.properties?.color || '#3B82F6',
          weight: 4,
          opacity: 0.9,
          lineJoin: 'round',
          dashArray: feature.properties?.route_id === 'beach-second-loop' ? null : '6, 6',
        }),
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

      // 2. Municipal CCTV Cluster Group
      const cctvCluster = Leaflet.markerClusterGroup ? Leaflet.markerClusterGroup({
        maxClusterRadius: 50,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        chunkedLoading: true,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          let sizeClass = 'marker-cluster-small';
          if (count > 20) sizeClass = 'marker-cluster-medium';
          if (count > 50) sizeClass = 'marker-cluster-large';
          return Leaflet.divIcon({
            html: `<div><span>${count}</span></div>`,
            className: `marker-cluster ${sizeClass}`,
            iconSize: Leaflet.point(36, 36),
          });
        },
      }) : Leaflet.layerGroup();

      cctvData.forEach((cam) => {
        const cctvIcon = Leaflet.divIcon({
          className: 'marker-cctv-cyan',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = Leaflet.marker([cam.lat, cam.lng], { icon: cctvIcon });
        marker.bindTooltip(
          `<div style="font-family: inherit; font-size: 11px;">
             <span style="color: #00E5FF; font-family: monospace; font-weight: 700; display: block;">${cam.id}</span>
             <strong style="color: #F8FAFC;">${cam.name}</strong>
             <span style="display: block; color: #94A3B8; font-size: 10px;">${cam.name_th}</span>
           </div>`,
          { className: 'pattaya-dark-tooltip', direction: 'top', offset: [0, -6] }
        );
        marker.on('click', () => {
          if (onSelectEntity) {
            onSelectEntity({ ...cam, type: 'cctv' });
          }
        });
        cctvCluster.addLayer(marker);
      });
      cctvCluster.addTo(map);

      // 3. Hero Venues Layer Group (Unclustered)
      const venueGroup = Leaflet.layerGroup();

      venuesData.forEach((venue) => {
        const isSponsor = venue.is_sponsored;
        const iconClass = isSponsor ? 'marker-venue-gold' : 'marker-venue-pink';
        const iconSize = isSponsor ? [28, 28] : [24, 24];
        const iconAnchor = isSponsor ? [14, 14] : [12, 12];

        const venueIcon = Leaflet.divIcon({
          className: iconClass,
          iconSize,
          iconAnchor,
          html: isSponsor
            ? '<span style="font-size: 12px;">⭐</span>'
            : '<span style="width: 8px; height: 8px; border-radius: 50%; background: #fff;"></span>',
        });

        const marker = Leaflet.marker([venue.lat, venue.lng], {
          icon: venueIcon,
          zIndexOffset: isSponsor ? 1000 : 500,
        });

        const categoryLabel = venue.category ? venue.category.toUpperCase().replace('_', ' ') : 'VENUE';
        marker.bindTooltip(
          `<div style="font-family: inherit; font-size: 11px;">
             <div style="display: flex; items-center; gap: 6px; margin-bottom: 2px;">
               <span style="background: ${isSponsor ? '#EAB308' : '#FF2A6D'}; color: #0B0F17; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px;">${categoryLabel}</span>
               ${isSponsor ? '<span style="color: #EAB308; font-weight: 700; font-size: 10px;">VIP PARTNER</span>' : ''}
             </div>
             <strong style="color: #FFFFFF; font-size: 12px;">${venue.name}</strong>
             <div style="color: #94A3B8; font-size: 10px; margin-top: 2px;">Zone: ${venue.zone}</div>
           </div>`,
          { className: 'pattaya-dark-tooltip', direction: 'top', offset: [0, -10] }
        );

        marker.on('click', () => {
          if (onSelectEntity) {
            onSelectEntity({ ...venue, type: 'venue' });
          }
        });
        venueGroup.addLayer(marker);
      });
      venueGroup.addTo(map);

      // Store references
      mapRef.current = map;
      layersRef.current = {
        cctvCluster,
        venueGroup,
        transitGroup,
      };

      if (onMapInstance) {
        onMapInstance(map);
      }

      if (isMounted) {
        setIsMapLoaded(true);
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
  }, [onSelectEntity, onMapInstance]);

  // Handle Layer Visibility Toggles
  useEffect(() => {
    if (!mapRef.current) return;
    const { venueGroup } = layersRef.current;
    if (!venueGroup) return;

    if (showVenues) {
      if (!mapRef.current.hasLayer(venueGroup)) {
        mapRef.current.addLayer(venueGroup);
      }
    } else {
      if (mapRef.current.hasLayer(venueGroup)) {
        mapRef.current.removeLayer(venueGroup);
      }
    }
  }, [showVenues]);

  useEffect(() => {
    if (!mapRef.current) return;
    const { cctvCluster } = layersRef.current;
    if (!cctvCluster) return;

    if (showCams) {
      if (!mapRef.current.hasLayer(cctvCluster)) {
        mapRef.current.addLayer(cctvCluster);
      }
    } else {
      if (mapRef.current.hasLayer(cctvCluster)) {
        mapRef.current.removeLayer(cctvCluster);
      }
    }
  }, [showCams]);

  useEffect(() => {
    if (!mapRef.current) return;
    const { transitGroup } = layersRef.current;
    if (!transitGroup) return;

    if (showTransit) {
      if (!mapRef.current.hasLayer(transitGroup)) {
        mapRef.current.addLayer(transitGroup);
      }
    } else {
      if (mapRef.current.hasLayer(transitGroup)) {
        mapRef.current.removeLayer(transitGroup);
      }
    }
  }, [showTransit]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-canvas">
      {/* Map Canvas Leaflet Target */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating HUD Layer Controller */}
      <LayerToggleHUD
        showVenues={showVenues}
        setShowVenues={setShowVenues}
        showCams={showCams}
        setShowCams={setShowCams}
        showTransit={showTransit}
        setShowTransit={setShowTransit}
        venueCount={venuesData.length}
        camCount={cctvData.length}
        transitCount={busRoutes.features.length}
      />
    </div>
  );
}
