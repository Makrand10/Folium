// src/app/read/[bookId]/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const ReactReader: any = dynamic(
  () => import("react-reader").then((m) => m.ReactReader as any),
  { ssr: false, loading: () => <div className="p-6">Loading reader…</div> }
);

// labels we consider “non-reading” entries
const SKIP_LABEL_RE = /(cover|title|frontmatter)/i;

export default function ReaderPage() {
  const params = useParams<{ bookId: string | string[] }>();
  const bookId = useMemo(
    () => (Array.isArray(params?.bookId) ? params.bookId[0] : params?.bookId),
    [params]
  );

  const [bookUrl, setBookUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<string | number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId) return;
    (async () => {
      try {
        const res = await fetch(`/api/books/${bookId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`meta ${res.status}`);
        const data = await res.json();
        // This should be /api/files/epub/<fileId>.epub
        setBookUrl(data.book.fileUrl as string);
      } catch (e: any) {
        setError(e?.message || "Failed to load book");
      }
    })();
  }, [bookId]);

  if (!bookId)  return <div className="p-6">Missing book id…</div>;
  if (error)    return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!bookUrl) return <div className="p-6">Loading…</div>;

  return (
    <div className="h-[calc(100vh-64px)]">
      <ReactReader
        url={bookUrl}
        // Force epub (zip) mode
        epubOptions={{ openAs: "epub" }}
        location={location}
        locationChanged={(loc: any) => setLocation(loc)}
        getRendition={(rendition: any) => {
            // Prefer the TOC item labeled "Title Page" (or similar)
            rendition.book.loaded.navigation
              .then((nav: any) => {
                const toc = nav?.toc ?? [];
                const isTitle = (s: string = "") =>
                  /\b(title\s*page|titlepage|title)\b/i.test(s);
          
                const coverIdx = toc.findIndex((it: any) =>
                  /cover/i.test((it?.label || it?.href || "") as string)
                );
          
                // 1) exact/near “Title Page”
                const titleItem =
                  toc.find((it: any) => isTitle(it?.label)) ||
                  toc.find((it: any) => isTitle(it?.href));
          
                // 2) if no title page, use the item right after cover (common case)
                const afterCover = coverIdx >= 0 ? toc[coverIdx + 1] : undefined;
          
                // 3) final fallback: first TOC item
                const target = titleItem || afterCover || toc[0];
          
                if (target?.href) {
                  rendition.display(target.href).catch(() => {});
                }
              })
              .catch(() => {});
          
            // keep saving progress
            rendition.on("relocated", (loc: any) => {
              const percentage = (loc?.start?.percentage ?? 0) * 100;
              fetch("/api/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookId, cfi: loc?.start?.cfi, percentage }),
              }).catch(() => {});
            });
          }}
          
        // Optional: enable swipe on touch devices
        swipeable
        showToc
      />
    </div>
  );
}
