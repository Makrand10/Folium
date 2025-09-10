import BookCard from "@/components/bookcard";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q || "";
  const res = await fetch(`${process.env.NEXTAUTH_URL || ""}/api/books/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
  const data = await res.json();
  const books = data.books as any[];

  return (
    <main className="px-6 py-8 space-y-4">
      <h1 className="text-xl font-semibold">Search results for “{q}”</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {books.map((b) => <BookCard key={b._id} {...b} />)}
      </div>
    </main>
  );
}
