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

## Gotchas

- Vercel env vars set with `<<<` get trailing newlines — always use `printf '%s'` piped to `vercel env add`
- Supabase pooler region is `aws-1` not `aws-0` for this project
- `CameraScrollExperience` accepts optional `getImageUrl`, `backHref`, `backLabel` props for reuse outside the public album view
- FileList from `<input type="file">` must be copied to Array before async loops (React re-renders can invalidate the live DOM reference)
