# Folium
Next.js + MongoDB (GridFS) EPUB reader: search, explore, upload .epub, and “continue reading” with saved progress.

# Book Reader – Next.js + MongoDB (GridFS)

A minimal web app to read EPUB books in the browser. Search the library, explore books (built-ins + user uploads), upload your own `.epub`, and continue reading right where you left off.

## ✨ Features
- **Home:** search bar, **Continue** card (last-read), Upload entry, and a row of library cards.
- **Explore:** grid of all books (existing + user uploads).
- **Search:** server-side text search on title/author/tags.
- **Reader:** opens `/read/[bookId]` and renders the same book in EPUB format.
- **Upload:** add an EPUB; files are stored in **MongoDB GridFS**; metadata saved in Mongo.
- **Progress save:** automatically stores EPUB CFI so the **Continue** card can resume.

## 🧰 Tech Stack
- **Next.js (App Router, TypeScript)**
- **MongoDB + Mongoose** with **GridFS** (store EPUBs)
- **epub.js / react-reader** (in-browser EPUB rendering)
- Tailwind CSS (styling)

🔌 API Endpoints

GET /api/books – list books (public / recent)

POST /api/books – create metadata (used by upload flow)

GET /api/books/[id] – one book (metadata)

GET /api/books/search?q=term – text search (title/author/tags)

POST /api/books/upload – multipart: {file: .epub, title, author, coverUrl?}
→ stores file in GridFS, creates Book, returns book JSON

GET /api/files/epub/[id] – stream EPUB by GridFS file id

POST /api/progress – save { userId, bookId, cfi } for Continue
