'use client';

import { useState, useEffect, useRef } from 'react';

const AISSTREAM_API_KEY = 'f96d25ad0e1aee593008f2c860bbd8dd685407ad';

// Pattaya Bay, Bali Hai, Koh Larn, Sattahip channel bounding box
const PATTAYA_BBOX = [[[12.75, 100.75], [13.05, 100.95]]];

// Fallback active passenger ferry tracks when AIS station has latency
const DEFAULT_FERRIES = [
  {
    mmsi: '567000101',
    name: 'KOH LARN EXPRESS 1',
    type: 'Passenger Ferry',
    lat: 12.9268,
    lng: 100.8520,
    sog: 11.2,
    cog: 268,
    lastSeen: Date.now(),
    isSimulated: true,
  },
  {
    mmsi: '567000102',
    name: 'BALI HAI RUNNER',
    type: 'Speedboat / Tender',
    lat: 12.9230,
    lng: 100.8210,
    sog: 18.5,
    cog: 92,
    lastSeen: Date.now(),
    isSimulated: true,
  }
];

export function useMarineTraffic(enabled = false) {
  const [vessels, setVessels] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const vesselMapRef = useRef(new Map());

  useEffect(() => {
    if (!enabled) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      setVessels([]);
      return;
    }

    // Seed with fallback ferries initially
    DEFAULT_FERRIES.forEach(f => vesselMapRef.current.set(f.mmsi, f));
    setVessels(Array.from(vesselMapRef.current.values()));

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

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
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
                isSimulated: false,
              };

              vesselMapRef.current.set(mmsi, updatedVessel);

              // Update vessels state throttled
              setVessels(Array.from(vesselMapRef.current.values()));
            }
          } catch (e) {
            // Ignore parse errors on stream
          }
        };

        ws.onerror = (err) => {
          console.warn('AISStream WebSocket warning:', err);
        };

        ws.onclose = () => {
          setIsConnected(false);
          if (enabled) {
            reconnectTimeout = setTimeout(connect, 8000);
          }
        };
      } catch (e) {
        console.warn('AISStream connection failed:', e);
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
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
