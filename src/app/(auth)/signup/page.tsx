"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const r = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });

    setLoading(false);

    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr((j as { error?: string })?.error || "Sign up failed");
      return;
    }

    // Auto sign-in then merge guest progress
    await signIn("credentials", { email, password, redirect: false });
    await fetch("/api/auth/merge-guest", { method: "POST" }).catch(() => {});
    router.push("/");
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>

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
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
          required
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          required
        />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button disabled={loading} className="w-full border rounded p-2">
          {loading ? "…" : "Sign up"}
        </button>
      </form>

      <p className="text-sm mt-3">
        Already have an account?{" "}
        <Link className="text-blue-600" href="/signin">
          Sign in
        </Link>
      </p>
    </main>
  );
}
