// src/lib/epub-cache.ts
import { idbGet, idbSet, idbDel } from "./idb";

const MIME = "application/epub+zip";

// ---- EPUB blob cache ----
function epubKey(bookId: string) {
  return `epub:${bookId}`;
}
export async function getCachedEpubBlob(bookId: string): Promise<Blob | null> {
  const blob = await idbGet<Blob>("files", epubKey(bookId));
  return blob || null;
}
export async function saveEpubBlob(bookId: string, ab: ArrayBuffer) {
  const blob = new Blob([ab], { type: MIME });
  await idbSet("files", epubKey(bookId), blob);
}
export async function deleteEpubBlob(bookId: string) {
  await idbDel("files", epubKey(bookId));
}

// ---- Locations cache (precomputed CFI list) ----
// ePub.js allows loading saved locations: book.locations.load(serializedArray)
function locKey(bookId: string) {
  return `loc:${bookId}`;
}
export async function getSavedLocations(bookId: string): Promise<number[] | string[] | null> {
  const val = await idbGet<number[] | string[]>("meta", locKey(bookId));
  return val || null;
}
export async function saveLocations(bookId: string, locations: number[] | string[]) {
  await idbSet("meta", locKey(bookId), locations);
}
export async function deleteLocations(bookId: string) {
  await idbDel("meta", locKey(bookId));
}
