import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../dist/', import.meta.url);
const distRoot = fileURLToPath(root);
const template = await readFile(new URL('index.html', root), 'utf8');
// On Netlify, URL is the site's primary URL (the custom domain once one is set).
const siteUrl = (process.env.PUBLIC_SITE_URL || process.env.URL || 'https://tksengworks.com').replace(/\/$/, '');
const platformEnv = process.env.VERCEL_ENV || (process.env.NETLIFY ? process.env.CONTEXT : undefined);
const indexable = platformEnv
  ? platformEnv === 'production' && process.env.VITE_INDEXABLE !== 'false'
  : process.env.VITE_INDEXABLE === 'true';
const robotsValue = indexable ? 'index,follow' : 'noindex,nofollow';
const pages = [
  ['', 'TKS Engineering Works | Steel Fabrication Chennai', 'Steel fabrication, structural roofing, gates and custom metalwork in Chennai. See the work of TKS Engineering Works.'],
  ['about', 'About | TKS Engineering Works', 'Meet TKS Engineering Works, a Chennai-based steel fabrication business established in 2005.'],
  ['services', 'Services | TKS Engineering Works', 'Explore structural roofing, truss work, steel fabrication, gates, railings, shutters and metal grills by TKS Engineering Works.'],
  ['projects', 'Projects | TKS Engineering Works', 'Browse genuine project photographs of structural, fabrication and architectural metalwork by TKS Engineering Works.'],
  ['request-a-quote', 'Request a Quote | TKS Engineering Works', 'Share your steel fabrication or metalwork requirement with TKS Engineering Works in Chennai.'],
  ['contact', 'Contact | TKS Engineering Works', 'Contact TKS Engineering Works in Padi, Chennai by phone, email or WhatsApp.'],
  ['privacy-policy', 'Privacy Policy | TKS Engineering Works', 'Read how TKS Engineering Works handles information submitted through this website.'],
];

function escapeAttribute(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

for (const [route, pageTitle, description] of pages) {
  const pageUrl = `${siteUrl}${route ? `/${route}` : '/'}`;
  const html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttribute(pageTitle)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*("\s*\/?>)/, `$1${escapeAttribute(description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*("\s*\/?>)/, `$1${escapeAttribute(pageTitle)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*("\s*\/?>)/, `$1${escapeAttribute(description)}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*("\s*\/?>)/, `$1${escapeAttribute(`${siteUrl}/projects/hero-structural-roofing.jpeg`)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*("\s*\/?>)/, `$1${escapeAttribute(pageUrl)}$2`)
    .replace(/(<meta name="site-url" content=")[^"]*("\s*\/?>)/, `$1${escapeAttribute(siteUrl)}$2`)
    .replace(/(<meta name="robots" content=")[^"]*("\s*\/?>)/, `$1${robotsValue}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*("\s*\/?>)/, `$1${escapeAttribute(pageUrl)}$2`)
    .replaceAll('https://tksengworks.com/', `${siteUrl}/`);
  const folder = join(distRoot, route);
  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, 'index.html'), html);
}

const notFoundHtml = template
  .replace(/<title>[^<]*<\/title>/, '<title>Page Not Found | TKS Engineering Works</title>')
  .replace(/(<meta name="description" content=")[^"]*("\s*\/?>)/, '$1This page could not be found. Return to TKS Engineering Works home or contact the team.$2')
  .replace(/(<meta property="og:title" content=")[^"]*("\s*\/?>)/, '$1Page Not Found | TKS Engineering Works$2')
  .replace(/(<meta property="og:description" content=")[^"]*("\s*\/?>)/, '$1This page could not be found.$2')
  .replace(/(<meta property="og:image" content=")[^"]*("\s*\/?>)/, `$1${escapeAttribute(`${siteUrl}/projects/hero-structural-roofing.jpeg`)}$2`)
  .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, '')
  .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, '')
  .replace(/(<meta name="robots" content=")[^"]*("\s*\/?>)/, '$1noindex,nofollow$2')
  .replaceAll('https://tksengworks.com/', `${siteUrl}/`);
await writeFile(join(distRoot, '404.html'), notFoundHtml);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(([route]) => `  <url><loc>${siteUrl}${route ? `/${route}` : '/'}</loc></url>`).join('\n')}\n</urlset>\n`;
const robots = indexable
  ? `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`
  : `User-agent: *\nDisallow: /\n`;
await writeFile(join(distRoot, 'sitemap.xml'), sitemap);
await writeFile(join(distRoot, 'robots.txt'), robots);
console.log(`Wrote static SEO entry points for ${pages.length} routes (${indexable ? 'indexable' : 'noindex'}; ${siteUrl}).`);
