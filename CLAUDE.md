# FrameCloud

A cinematic multi-tenant photo album platform. Users create private photo rolls, upload images to Cloudflare R2, view them in a 3D darkroom film-strip experience, and share password-protected album links.

## Current State

- Production: `https://framecloud.studio`
- GitHub: `hardstart/FrameCloud`
- Main branch is the source of truth.
- Vercel project: `framecloud`
- Dashboard album viewer uses the new Darkroom experience.
- Shared links still use the older grid/lightbox view and should be upgraded next.
- Legacy sample/manifest album routes still exist under `/album/[slug]`.

## Tech Stack

- Framework: Next.js 14.2 App Router
- Language: TypeScript
- Styling: Tailwind CSS plus inline cinematic styling
- Database: Supabase PostgreSQL via Drizzle ORM
- Auth: Supabase Auth SSR with app-level `users`/`tenants`
- Storage: Cloudflare R2 via S3-compatible SDK
- Hosting: Vercel
- 3D/animation: Three.js, React Three Fiber, GSAP

## Architecture

- Multi-tenant data model: `tenants`, `users`, `albums`, `photos`, `share_links`
- Auth flow: Supabase Auth -> app user/tenant row -> `getSession()`
- Photo storage path: `tenants/{tenantId}/albums/{albumId}/{uuid.ext}`
- Dashboard photo serving checks auth and tenant prefix before streaming R2 bytes.
- Shared photo serving checks share-link auth cookie and tenant prefix.

## Key Files

- `src/lib/db/schema.ts` - Drizzle schema
- `src/lib/db/index.ts` - lazy Drizzle/Postgres client
- `src/lib/auth/session.ts` - Supabase user -> app session lookup
- `src/lib/storage.ts` - R2 upload/download/delete helpers
- `src/lib/supabase/server.ts` - server Supabase client
- `src/middleware.ts` - route protection and public path list
- `src/app/dashboard/page.tsx` - dashboard album grid
- `src/app/dashboard/albums/[id]/page.tsx` - album editor/upload/share/photo grid
- `src/app/dashboard/albums/[id]/view/page.tsx` - dashboard Darkroom route
- `src/components/darkroom/*` - current 3D Darkroom viewer
- `src/app/shared/[token]/*` - password-protected shared album pages
- `src/components/camera/CameraScrollExperience.tsx` - older camera viewer used by legacy sample routes

## Darkroom Notes

- `src/components/darkroom/DarkroomScene.tsx` disables R3F pointer events with a no-op event manager because R3F 8.x + browser readonly pointer properties caused crashes.
- `@react-three/drei/Text` was removed from `FilmStrip3D` because `troika-three-text` conflicts with current Three.js `customDepthMaterial` behavior.
- `three` is intentionally pinned around `0.178.x`; upgrade carefully and browser-test the Darkroom route.
- Dashboard Darkroom route uses `dynamic(..., { ssr: false })`.
- Developed print reveal is in `PhotoReveal.tsx`.

## Verification

- `npm run build` passes.
- `npm run lint` passes with only existing `<img>` warnings.
- Useful local check: open an album with photos and visit `/dashboard/albums/{id}/view`.

## Deployment

- Deploy: `vercel --prod`
- Push: `git push origin main`
- Env var gotcha: use `printf '%s' 'value' | vercel env add NAME production` to avoid trailing newlines.
- Supabase pooler is `aws-1-us-east-1.pooler.supabase.com:6543`, not `aws-0`.

## Immediate Cloud Sprint

This is the next Codex Cloud task list:

1. Protect or remove public debug surfaces:
   - `/api/health`
   - `/darkroom-test`
2. Fix upload sort order:
   - Current upload route queries ascending and can reuse order values.
   - Use descending max sort order or calculate the batch start once.
3. Bring Darkroom to shared links:
   - Add `View in Darkroom` to `SharedAlbumView`.
   - Prefer a Darkroom-first recipient experience after password unlock.
   - Keep grid as a fallback.
4. Improve album editor:
   - Add drag-and-drop upload.
   - Add retry failed uploads.
   - Add inline caption editing.
   - Add `Set as Cover`.
   - Replace browser `confirm()` calls with styled modals.
5. Improve Darkroom interaction:
   - Add controls hint overlay.
   - Add next/previous navigation inside developed print reveal.
   - Add Escape/back behavior.

## Product Direction

The product should feel like: create a roll, arrange the frames, develop them in a cinematic darkroom, then share that exact experience privately.
