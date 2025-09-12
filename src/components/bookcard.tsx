import Link from "next/link";

type Props = { _id: string; title: string; author?: string; coverUrl?: string };

export default function BookCard({ _id, title, author, coverUrl }: Props) {
  return (
    <Link href={`/read/${_id}`} className="block rounded-xl border p-3 hover:shadow">
      <div className="aspect-[3/4] w-full bg-gray-100 rounded-md overflow-hidden mb-2 flex items-center justify-center">
        {coverUrl ? <img src={coverUrl} alt={title} className="w-full h-full object-cover" /> : <span className="text-sm text-gray-500"></span>}
      </div>
      <div className="text-sm font-medium line-clamp-2">{title}</div>
      <div className="text-xs text-gray-500">{author || "Unknown"}</div>
    </Link>
  );
}
