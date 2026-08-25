// frontend/src/store/slices/websocketSlice.js

import { create } from 'zustand'
import { io } from 'socket.io-client'
import { useNotifications } from '../../hooks/useNotifications'

export const useWebSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,
  connectionAttempts: 0,
  maxAttempts: 5,
  reconnectDelay: 1000,
  
  connect: (token) => {
    if (get().socket && get().isConnected) return
    
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      query: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: get().maxAttempts,
      reconnectionDelay: get().reconnectDelay,
    })
    
    set({ socket })
    
    socket.on('connect', () => {
      set({ isConnected: true, connectionAttempts: 0 })
      console.log('🔌 WebSocket connected')
    })
    
    socket.on('disconnect', () => {
      set({ isConnected: false })
      console.log('🔌 WebSocket disconnected')
    })
    
    socket.on('notification', (data) => {
      useNotifications.getState().addNotification(data)
    })
    
    socket.on('resume_update', (data) => {
      useNotifications.getState().addNotification({
        title: 'Resume Update',
        message: `Resume ${data.resume_id} is ${data.status}`,
        type: data.status === 'completed' ? 'success' : 'info',
      })
    })
    
    socket.on('job_match', (data) => {
      useNotifications.getState().addNotification({
        title: 'New Job Match!',
        message: `${data.match_score}% match found!`,
        type: 'success',
      })
    })
  },
  
  disconnect: () => {
    const socket = get().socket
    if (socket) {
      socket.disconnect()
      set({ socket: null, isConnected: false })
    }
  },
  
  reconnect: () => {
    const { connect, connectionAttempts } = get()
    if (connectionAttempts < get().maxAttempts) {
      set({ connectionAttempts: connectionAttempts + 1 })
      connect()
    }
  },
  
  emit: (event, data) => {
    const socket = get().socket
    if (socket && get().isConnected) {
      socket.emit(event, data)
    }
  },
  
  joinRoom: (room) => {
    get().emit('join_room', { room })
  },
  
  leaveRoom: (room) => {
    get().emit('leave_room', { room })
  },
}))
