# Codex Cloud Next Sprint

## Goal

Turn FrameCloud into a cohesive Darkroom-first album product.

## Must-Do Tasks

1. **Protect debug routes**
   - Remove `/darkroom-test` from production or gate it behind `NODE_ENV !== "production"`.
   - Gate `/api/health` behind an admin secret or dev-only check. It currently exposes configuration status and performs R2 write/delete checks.

2. **Fix upload ordering**
   - In `src/app/api/dashboard/photos/route.ts`, replace the current ascending sort-order lookup with a max-sort lookup.
   - For multi-file upload, calculate the starting sort order once and increment per uploaded file.

3. **Use Darkroom for shared albums**
   - Add a Darkroom viewer route or mode for `src/app/shared/[token]`.
   - Shared photo URLs should use `/api/shared/${token}/photo/${encodedR2Key}`.
   - Keep the grid/lightbox as a fallback view.

4. **Upgrade album editor UX**
   - Add drag-and-drop upload to `src/app/dashboard/albums/[id]/page.tsx`.
   - Show queued/uploading/succeeded/failed states per file.
   - Add retry failed uploads.
   - Add inline caption editing using existing photo `PATCH`.
   - Add `Set as Cover` using album `PATCH`.
   - Replace `confirm()` with styled modals.

5. **Improve Darkroom print reveal**
   - Add previous/next inside `src/components/darkroom/PhotoReveal.tsx`.
   - Add keyboard support: arrows and Escape.
   - Add mobile swipe between developed prints.

## Constraints

- Preserve the current Darkroom look and interactions.
- Keep `three`/R3F dependency compatibility in mind; test the viewer in browser after changes.
- Do not expose R2 keys publicly except through authenticated API routes.
- Keep edits scoped; avoid unrelated visual redesigns.

## Verification

Run:

```bash
npm run build
npm run lint
```

Manual smoke:

1. Log in.
2. Create/open an album.
3. Upload multiple photos.
4. Open Dashboard Darkroom view.
5. Develop a photo.
6. Create a share link.
7. Unlock the shared link.
8. Open shared Darkroom view.
