// frontend/src/store/slices/notificationSlice.js

import { createSlice } from '@reduxjs/toolkit'

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    notifications: [],
    unreadCount: 0,
  },
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload)
      state.unreadCount += 1
    },
    updateUnreadCount: (state) => {
      state.unreadCount = state.notifications.filter(n => !n.read).length
    },
    markNotificationRead: (state, action) => {
      const index = state.notifications.findIndex(n => n.id === action.payload)
      if (index !== -1) {
        state.notifications[index].read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    clearNotifications: (state) => {
      state.notifications = []
      state.unreadCount = 0
    }
  }
})

export const { 
  addNotification, 
  updateUnreadCount, 
  markNotificationRead, 
  clearNotifications 
} = notificationSlice.actions

export default notificationSlice.reducer
