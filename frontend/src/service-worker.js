// frontend/src/service-worker.js

const CACHE_VERSION = 'v2'
const CACHE_NAME = `ai-transition-${CACHE_VERSION}`
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - Network first, then cache
self.addEventListener('fetch', (event) => {
  const request = event.request
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    event.respondWith(fetch(request))
    return
  }
  
  // Skip API requests
  if (request.url.includes('/api/')) {
    event.respondWith(fetch(request))
    return
  }
  
  // Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clonedResponse = response.clone()
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, clonedResponse)
            })
        }
        return response
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            
            // Return fallback page for navigation requests
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html')
            }
            
            return new Response('Offline content not available', {
              status: 503,
              statusText: 'Service Unavailable'
            })
          })
      })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-resume-uploads') {
    event.waitUntil(syncResumeUploads())
  }
})

async function syncResumeUploads() {
  // Sync pending resume uploads
  const cache = await caches.open('pending-uploads')
  const requests = await cache.keys()
  
  for (const request of requests) {
    try {
      const response = await fetch(request)
      if (response.ok) {
        await cache.delete(request)
      }
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }
}