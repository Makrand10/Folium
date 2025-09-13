// src/components/bookcard.tsx
import Link from "next/link";

type Props = { 
  _id: string; 
  title: string; 
  author?: string; 
  coverUrl?: string;
  progress?: { percentage: number; cfi: string }; // Add this line
};

export default function BookCard({ _id, title, author, coverUrl, progress }: Props) {
  const percentage = progress?.percentage || 0;

  return (
    <Link href={`/read/${_id}`} className="block rounded-xl border p-3 hover:shadow">
      <div className="aspect-[3/4] w-full bg-gray-100 rounded-md overflow-hidden mb-2 flex flex-col justify-end">
        {/* Book cover or placeholder */}
        <div className="flex-grow flex items-center justify-center">
          {coverUrl ? <img src={coverUrl} alt={title} className="w-full h-full object-cover" /> : <span className="text-sm text-gray-500"></span>}
        </div>
        
        {/* Progress bar */}
        {percentage > 0 && (
          <div className="h-2 bg-gray-300 rounded-full mt-2 mx-2">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        )}

      </div>
      <div className="text-sm font-medium line-clamp-2">{title}</div>
      <div className="text-xs text-gray-500">{author || "Unknown"}</div>
      
    </Link>
  );
}