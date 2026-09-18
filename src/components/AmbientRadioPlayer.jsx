'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Radio, Play, Pause, Volume2, VolumeX } from 'lucide-react';

const RADIO_STREAMS = [
  'https://fabulous.thailandstreaming.net/fabulous.mp3',
  'https://media.onair.one:8200/stream/1/',
];

export default function AmbientRadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamIdx, setStreamIdx] = useState(0);
  const audioRef = useRef(null);

  const initAudio = (url) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(url);
    audio.preload = 'none';
    audio.crossOrigin = 'anonymous';

    audio.onplaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    audio.onwaiting = () => setIsLoading(true);
    audio.onerror = () => {
      // If primary failed, try fallback
      if (streamIdx + 1 < RADIO_STREAMS.length) {
        setStreamIdx((prev) => prev + 1);
        const nextUrl = RADIO_STREAMS[streamIdx + 1];
        initAudio(nextUrl);
        audioRef.current.play().catch(() => {
          setIsLoading(false);
          setIsPlaying(false);
        });
      } else {
        setIsLoading(false);
        setIsPlaying(false);
      }
    };
    audioRef.current = audio;
    return audio;
  };

  const togglePlay = () => {
    if (!audioRef.current) {
      initAudio(RADIO_STREAMS[streamIdx]);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
          setIsPlaying(false);
        });
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surfaceLight/40 hover:bg-surfaceLight/70 border border-borderDark/60 transition-all text-[11px] font-mono select-none">
      <button
        onClick={togglePlay}
        className="flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer"
        title={isPlaying ? 'Pause Fabulous 103 FM Live Radio' : 'Listen Live to Fabulous 103 FM Pattaya'}
      >
        <div className="relative flex items-center justify-center w-4 h-4">
          <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'text-brandPink' : 'text-slate-400'}`} />
          {isPlaying && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-brandPink animate-ping" />
          )}
        </div>
        <span className="text-[10px] font-bold text-slate-300 hidden md:inline">
          103 FM
        </span>
        <span className="p-0.5 rounded bg-surface border border-borderDark/80 flex items-center justify-center">
          {isLoading ? (
            <span className="w-2.5 h-2.5 border border-brandPink border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-2.5 h-2.5 fill-brandPink text-brandPink" />
          ) : (
            <Play className="w-2.5 h-2.5 fill-slate-300 text-slate-300" />
          )}
        </span>
      </button>

      {isPlaying && (
        <button
          onClick={toggleMute}
          className="text-slate-400 hover:text-white p-0.5 transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
}
