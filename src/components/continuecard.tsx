import Link from "next/link";

type Props = { lastRead: { bookId: string; title: string; author?: string; percentage?: number } | null };

export default function ContinueCard({ lastRead }: Props) {
  if (!lastRead) {
    return (
      <div className="rounded-xl border p-4 text-sm text-gray-500">
        Nothing to continue yet.
      </div>
    );
  }
  return (
    <Link href={`/read/${lastRead.bookId}`} className="block rounded-xl border p-4 hover:shadow">
      <div className="font-semibold">{lastRead.title}</div>
      <div className="text-xs text-gray-500">{lastRead.author}</div>
      {typeof lastRead.percentage === "number" && (
        <div className="mt-2 h-2 bg-gray-200 rounded">
          <div className="h-2 bg-gray-800 rounded" style={{ width: `${lastRead.percentage}%` }} />
        </div>
      )}
    </Link>
  );
}
