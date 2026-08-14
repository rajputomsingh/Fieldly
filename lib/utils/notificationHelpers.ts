// lib/utils/notificationHelpers.ts
import type { Notification } from "@/types/notification.types";

export const groupNotificationsByDate = (
  notifications: Notification[],
): Record<string, Notification[]> => {
  const groups: Record<string, Notification[]> = {};

  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupKey: string;

    if (isSameDay(date, today)) {
      groupKey = "Today";
    } else if (isSameDay(date, yesterday)) {
      groupKey = "Yesterday";
    } else if (isWithinDays(date, today, 7)) {
      groupKey = "This Week";
    } else if (isWithinDays(date, today, 30)) {
      groupKey = "This Month";
    } else {
      groupKey = "Earlier";
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }

    groups[groupKey].push(notification);
  });

  return groups;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const isWithinDays = (
  date1: Date,
  date2: Date,
  days: number,
): boolean => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days;
};

export const getNotificationIcon = (type: string): string => {
  const icons: Record<string, string> = {
    LISTING: "🏠",
    BID: "🔨",
    PAYMENT: "💰",
    LEASE: "📄",
    MESSAGE: "💬",
    APPLICATION: "📝",
    REVIEW: "⭐",
    REMINDER: "⏰",
    SYSTEM: "🔔",
  };

  return icons[type] || "📌";
};

export const getNotificationColor = (type: string): string => {
  const colors: Record<string, string> = {
    LISTING: "border-green-500 bg-green-50 dark:bg-green-950",
    BID: "border-amber-500 bg-amber-50 dark:bg-amber-950",
    PAYMENT: "border-blue-500 bg-blue-50 dark:bg-blue-950",
    LEASE: "border-purple-500 bg-purple-50 dark:bg-purple-950",
    MESSAGE: "border-cyan-500 bg-cyan-50 dark:bg-cyan-950",
    APPLICATION: "border-orange-500 bg-orange-50 dark:bg-orange-950",
    REVIEW: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
    REMINDER: "border-pink-500 bg-pink-50 dark:bg-pink-950",
    SYSTEM: "border-gray-500 bg-gray-50 dark:bg-gray-950",
  };

  return colors[type] || "border-gray-300 bg-gray-50";
};
