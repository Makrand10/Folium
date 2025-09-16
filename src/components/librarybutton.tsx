"use client";

import Link from "next/link";

export default function LibraryButton() {
  return (
    <Link
      href="/library"
      className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
    >
      📚 Go to My Library
    </Link>
  );
}
