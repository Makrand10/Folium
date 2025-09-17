// src/app/read/[bookId]/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

const ReactReader: any = dynamic(
  () => import("react-reader").then((m) => m.ReactReader as any),
  { ssr: false, loading: () => <div className="p-6">Loading reader…</div> }
);

// ---------- Minimal IndexedDB helpers ----------
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("epubCache", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("files")) db.createObjectStore("files");
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet<T = unknown>(store: "files" | "meta", key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}
async function idbSet(store: "files" | "meta", key: string, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbDel(store: "files" | "meta", key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export default function ReaderPage() {
  const params = useParams<{ bookId: string | string[] }>();
  const bookId = useMemo(
    () => (Array.isArray(params?.bookId) ? params.bookId[0] : params?.bookId),
    [params]
  );

  const [remoteUrl, setRemoteUrl] = useState<string | null>(null); // from /api/books/[id]
  const [sourceUrl, setSourceUrl] = useState<string | null>(null); // blob: or remote fallback for <ReactReader url>
  const [location, setLocation] = useState<string | number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // library button state
  const [checking, setChecking] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // user id (for per-user cache key)
  const [userId, setUserId] = useState<string | null>(null);

  // refs
  const locationsApiRef = useRef<any>(null);
  const saveTimerRef = useRef<any>(null);
  const lastCfiRef = useRef<string | null>(null);
  const lastPctRef = useRef<number>(-1);
  const activeBlobUrlRef = useRef<string | null>(null);

  // cleanup blob URL when unmounting or swapping
  useEffect(() => {
    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
    };
  }, []);

  // fetch session to identify user (NextAuth)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/session", { cache: "no-store" });
        if (!r.ok) throw new Error();
        const j = await r.json();
        setUserId(j?.user?.id || null);
      } catch {
        setUserId(null); // guest
      }
    })();
  }, []);

  // 1) load book metadata -> remote streaming URL
  useEffect(() => {
    if (!bookId) return;
    (async () => {
      try {
        const res = await fetch(`/api/books/${bookId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`meta ${res.status}`);
        const data = await res.json();
        setRemoteUrl(data.book.fileUrl as string);
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
    return () => {
      abort = true;
    };
  }, [bookId]);

  // ---------- Local cache orchestration ----------
  const cacheKey = useMemo(() => {
    if (!bookId) return null;
    const uid = userId || "guest";
    return `${uid}:${bookId}`;
  }, [userId, bookId]);

  // When we know the remoteUrl (file stream), try cache -> fallback network.
  useEffect(() => {
    if (!remoteUrl || !cacheKey) return;

    let cancelled = false;

    (async () => {
      // 1) Try to serve from cache immediately (fast start)
      try {
        const cachedBlob = await idbGet<Blob>("files", cacheKey);
        if (cachedBlob && !cancelled) {
          const blobUrl = URL.createObjectURL(cachedBlob);
          if (activeBlobUrlRef.current) URL.revokeObjectURL(activeBlobUrlRef.current);
          activeBlobUrlRef.current = blobUrl;
          setSourceUrl(blobUrl);
        }
      } catch {
        // ignore cache errors and continue
      }

      // 2) Validate/update cache in background (ETag/Last-Modified if available)
      try {
        // Pull any saved validators
        const meta = (await idbGet<any>("meta", cacheKey)) || {};
        const headers: Record<string, string> = {};
        if (meta.etag) headers["If-None-Match"] = meta.etag;
        if (meta.lastModified) headers["If-Modified-Since"] = meta.lastModified;

        const res = await fetch(remoteUrl, { headers }); // stream endpoint
        if (res.status === 304) {
          // Cache is fresh; if we didn't have a cached URL yet, load it now
          if (!activeBlobUrlRef.current) {
            const cachedBlob = await idbGet<Blob>("files", cacheKey);
            if (cachedBlob && !cancelled) {
              const blobUrl = URL.createObjectURL(cachedBlob);
              activeBlobUrlRef.current = blobUrl;
              setSourceUrl(blobUrl);
            }
          }
          return;
        }

        if (!res.ok) throw new Error(`Fetch ${res.status}`);

        const etag = res.headers.get("ETag") || undefined;
        const lastModified = res.headers.get("Last-Modified") || undefined;
        const blob = await res.blob();

        await idbSet("files", cacheKey, blob);
        await idbSet("meta", cacheKey, { etag, lastModified, size: blob.size, ts: Date.now() });

        if (!cancelled) {
          const blobUrl = URL.createObjectURL(blob);
          if (activeBlobUrlRef.current) URL.revokeObjectURL(activeBlobUrlRef.current);
          activeBlobUrlRef.current = blobUrl;
          setSourceUrl(blobUrl);
        }
      } catch (e) {
        // If we didn't manage to show cached content above, at least show remote
        if (!cancelled && !activeBlobUrlRef.current) {
          setSourceUrl(remoteUrl);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [remoteUrl, cacheKey]);

  // Optional: allow manual cache reset (handy while testing)
  async function clearThisCache() {
    if (!cacheKey) return;
    try {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
      await idbDel("files", cacheKey);
      await idbDel("meta", cacheKey);
      setSourceUrl(remoteUrl ?? null);
      alert("Local cache cleared for this book.");
    } catch {
      alert("Failed to clear local cache.");
    }
  }

  // Add-to-Library
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

  if (!bookId) return <div className="p-6">Missing book id…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!remoteUrl) return <div className="p-6">Loading…</div>;
  if (!sourceUrl) return <div className="p-6">Preparing your cached copy…</div>;

  return (
    <div className="h-[calc(100vh-64px)] relative">
      {/* Add-to-Library button (hidden when already added) */}
      {!checking && !isAdded && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={handleAddToLibrary}
            disabled={isAdding}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? "Adding..." : "Add to My Library"}
          </button>

          {/* Optional dev utility to clear cache for this book */}
          <button
            onClick={clearThisCache}
            className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300"
            title="Clear local cache for this book"
          >
            Clear Cache
          </button>
        </div>
      )}

      <ReactReader
        url={sourceUrl} // <-- use cached blob: URL when available
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
            const cfi = loc?.start?.cfi || lastCfiRef.current;
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
