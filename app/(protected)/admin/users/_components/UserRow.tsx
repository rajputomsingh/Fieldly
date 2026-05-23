// app/(protected)/admin/users/_components/UserRow.tsx
"use client";

import Image from "next/image";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Eye,
  Edit,
  Ban,
  Trash2,
  CheckCircle,
  XCircle,
  User,
  Bell,
} from "lucide-react";
import { format } from "date-fns";
import { ROLE_BADGE_CONFIG } from "../_constants";
import type { AdminUser } from "../_types";

interface UserRowProps {
  user: AdminUser;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onView: (id: string) => void;
  onEdit: (user: AdminUser) => void;
  onBan: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onNotify: (user: AdminUser) => void;
}

export function UserRow({
  user,
  selected,
  onSelect,
  onView,
  onEdit,
  onBan,
  onDelete,
  onNotify,
}: UserRowProps) {
  const roleConfig = ROLE_BADGE_CONFIG[user.role || ""] || {
    label: "No Role",
    variant: "outline" as const,
    icon: User,
  };
  const RoleIcon = roleConfig.icon;

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelect(user.id, !!checked)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 
            flex items-center justify-center overflow-hidden">
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.name}
                width={40}
                height={40}
                className="h-10 w-10 object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-gray-500" />
            )}
          </div>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={roleConfig.variant} className="gap-1">
          <RoleIcon className="h-3 w-3" />
          {roleConfig.label}
        </Badge>
      </TableCell>
      <TableCell>
        {user.isOnboarded ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1">
            <CheckCircle className="h-3 w-3" />
            Onboarded
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <XCircle className="h-3 w-3" />
            Pending
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <p className="text-sm">{user.state || "—"}</p>
        <p className="text-xs text-gray-500">{user.district || ""}</p>
      </TableCell>
      <TableCell>
        <p className="text-sm">{format(new Date(user.createdAt), "MMM d, yyyy")}</p>
        <p className="text-xs text-gray-500">
          {format(new Date(user.createdAt), "h:mm a")}
        </p>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <span className="font-medium">{user._count?.applications || 0}</span> apps
          <span className="mx-1">•</span>
          <span className="font-medium">{user._count?.listingsOwned || 0}</span> listings
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {/* Quick Notify Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNotify(user);
                  }}
                >
                  <Bell className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send Notification</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView(user.id)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onBan(user)}
              >
                <Ban className="h-4 w-4 mr-2" />
                Ban User
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(user)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}