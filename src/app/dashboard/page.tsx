"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Album } from "@/lib/db/schema";

export default function DashboardPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAlbums();
  }, []);

  async function fetchAlbums() {
    const res = await fetch("/api/dashboard/albums");
    const data = await res.json();
    setAlbums(data.albums || []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);

    const res = await fetch("/api/dashboard/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, description: newDesc }),
    });

    if (res.ok) {
      setNewTitle("");
      setNewDesc("");
      setShowCreate(false);
      fetchAlbums();
    }
    setCreating(false);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}" and all its photos? This cannot be undone.`)) return;

    await fetch(`/api/dashboard/albums/${id}`, { method: "DELETE" });
    fetchAlbums();
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,184,0,0.6)" }} />
          <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)" }}>
            Your Albums — {albums.length} {albums.length === 1 ? "roll" : "rolls"}
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="font-mono uppercase px-4 py-2 rounded transition-all"
          style={{
            fontSize: 9,
            letterSpacing: "0.18em",
            background: "rgba(255,184,0,0.15)",
            color: "rgba(255,184,0,0.9)",
            border: "1px solid rgba(255,184,0,0.2)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,184,0,0.25)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,184,0,0.15)")}
        >
          + New Album
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div
          className="mb-8 p-6 rounded-lg"
          style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block font-mono uppercase mb-2" style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)" }}>
                Album Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full px-4 py-3 rounded font-mono outline-none"
                style={{ fontSize: 13, background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)", color: "#F5F5F5" }}
                placeholder="e.g. Tokyo 2024"
              />
            </div>
            <div>
              <label className="block font-mono uppercase mb-2" style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)" }}>
                Description (optional)
              </label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-4 py-3 rounded font-mono outline-none resize-none"
                rows={2}
                style={{ fontSize: 13, background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)", color: "#F5F5F5" }}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="font-mono uppercase px-6 py-2 rounded transition-all"
                style={{
                  fontSize: 9, letterSpacing: "0.18em",
                  background: "rgba(255,184,0,0.2)", color: "rgba(255,184,0,0.9)",
                  border: "1px solid rgba(255,184,0,0.25)",
                }}
              >
                {creating ? "Creating..." : "Create Album"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="font-mono uppercase px-6 py-2 rounded transition-all"
                style={{
                  fontSize: 9, letterSpacing: "0.18em",
                  background: "transparent", color: "rgba(255,255,255,0.35)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-shimmer rounded-lg" style={{ height: 200 }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && albums.length === 0 && (
        <div className="text-center py-20">
          <div className="font-mono" style={{ fontSize: 48, color: "rgba(255,184,0,0.15)" }}>◆</div>
          <p className="font-mono mt-4" style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
            No albums yet. Create your first roll.
          </p>
        </div>
      )}

      {/* Album grid */}
      {!loading && albums.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {albums.map((album) => (
            <div
              key={album.id}
              className="group rounded-lg overflow-hidden transition-all"
              style={{
                background: "#141414",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Cover */}
              <div className="relative" style={{ height: 160, background: "#0D0D0D" }}>
                {album.coverKey ? (
                  <img
                    src={`/api/dashboard/photos/serve/${album.coverKey}`}
                    alt={album.title}
                    className="w-full h-full object-cover"
                    style={{ opacity: 0.85 }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="font-mono" style={{ fontSize: 28, color: "rgba(255,184,0,0.12)" }}>◆</span>
                  </div>
                )}
                {/* Overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3"
                  style={{ background: "rgba(0,0,0,0.6)" }}
                >
                  <Link
                    href={`/dashboard/albums/${album.id}`}
                    className="font-mono uppercase px-4 py-2 rounded transition-all"
                    style={{
                      fontSize: 9, letterSpacing: "0.15em",
                      background: "rgba(255,184,0,0.2)", color: "rgba(255,184,0,0.9)",
                      border: "1px solid rgba(255,184,0,0.3)",
                    }}
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => handleDelete(album.id, album.title)}
                    className="font-mono uppercase px-4 py-2 rounded transition-all"
                    style={{
                      fontSize: 9, letterSpacing: "0.15em",
                      background: "rgba(255,68,68,0.1)", color: "rgba(255,68,68,0.8)",
                      border: "1px solid rgba(255,68,68,0.2)",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-medium truncate" style={{ fontSize: 15, color: "#F5F5F5" }}>
                    {album.title}
                  </h3>
                  <span className="font-mono" style={{ fontSize: 10, color: "rgba(255,184,0,0.5)" }}>
                    {album.photoCount}
                  </span>
                </div>
                {album.description && (
                  <p className="font-mono mt-1 truncate" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    {album.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  <span className="font-mono" style={{ fontSize: 8, letterSpacing: "0.15em", color: "rgba(255,255,255,0.15)" }}>
                    {new Date(album.createdAt).toLocaleDateString()}
                  </span>
                  <span className="font-mono" style={{ fontSize: 8, color: "rgba(255,184,0,0.2)" }}>◆</span>
                  <span className="font-mono" style={{ fontSize: 8, letterSpacing: "0.15em", color: "rgba(255,255,255,0.15)" }}>
                    {album.photoCount} {album.photoCount === 1 ? "frame" : "frames"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
