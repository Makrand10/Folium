import BookCard from "@/components/bookcard";

type SearchParams = {
  q?: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // ✅ Await the promise
  const { q = "" } = await searchParams;

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const res = await fetch(
    `${baseUrl}/api/books/search?q=${encodeURIComponent(q)}`,
    { cache: "no-store" }
  );

  const data = res.ok ? await res.json() : { books: [] as any[] };
  const books = (data.books || []) as any[];

  return (
    <main className="px-6 py-8 space-y-4">
      <h1 className="text-xl font-semibold">
        Search results{q ? ` for “${q}”` : ""}
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {books.map((b) => (
          <BookCard key={b._id} {...b} />
        ))}
      </div>
    </main>
  );
}
