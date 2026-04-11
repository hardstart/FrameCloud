"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Album, Photo, ShareLink } from "@/lib/db/schema";

export default function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadCurrent, setUploadCurrent] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadFailed, setUploadFailed] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [showShareForm, setShowShareForm] = useState(false);
  const [sharePassword, setSharePassword] = useState("");
  const [creatingLink, setCreatingLink] = useState(false);

  const fetchAlbum = useCallback(async () => {
    const res = await fetch(`/api/dashboard/albums/${id}`);
    if (!res.ok) { router.push("/dashboard"); return; }
    const data = await res.json();
    setAlbum(data.album);
    setPhotos(data.photos);
    setShareLinks(data.shareLinks);
    setEditTitle(data.album.title);
    setEditDesc(data.album.description || "");
    setLoading(false);
  }, [id, router]);

  useEffect(() => { fetchAlbum(); }, [fetchAlbum]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    const total = files.length;
    setUploading(true);
    setUploadTotal(total);
    setUploadCurrent(0);
    setUploadFailed(0);
    setUploadProgress(`Uploading 0 / ${total}...`);

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < total; i++) {
      setUploadProgress(`Uploading ${i + 1} / ${total} — ${files[i].name}`);
      setUploadCurrent(i + 1);

      const formData = new FormData();
      formData.append("albumId", id);
      formData.append("files", files[i]);

      try {
        const res = await fetch("/api/dashboard/photos", { method: "POST", body: formData });
        if (res.ok) {
          succeeded++;
        } else {
          failed++;
          setUploadFailed(failed);
        }
      } catch {
        failed++;
        setUploadFailed(failed);
      }
    }

    setUploading(false);
    const msg = failed > 0
      ? `Done — ${succeeded} uploaded, ${failed} failed`
      : `Done — ${succeeded} photo${succeeded !== 1 ? "s" : ""} uploaded`;
    setUploadProgress(msg);
    fetchAlbum();
    if (fileInputRef.current) fileInputRef.current.value = "";
    setTimeout(() => {
      setUploadProgress("");
      setUploadCurrent(0);
      setUploadTotal(0);
      setUploadFailed(0);
    }, 4000);
  }

  async function handleDeletePhoto(photoId: string) {
    if (!confirm("Delete this photo?")) return;
    await fetch(`/api/dashboard/photos/${photoId}`, { method: "DELETE" });
    fetchAlbum();
    if (lightboxIdx !== null) setLightboxIdx(null);
  }

  async function handleSaveEdit() {
    await fetch(`/api/dashboard/albums/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, description: editDesc }),
    });
    setEditing(false);
    fetchAlbum();
  }

  async function handleCreateShareLink(e: React.FormEvent) {
    e.preventDefault();
    if (!sharePassword || sharePassword.length < 4) return;
    setCreatingLink(true);

    const res = await fetch("/api/dashboard/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumId: id, password: sharePassword }),
    });
    if (res.ok) {
      setSharePassword("");
      setShowShareForm(false);
      fetchAlbum();
    }
    setCreatingLink(false);
  }

  async function handleRevokeShareLink(linkId: string) {
    await fetch(`/api/dashboard/share?id=${linkId}`, { method: "DELETE" });
    fetchAlbum();
  }

  function getPhotoUrl(photo: Photo) {
    return `/api/dashboard/photos/serve/${photo.r2Key}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Loading...</span>
      </div>
    );
  }

  if (!album) return null;

  return (
    <div>
      {/* Back link + title */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="font-mono uppercase mb-4 inline-block transition-colors"
          style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,184,0,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
        >
          ← Back to Albums
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            {editing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="block w-full px-3 py-2 rounded font-sans font-semibold outline-none"
                  style={{ fontSize: 24, background: "#141414", border: "1px solid rgba(255,184,0,0.2)", color: "#F5F5F5" }}
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="block w-full px-3 py-2 rounded font-mono outline-none resize-none"
                  rows={2}
                  style={{ fontSize: 12, background: "#141414", border: "1px solid rgba(255,255,255,0.08)", color: "#F5F5F5" }}
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} className="font-mono uppercase px-4 py-1.5 rounded" style={{ fontSize: 9, letterSpacing: "0.15em", background: "rgba(255,184,0,0.2)", color: "rgba(255,184,0,0.9)", border: "1px solid rgba(255,184,0,0.25)" }}>Save</button>
                  <button onClick={() => setEditing(false)} className="font-mono uppercase px-4 py-1.5 rounded" style={{ fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-sans font-semibold" style={{ fontSize: 28, color: "#F5F5F5" }}>{album.title}</h1>
                {album.description && (
                  <p className="font-mono mt-1" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{album.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-mono" style={{ fontSize: 9, color: "rgba(255,184,0,0.4)" }}>{photos.length} frames</span>
                  <span className="font-mono" style={{ fontSize: 8, color: "rgba(255,255,255,0.1)" }}>◆</span>
                  <span className="font-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{new Date(album.createdAt).toLocaleDateString()}</span>
                </div>
              </>
            )}
          </div>

          {!editing && (
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setEditing(true)}
                className="font-mono uppercase px-3 py-1.5 rounded transition-all"
                style={{ fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload bar */}
      <div
        className="mb-6 rounded-lg overflow-hidden"
        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="font-mono uppercase px-4 py-2 rounded transition-all"
              style={{
                fontSize: 9, letterSpacing: "0.18em",
                background: uploading ? "rgba(255,184,0,0.05)" : "rgba(255,184,0,0.15)",
                color: uploading ? "rgba(255,184,0,0.4)" : "rgba(255,184,0,0.9)",
                border: "1px solid rgba(255,184,0,0.2)",
                cursor: uploading ? "not-allowed" : "pointer",
              }}
            >
              {uploading ? "Uploading..." : "+ Upload Photos"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            {uploadProgress && (
              <span className="font-mono truncate max-w-[300px]" style={{
                fontSize: 11,
                color: uploadFailed > 0 ? "rgba(255,68,68,0.7)" : "rgba(255,184,0,0.6)",
              }}>
                {uploadProgress}
              </span>
            )}
          </div>

          {/* Share section */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowShareForm(!showShareForm)}
              className="font-mono uppercase px-3 py-1.5 rounded transition-all"
              style={{ fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              + Share Link
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {uploading && uploadTotal > 0 && (
          <div className="px-4 pb-3">
            <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(uploadCurrent / uploadTotal) * 100}%`,
                  background: uploadFailed > 0
                    ? "linear-gradient(90deg, rgba(255,184,0,0.8), rgba(255,68,68,0.8))"
                    : "rgba(255,184,0,0.8)",
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="font-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
                {uploadCurrent} of {uploadTotal}
              </span>
              <span className="font-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
                {Math.round((uploadCurrent / uploadTotal) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Share link creation form */}
      {showShareForm && (
        <div className="mb-6 p-4 rounded-lg" style={{ background: "#141414", border: "1px solid rgba(255,184,0,0.1)" }}>
          <form onSubmit={handleCreateShareLink} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block font-mono uppercase mb-2" style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)" }}>
                Set Password for Share Link
              </label>
              <input
                type="text"
                value={sharePassword}
                onChange={(e) => setSharePassword(e.target.value)}
                required
                minLength={4}
                className="w-full px-4 py-2.5 rounded font-mono outline-none"
                style={{ fontSize: 13, background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)", color: "#F5F5F5" }}
                placeholder="Min. 4 characters"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={creatingLink || sharePassword.length < 4}
              className="font-mono uppercase px-5 py-2.5 rounded transition-all flex-shrink-0"
              style={{
                fontSize: 9, letterSpacing: "0.15em",
                background: "rgba(255,184,0,0.2)", color: "rgba(255,184,0,0.9)",
                border: "1px solid rgba(255,184,0,0.25)",
                opacity: sharePassword.length < 4 ? 0.5 : 1,
              }}
            >
              {creatingLink ? "Creating..." : "Create Link"}
            </button>
            <button
              type="button"
              onClick={() => { setShowShareForm(false); setSharePassword(""); }}
              className="font-mono uppercase px-4 py-2.5 rounded transition-all flex-shrink-0"
              style={{ fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Active share links */}
      {shareLinks.length > 0 && (
        <div className="mb-6 p-4 rounded-lg" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.04)" }}>
          <span className="font-mono uppercase block mb-3" style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)" }}>
            Active Share Links
          </span>
          <div className="space-y-2">
            {shareLinks.map((link) => (
              <div key={link.id} className="flex items-center justify-between gap-3">
                <code
                  className="font-mono truncate cursor-pointer flex-1"
                  style={{ fontSize: 11, color: "rgba(255,184,0,0.6)" }}
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/shared/${link.token}`);
                  }}
                  title="Click to copy"
                >
                  {window.location.origin}/shared/{link.token}
                </code>
                <button
                  onClick={() => handleRevokeShareLink(link.id)}
                  className="font-mono uppercase flex-shrink-0 transition-colors"
                  style={{ fontSize: 9, color: "rgba(255,68,68,0.6)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,68,68,0.9)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,68,68,0.6)")}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="text-center py-20">
          <div className="font-mono" style={{ fontSize: 48, color: "rgba(255,184,0,0.1)" }}>◆</div>
          <p className="font-mono mt-4" style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
            No photos yet. Upload some frames.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo, idx) => (
            <div
              key={photo.id}
              className="group relative rounded overflow-hidden cursor-pointer"
              style={{ aspectRatio: "1", background: "#0D0D0D" }}
              onClick={() => setLightboxIdx(idx)}
            >
              <img
                src={getPhotoUrl(photo)}
                alt={photo.caption || photo.filename}
                className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]"
                loading="lazy"
              />
              {/* Hover overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2"
                style={{ background: "linear-gradient(transparent 50%, rgba(0,0,0,0.7))" }}
              >
                <span className="font-mono truncate" style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
                  {photo.caption || photo.filename}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && photos[lightboxIdx] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.95)" }}
          onClick={() => setLightboxIdx(null)}
        >
          {/* Close */}
          <button
            className="absolute top-6 right-6 font-mono z-10"
            style={{ fontSize: 24, color: "rgba(255,255,255,0.5)" }}
            onClick={() => setLightboxIdx(null)}
          >
            ×
          </button>

          {/* Prev */}
          {lightboxIdx > 0 && (
            <button
              className="absolute left-6 top-1/2 -translate-y-1/2 font-mono z-10 p-2"
              style={{ fontSize: 28, color: "rgba(255,255,255,0.4)" }}
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
            >
              ‹
            </button>
          )}

          {/* Next */}
          {lightboxIdx < photos.length - 1 && (
            <button
              className="absolute right-6 top-1/2 -translate-y-1/2 font-mono z-10 p-2"
              style={{ fontSize: 28, color: "rgba(255,255,255,0.4)" }}
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
            >
              ›
            </button>
          )}

          {/* Image */}
          <img
            src={getPhotoUrl(photos[lightboxIdx])}
            alt={photos[lightboxIdx].caption || photos[lightboxIdx].filename}
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Bottom bar */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-4"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <span className="font-mono" style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                {photos[lightboxIdx].caption || photos[lightboxIdx].filename}
              </span>
              <span className="font-mono ml-4" style={{ fontSize: 10, color: "rgba(255,184,0,0.4)" }}>
                {lightboxIdx + 1} / {photos.length}
              </span>
            </div>
            <button
              onClick={() => handleDeletePhoto(photos[lightboxIdx].id)}
              className="font-mono uppercase px-3 py-1.5 rounded transition-all"
              style={{ fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,68,68,0.7)", border: "1px solid rgba(255,68,68,0.2)" }}
            >
              Delete Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
