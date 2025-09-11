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
  const [error, setError] = useState<string | null>(null);

  // 1) load book metadata (stream URL)
  useEffect(() => {
    if (!bookId) return;
    (async () => {
      try {
        const res = await fetch(`/api/books/${bookId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`meta ${res.status}`);
        const data = await res.json();
        setBookUrl(data.book.fileUrl as string); // e.g. /api/files/epub/<fileId>.epub
      } catch (e: any) {
        setError(e?.message || "Failed to load book");
      }
    })();
  }, [bookId]);

  // 2) resume from saved progress (guest cookie)
  useEffect(() => {
    if (!bookId) return;
    (async () => {
      try {
        const r = await fetch(`/api/progress?bookId=${bookId}`, { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (j?.progress?.cfi) setLocation(j.progress.cfi);
      } catch {}
    })();
  }, [bookId]);

  if (!bookId)  return <div className="p-6">Missing book id…</div>;
  if (error)    return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!bookUrl) return <div className="p-6">Loading…</div>;

  return (
    <div className="h-[calc(100vh-64px)]">
      <ReactReader
        url={bookUrl}
        epubOptions={{ openAs: "epub" }}
        location={location}
        locationChanged={(loc: any) => setLocation(loc)}
        getRendition={(rendition: any) => {
          // Smart start (unchanged)
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

          // Generate locations and compute % from CFI
          let locationsApi: any = null;
          rendition.book.ready
            .then(() => rendition.book.locations.generate(1600))
            .then(() => { locationsApi = rendition.book.locations; })
            .catch(() => {});

          // Save progress (debounced)
          let timer: any = null;
          const save = (loc: any) => {
            const cfi = loc?.start?.cfi;
            let pct01 = 0;
            if (locationsApi && cfi) {
              try { pct01 = locationsApi.percentageFromCfi(cfi) || 0; } catch {}
            } else if (typeof loc?.start?.percentage === "number") {
              pct01 = loc.start.percentage; // rare fallback
            }
            const percentage = Math.min(100, Math.max(0, Math.round(pct01 * 100)));
            fetch("/api/progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bookId, cfi, percentage }),
            }).catch(() => {});
          };

          rendition.on("relocated", (loc: any) => {
            clearTimeout(timer);
            timer = setTimeout(() => save(loc), 350);
          });
        }}
        swipeable
        showToc
      />
    </div>
  );
}
