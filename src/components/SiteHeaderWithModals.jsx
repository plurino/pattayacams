'use client';

import React, { useState } from 'react';
import Navbar from './Navbar';
import TickerBar from './TickerBar';
import WeatherModal from './WeatherModal';
import KohLarnModal from './KohLarnModal';
import EventRadarModal from './EventRadarModal';
import NewsletterModal from './NewsletterModal';

export default function SiteHeaderWithModals({ viewMode = 'creators' }) {
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const [isKohLarnOpen, setIsKohLarnOpen] = useState(false);
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);

  return (
    <>
      <Navbar viewMode={viewMode} />
      <TickerBar
        onOpenWeather={() => setIsWeatherOpen(true)}
        onOpenKohLarn={() => setIsKohLarnOpen(true)}
        onOpenEvents={() => setIsEventsOpen(true)}
        onOpenNewsletter={() => setIsNewsletterOpen(true)}
      />
      <WeatherModal isOpen={isWeatherOpen} onClose={() => setIsWeatherOpen(false)} />
      <KohLarnModal isOpen={isKohLarnOpen} onClose={() => setIsKohLarnOpen(false)} />
      <EventRadarModal isOpen={isEventsOpen} onClose={() => setIsEventsOpen(false)} />
      <NewsletterModal isOpen={isNewsletterOpen} onClose={() => setIsNewsletterOpen(false)} />
    </>
  );
}
