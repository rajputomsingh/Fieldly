"use client";

import { memo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  FileCheck,
  CreditCard,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";

export type ActivityType = "application" | "lease" | "payment";

export interface Activity {
  type: ActivityType;
  id: string;
  message: string;
  timestamp: string;
  amount?: number | null;
}

interface Props {
  activities: Activity[];
}

const ICON_MAP = {
  application: <FileText className="h-4 w-4 text-blue-600" />,
  lease: <FileCheck className="h-4 w-4 text-green-600" />,
  payment: <CreditCard className="h-4 w-4 text-purple-600" />,
};

const BG_MAP = {
  application: "bg-blue-50 dark:bg-blue-900/20",
  lease: "bg-green-50 dark:bg-green-900/20",
  payment: "bg-purple-50 dark:bg-purple-900/20",
};

/* ================= RELATIVE TIME HOOK ================= */

function useRelativeTime(date: Date) {
  const [text, setText] = useState("");

  useEffect(() => {
    function update() {
      const diff = Math.floor((Date.now() - date.getTime()) / 60000);

      if (diff <= 0) setText("Just now");
      else if (diff === 1) setText("1 minute ago");
      else if (diff < 60) setText(`${diff} minutes ago`);
      else if (diff < 1440) setText(`${Math.floor(diff / 60)}h ago`);
      else setText(`${Math.floor(diff / 1440)}d ago`);
    }

    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, [date]);

  return text;
}

/* ================= ITEM COMPONENT ================= */

const ActivityItem = memo(function ActivityItem({
  activity,
  index,
}: {
  activity: Activity;
  index: number;
}) {
  const relative = useRelativeTime(new Date(activity.timestamp));

  return (
    <motion.div
      key={activity.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative flex gap-4 group"
    >
      <div
        className={`
          relative z-10
          p-2 rounded-xl
          transition-all
          ${BG_MAP[activity.type] ?? "bg-gray-50"}
          group-hover:scale-110
        `}
      >
        {ICON_MAP[activity.type] ?? (
          <Clock className="h-4 w-4 text-gray-600" />
        )}
      </div>

      <div className="flex-1">
        <p className="text-sm leading-relaxed font-medium text-gray-800 dark:text-gray-200">
          {activity.message}
        </p>

        <div className="flex items-center gap-2 mt-1 text-xs">
          <span className="text-muted-foreground" suppressHydrationWarning>
            {relative}
          </span>

          {activity.amount != null && (
            <>
              <span className="opacity-40">•</span>
              <span className="font-semibold text-[#b7cf8a] tracking-tight">
                ₹{Number(activity.amount).toLocaleString("en-IN")}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
});

/* ================= MAIN COMPONENT ================= */

export const ActivityFeed = memo(function ActivityFeed({ activities }: Props) {
  if (!activities?.length) {
    return (
      <Card className="rounded-3xl border shadow-sm backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>

        <CardContent className="text-sm text-muted-foreground py-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <Clock className="h-6 w-6 opacity-60" />
            No activity yet — actions will appear here.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="
        rounded-3xl
        border border-white/40 dark:border-white/10
        bg-white/80 dark:bg-gray-900/80
        backdrop-blur-xl
        shadow-[0_18px_48px_rgba(0,0,0,0.10),0_6px_16px_rgba(0,0,0,0.06)]
      "
    >
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Recent Activity
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="relative space-y-6">
            <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-gray-200 to-transparent dark:via-gray-700" />

            {activities.map((activity, i) => (
              <ActivityItem key={activity.id} activity={activity} index={i} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});