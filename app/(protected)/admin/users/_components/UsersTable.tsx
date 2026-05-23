// app/(protected)/admin/users/_components/UsersTable.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { User } from "lucide-react"; 
import { UserRow } from "./UserRow";
import type { AdminUser } from "../_types";

interface UsersTableProps {
  users: AdminUser[];
  selectedUsers: string[];
  loading: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onView: (id: string) => void;
  onEdit: (user: AdminUser) => void;
  onBan: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onNotify: (user: AdminUser) => void;
}

export function UsersTable({
  users,
  selectedUsers,
  loading,
  onSelectAll,
  onSelectOne,
  onView,
  onEdit,
  onBan,
  onDelete,
  onNotify,
}: UsersTableProps) {
  return (
    <Card className="rounded-3xl border border-white/40 dark:border-white/10
      bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onCheckedChange={(checked) => onSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <div className="h-12 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <User className="h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No users found</p>
                    <p className="text-sm text-muted-foreground/70">
                      Try adjusting your filters
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  selected={selectedUsers.includes(user.id)}
                  onSelect={onSelectOne}
                  onView={onView}
                  onEdit={onEdit}
                  onBan={onBan}
                  onDelete={onDelete}
                  onNotify={onNotify}
                />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}