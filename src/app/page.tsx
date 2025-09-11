import SearchBar from "@/components/searchbar";
import BookCard from "@/components/bookcard";
import ContinueCard from "@/components/continuecard";

function getBaseUrl() {
  // Works locally and in production
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function getLatest() {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/books/search`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.books as any[];
}

export default async function HomePage() {
  const books = await getLatest();

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <SearchBar />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h2 className="mb-2 font-semibold">Continue</h2>
          <ContinueCard />
        </div>
        <div>
          <h2 className="mb-2 font-semibold">Upload</h2>
          <a href="/upload" className="block rounded-xl border p-4 hover:shadow text-center">
            + Upload EPUB
          </a>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Explore</h2>
          <a className="text-sm text-blue-600" href="/explore">See all</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {books.map((b: any) => <BookCard key={b._id} {...b} />)}
        </div>
      </section>
    </main>
  );
}
