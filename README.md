# CivicFix — Local Problem Reporting Platform

A MERN-style intermediate starter project for reporting community issues, tracking progress, and reviewing civic analytics.

## Features
- JWT registration/login with resident and authority roles
- Create, view, filter, upvote, and update civic reports
- Photo uploads (Multer, local `server/uploads`)
- Optional browser geolocation capture
- Leaflet/OpenStreetMap issue map
- Status workflow: Reported → In Progress → Resolved
- Dashboard summary analytics
- Responsive dark UI with lime/cyan accents

## Requirements
- Node.js 18+
- MongoDB local instance or MongoDB Atlas

## Setup
### 1) Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```
Edit `.env` and set `MONGO_URI` and a long `JWT_SECRET`.
Backend runs at `http://localhost:5000`.

### 2) Frontend
Open another terminal:
```bash
cd client
npm install
npm run dev
```
Open the Vite URL (usually `http://localhost:5173`).

## Demo accounts
Register a normal account in the UI. To create an authority account, set `ALLOW_AUTHORITY_REGISTRATION=true` in `server/.env` during local development, then select Authority on the register screen. Turn it off again for deployment.

## Notes
- Map tiles use OpenStreetMap; internet is needed for tiles.
- Uploaded images are stored locally. For production, use S3/Cloudinary and validate/scan uploads.
- Duplicate detection is a basic same-category + nearby-coordinate heuristic, not AI.
- This is a starter project, not a production-secured civic platform. Add rate limits, stronger validation, moderation, audit logs, tests, and deployment configuration before public use.
