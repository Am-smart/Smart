"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Notification } from '@/lib/types';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onNotificationClick: (notification: Notification) => Promise<void>;
  onClearAll?: () => Promise<void>;
}

// Helper function to parse deep links and navigate
const parseDeepLink = (link?: string): { path: string; params?: Record<string, string> } | null => {
  if (!link) return null;

  try {
    // Handle URL-style links: /student/assignments/abc123
    if (link.startsWith('/')) {
      return { path: link };
    }

    // Handle structured links: type:id format
    // e.g., "course:abc123", "assignment:xyz789", "quiz:def456"
    if (link.includes(':')) {
      const [type, id] = link.split(':');
      const routes: Record<string, string> = {
        course: `/student/courses/${id}`,
        assignment: `/student/assignments/${id}`,
        quiz: `/student/quizzes/${id}`,
        discussion: `/student/discussions/${id}`,
        material: `/student/materials/${id}`,
        live: `/student/live/${id}`,
        grading: `/teacher/grading/${id}`,
        students: `/teacher/students/${id}`,
        badge: `/student/achievements?badge=${id}`,
      };

      return { path: routes[type] || '/' };
    }

    return null;
  } catch (error) {
    console.error('Failed to parse deep link:', error);
    return null;
  }
};

// Get icon based on notification type
const getNotificationIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'success':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'error':
    case 'alert':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'info':
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onClose,
  onNotificationClick,
  onClearAll,
}) => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      setIsNavigating(true);

      // Call the callback to mark as read or perform other actions
      await onNotificationClick(notification);

      // Parse and navigate to the deep link
      const deepLink = parseDeepLink(notification.link);
      if (deepLink) {
        router.push(deepLink.path);
        onClose(); // Close panel after navigation
      }
    } catch (error) {
      console.error('Failed to handle notification click:', error);
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-16 right-0 w-full max-w-md bg-white shadow-2xl z-50 rounded-bl-2xl max-h-[calc(100vh-64px)] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
            {onClearAll && notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors py-1 px-2 rounded-lg hover:bg-blue-50"
              >
                Clear all
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close notifications"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Info className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                disabled={isNavigating}
                className={`w-full text-left p-4 transition-all hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                  !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm mb-1">
                      {notification.title}
                    </h4>
                    <p className="text-slate-600 text-sm line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1" />
                  )}
                </div>

                {/* Deep link indicator */}
                {notification.link && (
                  <p className="text-xs text-blue-600 mt-2 ml-8">
                    Tap to view →
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
