// src/app/page.tsx
import SearchBar from "@/components/searchbar";
import BookCard from "@/components/bookcard";
import ContinueCard from "@/components/continuecard";
import { getServerAuthSession } from "@/auth";
import LibraryButton from "@/components/librarybutton"; // 👈 import the button

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getBaseUrl() {
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
  const session = await getServerAuthSession();
  const isAuthed = !!session?.user?.id;

  const books = await getLatest();

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <SearchBar />

      {!isAuthed ? (
        <section className="rounded-xl border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Welcome to EPUBHUB</h2>
            <p className="text-sm text-gray-600">
              Create a free account to upload EPUBs and continue where you left off.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/signup"
              className="inline-flex items-center rounded-lg border px-4 py-2 font-medium hover:shadow"
            >
              Sign up
            </a>
            <a
              href="/signin"
              className="inline-flex items-center rounded-lg bg-black text-white px-4 py-2 font-medium hover:opacity-90"
            >
              Sign in
            </a>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h2 className="mb-2 font-semibold">Continue</h2>
            <ContinueCard />
          </div>
          <div>
            <h2 className="mb-2 font-semibold">Upload</h2>
            <a
              href="/upload"
              className="block rounded-xl border p-4 hover:shadow text-center mb-3"
            >
              + Upload EPUB
            </a>

            {/* 👇 New Library button just below upload */}
            <LibraryButton />
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Explore</h2>
          <a className="text-sm text-blue-600" href="/explore">
            See all
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {books.map((b: any) => (
            <BookCard key={b._id} {...b} />
          ))}
        </div>
      </section>
    </main>
  );
}
