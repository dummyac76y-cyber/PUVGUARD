# PUVGUARD

**IoT-based crash detection and emergency alert monitoring for motorcycle and tricycle drivers.**

PUVGUARD is a web dashboard prototype based on the study *IoT-Based Crash Detection and Emergency Alert System for Motorcycle and Tricycle Drivers in Kalibo*. It is designed to make registered vehicle identity, driver details, incident type, last-known GPS coordinates, device status, and responder coordination visible in one place.

## Prototype workflows

- **Incident center:** search/filter events, inspect vehicle/driver details, acknowledge and resolve events, and open the GPS coordinate in a map.
- **Vehicle registration:** register motorcycles or tricycles with a readable name, plate/identifier, driver, device ID, route, phone (optional), and last-known latitude/longitude.
- **Map:** MapLibre base map, incident/unit/contact markers, and optional Vaisala Xweather MapsGL radar overlay.
- **Driver safety event categories:** automatic crash detection, manual SOS, discreet driver-assistance alert, medical emergency, and device offline.
- **Responder directory:** add verified agency/official and registered emergency contacts with coordinates and phone numbers.
- **Nearest responder workflow:** rank available contacts by straight-line distance, assign one to an incident in the prototype, open a route, or tap-to-call a recorded phone number.
- **Device health:** display online/offline sample state, last-seen time and battery.
- **Reports:** export locally stored incident records as CSV.

## Xweather setup

Create/review keys in the [Xweather portal](https://data.portal.xweather.com/account/keys). In the Netlify site's environment variables, add:

- `VITE_XWEATHER_CLIENT_ID`
- `VITE_XWEATHER_CLIENT_SECRET`

Trigger a new deployment after setting them. Restrict the Xweather application credentials to your deployed domain and review your account's MapsGL entitlement/usage. MapsGL is optional: without keys, the base map and local markers can still appear, but Xweather weather layers will not load. The app includes the required **Powered by Vaisala Xweather** attribution.

Vite variables prefixed with `VITE_` are included in browser code. Do not treat them as private server secrets; use domain restrictions and an appropriate Xweather browser-key setup. Never commit real keys.

## Study-aligned behavior and limitations

The study specifies a two-stage manual SOS, a discreet driver-initiated assistance alert, automatic crash detection combining acceleration/orientation/motion cessation with a ten-second cancellation window, GPS location reporting, event-specific SMS with secondary-contact failover, emergency signaling, backup power, battery monitoring and non-volatile event logging. The dashboard represents the monitoring and coordination side; it does **not** implement the embedded device firmware or those hardware functions.

The discreet assistance event is a driver-initiated signal. The platform does not automatically detect a hold-up, diagnose a psychological/medical condition, or infer that a driver is in danger without a signal. GPS positions are approximate and should be displayed as last-known when a live heartbeat is absent.

**This is not a live emergency dispatch system.** Vehicle/incident/responder records are stored in the current browser's localStorage and are not shared with other operators. Seed contacts and sample events are illustrative, not verified official personnel or real incidents. Assigning a responder only changes local prototype state; it does not send SMS, call an agency automatically, or guarantee assistance. Verify every contact and use official emergency procedures. Do not rely on this prototype for real-world emergency response.

## Future production integration

1. Supabase Auth and Postgres with row-level security, shared fleet/incident/contact data, audit history and realtime subscriptions.
2. Authenticated device ingestion for signed GPS/heartbeat/incident events, deduplication and timestamps.
3. SMS provider integration with event-specific messages, retries and primary-to-secondary contact failover.
4. A verified official responder directory, role-based dispatch authorization and dispatch acknowledgement/audit.
5. Device firmware for sensor fusion, ten-second cancellation, SOS/assistance button handling, siren/light patterns, backup battery, and non-volatile event logs.

## Run locally

Node.js 20+ and npm:

```bash
npm install
npm run dev
npm run build
```

## Netlify

The repository includes `netlify.toml`; use `npm run build` and publish `dist`. The `main` branch can be connected for continuous deployment.
