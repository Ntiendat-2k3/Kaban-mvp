import { Skeleton } from '@/components/atoms/skeleton';

export default function LoadingCardModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="status" aria-label="Đang tải chi tiết thẻ">
      <div className="w-full max-w-3xl space-y-4 rounded-xl border bg-background p-6 shadow-2xl">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
