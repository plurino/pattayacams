import React from 'react';
import CreatorDirectoryClient from '@/src/components/CreatorDirectoryClient';
import creatorsData from '@/public/data/creators.json';
import venuesData from '@/public/data/venues.json';
import streamStatus from '@/public/data/stream_status.json';

export const metadata = {
  title: 'Pattaya Creators & Live Venues Directory | PattayaCams.com',
  description: 'Browse 70+ Pattaya-based YouTube and Kick creators streaming live from beaches, walking streets, and local neighborhoods across the Eastern Seaboard.',
  openGraph: {
    title: 'Pattaya Creators & Live Venues Directory | PattayaCams.com',
    description: 'Browse 70+ Pattaya-based YouTube and Kick creators streaming live from beaches, walking streets, and local neighborhoods across the Eastern Seaboard.',
    url: 'https://pattayacams.com/creators/',
    type: 'website',
  },
};

export default function CreatorsIndexPage() {
  return (
    <CreatorDirectoryClient
      creators={creatorsData}
      venues={venuesData}
      streamStatus={streamStatus}
    />
  );
}
