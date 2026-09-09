import React from 'react';
import CreatorDirectoryClient from '@/src/components/CreatorDirectoryClient';
import creatorsData from '@/public/data/creators.json';
import streamStatus from '@/public/data/stream_status.json';

export const metadata = {
  title: 'Pattaya Creators & Live Streamers Directory | 50+ Channels & Vlogs',
  description: 'Explore 50+ Pattaya content creators, 4K walking tour vloggers, expat guides, and mobile IRL streamers on YouTube and Kick. Watch live broadcasts, latest uploads, and discover authentic local guides.',
  openGraph: {
    title: 'Pattaya Creators & Live Streamers Directory | PattayaCams.com',
    description: 'Explore 50+ Pattaya content creators, 4K walking tour vloggers, expat guides, and mobile IRL streamers on YouTube and Kick.',
    url: 'https://pattayacams.com/creators/',
    type: 'website',
  },
};

export default function CreatorsIndexPage() {
  return (
    <CreatorDirectoryClient
      creators={creatorsData}
      streamStatus={streamStatus}
    />
  );
}
