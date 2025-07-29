import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonCard() {
  return (
    <div className="flex flex space-x-3">
      <Skeleton className="h-[125px] w-[250px] rounded-xl bg-gray-300" />
      <div className="space-y-2 flex flex-col justify-between">
        <div className="flex flex-col space-y-2">
        <Skeleton className="h-4 w-[250px] bg-gray-300" />
        <Skeleton className="h-4 w-[200px] bg-gray-300" />
        <Skeleton className="h-4 w-[200px] bg-gray-300" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-4 w-[50px] bg-gray-300" />
          <Skeleton className="h-4 w-[50px] bg-gray-300" />
        </div>
      </div>
    </div>
  )
}
