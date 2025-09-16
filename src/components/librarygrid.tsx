"use client";

import { useState } from "react";
import LibraryBookCard from "@/components/librarybookcard";

export default function LibraryGrid({ initialBooks }: { initialBooks: any[] }) {
  const [items, setItems] = useState(initialBooks);

  if (!items?.length) {
    return (
      <div className="text-center p-8 border-dashed border-2 rounded-lg text-gray-500">
        <p className="mb-2">Your library is empty.</p>
        <a href="/upload" className="text-blue-600 hover:underline">
          Upload your first book!
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
      {items.map((b: any) => (
        <LibraryBookCard
          key={b._id}
          {...b}
          onRemoved={(id) =>
            setItems((prev: any[]) => prev.filter((x) => String(x._id) !== String(id)))
          }
        />
      ))}
    </div>
  );
}
