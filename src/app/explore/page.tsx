// src/app/explore/page.tsx
import BookCard from "@/components/bookcard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ExplorePage() {
  let books: any[] = [];

  try {
    const res = await fetch("/api/books/search", {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    const ct = res.headers.get("content-type") || "";
    if (res.ok && ct.includes("application/json")) {
      const data = await res.json();
      books = Array.isArray(data?.books) ? data.books : [];
    } else {
      const preview = await res.text().catch(() => "");
      console.error("❌ /explore -> /api/books/search failed", {
        status: res.status,
        ct,
        preview: preview.slice(0, 400),
      });
    }
  } catch (err) {
    console.error("❌ Explore fetch error:", err);
  }

  return (
    <main className="px-6 py-8">
      <h1 className="text-xl font-semibold mb-4">Explore</h1>

      {books.length === 0 ? (
        <p className="text-gray-500">
          No books found (or the API failed). Check server logs.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {books.map((b) => (
            <BookCard key={b._id || b.id} {...b} />

          ))}
        </div>
      )}
    </main>
  );
}
