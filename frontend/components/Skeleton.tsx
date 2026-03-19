export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-16 mb-4" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-700">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  )
}

export function NotificationSkeleton() {
  return (
    <div className="flex items-start space-x-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export function ToolCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 md:p-4 lg:p-5">
      <div className="text-center">
        <Skeleton className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 mx-auto mb-2 md:mb-3 lg:mb-4 rounded-lg md:rounded-xl" />
        <Skeleton className="h-4 w-20 mx-auto mb-1" />
        <Skeleton className="h-3 w-32 mx-auto mb-2 md:mb-3 hidden sm:block" />
        <Skeleton className="h-8 w-16 mx-auto rounded-md md:rounded-lg" />
      </div>
    </div>
  )
}
