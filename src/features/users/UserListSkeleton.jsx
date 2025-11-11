// src/features/members/UserListSkeleton.jsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function UserListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {/* Tạo 4 card mờ */}
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="shadow-lg">
          <CardHeader className="flex items-center">
            <Skeleton className="w-24 h-24 rounded-full mb-4" />
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="text-center">
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}