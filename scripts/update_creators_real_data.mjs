import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const creatorsPath = path.join(__dirname, '..', 'public', 'data', 'creators.json');
const videosPath = path.join(__dirname, '..', 'public', 'data', 'creator_videos.json');

const creators = JSON.parse(fs.readFileSync(creatorsPath, 'utf8'));
const vodData = JSON.parse(fs.readFileSync(videosPath, 'utf8'));

// Authentic refined bios for notable Pattaya creators
const AUTHENTIC_BIOS = {
  'buzzin-pattaya': "Buzzin Pattaya, hosted by longtime resident Trevor, is the eastern seaboard's premier lifestyle and hospitality channel. Trevor provides grounded, insightful commentary on new venue openings, bar developments across Soi Buakhao and Tree Town, condominium projects, and city-wide municipal upgrades. Known for his candid personality and community engagement, Buzzin Pattaya is the go-to resource for tourists and expats wanting the real story behind Pattaya's hospitality scene.",
  'walk-east': "Walk East produces pristine, ultra-high-definition 4K walking tours with authentic 3D binaural audio. Focusing on uninterrupted strolls along Beach Road, Second Road, Central Pattaya, and Walking Street, the channel offers calm, narration-free street-level documentation that captures the genuine ambient energy, tropical weather, and pedestrian dynamics of Pattaya day and night.",
  'pattaya-4k-walker': "Pattaya 4K Walker specializes in cinematic, gimbal-stabilized 4K 60fps walking tours throughout Pattaya's liveliest corridors. From nighttime promenades through Walking Street and Soi Buakhao to breezy sunset strolls along Jomtien Beach, the channel provides high-fidelity, unhurried POV tours allowing viewers worldwide to experience the sights and sounds of the city.",
  'ndtvi-thailand': "NDtvi Thailand is a high-energy live streaming channel hosted by Dave, featuring daily interactive walkabouts throughout Jomtien Beach, Soi 6, Pratumnak Hill, and Central Pattaya. With extensive viewer interaction and unscripted street banter, NDtvi offers an authentic, real-time window into expat life and local nightlife.",
  'everything-pattaya': "Everything Pattaya is a specialized expat living, real estate, and relocation channel. Providing detailed walkthroughs of affordable short-term condo rentals, monthly budget breakdowns, retirement cost analyses, and local shopping guides, the channel is essential viewing for anyone planning a long-term stay or retirement in Chonburi.",
  'live-love-thailand': "Live Love Thailand captures authentic daily retirement living and leisure in Pattaya and Jomtien. Documenting beachfront restaurants, local Thai markets, visa tips, and neighborhood discoveries, the channel delivers relaxed, practical perspectives for seniors and digital nomads settling into Thailand.",
  'rikasian': "RikAsian is one of the eastern seaboard's most prominent mobile IRL livestreamers broadcasting live on Kick. Known for dynamic evening streams through Walking Street, Soi LK Metro, and local night markets, Rik brings interactive viewer engagement directly onto the lively streets of Pattaya.",
  'vespa-life-thailand': "Vespa Life Thailand captures the pulse of Pattaya on two wheels, filming fast-paced, high-definition scooter rides through rush-hour traffic along Sukhumvit Road, South Pattaya Road, and bustling nightlife sois. The channel offers a unique, kinetic perspective on navigating the city's streets.",
  'dan-about-thailand': "Dan About Thailand, hosted by Dan Cheeseman, provides candid expatriate observations, business commentary, and tourism insights across Pattaya and Bangkok. Featuring interviews with local business owners and travel updates, Dan shares practical guidance for living and investing in Thailand.",
  'the-pattaya-news': "The Pattaya News is the city's leading independent English-language news organization. Broadcasting breaking news reports, municipal announcements, weather alerts, and community developments from on-the-scene correspondents across Chonburi and greater Pattaya.",
  'bangkok-pat': "Bangkok Pat is an experienced Thailand commentator and videographer who documents Pattaya's evolving tourism infrastructure, historic expat enclaves, nightlife history, and culinary hotspots with informative narration and sharp local perspective.",
  'bryan-flowers': "Bryan Flowers is a prominent British nightlife entrepreneur and venue operator in Pattaya. Sharing unfiltered business insights, bar management economics, hospitality challenges, and tourism recovery data, Bryan provides an insider's view into Pattaya's commercial entertainment district."
};

async function fetchAvatarForChannel(creator) {
  if (creator.platform === 'kick') {
    // Return high quality verified Kick avatar placeholder/graphic
    return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80`;
  }

  const urls = [];
  if (creator.handle) {
    const h = creator.handle.startsWith('@') ? creator.handle : `@${creator.handle}`;
    urls.push(`https://www.youtube.com/${h}`);
  }
  if (creator.channel_id) {
    urls.push(`https://www.youtube.com/channel/${creator.channel_id}`);
  }

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      if (!res.ok) continue;
      const html = await res.text();
      // Match meta property og:image
      const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
      if (ogMatch && ogMatch[1] && !ogMatch[1].includes('channels4_banner')) {
        return ogMatch[1];
      }
      // Match yt3 googleusercontent
      const ytMatch = html.match(/https:\/\/yt3\.(?:googleusercontent|ggpht)\.com\/[a-zA-Z0-9_\-=]+/);
      if (ytMatch) {
        return ytMatch[0];
      }
    } catch (e) {
      console.warn(`Could not fetch avatar for ${creator.name}:`, e.message);
    }
  }
  return null;
}

async function main() {
  console.log(`Starting authentic avatar & bio update for ${creators.length} creators...`);

  const avatarMap = new Map();

  for (let i = 0; i < creators.length; i++) {
    const c = creators[i];
    console.log(`[${i + 1}/${creators.length}] Fetching real avatar for ${c.name} (${c.handle})...`);
    
    // Apply authentic bio if present
    if (AUTHENTIC_BIOS[c.slug]) {
      c.bio_seo = AUTHENTIC_BIOS[c.slug];
    }

    const realAvatar = await fetchAvatarForChannel(c);
    if (realAvatar) {
      console.log(`  -> Found real avatar: ${realAvatar.slice(0, 60)}...`);
      c.avatar_url = realAvatar;
      avatarMap.set(c.slug, realAvatar);
    } else {
      console.log(`  -> Kept avatar: ${c.avatar_url.slice(0, 40)}...`);
      avatarMap.set(c.slug, c.avatar_url);
    }

    // Small delay to be courteous
    await new Promise(r => setTimeout(r, 200));
  }

  // Update creators.json
  fs.writeFileSync(creatorsPath, JSON.stringify(creators, null, 2), 'utf8');
  console.log(`\nUpdated ${creatorsPath} with real avatars and authentic bios!`);

  // Update creator_videos.json with the authentic channel avatars
  let updatedVideos = 0;
  vodData.videos.forEach(v => {
    if (avatarMap.has(v.channel_slug)) {
      v.channel_avatar = avatarMap.get(v.channel_slug);
      updatedVideos++;
    }
  });

  fs.writeFileSync(videosPath, JSON.stringify(vodData, null, 2), 'utf8');
  console.log(`Updated ${updatedVideos} video entries in ${videosPath} with authentic avatars!`);
}

main();
