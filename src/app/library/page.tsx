//src/app/library/page.tsx

import { getServerAuthSession } from "@/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import LibraryGrid from "@/components/librarygrid";

export const dynamic = "force-dynamic";

function getBaseUrl() {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function getMyBooks() {
  const base = getBaseUrl();
  const headerObject = Object.fromEntries(await headers());
  const res = await fetch(`${base}/api/books/my-library`, {
    cache: "no-store",
    headers: headerObject,
  });

  if (!res.ok) {
    if (res.status === 401) redirect("/signin");
    return { books: [] };
  }
  return res.json();
}

export default async function LibraryPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect("/signin");

  const { books } = await getMyBooks();

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <h1 className="text-2xl font-bold">My Library</h1>
      <LibraryGrid initialBooks={books} />
    </main>
  );
}
