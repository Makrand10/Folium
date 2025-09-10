"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <main className="px-6 py-8">
      <h1 className="text-xl font-semibold mb-4">Upload EPUB</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          setBusy(true);
          const res = await fetch("/api/books/upload", { method: "POST", body: fd });
          setBusy(false);
          if (!res.ok) {
            alert("Upload failed");
            return;
          }
          const { book } = await res.json();
          router.push(`/read/${book._id}`);
        }}
        encType="multipart/form-data"
        className="space-y-3 max-w-md"
      >
        <input name="title" placeholder="Title" className="w-full border rounded px-3 py-2" required />
        <input name="author" placeholder="Author" className="w-full border rounded px-3 py-2" />
        <input type="file" name="file" accept=".epub,application/epub+zip" required />
        <button disabled={busy} className="px-4 py-2 rounded bg-black text-white">
          {busy ? "Uploading…" : "Upload"}
        </button>
      </form>
    </main>
  );
}
