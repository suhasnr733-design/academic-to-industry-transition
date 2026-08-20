// frontend/src/utils/healthCheck.js

export const checkBackendHealth = async () => {
  try {
    const response = await fetch('/api/v1/health')
    if (response.ok) {
      return { status: 'healthy', message: 'Backend is running' }
    }
    return { status: 'unhealthy', message: 'Backend is not responding' }
  } catch (error) {
    return { status: 'unhealthy', message: error.message }
  }
}

export const checkAllServices = async () => {
  const results = {
    backend: await checkBackendHealth(),
    // Add more services as needed
  }
  return results
}

export default {
  checkBackendHealth,
  checkAllServices,
}
