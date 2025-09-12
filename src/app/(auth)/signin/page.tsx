"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) { setErr("Invalid credentials"); return; }

    // merge guest progress then go home
    await fetch("/api/auth/merge-guest", { method: "POST" }).catch(() => {});
    router.push(callbackUrl);
  };

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border p-2 rounded" placeholder="Email"
               value={email} onChange={e=>setEmail(e.target.value)} type="email" required />
        <input className="w-full border p-2 rounded" placeholder="Password"
               value={password} onChange={e=>setPassword(e.target.value)} type="password" required />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button disabled={loading} className="w-full border rounded p-2">{loading ? "…" : "Sign in"}</button>
      </form>
      <p className="text-sm mt-3">No account? <a className="text-blue-600" href="/signup">Create one</a></p>
    </main>
  );
}
