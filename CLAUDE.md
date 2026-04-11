# FrameCloud

A cinematic photo album platform with a 3D camera viewfinder browsing experience.

## Tech Stack

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (dark camera/retro aesthetic)
- **Database**: Supabase PostgreSQL via Drizzle ORM
- **Auth**: Supabase Auth (SSR) with custom session lookup
- **Storage**: Cloudflare R2 (S3-compatible) for photos
- **Hosting**: Vercel (production: https://framecloud.studio)
- **3D/Animation**: Three.js, react-three-fiber, GSAP

## Architecture

- **Multi-tenant**: Each user gets a tenant with isolated data
- **Auth flow**: Supabase Auth → auth trigger auto-creates tenant+user → session lookup via `getSession()`
- **Photo storage**: Uploaded to R2 at `tenants/{tenantId}/albums/{albumId}/{filename}`
- **Viewfinder**: `CameraScrollExperience` component — scroll-scrub video zoom into camera eyepiece, then browse photos with shutter blink transitions

## Key Files

- `src/lib/db/schema.ts` — Drizzle schema (tenants, users, albums, photos, share_links)
- `src/lib/auth/session.ts` — `getSession()` function (Supabase auth + DB lookup)
- `src/lib/storage.ts` — R2 upload/download/delete helpers
- `src/lib/supabase/server.ts` — Server-side Supabase client
- `src/middleware.ts` — Route protection (PUBLIC_PATHS list)
- `src/components/camera/CameraScrollExperience.tsx` — The viewfinder experience
- `src/app/dashboard/` — Dashboard pages (albums, photos, upload, share links)

## Database

- **Project ref**: `bguarwryhfxsmsohnype`
- **Connection**: Transaction pooler at `aws-1-us-east-1.pooler.supabase.com:6543`
- **Migrations**: Applied via Supabase MCP (3 migrations: schema, RLS policies, auth trigger)
- **RLS**: Enabled on all tables with tenant-scoped policies

## Deployment

- **Vercel project**: `framecloud` (linked via CLI, no GitHub auto-deploy)
- **Deploy command**: `vercel --prod`
- **Domain**: framecloud.studio (DNS via GoDaddy → Vercel)
- **Env vars**: Set via `printf '%s' 'value' | vercel env add NAME production` (use printf to avoid trailing newlines)

## Common Tasks

- **Deploy**: `vercel --prod`
- **Push to GitHub**: `git push origin main`
- **Check health**: `curl https://framecloud.studio/api/health`
- **Supabase SQL**: Use `mcp__supabase__execute_sql` tool
- **Add public route**: Add path to `PUBLIC_PATHS` in `src/middleware.ts`

## Pending: Darkroom Gallery Viewer Integration

Replace the current `CameraScrollExperience` viewfinder with the **darkroom film strip** gallery from `hardstart/darkroom`. Reference source files are in `reference/darkroom/`. Darkroom texture assets are already in `public/assets/darkroom/`.

### Darkroom UI Concept
- 3D film strip in a chemical developer tub (Three.js + React Three Fiber)
- User scrolls through film frames, taps one to "dip" it into developer liquid
- Frame animates negative→positive transition (orange tint → full color)
- After development, photo reveals full-screen with gallery-style white border
- Atmospheric effects: red safelight glow, film grain canvas, vignette, floating particles

### Key Darkroom Components (in `reference/darkroom/`)
- `DarkroomScene.tsx` — 3D canvas: tub, liquid, lighting (red safelight), particles, tongs
- `FilmStrip3D.tsx` — Scrollable 3D film strip with sprocket holes, negative→positive material transition
- `PhotoReveal.tsx` — Full-screen developed photo modal with wet-print sheen
- `Atmosphere.tsx` — Film grain canvas overlay, vignette, safelight glow
- `useDarkroom.ts` — State: frames array with `developed`/`isDipping`, dip animation logic
- `constants.ts` — Photo URLs and texture paths
- `App.tsx` — Scroll/touch handling, UI overlays (title, frame counter, dot indicators)

### Integration Plan
1. Port darkroom components into `src/components/darkroom/` (adapt from Vite to Next.js `'use client'`)
2. Replace `CameraScrollExperience` usage in dashboard album view (`/dashboard/albums/[id]/view`)
3. Feed album photos from R2 into the darkroom's `useDarkroom` hook instead of static constants
4. Texture assets already copied to `public/assets/darkroom/`
5. Must use `dynamic(() => import(...), { ssr: false })` for the 3D Canvas component
6. Keep existing `CameraScrollExperience` for public album pages (`/album/[slug]/view`)

## Gotchas

- Vercel env vars set with `<<<` get trailing newlines — always use `printf '%s'` piped to `vercel env add`
- Supabase pooler region is `aws-1` not `aws-0` for this project
- `CameraScrollExperience` accepts optional `getImageUrl`, `backHref`, `backLabel` props for reuse outside the public album view
- FileList from `<input type="file">` must be copied to Array before async loops (React re-renders can invalidate the live DOM reference)
