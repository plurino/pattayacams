import React from 'react';
import CreatorDirectoryClient from '@/src/components/CreatorDirectoryClient';
import creatorsData from '@/public/data/creators.json';
import venuesData from '@/public/data/venues.json';
import streamStatus from '@/public/data/stream_status.json';

export const metadata = {
  title: 'Pattaya Creators & Live Venues Directory | 70+ Channels, Bars & Vlogs',
  description: 'Explore 70+ Pattaya content creators, nightlife live venues, 4K walking tour vloggers, expat guides, and mobile IRL streamers on YouTube and Kick. Watch live broadcasts, latest uploads, and discover authentic local guides.',
  openGraph: {
    title: 'Pattaya Creators & Live Venues Directory | PattayaCams.com',
    description: 'Explore 70+ Pattaya content creators, nightlife live venues, 4K walking tour vloggers, expat guides, and mobile IRL streamers on YouTube and Kick.',
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
