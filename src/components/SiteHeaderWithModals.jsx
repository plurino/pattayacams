'use client';

import React, { useState } from 'react';
import Navbar from './Navbar';
import TickerBar from './TickerBar';
import WeatherModal from './WeatherModal';
import KohLarnModal from './KohLarnModal';
import EventRadarModal from './EventRadarModal';
import NewsletterModal from './NewsletterModal';
import ContactModal from './ContactModal';
import CurrencyConverterModal from './CurrencyConverterModal';
import TouristEmergencyModal from './TouristEmergencyModal';
import { useTickerData } from '@/src/hooks/useTickerData';

export default function SiteHeaderWithModals({ viewMode = 'creators' }) {
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const [isKohLarnOpen, setIsKohLarnOpen] = useState(false);
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const { rates } = useTickerData();

  return (
    <>
      <Navbar viewMode={viewMode} />
      <TickerBar
        onOpenWeather={() => setIsWeatherOpen(true)}
        onOpenKohLarn={() => setIsKohLarnOpen(true)}
        onOpenEvents={() => setIsEventsOpen(true)}
        onOpenNewsletter={() => setIsNewsletterOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        onOpenConverter={() => setIsConverterOpen(true)}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
      />
      <WeatherModal isOpen={isWeatherOpen} onClose={() => setIsWeatherOpen(false)} />
      <KohLarnModal isOpen={isKohLarnOpen} onClose={() => setIsKohLarnOpen(false)} />
      <EventRadarModal isOpen={isEventsOpen} onClose={() => setIsEventsOpen(false)} />
      <NewsletterModal isOpen={isNewsletterOpen} onClose={() => setIsNewsletterOpen(false)} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      <CurrencyConverterModal isOpen={isConverterOpen} onClose={() => setIsConverterOpen(false)} rates={rates} />
      <TouristEmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />
    </>
  );
}
