import { Skeleton } from '@/components/atoms/skeleton';

export default function LoadingBoard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-14 border-b bg-background" />
      <div className="flex h-14 items-center justify-between border-b px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex gap-4 overflow-hidden p-4">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-80 w-[272px] shrink-0 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
