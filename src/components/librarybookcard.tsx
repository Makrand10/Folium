// src/components/librarybookcard.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  _id: string;
  title: string;
  author?: string;
  coverUrl?: string;
  progress?: { percentage?: number | null };
  onRemoved?: (bookId: string) => void;
};

export default function LibraryBookCard({
  _id,
  title,
  author,
  coverUrl,
  progress,
  onRemoved,
}: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(Number(progress?.percentage ?? 0))));
  const [removing, setRemoving] = useState(false);

  const removeFromLibrary = async () => {
    if (!confirm("Remove this book from your library?")) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/user/library/${_id}`, { method: "DELETE" });
      if (res.ok) {
        onRemoved?.(_id);
      } else {
        const e = await res.json().catch(() => ({}));
        alert(`Failed to remove: ${e?.error || res.statusText}`);
      }
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="relative rounded-xl border p-3 hover:shadow transition">
      {/* Remove button (small) */}
      <button
        onClick={removeFromLibrary}
        disabled={removing}
        className="absolute top-2 right-2 z-10 rounded-md text-[11px] px-2 py-1 bg-black text-white/90 hover:bg-black/90 disabled:opacity-50"
        aria-label="Remove from library"
        title="Remove from library"
      >
        {removing ? "…" : "Remove"}
      </button>

      {/* Clickable area to open the reader */}
      <Link href={`/read/${_id}`} className="block">
        <div className="aspect-[3/4] w-full bg-gray-100 rounded-md overflow-hidden mb-2 flex items-center justify-center">
          {coverUrl ? (
            <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm text-gray-500" />
          )}
        </div>

        <div className="text-sm font-medium line-clamp-2">{title}</div>
        <div className="text-xs text-gray-500">{author || "Unknown"}</div>

        {/* progress */}
        <div className="mt-3 h-2 w-full rounded bg-gray-200" aria-label={`Progress ${pct}%`}>
          <div className="h-2 rounded bg-black" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 text-[11px] text-gray-500">{pct}% read</div>
      </Link>
    </div>
  );
}
