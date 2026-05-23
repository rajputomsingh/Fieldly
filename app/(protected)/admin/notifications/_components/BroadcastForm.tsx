// app/(protected)/admin/notifications/_components/BroadcastForm.tsx
'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, AlertTriangle } from 'lucide-react';

interface BroadcastFormProps {
  isSending: boolean;
  setIsSending: (v: boolean) => void;
}

export function BroadcastForm({ isSending, setIsSending }: BroadcastFormProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [targetType, setTargetType] = useState('all');
  const [targetRole, setTargetRole] = useState('FARMER');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsSending(true);
    
    try {
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          priority,
          targetType,
          targetRole: targetType === 'role' ? targetRole : undefined,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success(`Notification sent to ${data.sent} users`);
        setTitle('');
        setMessage('');
        setShowConfirm(false);
      } else {
        toast.error(data.error || 'Failed to send notification');
      }
    } catch {
      toast.error('Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  const getTargetLabel = () => {
    if (targetType === 'all') return 'All users';
    if (targetType === 'role') return `All ${targetRole.toLowerCase()}s`;
    return 'Specific users';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Compose Broadcast
        </CardTitle>
        <CardDescription>
          Send a notification to multiple users at once
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Notification Title</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Important Update for All Users"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your notification message here..."
              required
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{message.length}/500</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
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
              <Label>Target Audience</Label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="role">By Role</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {targetType === 'role' && (
            <div className="space-y-2">
              <Label>Select Role</Label>
              <RadioGroup value={targetRole} onValueChange={setTargetRole} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="FARMER" id="farmer" />
                  <Label htmlFor="farmer" className="cursor-pointer">Farmers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="LANDOWNER" id="landowner" />
                  <Label htmlFor="landowner" className="cursor-pointer">Landowners</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {showConfirm && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will send a notification to <strong>{getTargetLabel()}</strong>. 
                Are you sure you want to proceed?
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isSending || !title || !message}>
              {isSending ? (
                'Sending...'
              ) : showConfirm ? (
                'Confirm Send'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Broadcast
                </>
              )}
            </Button>
            {showConfirm && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}