// frontend/src/services/offline.js

import { api } from './api'
import { useWebSocketStore } from '../store/slices/websocketSlice'

class OfflineService {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    this.pendingActions = []
    this.setupListeners()
    this.initDB()
  }
  
  initDB() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      const request = indexedDB.open('offlineStorage', 1)
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id', autoIncrement: true })
        }
      }
    }
  }

  setupListeners() {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncPendingActions()
      useWebSocketStore.getState().reconnect()
      
      // Show notification
      this.showToast('Back Online', 'Your connection has been restored', 'success')
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
      this.showToast('Offline Mode', 'Some features may be limited', 'warning')
    })
  }
  
  async syncPendingActions() {
    const actions = JSON.parse(localStorage.getItem('pendingActions') || '[]')
    
    for (const action of actions) {
      try {
        await this.executeAction(action)
        // Remove action after successful sync
        const updated = actions.filter((a) => a.id !== action.id)
        localStorage.setItem('pendingActions', JSON.stringify(updated))
      } catch (error) {
        console.error('Failed to sync action:', error)
      }
    }
  }
  
  executeAction(action) {
    // Execute the action based on type
    switch (action.type) {
      case 'upload_resume':
        return this.uploadResumeOffline(action.data)
      case 'save_job':
        return this.saveJobOffline(action.data)
      default:
        return Promise.resolve()
    }
  }
  
  queueAction(action) {
    const pendingActions = JSON.parse(localStorage.getItem('pendingActions') || '[]')
    pendingActions.push({
      id: Date.now(),
      ...action,
    })
    localStorage.setItem('pendingActions', JSON.stringify(pendingActions))
  }
  
  async uploadResumeOffline(formData) {
    // Offline resume upload
    const reader = new FileReader()
    const file = formData instanceof FormData ? formData.get('file') : formData?.file
    
    if (!file) return Promise.resolve({ success: false, message: 'No file provided' })

    return new Promise((resolve) => {
      reader.onload = (e) => {
        const fileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result,
          savedAt: new Date().toISOString(),
        }
        
        // Store file in IndexedDB
        const request = indexedDB.open('offlineStorage', 1)
        
        request.onsuccess = (event) => {
          const db = event.target.result
          if (!db.objectStoreNames.contains('files')) {
            resolve({ success: true, message: 'File stored' })
            return
          }
          const transaction = db.transaction(['files'], 'readwrite')
          const store = transaction.objectStore('files')
          store.add(fileData)
          
          resolve({ success: true, message: 'File saved offline' })
        }
        request.onerror = () => {
          resolve({ success: false, message: 'Failed to open IndexedDB' })
        }
      }
      reader.readAsDataURL(file)
    })
  }
  
  async saveJobOffline(jobData) {
    // Save job offline
    const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]')
    savedJobs.push(jobData)
    localStorage.setItem('savedJobs', JSON.stringify(savedJobs))
    return { success: true }
  }
  
  showToast(title, message, type = 'info') {
    // Show toast notification
    const event = new CustomEvent('toast', {
      detail: { title, message, type }
    })
    window.dispatchEvent(event)
  }
  
  getOfflineData() {
    const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]')
    const pendingActions = JSON.parse(localStorage.getItem('pendingActions') || '[]')
    
    return {
      savedJobs,
      pendingActions,
      isOnline: this.isOnline,
    }
  }
}

export const offlineService = new OfflineService()
export default offlineService
