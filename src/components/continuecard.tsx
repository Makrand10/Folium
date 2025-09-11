"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LastRead = { bookId: string; title: string; author: string; percentage: number | string };

export default function ContinueCard() {
  const [data, setData] = useState<LastRead | null>(null);

  useEffect(() => {
    const fetchIt = () =>
      fetch("/api/me/continue", { cache: "no-store" })
        .then(r => r.json())
        .then(d => setData(d?.lastRead ?? null))
        .catch(() => setData(null));

    fetchIt(); // initial
    const onFocus = () => fetchIt();
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (!data) {
    return <div className="rounded-lg border p-4 text-sm text-gray-500">Nothing to continue yet.</div>;
  }

  const raw = Number((data as any).percentage ?? 0);
  const pct = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
  if (pct >= 100) return null;

  return (
    <Link href={`/read/${data.bookId}`} className="block rounded-lg border p-4 hover:bg-gray-50">
      <div className="font-medium">{data.title}</div>
      <div className="text-sm text-gray-500">{data.author}</div>

      <div className="mt-3 h-2 w-full rounded bg-gray-200">
        <div className="h-2 rounded bg-black" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-xs text-gray-500">{Math.round(pct)}% read</div>
    </Link>
  );
}
