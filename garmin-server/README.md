Garmin Bridge Server (Local)

Prerequisites
- Node.js 16+
- (Phase 2) Python 3.8+ and garminconnect

Install (MVP)
```
cd garmin-server
npm init -y
npm install express cors
node garmin-server.js
# -> http://localhost:3001/api/garmin/status
```

Endpoints
- GET /api/garmin/status : last sync status
- POST /api/garmin/sync   : run a sync (MVP returns mock data)

User steps (for now)
- Start the server (`node garmin-server.js`).
- From the Gramin tab, click "Synchroniser".

Phase 2 (real integration)
- Add Python script fetch_garmin_data.py + session persistence.
- Units/UTC normalization and dedup in Node.
- Downsampling HR to 5 min + 90 days retention.

