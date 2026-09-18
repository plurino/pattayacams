'use client';

import { useState, useEffect, useRef } from 'react';

const AISSTREAM_API_KEY = 'f96d25ad0e1aee593008f2c860bbd8dd685407ad';

// Expanded Pattaya Bay, Koh Larn, Laem Chabang & Sattahip Gulf corridor
const PATTAYA_BBOX = [[[12.40, 100.50], [13.40, 101.20]]];

export function useMarineTraffic(enabled = false) {
  const [vessels, setVessels] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const vesselMapRef = useRef(new Map());

  useEffect(() => {
    if (!enabled) {
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (_) {}
        socketRef.current = null;
      }
      setIsConnected(false);
      setVessels([]);
      vesselMapRef.current.clear();
      return;
    }

    let ws = null;
    let reconnectTimeout = null;

    function connect() {
      try {
        ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          const subMessage = {
            APIKey: AISSTREAM_API_KEY,
            BoundingBoxes: PATTAYA_BBOX,
            FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
          };
          ws.send(JSON.stringify(subMessage));
        };

        ws.onmessage = async (event) => {
          try {
            const rawText = typeof event.data === 'string' ? event.data : await event.data.text();
            const data = JSON.parse(rawText);
            const mmsi = data?.MetaData?.MMSI?.toString();
            if (!mmsi) return;

            const existing = vesselMapRef.current.get(mmsi) || {};
            const lat = data.MetaData.latitude;
            const lng = data.MetaData.longitude;
            const name = (data.MetaData.ShipName || existing.name || `MMSI-${mmsi}`).trim();

            if (typeof lat === 'number' && typeof lng === 'number') {
              const posReport = data.Message?.PositionReport;
              const updatedVessel = {
                mmsi,
                name: name || `VESSEL ${mmsi}`,
                lat,
                lng,
                sog: posReport?.Sog ?? existing.sog ?? 0,
                cog: posReport?.Cog ?? existing.cog ?? 0,
                heading: posReport?.TrueHeading ?? existing.heading ?? 0,
                type: data.Message?.ShipStaticData?.Type || existing.type || 'Marine Vessel',
                lastSeen: Date.now(),
              };

              vesselMapRef.current.set(mmsi, updatedVessel);

              // Prune vessels not seen in 20 minutes
              const now = Date.now();
              for (const [id, v] of vesselMapRef.current.entries()) {
                if (now - v.lastSeen > 20 * 60 * 1000) {
                  vesselMapRef.current.delete(id);
                }
              }

              setVessels(Array.from(vesselMapRef.current.values()));
            }
          } catch (_) {
            // Ignore parse errors on stream
          }
        };

        ws.onerror = () => {
          // Fail silently without loud console spam
        };

        ws.onclose = () => {
          setIsConnected(false);
          if (enabled) {
            reconnectTimeout = setTimeout(connect, 10000);
          }
        };
      } catch (_) {
        // Handle unexpected connection error
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (_) {}
        socketRef.current = null;
      }
    };
  }, [enabled]);

  return {
    vessels,
    count: vessels.length,
    isConnected,
  };
}
