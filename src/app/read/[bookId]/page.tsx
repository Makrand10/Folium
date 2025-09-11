// src/app/read/[bookId]/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const ReactReader: any = dynamic(
  () => import("react-reader").then((m) => m.ReactReader as any),
  { ssr: false, loading: () => <div className="p-6">Loading reader…</div> }
);

export default function ReaderPage() {
  const params = useParams<{ bookId: string | string[] }>();
  const bookId = useMemo(
    () => (Array.isArray(params?.bookId) ? params.bookId[0] : params?.bookId),
    [params]
  );

  const [bookUrl, setBookUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<string | number | undefined>(undefined);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1) demo user id (replace with real auth later)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/dev/demo-user", { cache: "no-store" });
        const j = await r.json();
        setUserId(j.userId);
      } catch {}
    })();
  }, []);

  // 2) load book metadata (and stream URL)
  useEffect(() => {
    if (!bookId) return;
    (async () => {
      try {
        const res = await fetch(`/api/books/${bookId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`meta ${res.status}`);
        const data = await res.json();
        setBookUrl(data.book.fileUrl as string);
      } catch (e: any) {
        setError(e?.message || "Failed to load book");
      }
    })();
  }, [bookId]);

  // 3) resume from saved CFI if this is the same last-read book
  useEffect(() => {
    if (!userId || !bookId) return;
    (async () => {
      try {
        const r = await fetch(`/api/me/continue?userId=${userId}`, { cache: "no-store" });
        const j = await r.json();
        if (j?.book?._id === bookId && j?.cfi) setLocation(j.cfi);
      } catch {}
    })();
  }, [userId, bookId]);

  if (!bookId)  return <div className="p-6">Missing book id…</div>;
  if (error)    return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!bookUrl) return <div className="p-6">Loading…</div>;

  return (
    <div className="h-[calc(100vh-64px)]">
      <ReactReader
        url={bookUrl}
        epubOptions={{ openAs: "epub" }}      // force zip/epub mode
        location={location}
        locationChanged={(loc: any) => setLocation(loc)}
        getRendition={(rendition: any) => {
          // Only pick a "smart start" if we *don't* have a saved location
          rendition.book.loaded.navigation
            .then((nav: any) => {
              if (location) return;
              const toc = nav?.toc ?? [];
              const isTitle = (s: string = "") => /\b(title\s*page|titlepage|title)\b/i.test(s);
              const coverIdx = toc.findIndex((it: any) =>
                /cover/i.test((it?.label || it?.href || "") as string)
              );
              const titleItem =
                toc.find((it: any) => isTitle(it?.label)) ||
                toc.find((it: any) => isTitle(it?.href));
              const afterCover = coverIdx >= 0 ? toc[coverIdx + 1] : undefined;
              const target = titleItem || afterCover || toc[0];
              if (target?.href) rendition.display(target.href).catch(() => {});
            })
            .catch(() => {});

          // Save progress on every relocation
          rendition.on("relocated", (loc: any) => {
            if (!userId) return;
            const percentage = (loc?.start?.percentage ?? 0) * 100;
            fetch("/api/progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, bookId, cfi: loc?.start?.cfi, percentage }),
            }).catch(() => {});
          });
        }}
        swipeable
        showToc
      />
    </div>
  );
}
