export default function LoadingSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading your library">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="nb-skeleton h-44" />
        ))}
      </div>
    </div>
  );
}