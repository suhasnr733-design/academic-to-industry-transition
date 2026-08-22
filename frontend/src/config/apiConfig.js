/**
 * Automatically and dynamically resolves the API and WebSocket URLs.
 * 
 * Works seamlessly across:
 * - Localhost (PC browser) -> http://localhost:5000/api/v1
 * - Mobile / LAN on any Wi-Fi/Hotspot (e.g. 10.83.245.31:5173, 192.168.x.x) -> dynamically uses http://<current-host>:5000/api/v1
 * - Production (Vercel / Render) -> Uses configured VITE_API_URL or production backend URL
 */

export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL?.trim()

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname

    // Check if running on local environment or local network IP
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
    const isLocalIP = 
      /^192\.168\.\d+\.\d+$/.test(hostname) || 
      /^10\.\d+\.\d+\.\d+$/.test(hostname) || 
      /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)

    if (isLocalhost || isLocalIP) {
      return `http://${hostname}:5000/api/v1`
    }
  }

  // If explicit production API URL is provided in env
  if (envUrl) {
    return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl.replace(/\/+$/, '')}/api/v1`
  }

  // Default production fallback
  return 'https://academic-to-industry-transition.onrender.com/api/v1'
}

export const getWebSocketUrl = () => {
  const apiBase = getApiBaseUrl()
  return apiBase.replace(/\/api\/v1\/?$/, '')
}
