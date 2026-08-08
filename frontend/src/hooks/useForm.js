// frontend/src/hooks/useForm.js

import { useState, useCallback, useMemo } from 'react'
import { debounce } from '../utils/performance'

export const useForm = (initialValues = {}, validate = null) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validate form
  const validateForm = useCallback((fieldValues = values) => {
    if (!validate) return {}
    
    const validationErrors = validate(fieldValues)
    setErrors(validationErrors)
    return validationErrors
  }, [validate, values])

  // Debounced validation
  const debouncedValidate = useMemo(
    () => debounce(validateForm, 300),
    [validateForm]
  )

  // Handle field change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    
    setValues(prev => ({
      ...prev,
      [name]: newValue
    }))
    
    // Validate field
    if (touched[name]) {
      const fieldErrors = validateForm({
        ...values,
        [name]: newValue
      })
      setErrors(fieldErrors)
    }
  }, [values, touched, validateForm])

  // Handle field blur
  const handleBlur = useCallback((e) => {
    const { name } = e.target
    setTouched(prev => ({
      ...prev,
      [name]: true
    }))
    
    // Validate on blur
    const fieldErrors = validateForm(values)
    setErrors(fieldErrors)
  }, [values, validateForm])

  // Handle form submit
  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true)
    
    // Validate all fields
    const validationErrors = validateForm(values)
    setErrors(validationErrors)
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {})
    setTouched(allTouched)
    
    if (Object.keys(validationErrors).length === 0) {
      try {
        await onSubmit(values)
      } catch (error) {
        console.error('Submit error:', error)
      }
    }
    
    setIsSubmitting(false)
  }, [values, validateForm])

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
    setErrors,
    setTouched
  }
}