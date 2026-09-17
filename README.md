# ⚡ ProspectPulse — Automated Lead Finder, Website Audit & AI UX Critic

> Built for **Luminasiti**. A modern full-stack web application designed in high-energy **Neubrutalism** style to discover local businesses, perform deep multi-pillar website audits, generate AI visual critiques, and manage outreach pipelines.

---

## 🚀 Key Features

- 🗺️ **Interactive Geographic Search Zone**: Draw radius circles (0.5km – 15km) or custom polygons directly on the map.
- 🏢 **Automated Business Discovery**: Discovers businesses with phone numbers, formatted addresses, and website URLs via Google Places API (New) with smart fallback simulator.
- 🛡️ **5-Pillar Technical Website Audit**:
  - **Security & SSL (20 pts)**: Fast HTTPS status & SSL handshake verification.
  - **Mobile PageSpeed (30 pts)**: Powered by Google Lighthouse / PageSpeed Insights API.
  - **SEO Compliance (20 pts)**: Title tag length, meta description, and `<h1>` headings.
  - **Core Web Vitals (15 pts)**: Largest Contentful Paint (LCP in seconds) and latency checks.
  - **Responsive DOM (15 pts)**: Mobile viewport meta tag and image alt audits.
- 🤖 **AI Website Design Critic**: Powered by Google Gemini (`gemini-3.6-flash`) to assess aesthetic modernity, visual hierarchy, typography contrast, CRO funnels, and auto-generate tailored **Cold Outreach Pitch Scripts**.
- 👥 **Saved Prospects CRM Pipeline**: Track outreach stages (`Not Contacted`, `Contacted`, `Follow-Up Needed`, `Meeting Booked`, `Closed Deal`), set follow-up reminders with alert tags, write conversation logs, and attach dynamic **Custom Client Fields**.
- 📊 **Selective & Bulk CSV Export**: Export all or filtered leads ready for CRM import with pitch angles and custom columns.
- 🎨 **Bold Neubrutalism UI**: Chunky black outlines, hard offset drop-shadows, and high-energy retro-modern color accents.
- 🔒 **Protected Access**: Secured with account authentication (`accounts@luminasiti.com`).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Neubrutalism UI Design System
- **Maps**: [Leaflet](https://leafletjs.com/) + OpenStreetMap / CartoDB Voyager
- **Database**: [Supabase](https://supabase.com/) PostgreSQL with Row Level Security (RLS)
- **AI Engine**: [Google Gemini 3.6 Flash](https://aistudio.google.com/)
- **Auditing API**: [Google PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started)
- **Places API**: [Google Cloud Places API (New)](https://developers.google.com/maps/documentation/places/web-service/overview)

---

## ⚙️ Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/Luminasiti/Prospects-finder.git
cd Prospects-finder
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your API credentials:
```env
# Authentication
AUTH_EMAIL=accounts@luminasiti.com
AUTH_PASSWORD=your-secure-password

# Supabase PostgreSQL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Google Cloud Places API (New)
GOOGLE_MAPS_API_KEY=AIzaSy...

# Google PageSpeed Insights
PAGESPEED_API_KEY=AIzaSy...

# Google Gemini AI
GEMINI_API_KEY=AIzaSy...
```

### 3. Initialize Database Schema
Copy and execute [`supabase/schema.sql`](supabase/schema.sql) in your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql).

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License
Private repository for **Luminasiti**.
