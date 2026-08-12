// app/(protected)/landowner/dashboard/_components/RecentApplications.tsx
"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNowStrict } from "date-fns";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

export type ApplicationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "UNDER_REVIEW"
  | "WITHDRAWN";

export interface RecentApplication {
  id: string;
  farmerName: string;
  farmerImage?: string | null;
  proposedRent?: string | null;
  status: ApplicationStatus;
  createdAt: string;
  landTitle?: string;
}

interface Props {
  applications: RecentApplication[];
}

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  PENDING:
    "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300",
  UNDER_REVIEW:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300",
  APPROVED:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300",
  REJECTED:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300",
  WITHDRAWN:
    "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300",
};

export const RecentApplications = memo(function RecentApplications({
  applications,
}: Props) {
  const router = useRouter();

  if (!applications?.length) {
    return (
      <Card
        className="
          h-full rounded-3xl
          border border-white/40 dark:border-white/10
          bg-white/80 dark:bg-gray-900/80
          backdrop-blur-xl
          shadow-[0_18px_48px_rgba(0,0,0,0.10),0_6px_16px_rgba(0,0,0,0.06)]
        "
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Applications</CardTitle>
        </CardHeader>

        <CardContent className="text-sm text-muted-foreground py-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <Clock className="h-6 w-6 opacity-60" />
            <p>No applications yet</p>
            <p className="text-xs">Farmers will appear here when they apply</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="
        h-full rounded-3xl
        border border-white/40 dark:border-white/10
        bg-white/80 dark:bg-gray-900/80
        backdrop-blur-xl
        shadow-[0_18px_48px_rgba(0,0,0,0.10),0_6px_16px_rgba(0,0,0,0.06)]
      "
    >
      <CardHeader className="pb-4 shrink-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          Recent Applications
          <Badge variant="secondary" className="ml-2">
            {applications.length}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea className="h-full max-h-[calc(100vh-280px)] px-6 pb-6">
          <div className="space-y-3">
            {applications.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="
                  group
                  flex items-start gap-3
                  p-4 rounded-xl
                  border border-gray-100 dark:border-gray-800
                  hover:shadow-md hover:-translate-y-0.5
                  transition-all cursor-pointer
                  bg-white/50 dark:bg-gray-900/50
                "
                onClick={() => router.push(`/applications/${app.id}`)}
              >
                <Avatar className="ring-2 ring-[#b7cf8a]/30 shrink-0 h-10 w-10">
                  <AvatarImage src={app.farmerImage ?? ""} />
                  <AvatarFallback className="bg-[#b7cf8a]/20 text-[#5a6b3d] text-sm">
                    {app.farmerName?.charAt(0)?.toUpperCase() ?? "F"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {app.farmerName}
                    </p>

                    <Badge
                      variant="outline"
                      className={`${STATUS_STYLE[app.status]} font-medium text-[10px] px-1.5 py-0 shrink-0`}
                    >
                      {app.status.replace("_", " ")}
                    </Badge>
                  </div>

                  {app.landTitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      {app.landTitle}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Rent:{" "}
                      {app.proposedRent != null ? (
                        <span className="font-medium text-[#b7cf8a]">
                          ₹{Number(app.proposedRent).toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </p>

                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNowStrict(new Date(app.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 shrink-0 h-7 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/applications/${app.id}`);
                  }}
                >
                  View
                </Button>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});
