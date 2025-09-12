"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BookWithProgress = {
  bookId: string;
  title: string;
  author: string;
  coverUrl?: string;
  percentage: number;
  lastRead: string;
  cfi?: string;
};

export default function MyBookPage() {
  const [books, setBooks] = useState<BookWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch("/api/me/books", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setBooks(data.books || []);
        }
      } catch (error) {
        console.error("Failed to fetch books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">My Books</h1>
        <div className="text-center py-8">
          <div className="text-gray-500">Loading your books...</div>
        </div>
      </main>
    );
  }

  if (books.length === 0) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">My Books</h1>
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">No books in your library yet</div>
          <Link 
            href="/upload" 
            className="inline-block px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Upload your first book
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">My Books</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.map((book) => (
          <Link
            key={book.bookId}
            href={`/read/${book.bookId}`}
            className="block rounded-lg border p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="aspect-[3/4] bg-gray-100 rounded mb-3 flex items-center justify-center overflow-hidden">
              {book.coverUrl ? (
                <img 
                  src={book.coverUrl} 
                  alt={`${book.title} cover`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-sm">No cover</div>
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm line-clamp-2">{book.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-1">{book.author}</p>
              
              <div className="space-y-1">
                <div className="h-2 w-full rounded bg-gray-200">
                  <div 
                    className="h-2 rounded bg-black transition-all" 
                    style={{ width: `${Math.min(100, Math.max(0, book.percentage))}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{Math.round(book.percentage)}% read</span>
                  <span>
                    {new Date(book.lastRead).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
