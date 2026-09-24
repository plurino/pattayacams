'use client';

import { useEffect, useRef } from 'react';
import { useAirQuality } from '@/src/hooks/useAirQuality';

/**
 * AirQualityLayer — Leaflet overlay for the WAQI Pattaya air-quality station.
 *
 * Mounts a single Leaflet circleMarker at the Pattaya downtown anchor when
 * `visible` is true and a numeric AQI reading is available. Color comes from
 * the EPA AQI scale (0-500). If the reading is "Unhealthy" or worse (>= 151),
 * the marker pulses by periodically resizing the SVG circle radius — no CSS
 * edits to globals.css are required (this keeps the layer self-contained).
 *
 * Self-managed Leaflet import: we dynamic-import 'leaflet' to avoid SSR crashes
 * and match the pattern used by MapCanvas.jsx (`await import('leaflet')`).
 */

const PATTAYA_LAT = 12.9276;
const PATTAYA_LON = 100.8771;

// EPA AQI breakpoints → (maxAqi, hexColor, label)
const AQI_TIERS = [
  { max: 50, color: '#10B981', label: 'Good' },
  { max: 100, color: '#EAB308', label: 'Moderate' },
  { max: 150, color: '#F97316', label: 'Unhealthy for Sensitive Groups' },
  { max: 200, color: '#EF4444', label: 'Unhealthy' },
  { max: 300, color: '#A855F7', label: 'Very Unhealthy' },
  { max: Infinity, color: '#7F1D1D', label: 'Hazardous' },
];

function tierFor(aqi) {
  if (aqi === null || aqi === undefined) return null;
  for (const tier of AQI_TIERS) {
    if (aqi <= tier.max) return tier;
  }
  return AQI_TIERS[AQI_TIERS.length - 1];
}

function tooltipHtml({ aqi, label, pm25, station, distanceM }) {
  const stationLine = station ? `${escapeHtml(station)}` : 'Nearest WAQI station';
  const distLine = distanceM ? ` &middot; ${Math.round(distanceM).toLocaleString()} m` : '';
  const pmLine = pm25 !== null && pm25 !== undefined ? `PM2.5: ${pm25.toFixed(1)} µg/m³` : 'PM2.5: n/a';
  return `
    <div style="font-family: inherit; font-size: 11px; line-height: 1.35;">
      <span style="color: #F8FAFC; font-weight: 700; display: block;">Pattaya AQI: ${aqi} (${label})</span>
      <span style="color: #94A3B8; display: block;">${stationLine}${distLine}</span>
      <span style="color: #94A3B8; display: block;">${pmLine}</span>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function AirQualityLayer({ map, visible = false, lat = PATTAYA_LAT, lon = PATTAYA_LON }) {
  const { aqi, pm25, station, distanceM, error } = useAirQuality({ lat, lon });
  const markerRef = useRef(null);
  const pulseTimerRef = useRef(null);
  const baseRadiusRef = useRef(14);
  const currentTierRef = useRef(null);
  const tooltipRef = useRef(null);

  // Mount / update the circleMarker when AQI or visibility changes.
  useEffect(() => {
    if (!map) return undefined;
    if (!visible) return undefined;

    let cancelled = false;

    async function ensureMarker() {
      // Lazy-load Leaflet (same pattern as MapCanvas.jsx).
      const LeafletMod = await import('leaflet');
      const Leaflet = LeafletMod.default || LeafletMod;
      if (cancelled || !map) return;

      const tier = tierFor(aqi);
      currentTierRef.current = tier;
      const color = tier ? tier.color : '#64748B';

      const initialRadius = baseRadiusRef.current;
      const html = tooltipHtml({
        aqi,
        label: tier ? tier.label : 'Unavailable',
        pm25,
        station,
        distanceM,
      });

      if (!markerRef.current) {
        const marker = Leaflet.circleMarker([lat, lon], {
          radius: initialRadius,
          color: '#FFFFFF',
          weight: 2,
          opacity: 0.9,
          fillColor: color,
          fillOpacity: 0.85,
          interactive: true,
        });
        const tip = marker.bindTooltip(html, {
          permanent: false,
          direction: 'top',
          offset: [0, -8],
          className: 'pattaya-dark-tooltip',
          opacity: 1,
        });
        marker.addTo(map);
        markerRef.current = marker;
        tooltipRef.current = tip;
      } else {
        markerRef.current.setStyle({
          fillColor: color,
          color: '#FFFFFF',
        });
        markerRef.current.setLatLng([lat, lon]);
        if (tooltipRef.current) {
          tooltipRef.current.setContent(html);
        }
      }
    }

    ensureMarker();

    return () => {
      cancelled = true;
    };
  }, [map, visible, aqi, pm25, station, distanceM, lat, lon]);

  // Pulse animation when AQI is Unhealthy or worse (>= 151).
  useEffect(() => {
    if (!map || !markerRef.current) return undefined;
    if (aqi === null || aqi === undefined || aqi < 151) {
      // Stop any running pulse and snap radius back to base.
      if (pulseTimerRef.current) {
        clearInterval(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }
      if (markerRef.current && markerRef.current.setRadius) {
        markerRef.current.setRadius(baseRadiusRef.current);
      }
      return undefined;
    }

    let growing = true;
    const base = baseRadiusRef.current;
    const peak = base + 6;

    pulseTimerRef.current = setInterval(() => {
      const marker = markerRef.current;
      if (!marker || typeof marker.setRadius !== 'function') return;
      const current = marker.getRadius ? marker.getRadius() : base;
      const next = growing ? current + 1.5 : current - 1.5;
      if (next >= peak) growing = false;
      else if (next <= base) growing = true;
      marker.setRadius(next);
    }, 120);

    return () => {
      if (pulseTimerRef.current) {
        clearInterval(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }
      if (markerRef.current && markerRef.current.setRadius) {
        markerRef.current.setRadius(base);
      }
    };
  }, [map, aqi]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (pulseTimerRef.current) {
        clearInterval(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }
      if (markerRef.current && map && typeof map.hasLayer === 'function') {
        try {
          if (map.hasLayer(markerRef.current)) {
            map.removeLayer(markerRef.current);
          }
        } catch (_) {}
      }
      markerRef.current = null;
      tooltipRef.current = null;
    };
  }, [map]);

  // Nothing to render in the DOM — this is purely a Leaflet side-effect component.
  // AQI being null (cold start, error, or upstream `waqi_error`) → don't show marker.
  if (!visible || aqi === null || aqi === undefined) return null;
  return null;
}

export { PATTAYA_LAT, PATTAYA_LON, AQI_TIERS };