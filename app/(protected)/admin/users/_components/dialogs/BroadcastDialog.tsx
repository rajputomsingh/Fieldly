// app/(protected)/admin/users/_components/dialogs/BroadcastDialog.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, AlertTriangle, Link } from "lucide-react";

interface BroadcastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BroadcastDialog({ open, onOpenChange }: BroadcastDialogProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<string>("MEDIUM");
  const [targetType, setTargetType] = useState<string>("all");
  const [targetRole, setTargetRole] = useState<string>("FARMER");
  const [actionUrl, setActionUrl] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  const getTargetLabel = () => {
    if (targetType === "all") return "all users";
    if (targetType === "role") return `all ${targetRole.toLowerCase()}s`;
    return "selected users";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    setSending(true);

    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        message: message.trim(),
        priority,
        targetType,
        actionUrl: actionUrl.trim() || null,
      };

      if (targetType === "role") {
        body.targetRole = targetRole;
      }

      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Broadcast sent to ${data.sent} users`);
        setTitle("");
        setMessage("");
        setPriority("MEDIUM");
        setTargetType("all");
        setActionUrl("");
        setShowConfirm(false);
        onOpenChange(false);
      } else {
        toast.error(data.error || "Failed to send broadcast");
      }
    } catch {
      toast.error("Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setTitle("");
      setMessage("");
      setShowConfirm(false);
      setActionUrl("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Broadcast Notification
          </DialogTitle>
          <DialogDescription>
            Send a notification to all users or by role
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="broadcast-title">Title</Label>
            <Input
              id="broadcast-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Important Platform Update"
              maxLength={100}
              className="rounded-xl"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="broadcast-message">Message</Label>
            <Textarea
              id="broadcast-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your broadcast message..."
              rows={4}
              maxLength={500}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/500
            </p>
          </div>

          {/* Action URL - NEW */}
          <div className="space-y-2">
            <Label htmlFor="broadcast-action-url" className="flex items-center gap-1">
              <Link className="h-3.5 w-3.5" />
              Action URL (Optional)
            </Label>
            <Input
              id="broadcast-action-url"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="/dashboard or /marketplace/listings/abc123"
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Users will be redirected here when clicking the notification
            </p>
          </div>

          {/* Priority & Target */}
          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label>Target</Label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="role">By Role</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {targetType === "role" && (
            <div className="space-y-2">
              <Label>Select Role</Label>
              <RadioGroup
                value={targetRole}
                onValueChange={setTargetRole}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="FARMER" id="farmer" />
                  <Label htmlFor="farmer" className="cursor-pointer">
                    Farmers
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="LANDOWNER" id="landowner" />
                  <Label htmlFor="landowner" className="cursor-pointer">
                    Landowners
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {showConfirm && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will send a notification to <strong>{getTargetLabel()}</strong>.
                This cannot be undone.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={sending}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sending || !title.trim() || !message.trim()}
              className="rounded-xl gap-2"
            >
              <Send className="h-4 w-4" />
              {sending
                ? "Sending..."
                : showConfirm
                ? "Confirm Broadcast"
                : "Send Broadcast"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}