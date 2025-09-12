// src/components/headeruser.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function HeaderUser() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Welcome, {session.user.name || session.user.email}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/signin"
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="text-sm bg-black text-white px-3 py-1 rounded hover:opacity-90"
      >
        Sign up
      </Link>
    </div>
  );
}