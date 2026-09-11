import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const BASE_URL = 'https://pattayacams.com';
const venues = JSON.parse(fs.readFileSync(path.join(rootDir, 'public', 'data', 'venues.json'), 'utf8'));
const creators = JSON.parse(fs.readFileSync(path.join(rootDir, 'public', 'data', 'creators.json'), 'utf8'));
const cctvs = JSON.parse(fs.readFileSync(path.join(rootDir, 'public', 'data', 'cctv_cams.json'), 'utf8'));

const now = new Date().toISOString().split('T')[0];

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

function addUrl(loc, priority, changefreq) {
  xml += '  <url>\n';
  xml += `    <loc>${loc}</loc>\n`;
  xml += `    <lastmod>${now}</lastmod>\n`;
  xml += `    <changefreq>${changefreq}</changefreq>\n`;
  xml += `    <priority>${priority}</priority>\n`;
  xml += '  </url>\n';
}

addUrl(`${BASE_URL}/`, '1.0', 'hourly');
addUrl(`${BASE_URL}/creators`, '0.9', 'daily');

venues.forEach((v) => addUrl(`${BASE_URL}/venues/${v.slug}`, '0.8', 'daily'));
creators.forEach((c) => addUrl(`${BASE_URL}/creators/${c.slug}`, '0.8', 'daily'));
cctvs.forEach((cam) => addUrl(`${BASE_URL}/cams/${cam.slug}`, '0.7', 'weekly'));

xml += '</urlset>\n';

fs.writeFileSync(path.join(rootDir, 'public', 'sitemap.xml'), xml);
console.log(`Generated public/sitemap.xml with ${2 + venues.length + creators.length + cctvs.length} URLs.`);
