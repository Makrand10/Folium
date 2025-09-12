// src/auth.ts
import NextAuth, { type NextAuthOptions, getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { dbConnect } from "@/lib/db";
import User from "@/models/user";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = creds?.email?.toString().toLowerCase().trim();
        const password = creds?.password?.toString() || "";
        if (!email || !password) return null;

        await dbConnect();
        const u = await User.findOne({ email }).lean();
        if (!u) return null;
        const ok = await compare(password, (u as any).passwordHash);
        if (!ok) return null;

        return { id: String((u as any)._id), email: (u as any).email, name: (u as any).username };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = (user as any).id;
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = token.uid as string;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper you can use in server components/APIs
export const getServerAuthSession = () => getServerSession(authOptions);
