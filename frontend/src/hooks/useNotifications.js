// frontend/src/hooks/useNotifications.js

import { create } from 'zustand'

export const useNotifications = create((set) => ({
  notifications: [],
  unreadCount: 0,
  
  addNotification: (notification) =>
    set((state) => {
      const newNotif = {
        id: notification.id || Date.now() + Math.random(),
        title: notification.title || 'Notification',
        message: notification.message || '',
        type: notification.type || 'info',
        timestamp: notification.timestamp || new Date().toISOString(),
        read: false,
        ...notification,
      }
      return {
        notifications: [newNotif, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }
    }),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearAll: () =>
    set({
      notifications: [],
      unreadCount: 0,
    }),
}))

export default useNotifications
