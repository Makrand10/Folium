import BookCard from "@/components/bookcard";

export default async function ExplorePage() {
  const res = await fetch(`${process.env.NEXTAUTH_URL || ""}/api/books/search`, { cache: "no-store" });
  const data = await res.json();
  const books = data.books as any[];

  return (
    <main className="px-6 py-8">
      <h1 className="text-xl font-semibold mb-4">Explore</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {books.map((b) => <BookCard key={b._id} {...b} />)}
      </div>
    </main>
  );
}
