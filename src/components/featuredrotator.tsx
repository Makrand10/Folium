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
    "A mesmerizing and surreal journey into the depths of identity, loss, and the hidden connections that shape our lives. A modern masterpiece.";

  return (
    <section className="relative rounded-xl overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 min-h-[300px]">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="relative z-10 flex gap-8 items-center p-8 md:p-12">
        {/* Book Cover */}
        <div className="w-32 h-48 md:w-40 md:h-56 rounded-lg bg-gray-700 overflow-hidden shrink-0 shadow-2xl">
          {b.coverUrl ? (
            <img
              src={b.coverUrl}
              alt={`📖Book cover of ${b.title}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-600 flex items-center justify-center">
              <span className="text-4xl">📖</span>
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
            {b.title}
          </h1>
          {b.author && (
            <h2 className="text-lg md:text-xl text-gray-300 font-medium">
              {b.author}
            </h2>
          )}
          <p className="text-sm md:text-base text-gray-300 max-w-2xl leading-relaxed">
            {stub}
          </p>

          <div className="pt-2">
            <Link
              href={`/read/${b._id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-medium transition-colors shadow-lg"
            >
              📖 Start Reading
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}