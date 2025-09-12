// src/components/auth-buttons.tsx
"use client";
import { useSession, signOut } from "next-auth/react";

export default function AuthButtons() {
  const { data } = useSession();
  if (data?.user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span>Hi, {(data.user as any).name || data.user.email}</span>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="border rounded px-2 py-1">
          Sign out
        </button>
      </div>
    );
  }
  return <a className="border rounded px-3 py-1" href="/signin">Sign in</a>;
}
