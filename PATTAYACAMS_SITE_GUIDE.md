# PattayaCams.com

> **Live Street Webcams, Beach Feeds & Interactive City Transit Radar**  
> *Tourism Information Service & Regional Transit Guide for Pattaya, Thailand*

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet)](https://leafletjs.com/)
[![Deployment](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com/)
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)](#)

---

## 🌴 Project Overview

**PattayaCams.com** is a high-performance, real-time map, multi-cam surveillance command dashboard, transit radar, and programmatic SEO engine for Pattaya, Chonburi, Thailand.

It aggregates live municipal CCTV feeds from Pattaya City Hall, 24/7 beach webcams, and authentic nightlife venue live streams from YouTube & Kick, paired with turn-by-turn Songthaew (Baht Bus) public transit loops, real-time Doppler rain radar, Koh Larn ferry nautical tracks, and an automated VOD portal (**PattayaVids**).

---

## 📸 Platform Previews

| Interactive Weather Radar & Map Canvas | PattayaVids VOD Portal |
| :---: | :---: |
| ![PattayaCams Weather Radar](/images/docs/pattayacams-weather-radar.png) | ![PattayaVids VOD Portal](/images/docs/pattayavids-vod-portal.png) |

---

## ⚡ Key Features

- **Interactive Dark & Light Map Engine**: Powered by Leaflet and licensed CartoDB Dark Matter / Positron basemaps with smooth 45° step rotation, interactive compass rose reset, theme toggling, and zero watermarks.
- **Tactical Sensor Overlays & Geolocation**: Instant one-click toggle through NVG (Night Vision Green), High-Contrast Noir, and Thermal FLIR sensor modes, alongside precision GPS geolocation.
- **Municipal CCTV Network & City Hall Integration**: 600 unclustered surveillance dots along all Pattaya arterial corridors. Displays official municipal telemetry, camera code, and direct link to the official Pattaya City Hall surveillance portal (`https://livestream.pattaya.go.th/`).
- **Real-Time Doppler Rain Radar**: Embedded RainViewer API layer with 10-minute past history and 30-minute forward precipitation forecasts, interactive timeline scrubber, and rain overlay toggle.
- **Hero Entertainment Venues & 24/7 Webcams**: 19 physical venues and 24/7 live webcams with high-visibility neon pink pulsing pins (`🔴 LIVE`) with active live stream radar pings vs dim slate pins (`⚪ OFFLINE`) for offline venues.
- **Automated Stream Health-Checker**: Quota-free GitHub Actions automation (`scripts/check_streams.mjs` + `.github/workflows/check_streams.yml`) probing YouTube handle redirects, verifying live broadcast flags, and strictly rejecting ended broadcasts and upcoming waiting rooms.
- **Multi-Cam Command Grid**: 2x2 and 3x3 multi-screen grid wall with randomized initial slots on first visit, browser `localStorage` slot persistence, and an interactive `🎲 Shuffle Lives` button to cycle streams.
- **Desktop Theater Mode**: VideoDrawer includes a Maximize/Minimize toggle expanding into an 800px+ 2-column widescreen desktop command console with unmuted autoplay YouTube audio.
- **🎲 Live Shuffle (City Roulette)**: Floating neon widget in the bottom corner of the map that dynamically repositions when drawer opens. Flies the map to an active live stream venue or displays interactive mobile phone viewer when dropping into an IRL creator's broadcast.
- **🎬 Automated Cinematic Drone Tour**: Auto-pilots the camera across Pattaya's primary hotspots (Bali Hai Pier, Walking Street, Soi Buakhao, Central Beach Road, Soi 6, and Pratumnak Hill Viewpoint).
- **2-Tier Tactical Telemetry Bar**: Permanent dual-tier situational panel featuring Indochina Time (ICT), Pattaya Bay Sunset & Golden Hour countdown, microclimate weather, PM2.5 air quality, wave swell & rip current advisory, nightlife vibe meter, Buddhist Dry Day alcohol ban alerts, and live THB FX rates.
- **Pattaya Creators & Venues Hub**: 55+ verified Pattaya creators and nightlife venues indexed on YouTube and Kick with a "Live Only" toggle, green Venue pins (`#10B981`), red YouTube badges (`#EF4444`), and bright green Kick badges (`#53FC18`).
- **PattayaVids VOD Portal**: Zero-quota RSS video scraper displaying completed episodes with automated exclusion of scheduled waiting rooms, live cams, and upcoming countdowns.
- **Default Active Transport Scene**: Automatic startup enablement of Songthaew transit loops, Koh Larn ferry nautical tracks, live ADS-B flight telemetry, and marine traffic.
- **Programmatic SEO & Schema.org JSON-LD**: 660+ statically pre-rendered HTML landing pages (`/venues/[slug]`, `/creators/[slug]`, `/cams/[slug]`), full `robots.txt`, dynamic `sitemap.xml`, high-res 1200x630 `og-image.jpg`, and valid Schema.org structured data.

---

## 🚌 Verified 2026 Songthaew (Baht Bus) Network

The transit layer reflects the **Official June 2026 Pattaya Songthaew Network Map**:

![Verified 2026 Pattaya Transit Map](/images/docs/pattaya-transit-map-2026.jpg)

### Fare Structure (Updated 2026)
- **Standard Fare (1–10 km)**: **15 THB** (increased from historic 10 THB baseline due to fuel & operating costs).
- **Extended Distance / Inter-Zone Routes**: **20 THB**.

### 4 Main Songthaew Transit Routes
1. **Beach Road Route (`#EF4444` Red)**:
   - *Description*: The easiest route for first-time visitors, running along Beach Road and Second Road through central Pattaya.
   - *Streets*: Dolphin Roundabout (Terminal 21) ➔ Beach Road (Southbound) ➔ South Pattaya Road ➔ Second Road (Northbound) ➔ Dolphin Roundabout.
   - *Direction*: Clockwise Loop (Beach Rd South ➔ Second Rd North).
   - *Frequency*: Every 1–2 minutes (24/7 continuous).
2. **Naklua Route (`#0284C7` Sky Blue)**:
   - *Description*: Connects central Pattaya with the Naklua area and local attractions such as Naklua Market.
   - *Streets*: Terminal 21 / Dolphin Roundabout ⇄ Pattaya-Naklua Road ⇄ Lan Pho Naklua Market.
   - *Direction*: Two-Way Corridor: Dolphin Roundabout ⇄ Naklua Market.
   - *Frequency*: Every 5–8 minutes (06:00 – 22:00).
3. **Jomtien Route (`#22C55E` Green)**:
   - *Description*: Runs south from Pattaya toward Jomtien Beach, making it easy to reach the beach area.
   - *Streets*: South Pattaya Road (Second Rd junction) ➔ Thappraya Road ➔ Jomtien Beach Road (to Chaiyapruek).
   - *Direction*: Two-Way Corridor: South Pattaya ⇄ Thappraya Rd ⇄ Jomtien Beach.
   - *Frequency*: Every 3–5 minutes (06:00 – 02:00).
4. **Soi Buakhao Route (`#2563EB` Navy Blue)**:
   - *Description*: Connects Pattaya Klang and Pattaya Tai through the Soi Buakhao area, popular with long-stay visitors and local residents.
   - *Streets*: Central Pattaya Road (Klang) ⇄ Soi Buakhao ⇄ South Pattaya Road (Tai).
   - *Direction*: Two-Way Corridor: Central Pattaya Rd ⇄ LK Metro ⇄ South Pattaya Rd.
   - *Frequency*: Every 2–3 minutes (24/7 continuous).

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 16 with Turbopack (App Router, Static HTML Export `output: 'export'`)
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Mapping**: Leaflet 1.9, `leaflet-rotate`, `leaflet.markercluster` (dynamically imported with client lifecycle isolation)
- **Tiles**: CartoDB Dark Matter & Positron (Licensed API Key)
- **Radar**: RainViewer Global Weather Radar API
- **Video Players**: Responsive YouTube Live embeds, Kick.com iFrame player, `hls.js` municipal stream wrapper
- **Icons**: `lucide-react`
- **State Persistence**: Browser `localStorage` (Zero server database needed)
- **Hosting Target**: Cloudflare Pages (Direct Git integration)

---

## 🤖 Live Pipeline & GitHub Actions Automation

The repository runs automated background workflows that update stream statuses without exceeding GitHub free tier quotas:

1. **Peak Pattaya Nightlife (18:00 – 04:00 ICT = 11:00 – 21:00 UTC)**:
   - Runs stream health check every 10 minutes (`*/10 11-21 * * *`).
2. **Off-Peak Daytime (04:00 – 18:00 ICT = 21:00 – 11:00 UTC)**:
   - Runs stream health check every 30 minutes (`*/30 0-10,22-23 * * *`).
3. **PattayaVids RSS Scraper**:
   - Runs every 3 hours pulling fresh video releases from 50+ Pattaya creators, sanitizing content and filtering out scheduled waiting rooms.

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18.17+ or 20+
- npm or pnpm

### Installation

```bash
# Clone repository
git clone https://github.com/plurino/pattayacams.git
cd pattayacams

# Install dependencies
npm install

# Start development server with Turbopack
npm run dev
```

Visit `http://localhost:3000` to view the application.

### Production Build

```bash
# Compile and export static bundle
npm run build
```

This generates a fully pre-rendered static distribution in the `/out` directory with 660+ HTML pages ready for Cloudflare Pages or AWS S3.

---

## 🌐 Custom Domain & Cloudflare Pages Configuration

### Connecting Namecheap Domain to Cloudflare Pages
1. In Cloudflare Pages dashboard, navigate to **PattayaCams > Custom domains**.
2. Add `pattayacams.com` and `www.pattayacams.com`.
3. In your Namecheap DNS management console:
   - **Type**: `CNAME Record` | **Host**: `@` | **Target**: `pattayacams.pages.dev` | **TTL**: Automatic
   - **Type**: `CNAME Record` | **Host**: `www` | **Target**: `pattayacams.pages.dev` | **TTL**: Automatic
4. Cloudflare automatically provisions a free Universal SSL certificate.

---

## 📄 License

Proprietary. All rights reserved. PattayaCams.com
