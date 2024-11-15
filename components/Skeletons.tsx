import { Card, Skeleton } from '@nextui-org/react';

export function AvatarSkeleton() {
  return <Skeleton className="rounded-full w-8 h-8" />;
}

export function MapMarkerSkeleton() {
  return (
    <div className="relative">
      <Skeleton className="rounded-full w-10 h-10" />
      <Skeleton className="absolute -top-1 -right-1 w-3 h-3 rounded-full" />
    </div>
  );
}

export function ConnectionCardSkeleton() {
  return (
    <Card className="p-2 w-64">
      <div className="flex items-center gap-3">
        <Skeleton className="w-6 h-6 rounded" />
        <Skeleton className="flex-1 h-4 rounded" />
        <Skeleton className="w-16 h-8 rounded" />
      </div>
    </Card>
  );
}
