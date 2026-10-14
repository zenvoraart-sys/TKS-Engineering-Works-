# TKS Engineering Works website

Responsive Vite, React and TypeScript website for TKS Engineering Works. The site uses supplied project photographs and verified business details; it does not fabricate project clients, testimonials, prices or certifications.

## Run locally

Install Node.js 20.19+ or 22.12+ and npm, then:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. Production compilation and static route generation:

```powershell
npm run build
npm run preview
```

## Pages

- `/` — Home, service overview, selected work, reasons to work with TKS, workflow and FAQs
- `/about` — Company and working approach
- `/services` — Capability descriptions
- `/projects` — Filterable gallery from the supplied TKS project photos
- `/request-a-quote` — Four-step request form with attachments, review, validation and summary download
- `/contact` — Contact details, map link and contact form
- `/privacy-policy` — Enquiry data handling
- Any unrecognized URL — Branded 404 page

## Appearance and motion

The theme control in the desktop header and mobile menu follows the visitor's system preference on first visit, then saves an explicit choice in local storage. Theme selection is initialized before the page renders to reduce flashing. Section and card reveals use the browser's Intersection Observer with no added animation dependency; they are disabled when reduced motion is requested and remain visible when the observer is unavailable.

## Quote and contact submission

Both forms POST to `api/quote.js`. The Vercel serverless function validates input and sends an email through Resend. It generates a `TKS-YYYYMMDD-XXXXXXXX` reference only when Resend accepts delivery. The customer sees success only after that response. Failures offer WhatsApp and email alternatives.

Requests are delivered to the configured `TKS_ENQUIRY_TO` mailbox; this project has no database, admin dashboard, or separate file-storage service. Attachments (JPEG, PNG, WebP or PDF, max three files and 3 MB combined) are validated by the browser and server, then included in the enquiry email. Configure and test the receiving mailbox and mail retention practices before launch.

### Resend setup

1. Create a Resend account, verify a sending domain, and create an API key.
2. Copy `.env.example` to `.env.local` and set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (a sender on the verified domain), and `TKS_ENQUIRY_TO`.
3. Add these three values to the Vercel project's environment variables. Keep the API key server-side; never use a `VITE_` prefix for secrets.
4. Deploy to Vercel, then submit a real test enquiry and confirm it arrives at the intended mailbox. Remove test messages as appropriate.

The online form cannot deliver email until those credentials are configured. No request is persisted if email delivery fails. For durable records or a review dashboard, connect a database or CRM before relying on the form as the sole intake channel.

## SEO and indexability

`npm run build` prerenders the public route entry files with unique titles, descriptions and canonical URLs, and writes `sitemap.xml` and `robots.txt` into `dist/`. `PUBLIC_SITE_URL` sets the canonical origin (default `https://tksengworks.com`). Set it to the real production origin in the build environment if that differs.

Builds are noindex by default. Vercel builds become indexable only when `VERCEL_ENV=production` and `VITE_INDEXABLE` is not `false`; preview and development builds are noindex and disallow crawling. In Vercel project settings, set `PUBLIC_SITE_URL` to the production domain and set `VITE_INDEXABLE=true` for Production. Leave preview environments unset/false. For non-Vercel static production builds, deliberately set `VITE_INDEXABLE=true` for that build. The site includes LocalBusiness structured data only for the verified business contact details.

## Deploy to Vercel

1. Push this project to a GitHub repository and import it into Vercel.
2. Set the build command to `npm run build` and output directory to `dist` (Vercel detects these from the Vite setup in most cases).
3. Configure `PUBLIC_SITE_URL`, `VITE_INDEXABLE`, and the three Resend variables as described above. Set production indexability only after the production domain is attached and canonical URL is correct.
4. Deploy a preview first and check that `robots.txt` disallows crawling and page metadata contains `noindex,nofollow`.
5. Deploy to Production, then check the public routes, quote and contact forms, email receipt, sitemap, and canonical URLs. Confirm `robots.txt` allows crawling once production indexing is enabled.

The build emits a custom `404.html`, and `vercel.json` enables clean URLs without a catch-all SPA rewrite, so unknown paths can use Vercel's static 404 response while generated route files remain directly indexable. The quote endpoint requires a serverless-capable host; static-only hosting needs an equivalent secure server-side endpoint.

As checked on 13 October 2026, Vercel Hobby is free for personal projects and small-scale apps and includes up to 1 million function invocations and 100 GB-hours of function duration per month; hitting included usage caps can pause usage until the cap resets. Resend's free transactional tier currently includes 3,000 emails per month, limited to 100 per day, and requires a verified sender domain. A custom domain name may cost extra. Provider limits and terms can change, so check [Vercel Hobby plan](https://vercel.com/docs/plans/hobby) and [Resend pricing](https://resend.com/pricing) before launch.

## Verified business details and assets

Business details were checked against the supplied reference materials and the existing company website: TKS Engineering Works, established 2005; No 64, Mugappair Rd, Padi, Chennai, Tamil Nadu 600058; `+91 9840682818`; `tksengneering2004@gmail.com`; Mon–Fri 9 AM–6 PM, Sat 9 AM–4 PM. The WhatsApp action uses the verified phone number. Real supplied project photos are in `public/projects/`, and the supplied logo is `public/brand/tks-logo.jpeg`.

Edit business information and capability content in `src/data/site.ts`; the route descriptions are in `src/main.tsx` and `scripts/prerender-routes.mjs`. Replace photos by preserving their current filenames or updating the references.
