// src/app/read/[bookId]/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
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

  // library button state
  const [checking, setChecking] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // refs so values persist across renders
  const locationsApiRef = useRef<any>(null);
  const saveTimerRef = useRef<any>(null);
  const lastCfiRef = useRef<string | null>(null);
  const lastPctRef = useRef<number>(-1);

  // 1) load book metadata
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

  // 2) resume from saved progress
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

  // 3) check if book already in library (to hide button)
  useEffect(() => {
    if (!bookId) return;
    let abort = false;
    (async () => {
      try {
        const res = await fetch(`/api/user/library?bookId=${bookId}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!abort) setIsAdded(!!data?.inLibrary);
      } finally {
        if (!abort) setChecking(false);
      }
    })();
    return () => { abort = true; };
  }, [bookId]);

  // Handle adding book to library
  const handleAddToLibrary = async () => {
    if (!bookId || isAdding || isAdded) return;
    setIsAdding(true);
    try {
      const res = await fetch("/api/user/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      if (res.ok) setIsAdded(true);
      else {
        const e = await res.json().catch(() => ({}));
        alert(`Failed to add book: ${e?.error || res.statusText}`);
      }
    } catch {
      alert("An error occurred while adding the book.");
    } finally {
      setIsAdding(false);
    }
  };

  if (!bookId)  return <div className="p-6">Missing book id…</div>;
  if (error)    return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!bookUrl) return <div className="p-6">Loading…</div>;

  return (
    <div className="h-[calc(100vh-64px)] relative">
      {/* Add-to-Library button (hidden when already added) */}
      {!checking && !isAdded && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleAddToLibrary}
            disabled={isAdding}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? "Adding..." : "Add to My Library"}
          </button>
        </div>
      )}

      <ReactReader
        url={bookUrl}
        epubOptions={{ openAs: "epub" }}
        location={location}
        locationChanged={(loc: any) => {
          const cfi = typeof loc === "string" ? loc : loc?.start?.cfi;
          if (cfi) {
            lastCfiRef.current = cfi;
            setLocation(cfi);
          }
        }}
        getRendition={(rendition: any) => {
          // Smart start
          rendition.book.loaded.navigation
            .then((nav: any) => {
              if (location) return;
              const toc = nav?.toc ?? [];
              const isTitle = (s: string = "") => /\b(title\s*page|titlepage|title)\b/i.test(s);
              const coverIdx = toc.findIndex((it: any) => /cover/i.test((it?.label || it?.href || "") as string));
              const titleItem = toc.find((it: any) => isTitle(it?.label)) || toc.find((it: any) => isTitle(it?.href));
              const afterCover = coverIdx >= 0 ? toc[coverIdx + 1] : undefined;
              const target = titleItem || afterCover || toc[0];
              if (target?.href) rendition.display(target.href).catch(() => {});
            })
            .catch(() => {});

          // Generate locations -> enables percentageFromCfi
          rendition.book.ready
            .then(() => rendition.book.locations.generate(1600))
            .then(() => {
              locationsApiRef.current = rendition.book.locations;
              const cfi = lastCfiRef.current || (rendition?.location?.start?.cfi ?? null);
              if (cfi) {
                const pct01 = locationsApiRef.current.percentageFromCfi(cfi) || 0;
                const pct = +(pct01 * 100).toFixed(1);
                lastPctRef.current = pct;
                fetch("/api/progress", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ bookId, cfi, percentage: pct }),
                }).catch(() => {});
              }
            })
            .catch(() => {});

          const save = (loc: any) => {
            const cfi = loc?.start?.cfi;
            lastCfiRef.current = cfi || lastCfiRef.current;

            let pct01 = 0;
            try {
              if (locationsApiRef.current && cfi) {
                pct01 = locationsApiRef.current.percentageFromCfi(cfi) || 0;
              } else if (typeof loc?.start?.percentage === "number") {
                pct01 = loc.start.percentage;
              }
            } catch {}

            const pct = +(Math.min(100, Math.max(0, pct01 * 100))).toFixed(1);
            if (Math.abs(pct - lastPctRef.current) < 0.2) return;
            lastPctRef.current = pct;

            fetch("/api/progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bookId, cfi, percentage: pct }),
            }).catch(() => {});
          };

          rendition.on("displayed", (section: any) => {
            const cfi = section?.start?.cfi || lastCfiRef.current;
            if (!cfi) return;
            save({ start: { cfi } });
          });

          rendition.on("relocated", (loc: any) => {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => save(loc), 350);
          });
        }}
        swipeable
        showToc
      />
    </div>
  );
}
