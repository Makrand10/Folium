"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Book = { _id: string; title: string; author?: string };
type ContinueResp = { book?: Book; cfi?: string } | null;

export default function ContinueCard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<ContinueResp>(null);
  const [loading, setLoading] = useState(true);

  // get or create a demo user id
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/dev/demo-user", { cache: "no-store" });
        const j = await r.json();
        setUserId(j.userId);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // load last-read for that user
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const r = await fetch(`/api/me/continue?userId=${userId}`, { cache: "no-store" });
      const j = (await r.json()) as ContinueResp;
      setData(j && (j as any).book ? j : null);
    })();
  }, [userId]);

  if (loading) return <div className="p-4 rounded-xl border text-gray-400">Loading…</div>;
  if (!data?.book) return <div className="p-4 rounded-xl border text-gray-500">Nothing to continue yet.</div>;

  const { book } = data;
  return (
    <Link href={`/read/${book._id}`} className="block p-4 rounded-xl border hover:shadow">
      <div className="text-xs text-gray-500">Continue reading</div>
      <div className="text-lg font-semibold">{book.title}</div>
      {book.author ? <div className="text-sm">{book.author}</div> : null}
    </Link>
  );
}
