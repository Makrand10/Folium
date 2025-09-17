// src/components/featuredrotator.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type FeaturedBook = {
  _id: string;
  title: string;
  author?: string;
  description?: string;
  coverUrl?: string;
};

type Props = {
  books: FeaturedBook[];
  rotateMs?: number; // default 8000 ms
};

export default function FeaturedRotator({ books, rotateMs = 8000 }: Props) {
  const pool = useMemo(
    () => (Array.isArray(books) ? books.filter(Boolean) : []),
    [books]
  );

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (pool.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % pool.length);
    }, rotateMs);
    return () => clearInterval(t);
  }, [pool.length, rotateMs]);

  if (!pool.length) return null;

  const b = pool[idx];
  const stub =
    (b.description && b.description.trim()) ||
    "A delightful read. Description coming soon.";

  return (
    <section className="rounded-xl border p-6">
      <div className="flex gap-6 items-start">
        <div className="w-40 h-56 rounded-md bg-gray-100 overflow-hidden shrink-0">
          {b.coverUrl ? (
            <img
              src={b.coverUrl}
              alt={`Book cover of ${b.title}`}
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>

        <div className="flex-1 space-y-2">
          <h1 className="text-3xl font-extrabold">{b.title}</h1>
          {b.author ? <p className="text-sm">{b.author}</p> : null}
          <p className="text-sm text-gray-600">{stub}</p>

          <Link
            href={`/read/${b._id}`}
            className="inline-flex items-center rounded-lg bg-black text-white px-4 py-2 font-medium"
          >
            Start Reading
          </Link>
        </div>
      </div>
    </section>
  );
}
