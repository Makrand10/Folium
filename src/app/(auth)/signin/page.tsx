"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams(); // ✅ client hook inside Suspense
  const callbackUrl = params.get("callbackUrl") || "/";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      setErr("Invalid credentials");
      return;
    }

    // merge guest progress then redirect
    await fetch("/api/auth/merge-guest", { method: "POST" }).catch(() => {});
    router.push(callbackUrl);
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          type="email"
          required
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          type="password"
          required
        />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button disabled={loading} className="w-full border rounded p-2">
          {loading ? "…" : "Sign in"}
        </button>
      </form>

      <p className="text-sm mt-3">
        No account?{" "}
        <Link className="text-blue-600" href="/signup">
          Create one
        </Link>
      </p>
    </main>
  );
}

export default function SignInPage() {
  // ✅ wrap component that calls useSearchParams in Suspense (Next 15 requirement)
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <SignInInner />
    </Suspense>
  );
}
