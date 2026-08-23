// frontend/src/services/websocket.js

import { io } from 'socket.io-client'
import { store } from '../store/store'
import { 
  addNotification, 
  updateUnreadCount,
  markNotificationRead
} from '../store/slices/notificationSlice'
import { updateResumeStatus, setUploadProgress } from '../store/slices/resumeSlice'
import toast from 'react-hot-toast'
import { getWebSocketUrl } from '../config/apiConfig'

class WebSocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return
    }

    const baseURL = getWebSocketUrl()
    this.socket = io(baseURL, {
      query: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true
    })

    this._setupEventListeners()
  }

  _setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected')
      this.isConnected = true
      this.reconnectAttempts = 0
      toast.success('Connected to real-time server')
    })

    this.socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected')
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      this.reconnectAttempts++
    })

    // Notification events
    this.socket.on('notification', (data) => {
      this._handleNotification(data)
    })

    // Resume events
    this.socket.on('resume_update', (data) => {
      this._handleResumeUpdate(data)
    })

    // Job match events
    this.socket.on('job_match', (data) => {
      this._handleJobMatch(data)
    })

    // Progress events
    this.socket.on('resume_progress', (data) => {
      store.dispatch(setUploadProgress(data.progress))
    })
  }

  _handleNotification(data) {
    store.dispatch(addNotification(data))
    store.dispatch(updateUnreadCount())
    
    toast(data.title, {
      icon: this._getNotificationIcon(data.notification_type),
      duration: 5000,
      position: 'top-right'
    })
  }

  _handleResumeUpdate(data) {
    store.dispatch(updateResumeStatus(data))
    
    if (data.status === 'completed') {
      toast.success(`✅ Resume processed successfully!`, {
        duration: 5000,
        icon: '🎉'
      })
    } else if (data.status === 'failed') {
      toast.error(`❌ Resume processing failed`, {
        duration: 5000
      })
    }
  }

  _handleJobMatch(data) {
    toast.success(`🎯 New job match! ${data.match_score}% match found.`, {
      duration: 6000,
      icon: '💼'
    })
  }

  _getNotificationIcon(type) {
    switch (type) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      case 'info': return '📌'
      default: return '📢'
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.isConnected = false
      console.log('🔌 WebSocket disconnected manually')
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data)
    } else {
      console.warn('WebSocket not connected, caching event:', event)
    }
  }

  joinRoom(room) {
    this.emit('join_room', { room })
  }

  leaveRoom(room) {
    this.emit('leave_room', { room })
  }

  // Reconnect manually
  reconnect() {
    if (this.socket) {
      this.socket.connect()
    }
  }
}

export const websocket = new WebSocketService()