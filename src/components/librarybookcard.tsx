"use client";

import Link from "next/link";

type Props = {
  _id: string;
  title: string;
  author?: string;
  coverUrl?: string;
  progress?: { percentage?: number | null };
};

export default function LibraryBookCard({ _id, title, author, coverUrl, progress }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(Number(progress?.percentage ?? 0))));

  return (
    <Link href={`/read/${_id}`} className="block rounded-xl border p-3 hover:shadow transition">
      {/* same visual structure as your Explore BookCard */}
      <div className="aspect-[3/4] w-full bg-gray-100 rounded-md overflow-hidden mb-2 flex items-center justify-center">
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm text-gray-500"></span>
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
  );
}
