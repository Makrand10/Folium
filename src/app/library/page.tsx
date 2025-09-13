// src/app/library/page.tsx
import BookCard from "@/components/bookcard";
import { getServerAuthSession } from "@/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function getBaseUrl() {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function getMyBooks() {
  const base = getBaseUrl();
  
  // The 'headers()' function returns a Promise that resolves to a ReadonlyHeaders object.
  // We must 'await' it before passing it to Object.fromEntries.
  const headerObject = Object.fromEntries(await headers());

  const res = await fetch(`${base}/api/books/my-library`, {
    cache: "no-store",
    headers: headerObject,
  });

  if (!res.ok) {
    if (res.status === 401) {
      redirect("/signin");
    }
    return { books: [] };
  }
  const data = await res.json();
  return data;
}

export default async function LibraryPage() {
  const session = await getServerAuthSession();
  
  console.log("🐛 Library Page Session:", session);

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { books } = await getMyBooks();

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <h1 className="text-2xl font-bold">My Library</h1>
      <section>
        {books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {books.map((b: any) => <BookCard key={b._id} {...b} />)}
          </div>
        ) : (
          <div className="text-center p-8 border-dashed border-2 rounded-lg text-gray-500">
            <p className="mb-2">You haven't uploaded any books yet.</p>
            <a href="/upload" className="text-blue-600 hover:underline">
              Upload your first book!
            </a>
          </div>
        )}
      </section>
    </main>
  );
}