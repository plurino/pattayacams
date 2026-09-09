# PattayaCams.com

> **Live Street Webcams, Beach Feeds & Interactive City Transit Radar**  
> *Tourism Information Service & Regional Transit Guide for Pattaya, Thailand*

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet)](https://leafletjs.com/)
[![Deployment](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com/)
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)](#)

---

## 🌴 Project Overview

**PattayaCams.com** is a high-performance, real-time map, multi-cam surveillance command dashboard, transit radar, and programmatic SEO engine for Pattaya, Chonburi, Thailand.

It aggregates live municipal CCTV feeds from Pattaya City Hall and commercial venue live streams from YouTube, paired with Songthaew (Baht Bus) public transit vectors, high-intent travel conversion cards (private airport transfers, dynamic weekend hotel rates, eSIMs), and crowd telemetry.

---

## 🗺️ Map Tiles & API Key FAQ

**Q: Does PattayaCams.com require an API key or paid Google Maps subscription?**  
**A: NO.** The map engine uses **Leaflet** paired with **CartoDB Dark Matter / OpenStreetMap tiles**, which are **100% free with NO API key, credit card, or billing required**.  
*(Note: If you see an API key warning when clicking external City Hall links, that is because Pattaya City Hall's third-party government portal has an unconfigured Google Maps key on their own server. PattayaCams itself does not require any API keys).*

---

## ⚡ Key Features

- **Interactive Dark Map Engine**: Powered by Leaflet and licensed CartoDB Dark Matter tiles (`cb1_33su_1_683c1b500e92ad8b2069c2d2`) with zero watermarks and zero client-side fetch waterfall.
- **Municipal CCTV Network**: 600 unclustered individual 8px cyan dots (`#00E5FF`) along all city streets and junctions. Disabled by default (`cctv: false`) for maximum performance, with an informative municipal network disclaimer toast on activation.
- **Hero Entertainment Venues**: High-visibility neon pink pulsing pins (`🔴 LIVE`) with active live stream radar pings vs dim slate pins (`⚪ OFFLINE`) for offline venues.
- **Automated Stream Health-Checker**: Quota-free 15-minute GitHub Actions automation (`scripts/check_streams.mjs` + `.github/workflows/check_streams.yml`) probing YouTube handle redirects without burning API quota.
- **Multi-Cam Command Grid**: 2x2 multi-screen grid wall with municipal CCTVs completely excluded from the dropdown selector and slots auto-populated with active live YouTube feeds.
- **Desktop Theater Mode**: VideoDrawer includes a Maximize/Minimize toggle expanding into an 800px+ 2-column widescreen desktop command console.
- **Offline Telemetry Standby Card**: Inactive venues render an offline card with radio icon, relative timestamp ("Last live recently"), and YouTube channel CTA (zero broken iframes or black screens).
- **🎲 Live Shuffle (City Roulette)**: Glowing neon button in the top navbar that randomly selects an active live stream, smoothly flies the map (`zoom: 17`), and opens the VideoDrawer for immediate playback.
- **Pattaya Live Streamers Dock**: Footer dock tracking active live creators (e.g. *Pattaya Beach Live*), auto-collapsing to a minimal `[ ⚪ 0 Streamers Live ]` pill with optional 4K walking channel expansion.
- **Songthaew (Baht Bus) Transit Vectors**: Road-aligned GeoJSON paths snapped to OpenStreetMap centerlines with interactive tooltips showing loop direction, frequency, and 10 THB fixed fare:
  1. *Beach Rd & Second Rd Circular Loop* (`#3B82F6`)
  2. *South Pattaya to Jomtien Beach Line* (`#10B981`)
  3. *Dolphin Roundabout to Naklua Fish Market* (`#F59E0B`)
- **Central Feature Flags & Zero Ad Gaps**: Configured via `src/config/features.js` (`FEATURES.SHOW_AFFILIATE_ADS`). All affiliate ad containers (12Go, Agoda, Airalo, Aviasales) gracefully disappear when disabled with zero blank gaps.
- **Self-Serve B2B Sponsorship**: `⭐ List Venue` button opening the high-conversion pricing modal (30-day and 90-day seasonal tiers with PromptPay QR and Stripe options).
- **Programmatic SSG SEO**: 623 pre-rendered physical HTML landing pages (`/venues/[slug]/index.html` and `/cams/[slug]/index.html`) generated via Next.js `generateStaticParams()` with `trailingSlash: true`.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, Static HTML Export `output: 'export'`)
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Mapping**: Leaflet 1.9, Leaflet.markercluster (dynamically imported with client lifecycle isolation)
- **Tiles**: CartoDB Dark Matter
- **Video Players**: `hls.js` for municipal CCTV, responsive YouTube embeds for venues
- **Icons**: `lucide-react`
- **State Persistence**: Browser `localStorage` (no server database required)
- **Edge Proxy**: Cloudflare Worker (`proxy/worker.js`)
- **Hosting Target**: Cloudflare Pages

---

## 📁 Directory Structure

```
pattayaCams/
├── public/
│   └── data/
│       ├── cctv_cams.json              # 25 seed high-priority municipal cameras
│       ├── venues.json                 # Hero venues (Soi 6, Buakhao, Walking St, Beach Rd)
│       ├── roaming_streamers.json      # Active IRL mobile creators
│       ├── hotels.json                 # Curated hotels by zone with Agoda IDs
│       └── pattaya_baht_bus.geojson    # 3 Songthaew transit routes (GeoJSON)
├── src/
│   ├── app/
│   │   ├── globals.css                 # Tailwind directives, Leaflet dark styles, marker animations
│   │   ├── layout.jsx                  # Root layout, Inter & JetBrains Mono fonts, SEO metadata
│   │   ├── page.jsx                    # Root page (MapCanvas + MultiCamGrid + Drawers)
│   │   ├── venues/[slug]/page.jsx      # Static SSG route for venues
│   │   └── cams/[slug]/page.jsx        # Static SSG route for CCTV cameras
│   ├── components/
│   │   ├── Navbar.jsx                  # Top header, quick jumps, mode switch, trip countdown
│   │   ├── MapCanvasWrapper.jsx        # Dynamic client wrapper for Leaflet (ssr: false)
│   │   ├── MapCanvas.jsx               # Core map engine with CartoDB Dark & clustering
│   │   ├── LayerToggleHUD.jsx          # Bottom-left floating layer toggle panel
│   │   ├── VideoDrawer.jsx             # Slide-over video drawer with affiliate cards
│   │   ├── MultiCamGrid.jsx            # 2x2 and 3x3 multi-cam command center
│   │   ├── RoamingTray.jsx             # Bottom bar for IRL streamers & venue listing CTA
│   │   ├── TripModal.jsx               # Arrival countdown and flight/taxi/eSIM modal
│   │   ├── SponsorModal.jsx            # Self-serve B2B pricing modal
│   │   └── common/
│   │       ├── HlsPlayer.jsx           # HLS player with municipal offline error recovery
│   │       ├── YouTubePlayer.jsx       # Responsive YouTube live embed
│   │       └── EmojiReactionGroup.jsx  # 4-emoji telemetry with 2h sliding window
│   └── utils/
│       ├── affiliate.js                # Dynamic weekend date calculator & affiliate link builders
│       ├── storage.js                  # Safe localStorage accessors
│       └── zones.js                    # Pattaya zones and quick-jump coordinates
├── proxy/
│   └── worker.js                       # Cloudflare Worker proxying .m3u8 manifests only (blocks .ts)
├── scripts/
│   ├── audit.js                        # Production audit: compliance, schemas, affiliate, SSG
│   └── generate_all_cams.js            # Automated generator for 600+ CCTV nodes
├── next.config.mjs                     # static export (output: 'export', trailingSlash: true)
├── tailwind.config.js                  # Custom color tokens (canvas, surface, brand colors)
└── package.json
```

---

## 💻 1. How to Run Locally

### Prerequisites
- Node.js 18.x or 20.x or 22.x
- npm 9+ or 10+

### Step-by-Step Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/plurino/pattayacams.git
   cd pattayacams
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Verify the static export build:**
   ```bash
   npm run build
   ```
   This compiles the project and generates a fully static export in the `out/` directory with 41 pre-rendered HTML landing pages.

5. **Run the production audit check:**
   ```bash
   node scripts/audit.js
   ```

---

## 🚀 2. How to Deploy to Cloudflare Pages & Connect Namecheap Domain

Deploying to **Cloudflare Pages** takes under 5 minutes and offers blazing-fast global edge delivery with free SSL.

### Step 2.1: Deploy Static Site to Cloudflare Pages

#### Method A: Git Integration (Recommended)
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** ➔ **Create application** ➔ **Pages** ➔ **Connect to Git**.
3. Select your private GitHub repository: `plurino/pattayacams`.
4. Configure the build settings:
   - **Project name**: `pattayacams`
   - **Production branch**: `main`
   - **Framework preset**: `Next.js (Static HTML Export)` or `None`
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
5. Click **Save and Deploy**. Cloudflare will automatically build and publish your site at `pattayacams.pages.dev`.

#### Method B: Direct CLI Deployment via Wrangler
If you prefer deploying directly from your terminal:
```bash
npm run build
npx wrangler pages deploy out --project-name=pattayacams
```

---

### Step 2.2: Deploy the M3U8 Manifest Proxy Worker

To proxy City Hall `.m3u8` playlists and enforce the `.ts` segment egress blocker:
```bash
npx wrangler deploy proxy/worker.js --name pattayacams-m3u8-proxy
```
This deploys a serverless edge worker at `https://pattayacams-m3u8-proxy.<your-subdomain>.workers.dev`.

---

### Step 2.3: Configure Custom Domain on Namecheap

Because you purchased your domain on **Namecheap**, connect it to Cloudflare to enable DDoS protection, CDN caching, and automatic SSL:

#### Part 1: Add the Domain to Cloudflare
1. In your Cloudflare Dashboard, click **Add a Domain** (or **Websites** ➔ **Add a Site**).
2. Enter `pattayacams.com` and choose the **Free** plan.
3. Cloudflare will scan existing DNS records and provide two **Cloudflare Nameservers**, for example:
   - `alec.ns.cloudflare.com`
   - `vera.ns.cloudflare.com`

#### Part 2: Point Namecheap Nameservers to Cloudflare
1. Log in to [Namecheap.com](https://www.namecheap.com/) and go to your **Domain List**.
2. Click **Manage** next to `pattayacams.com`.
3. Under the **Nameservers** section:
   - Change from *Namecheap BasicDNS* to **Custom DNS**.
   - Enter the two Cloudflare nameservers provided in Part 1.
   - Click the green checkmark (Save).
4. *Note: DNS propagation usually takes 5–30 minutes.*

#### Part 3: Bind Custom Domain in Cloudflare Pages
1. Go back to your Cloudflare Dashboard ➔ **Workers & Pages** ➔ Select `pattayacams`.
2. Go to the **Custom domains** tab.
3. Click **Set up a custom domain**.
4. Enter `pattayacams.com` and click **Continue**.
5. Cloudflare will automatically configure the `CNAME` / apex record and issue a free Universal SSL/TLS certificate.
6. (Optional) Add `www.pattayacams.com` as a second custom domain following the same step.

---

## 🔒 Legal Safe Harbor & Compliance

- **No In-App Freeform Chat**: Complies with Thailand Computer Crimes Act and criminal defamation statutes by using structured 1-click emoji reactions only. Community discussion is directed to external Telegram groups.
- **Payment & AdSense Family-Safe Policy**: All commercial listings are strictly classified under standard tourism categories: `Bar`, `Lounge`, `Beach Club`, `Restaurant`, `Cafe`, or `Complex`. Zero adult terminology is permitted in code, metadata, or UI copy.

---

## 📄 License

Proprietary © PattayaCams.com. All rights reserved.
