import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-dvh flex-col bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      <div className="flex-1 overflow-hidden px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Skeleton className="h-10 w-48 rounded-2xl" />
          </div>

          <div className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
