// app/(protected)/admin/notifications/_components/BroadcastForm.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Send, AlertTriangle, Link, Clock } from "lucide-react";

interface BroadcastFormProps {
  isSending: boolean;
  setIsSending: (v: boolean) => void;
  onSuccess?: () => void; // Callback for real-time updates
}

const generateTimeOptions = () => {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const ampm = hour < 12 ? "AM" : "PM";
      const displayHour = hour % 12 || 12;
      const displayMinute = minute.toString().padStart(2, "0");
      const value = `${hour.toString().padStart(2, "0")}:${displayMinute}`;
      const label = `${displayHour}:${displayMinute} ${ampm}`;
      options.push({ value, label });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export function BroadcastForm({ isSending, setIsSending, onSuccess }: BroadcastFormProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [targetType, setTargetType] = useState("all");
  const [targetRole, setTargetRole] = useState("FARMER");
  const [actionUrl, setActionUrl] = useState("");
  const [scheduleLater, setScheduleLater] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const timePickerRef = useRef<HTMLDivElement>(null);
  const timeScrollRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
        setShowTimePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showTimePicker && timeScrollRef.current) {
      const selectedElement = timeScrollRef.current.querySelector(`[data-time="${scheduledTime}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }, [showTimePicker, scheduledTime]);

  const getSelectedTimeLabel = () => {
    const option = TIME_OPTIONS.find((t) => t.value === scheduledTime);
    return option?.label || "09:00 AM";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showConfirm) { setShowConfirm(true); return; }
    setIsSending(true);

    try {
      const body: Record<string, unknown> = {
        title, message, priority, targetType,
        targetRole: targetType === "role" ? targetRole : undefined,
        actionUrl: actionUrl.trim() || null,
      };

      if (scheduleLater) {
        body.scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      }

      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        if (scheduleLater) {
          toast.success(`Scheduled for ${new Date(body.scheduledAt as string).toLocaleString("en-IN")}`);
        } else {
          toast.success(`Sent to ${data.sent} users`);
        }
        resetForm();
        onSuccess?.(); // Trigger real-time refresh
      } else {
        toast.error(data.error || "Failed");
      }
    } catch {
      toast.error("Failed to process notification");
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setTitle(""); setMessage(""); setActionUrl("");
    setScheduleLater(false); setScheduledDate(""); setScheduledTime("09:00");
    setShowConfirm(false);
  };

  const getTargetLabel = () => {
    if (targetType === "all") return "All users";
    if (targetType === "role") return `All ${targetRole.toLowerCase()}s`;
    return "Specific users";
  };

  const getActionLabel = () => {
    if (scheduleLater) {
      if (scheduledDate && scheduledTime) {
        return `Schedule for ${new Date(`${scheduledDate}T${scheduledTime}:00`).toLocaleString("en-IN")}`;
      }
      return "Schedule";
    }
    return showConfirm ? "Confirm Send" : "Send Now";
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" /> Compose Broadcast
        </CardTitle>
        <CardDescription>Send a notification to multiple users at once</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Notification Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Important Update for All Users" required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your notification message here..." required rows={4} maxLength={500} />
            <p className="text-xs text-muted-foreground">{message.length}/500</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="actionUrl" className="flex items-center gap-1"><Link className="h-3.5 w-3.5" /> Action URL (Optional)</Label>
            <Input id="actionUrl" value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} placeholder="/dashboard or /marketplace/listings/abc123" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <RadioGroup value={targetRole} onValueChange={setTargetRole} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="FARMER" id="farmer" /><Label htmlFor="farmer" className="cursor-pointer">Farmers</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="LANDOWNER" id="landowner" /><Label htmlFor="landowner" className="cursor-pointer">Landowners</Label></div>
              </RadioGroup>
            </div>
          )}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><Label htmlFor="schedule" className="cursor-pointer text-sm">Schedule for later</Label></div>
            <Switch id="schedule" checked={scheduleLater} onCheckedChange={setScheduleLater} />
          </div>
          {scheduleLater && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/20">
              <div className="space-y-2">
                <Label>Date</Label>
                <input ref={datePickerRef} type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} min={today} required className={cn("w-full h-10 px-3 rounded-md text-sm", "border border-gray-200 dark:border-gray-700", "bg-white dark:bg-gray-900", "text-gray-900 dark:text-gray-100", "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary", "cursor-pointer", "[color-scheme:light] dark:[color-scheme:dark]")} />
              </div>
              <div className="space-y-2 relative" ref={timePickerRef}>
                <Label>Time</Label>
                <button type="button" onClick={() => setShowTimePicker(!showTimePicker)} className={cn("w-full h-10 px-3 rounded-md text-sm text-left", "border border-gray-200 dark:border-gray-700", "bg-white dark:bg-gray-900", "text-gray-900 dark:text-gray-100", "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary", "flex items-center justify-between", "hover:bg-gray-50 dark:hover:bg-gray-800")}>
                  <span>{getSelectedTimeLabel()}</span><Clock className="h-4 w-4 text-muted-foreground" />
                </button>
                {showTimePicker && (
                  <div className={cn("absolute z-50 mt-1 w-full", "bg-white dark:bg-gray-900", "border border-gray-200 dark:border-gray-700", "rounded-md shadow-lg", "overflow-hidden")}>
                    <ScrollArea className="h-48" ref={timeScrollRef}>
                      <div className="py-1">
                        {TIME_OPTIONS.map((option) => (
                          <button key={option.value} type="button" data-time={option.value} onClick={() => { setScheduledTime(option.value); setShowTimePicker(false); }} className={cn("w-full px-3 py-2 text-sm text-left", "hover:bg-gray-100 dark:hover:bg-gray-800", "transition-colors", scheduledTime === option.value ? "bg-primary/10 text-primary font-medium" : "text-gray-700 dark:text-gray-300")}>
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
          )}
          {showConfirm && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {scheduleLater
                  ? `Schedule for ${new Date(`${scheduledDate}T${scheduledTime}:00`).toLocaleString("en-IN")} to ${getTargetLabel()}.`
                  : `Send to ${getTargetLabel()} immediately.`}{" "}Are you sure?
              </AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={isSending || !title || !message || (scheduleLater && (!scheduledDate || !scheduledTime))}>
              {isSending ? "Processing..." : (<>{scheduleLater ? <Clock className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}{getActionLabel()}</>)}
            </Button>
            {showConfirm && <Button type="button" variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}