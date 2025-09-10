<<<<<<< HEAD
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
=======
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
>>>>>>> 495220c51caa47a8f374fd3dbe41af9d1e0ae2d4
