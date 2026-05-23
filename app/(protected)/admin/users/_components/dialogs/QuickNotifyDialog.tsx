// app/(protected)/admin/users/_components/dialogs/QuickNotifyDialog.tsx
"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, User, Link } from "lucide-react";
import type { AdminUser } from "../../_types";

interface QuickNotifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: AdminUser[];
  mode: "single" | "bulk";
}

export function QuickNotifyDialog({
  open,
  onOpenChange,
  users,
  mode,
}: QuickNotifyDialogProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<string>("MEDIUM");
  const [actionUrl, setActionUrl] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    setSending(true);

    try {
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          priority,
          targetType: "specific",
          targetIds: users.map((u) => u.id),
          actionUrl: actionUrl.trim() || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          `Notification sent to ${users.length} user${users.length !== 1 ? "s" : ""}`
        );
        setTitle("");
        setMessage("");
        setPriority("MEDIUM");
        setActionUrl("");
        onOpenChange(false);
      } else {
        toast.error(data.error || "Failed to send notification");
      }
    } catch {
      toast.error("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setTitle("");
      setMessage("");
      setPriority("MEDIUM");
      setActionUrl("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {mode === "single" ? "Send Notification" : "Bulk Notification"}
          </DialogTitle>
          <DialogDescription>
            {mode === "single"
              ? `Send a direct notification to ${users[0]?.name || "user"}`
              : `Send notification to ${users.length} selected user${users.length !== 1 ? "s" : ""}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected Users */}
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 bg-muted/50 rounded-lg">
            {users.map((user) => (
              <Badge key={user.id} variant="secondary" className="gap-1 text-xs">
                <User className="h-3 w-3" />
                {user.name}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="notify-title">Title</Label>
            <Input
              id="notify-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Important Update"
              maxLength={100}
              className="rounded-xl"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="notify-message">Message</Label>
            <Textarea
              id="notify-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your notification message..."
              rows={3}
              maxLength={500}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/500
            </p>
          </div>

          {/* Action URL - NEW */}
          <div className="space-y-2">
            <Label htmlFor="notify-action-url" className="flex items-center gap-1">
              <Link className="h-3.5 w-3.5" />
              Action URL (Optional)
            </Label>
            <Input
              id="notify-action-url"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="/dashboard or /marketplace/listings/abc123"
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              User will be redirected here when clicking the notification
            </p>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={sending}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !title.trim() || !message.trim()}
            className="rounded-xl gap-2"
          >
            <Send className="h-4 w-4" />
            {sending
              ? "Sending..."
              : `Send to ${users.length} user${users.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}