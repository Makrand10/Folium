"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const [q, setQ] = useState("");
  const router = useRouter();
  return (
    <form
      onSubmit={e => { e.preventDefault(); router.push(`/search?q=${encodeURIComponent(q)}`); }}
      className="w-full max-w-xl mx-auto"
    >
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search books..."
        className="w-full border rounded-lg px-4 py-2"
      />
    </form>
  );
}
