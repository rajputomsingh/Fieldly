// components/shared/notifications/NotificationBell.tsx
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellRing } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useNotifications } from '@/hooks/notifications/useNotifications';
import { useNotificationCount } from '@/hooks/notifications/useNotificationCount';
import { useNotificationStore } from '@/stores/notification.store';
import { NotificationDropdown } from './NotificationDropdown';
import { NotificationBadge } from './NotificationBadge';
import { NotificationPreferences } from './NotificationPreferences';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import type { Notification } from '@/types/notification.types';

interface NotificationBellProps {
  className?: string;
  userRole: 'FARMER' | 'LANDOWNER' | 'ADMIN';
  userId: string;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onNotificationClick?: (notification: Notification) => void;
}

// Custom hook to handle mounted state (fixes ESLint setState-in-effect)
function useMounted() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return mounted;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className,
  userRole,
  userId,
  showBadge = true,
  size = 'md',
  onNotificationClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const mounted = useMounted();
  const bellRef = useRef<HTMLDivElement>(null);
  const previousCountRef = useRef(0);
  const router = useRouter();

  // Store for optimistic updates & ring state
  const { 
    isRinging,
    optimisticMarkRead, 
    rollbackMarkRead,
    optimisticMarkAllRead, 
    rollbackMarkAllRead,
    stopRing 
  } = useNotificationStore();

  const { 
    notifications, 
    isLoading, 
    fetchNextPage, 
    hasNextPage,
    markAsRead,
    markAllAsRead,
    refetch
  } = useNotifications({ 
    userId,
    enabled: isOpen
  });

  const { unreadCount, refetch: refetchCount } = useNotificationCount(userId);

  // Detect new notifications for ring animation
  useEffect(() => {
    if (unreadCount > previousCountRef.current && previousCountRef.current > 0) {
      useNotificationStore.getState().triggerRing();
    }
    previousCountRef.current = unreadCount;
  }, [unreadCount]);

  const updatePosition = useCallback(() => {
    if (bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(updatePosition);
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePositionUpdate = () => {
      requestAnimationFrame(updatePosition);
    };

    window.addEventListener('resize', handlePositionUpdate);
    window.addEventListener('scroll', handlePositionUpdate, { passive: true });

    return () => {
      window.removeEventListener('resize', handlePositionUpdate);
      window.removeEventListener('scroll', handlePositionUpdate);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (bellRef.current?.contains(target)) return;
      
      const portalContent = document.querySelector('[data-notification-portal]');
      if (portalContent?.contains(target)) return;
      
      setIsOpen(false);
      setShowPreferences(false);
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleBellClick = useCallback(() => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    setShowPreferences(false);
    
    if (newIsOpen) {
      stopRing();
      refetchCount();
      refetch();
    }
  }, [isOpen, refetchCount, refetch, stopRing]);

  // Optimistic notification click
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    if (!notification.isRead) {
      optimisticMarkRead(notification.id);
      
      try {
        await markAsRead(notification.id);
        refetchCount();
      } catch {
        rollbackMarkRead(notification.id);
      }
    }
    
    onNotificationClick?.(notification);
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
    
    setIsOpen(false);
  }, [markAsRead, refetchCount, onNotificationClick, router, optimisticMarkRead, rollbackMarkRead]);

  // Optimistic mark all read
  const handleMarkAllRead = useCallback(async () => {
    const previousState = optimisticMarkAllRead();
    
    try {
      await markAllAsRead();
      refetchCount();
      refetch();
    } catch {
      rollbackMarkAllRead(previousState);
    }
  }, [markAllAsRead, refetchCount, refetch, optimisticMarkAllRead, rollbackMarkAllRead]);

  const handlePreferencesClick = useCallback(() => {
    setShowPreferences(prev => !prev);
  }, []);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  } as const;

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  } as const;

  // Fixed bell animation variants with proper Framer Motion types
  const bellVariants: Variants = {
    initial: { rotate: 0 },
    ring: {
      rotate: [0, -15, 15, -10, 10, 0],
      transition: { 
        duration: 0.5, 
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
    idle: {
      rotate: [0, -5, 5, 0],
      transition: { 
        duration: 0.3, 
        ease: [0.4, 0, 0.2, 1] as const, 
        repeat: isRinging ? Infinity : 0,
      },
    },
  };

  const currentAnimation = isRinging ? "ring" : unreadCount > 0 ? "idle" : "initial";

  const dropdownContent = isOpen && (
    <div
      data-notification-portal="true"
      style={{
        position: 'fixed',
        top: dropdownPosition.top,
        right: dropdownPosition.right,
        zIndex: 99999,
        pointerEvents: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <AnimatePresence mode="wait">
        {showPreferences ? (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <NotificationPreferences
              userId={userId}
              userRole={userRole}
              onClose={() => setShowPreferences(false)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <NotificationDropdown
              notifications={notifications}
              isLoading={isLoading}
              hasNextPage={hasNextPage}
              unreadCount={unreadCount}
              userRole={userRole}
              onNotificationClick={handleNotificationClick}
              onMarkAllRead={handleMarkAllRead}
              onLoadMore={fetchNextPage}
              onPreferencesClick={handlePreferencesClick}
              onClose={() => setIsOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      <div ref={bellRef} className={cn('relative', className)}>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative rounded-full transition-all duration-200',
            sizeClasses[size],
            isOpen && 'bg-[#b7cf8a]/20 ring-2 ring-[#b7cf8a]/30'
          )}
          onClick={handleBellClick}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <motion.div
            variants={bellVariants}
            initial="initial"
            animate={currentAnimation}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {unreadCount > 0 ? (
                <motion.div
                  key="ringing"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <BellRing 
                    className={cn(
                      'transition-colors duration-300',
                      isRinging ? 'text-primary animate-pulse' : 'text-[#b7cf8a]'
                    )} 
                    size={iconSizes[size]} 
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="static"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Bell size={iconSizes[size]} className="text-gray-600 dark:text-gray-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {showBadge && unreadCount > 0 && (
            <NotificationBadge 
              count={unreadCount}
              variant={isRinging ? 'destructive' : 'default'}
              className={cn(
                'transition-all duration-300',
                isRinging && 'animate-pulse shadow-lg shadow-destructive/50'
              )}
            />
          )}
        </Button>
      </div>

      {mounted && createPortal(dropdownContent, document.body)}
    </>
  );
};