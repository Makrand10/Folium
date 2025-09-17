// src/app/page.tsx
import BookCard from "@/components/bookcard";
import ContinueCard from "@/components/continuecard";
import { getServerAuthSession } from "@/auth";
import LibraryButton from "@/components/librarybutton";
import FeaturedRotator from "@/components/featuredrotator";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getBaseUrl() {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function getLatest(limit = 18) {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/books/search?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.books ?? []) as any[];
}

export default async function HomePage() {
  const session = await getServerAuthSession();
  const isAuthed = !!session?.user?.id;

  const books = await getLatest(18);
  const featuredPool = books.slice(0, 4);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* 🎬 Dynamic rotating hero (8s) */}
      {featuredPool.length > 0 && (
        <FeaturedRotator books={featuredPool} rotateMs={8000} />
      )}

      {!isAuthed ? (
        <section className="rounded-xl border border-gray-700 bg-gray-800 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Welcome to FOLIUM</h2>
            <p className="text-sm text-gray-300">
              Create a free account to upload EPUBs and continue where you left off.
            </p>
          </div>
          <div className="flex gap-3">
            {/* <a
              href="/signup"
              className="inline-flex items-center rounded-lg border border-gray-600 px-4 py-2 font-medium hover:bg-gray-700 text-white"
            >
              Sign up
            </a> */}
            {/* <a
              href="/signin"
              className="inline-flex items-center rounded-lg bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700"
            >
              Sign in
            </a> */}
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h2 className="mb-2 font-semibold text-white">Continue</h2>
            <ContinueCard />
          </div>
          <div>
            <h2 className="mb-2 font-semibold text-white">Upload</h2>
            <a
              href="/upload"
              className="block rounded-xl border border-gray-600 bg-gray-800 text-white p-4 hover:bg-gray-700 text-center mb-3"
            >
              + Upload EPUB
            </a>
            <LibraryButton />
          </div>
        </section>
      )}

      {/* 🧱 Explore grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white">Explore</h2>
          <a className="text-sm text-blue-400 hover:text-blue-300" href="/explore">
            See all
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {books.slice(0, 4).map((b: any) => (
            <BookCard
              key={b._id}
              _id={String(b._id)}
              title={b.title}
              author={b.author}
              coverUrl={b.coverUrl}
            />
          ))}
        </div>
      </section>
    </main>
  );
}