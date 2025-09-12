// src/app/upload/page.tsx
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/auth";
import UploadForm from "@/components/upload-form";

export default async function UploadPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent("/upload")}`);
  }

  return (
    <main className="px-6 py-8">
      <h1 className="text-xl font-semibold mb-4">Upload EPUB</h1>
      <UploadForm />
    </main>
  );
}
