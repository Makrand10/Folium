// src/components/upload-form.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadForm() {
  const [busy, setBusy] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const router = useRouter();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.files = e.dataTransfer.files;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Upload Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Success Message */}
          {uploadSuccess && (
            <div className="mb-6 p-4 bg-emerald-900/50 border border-emerald-500/50 rounded-lg flex items-center gap-3">
              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-emerald-400 font-medium">Upload Successful!</p>
                <p className="text-emerald-300 text-sm">Your book is now live on the platform.</p>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-3">Share Your Story.</h1>
            <p className="text-slate-400 text-lg">Upload your book and join a community of creators.</p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              setBusy(true);
              setUploadSuccess(false);
              
              try {
                const res = await fetch("/api/books/upload", { method: "POST", body: fd });
                setBusy(false);
                
                if (!res.ok) {
                  alert("Upload failed");
                  return;
                }
                
                setUploadSuccess(true);
                const { book } = await res.json();
                
                // Delay redirect to show success message
                setTimeout(() => {
                  router.push(`/read/${book._id}`);
                }, 2000);
              } catch (error) {
                setBusy(false);
                alert("Upload failed");
              }
            }}
            encType="multipart/form-data"
            className="space-y-6"
          >
            {/* Book Title Input */}
            <div>
              <input
                name="title"
                placeholder="Book Title"
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            {/* Author Name Input */}
            <div>
              <input
                name="author"
                placeholder="Author Name"
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* File Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                dragActive
                  ? "border-blue-400 bg-blue-500/10"
                  : "border-slate-600/50 bg-slate-700/30"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-600/50 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-blue-400 text-lg font-medium mb-2">
                  <label htmlFor="file-upload" className="cursor-pointer hover:text-blue-300 transition-colors">
                    Browse files
                  </label>
                  <span className="text-slate-400"> or drag and drop</span>
                </p>
                <p className="text-slate-500 text-sm">EPUB, MOBI, PDF (MAX 2GB)</p>
                <input
                  id="file-upload"
                  type="file"
                  name="file"
                  accept=".epub,application/epub+zip,.mobi,.pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* Upload Button */}
            <button
              disabled={busy}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
            >
              {busy ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Uploading...
                </div>
              ) : (
                "Upload & Share"
              )}
            </button>
          </form>
        </div>

        {/* Right Side - Illustration */}
        <div className="hidden lg:flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-sm border border-slate-600/30">
            <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Unleash Your Narrative</h2>
          <p className="text-slate-400 text-lg max-w-md leading-relaxed">
            From a simple manuscript to a global phenomenon. Your journey starts here.
          </p>
          
          {/* Decorative Elements */}
          <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-purple-400 rounded-full opacity-40 animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 right-1/6 w-1.5 h-1.5 bg-emerald-400 rounded-full opacity-50 animate-pulse delay-500"></div>
        </div>
      </div>
    </div>
  );
}