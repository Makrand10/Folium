// src/app/explore/page.tsx
import BookCard from "@/components/bookcard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getBaseUrl() {
  // Works locally and on Vercel
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export default async function ExplorePage() {
  const base = getBaseUrl();

  let books: any[] = [];
  try {
    const res = await fetch(`${base}/api/books/search`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    const isJson = res.headers.get("content-type")?.includes("application/json");
    if (res.ok && isJson) {
      const data = await res.json();
      books = (data?.books as any[]) ?? [];
    } else {
      console.error(
        "❌ Explore fetch failed:",
        res.status,
        res.statusText,
        "content-type:",
        res.headers.get("content-type")
      );
    }
  } catch (err) {
    console.error("❌ Explore fetch error:", err);
  }

  return (
    <main className="px-6 py-8">
      <h1 className="text-xl font-semibold mb-4">Explore</h1>
      {books.length === 0 ? (
        <p className="text-gray-500">No books found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {books.map((b) => (
            <BookCard key={b._id} {...b} />
          ))}
        </div>
      )}
    </main>
  );
}
