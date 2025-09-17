// src/app/upload/page.tsx
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/auth";
import UploadForm from "@/components/upload-form";

export default async function UploadPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent("/upload")}`);
  }

  return <UploadForm />;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;