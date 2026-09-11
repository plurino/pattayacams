'use client';

import React, { useState } from 'react';
import { MapPin, ExternalLink, Share2, Compass, Clock, Bus, Check, Camera, ChevronLeft, ChevronRight, Navigation } from 'lucide-react';

export default function VenueDetailsClient({ venue }) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!venue) return null;

  const photos = venue.photos && venue.photos.length > 0 ? venue.photos : [
    { url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80', caption: 'Nightlife atmosphere in Pattaya' }
  ];

  const currentPhoto = photos[activePhotoIdx] || photos[0];

  const handleNextPhoto = () => {
    setActivePhotoIdx((prev) => (prev + 1) % photos.length);
  };

  const handlePrevPhoto = () => {
    setActivePhotoIdx((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const googleMapsUrl = venue.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${venue.lat},${venue.lng}`;

  const handleQuickShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(googleMapsUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // OpenStreetMap embed coordinates bounding box (0.003 deg delta ~ 300m)
  const lat = venue.lat;
  const lng = venue.lng;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.003}%2C${lat - 0.002}%2C${lng + 0.003}%2C${lat + 0.002}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. Curated Venue Photo Showcase */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-borderDark shadow-xl group">
        <img
          src={currentPhoto.url}
          alt={currentPhoto.caption || venue.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

        {/* Photo Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/15 text-[11px] font-mono text-white">
          <Camera className="w-3.5 h-3.5 text-brandCyan" />
          <span>Photo {activePhotoIdx + 1} of {photos.length}</span>
        </div>

        {/* Photo Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white transition-all hover:scale-110 shadow-lg"
              title="Previous Photo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white transition-all hover:scale-110 shadow-lg"
              title="Next Photo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Caption & Thumbnail Strip */}
        <div className="absolute bottom-3 inset-x-3 flex flex-col gap-2 z-10">
          {currentPhoto.caption && (
            <p className="text-xs sm:text-sm font-medium text-white drop-shadow-md line-clamp-1">
              {currentPhoto.caption}
            </p>
          )}

          {photos.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {photos.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative h-10 w-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    activePhotoIdx === idx
                      ? 'border-brandCyan scale-105 shadow-[0_0_10px_rgba(0,229,255,0.6)]'
                      : 'border-white/30 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Interactive Map Preview & Quick Share Location */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-borderDark flex flex-col gap-3.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brandCyan" />
            <span className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
              Exact Location & Google Maps
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-canvas px-2 py-0.5 rounded border border-borderDark">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </div>

        {/* Embedded Map Canvas Preview */}
        <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden border border-borderDark bg-black shadow-inner">
          <iframe
            src={osmEmbedUrl}
            title={`Location Map for ${venue.name}`}
            className="w-full h-full border-0 pointer-events-auto"
            loading="lazy"
          />
          {/* Centered Map Marker Callout Overlay */}
          <div className="absolute top-2 left-2 z-10 pointer-events-none bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-borderDark text-[11px] font-mono text-slate-200">
            📍 <strong className="text-white">{venue.name}</strong> ({venue.zone?.replace('_', ' ')})
          </div>
        </div>

        {/* Quick Share & Map Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* 1. Quick Share Location Button */}
          <button
            onClick={handleQuickShare}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer ${
              copiedLink
                ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-brandPink to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-[0_0_12px_rgba(255,42,109,0.35)]'
            }`}
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4" />
                <span>✓ Location Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Quick Share Location</span>
              </>
            )}
          </button>

          {/* 2. Open in Google Maps */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-surfaceLight hover:bg-slate-700 border border-borderDark hover:border-slate-500 text-slate-100 font-semibold text-xs transition-all shadow-sm"
          >
            <Compass className="w-4 h-4 text-brandCyan" />
            <span>Open Google Maps</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* 3. Apple Maps / Navigation */}
          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-surfaceLight hover:bg-slate-700 border border-borderDark hover:border-slate-500 text-slate-100 font-semibold text-xs transition-all shadow-sm"
          >
            <Navigation className="w-4 h-4 text-brandAmber" />
            <span>Get Directions</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* 3. Transit Tips & Operating Hours Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Transit Tip */}
        <div className="p-3.5 rounded-xl bg-surface border border-borderDark flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-brandCyan">
            <Bus className="w-3.5 h-3.5" />
            <span>How to Get There (Songthaew)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {venue.transit_tip || 'Hop on the local 10-THB Songthaew Baht Bus along Beach Road or Second Road to reach this venue.'}
          </p>
        </div>

        {/* Operating Hours & Peak Vibe */}
        <div className="p-3.5 rounded-xl bg-surface border border-borderDark flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Hours & Peak Vibe</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {venue.opening_hours || '3:00 PM – 2:00 AM daily • Peak Vibe: 8:30 PM – Midnight'}
          </p>
        </div>
      </div>
    </div>
  );
}
