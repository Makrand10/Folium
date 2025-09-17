// src/components/librarybutton.tsx
export default function LibraryButton() {
  return (
    <a
      href="/library"
      className="block w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 font-medium text-center transition-colors shadow-md"
    >
      📚 Go to My Library
    </a>
  );
}