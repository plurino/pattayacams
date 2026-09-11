import venuesData from '@/public/data/venues.json';
import creatorsData from '@/public/data/creators.json';
import cctvData from '@/public/data/cctv_cams.json';

const BASE_URL = 'https://pattayacams.com';

export default function sitemap() {
  const now = new Date();

  const staticRoutes = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/creators`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  const venueRoutes = venuesData.map((v) => ({
    url: `${BASE_URL}/venues/${v.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const creatorRoutes = creatorsData.map((c) => ({
    url: `${BASE_URL}/creators/${c.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const cctvRoutes = cctvData.map((cam) => ({
    url: `${BASE_URL}/cams/${cam.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...venueRoutes, ...creatorRoutes, ...cctvRoutes];
}
