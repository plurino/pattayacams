import venuesData from '@/public/data/venues.json';
import cctvData from '@/public/data/cctv_cams.json';
import busRoutes from '@/public/data/pattaya_baht_bus.geojson';
import hotelsData from '@/public/data/hotels.json';
import streamersData from '@/public/data/roaming_streamers.json';

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 bg-canvas text-center">
      <div className="max-w-md p-8 bg-surface border border-borderDark rounded-2xl shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-surfaceLight border border-brandCyan/30 text-brandCyan text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-brandGreen animate-pulse"></span>
          600 Cams Online
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          PattayaCams.com
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Live Street Webcams, Beach Feeds & Interactive City Transit Radar
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs font-mono text-left">
          <div className="p-3 bg-surfaceLight/60 rounded-lg border border-borderDark">
            <span className="text-slate-400 block">CCTV Seed:</span>
            <span className="text-brandCyan font-semibold">{cctvData.length} Nodes</span>
          </div>
          <div className="p-3 bg-surfaceLight/60 rounded-lg border border-borderDark">
            <span className="text-slate-400 block">Venues:</span>
            <span className="text-brandPink font-semibold">{venuesData.length} Live Spots</span>
          </div>
          <div className="p-3 bg-surfaceLight/60 rounded-lg border border-borderDark">
            <span className="text-slate-400 block">Baht Bus Routes:</span>
            <span className="text-brandAmber font-semibold">{busRoutes.features.length} Lines</span>
          </div>
          <div className="p-3 bg-surfaceLight/60 rounded-lg border border-borderDark">
            <span className="text-slate-400 block">Roaming IRL:</span>
            <span className="text-brandGreen font-semibold">{streamersData.length} Walkers</span>
          </div>
        </div>
      </div>
    </main>
  );
}
