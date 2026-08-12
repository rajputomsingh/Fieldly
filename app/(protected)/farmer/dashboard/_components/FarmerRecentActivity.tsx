"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  DollarSign,
  MessageSquare,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

interface Activity {
  id: string;
  type: "application" | "lease" | "payment" | "message" | "bid";
  title: string;
  description: string;
  status?: string;
  amount?: number;
  timestamp: Date;
}

interface RecentActivityProps {
  activities: Activity[];
}

export function FarmerRecentActivity({ activities }: RecentActivityProps) {
  const [filter, setFilter] = useState<string>("all");

  const getIcon = (type: Activity["type"]) => {
    switch (type) {
      case "application":
        return FileText;
      case "lease":
        return CheckCircle;
      case "payment":
        return DollarSign;
      case "message":
        return MessageSquare;
      case "bid":
        return TrendingUp;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "success":
      case "active":
        return "text-green-600 bg-green-50 dark:bg-green-900/20";
      case "pending":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
      case "rejected":
      case "failed":
        return "text-red-600 bg-red-50 dark:bg-red-900/20";
      case "outbid":
        return "text-orange-600 bg-orange-50 dark:bg-orange-900/20";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-800";
    }
  };

  const filteredActivities = filter === "all" 
    ? activities 
    : activities.filter(a => a.type === filter);

  const filters = [
    { value: "all", label: "All" },
    { value: "application", label: "Applications" },
    { value: "lease", label: "Leases" },
    { value: "payment", label: "Payments" },
    { value: "bid", label: "Bids" },
  ];

  if (activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl p-8 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700"
      >
        <div className="text-center py-12">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Recent Activity
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            When you have activity, it will appear here
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl p-8 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your latest updates and notifications
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {filters.map((f) => (
            <motion.button
              key={f.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                filter === f.value
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {f.label}
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Activity List */}
      <motion.div 
        className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar"
        layout
      >
        <AnimatePresence mode="popLayout">
          {filteredActivities.map((activity, index) => {
            const Icon = getIcon(activity.type);
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 5 }}
                className="relative group cursor-pointer"
              >
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-green-200 dark:hover:border-green-800 transition-all duration-300">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ rotate: 15 }}
                    className={`p-3 rounded-xl ${getStatusColor(activity.status)}`}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {activity.title}
                      </h3>
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-gray-500 dark:text-gray-400"
                      >
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </motion.span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {activity.description}
                    </p>
                    
                    {activity.amount && (
                      <p className="text-sm font-semibold text-green-600">
                        ₹{Number(activity.amount).toLocaleString()}
                      </p>
                    )}
                    
                    {activity.status && (
                      <motion.span 
                        whileHover={{ scale: 1.05 }}
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-2 ${getStatusColor(activity.status)}`}
                      >
                        {activity.status}
                      </motion.span>
                    )}
                  </div>
                </div>

                {/* Hover Line */}
                <motion.div
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-10 bg-green-500 rounded-r-full"
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                  transition={{ type: "spring" }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
      
      {/* View All Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-6 w-full py-3 text-center text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-all"
      >
        View All Activity
      </motion.button>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </motion.div>
  );
}