# PUVGUARD

**Public Utility Vehicle Safety Monitoring & Incident Coordination**

PUVGUARD is a responsive prototype dashboard for a proposed PUV safety monitoring and MDRRMO incident-coordination system. The current version uses illustrative sample data so the interface can be explored before backend and hardware integration.

## Current prototype

- Operations overview and sample incident queue
- Incident search, filtering, acknowledgement and resolution demo actions
- Illustrative PUV fleet inventory and device-health cards
- Schematic map preview (not a live map or GPS feed)
- CSV export of sample incident data
- Integration setup screen for future Supabase and Cato API work
- Responsive desktop and mobile layout

## Important limitations

This is a **demonstration prototype**, not an operational emergency dispatch system. Sample incidents, locations, device statuses, battery levels, and timestamps are illustrative. Actions taken in the dashboard are local UI changes only and do not notify emergency responders, contact drivers, or persist to a server. Do not use this prototype for real-world emergency response.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Create a production build:

```bash
npm run build
npm run preview
```

## Netlify

The repository includes `netlify.toml` for Vite builds. Set the build command to `npm run build` and publish directory to `dist`. The site can be connected to Netlify for continuous deployment from the `main` branch.

## Future integration plan

- **Supabase:** authentication, database persistence, row-level security and optional realtime updates. Configure public frontend values only after setting up the project and database policies.
- **Cato API:** first confirm which Cato product/API and use case are intended. Keep private API tokens in server-side environment variables or a protected function; never commit credentials or expose private keys in frontend code.
- **Device event ingestion:** define an authenticated, validated backend endpoint before connecting physical devices or treating alerts as real.

No Supabase credentials, Cato API keys, or device credentials are included in this repository.
