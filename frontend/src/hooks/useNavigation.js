// frontend/src/hooks/useNavigation.js

import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useMemo, useCallback } from 'react'

export const useNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const goBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  const goTo = useCallback((path, state = {}) => {
    navigate(path, { state })
  }, [navigate])

  const goToWithParams = useCallback((path, params = {}) => {
    const url = Object.keys(params).reduce((acc, key) => {
      return acc.replace(`:${key}`, params[key])
    }, path)
    navigate(url)
  }, [navigate])

  const setQueryParam = useCallback((key, value) => {
    const newParams = new URLSearchParams(searchParams)
    if (value === null || value === undefined || value === '') {
      newParams.delete(key)
    } else {
      newParams.set(key, value)
    }
    setSearchParams(newParams)
  }, [searchParams, setSearchParams])

  const getQueryParam = useCallback((key) => {
    return searchParams.get(key)
  }, [searchParams])

  const getAllQueryParams = useMemo(() => {
    const params = {}
    for (const [key, value] of searchParams.entries()) {
      params[key] = value
    }
    return params
  }, [searchParams])

  const isActive = useCallback((path, exact = false) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }, [location.pathname])

  return {
    navigate,
    location,
    params,
    searchParams,
    goBack,
    goTo,
    goToWithParams,
    setQueryParam,
    getQueryParam,
    getAllQueryParams,
    isActive,
    currentPath: location.pathname,
    queryString: location.search
  }
}