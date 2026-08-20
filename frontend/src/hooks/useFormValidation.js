// frontend/src/hooks/useFormValidation.js

import { useState, useCallback } from 'react'
import * as yup from 'yup'

export const useFormValidation = (schema, onSubmit) => {
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValid, setIsValid] = useState(false)
  
  const validateField = useCallback(async (name, value) => {
    try {
      await schema.validateAt(name, { ...values, [name]: value })
      setErrors(prev => ({ ...prev, [name]: undefined }))
      return true
    } catch (error) {
      setErrors(prev => ({ ...prev, [name]: error.message }))
      return false
    }
  }, [schema, values])
  
  const validateAll = useCallback(async () => {
    try {
      await schema.validate(values, { abortEarly: false })
      setErrors({})
      return true
    } catch (error) {
      const newErrors = {}
      if (error.inner && error.inner.length > 0) {
        error.inner.forEach((err) => {
          newErrors[err.path] = err.message
        })
      } else if (error.path) {
        newErrors[error.path] = error.message
      }
      setErrors(newErrors)
      return false
    }
  }, [schema, values])
  
  const handleChange = useCallback(async (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    
    setValues(prev => ({ ...prev, [name]: newValue }))
    
    if (touched[name]) {
      await validateField(name, newValue)
    }
    
    // Validate all after change
    const valid = await validateAll()
    setIsValid(valid)
  }, [touched, validateField, validateAll])
  
  const handleBlur = useCallback((e) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    validateField(name, values[name])
  }, [validateField, values])
  
  const handleSubmit = useCallback(async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    setIsSubmitting(true)
    
    // Mark all fields as touched
    const schemaFields = schema && schema.fields ? Object.keys(schema.fields) : Object.keys(values)
    const allTouched = schemaFields.reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {})
    setTouched(allTouched)
    
    const valid = await validateAll()
    
    if (valid) {
      try {
        await onSubmit(values)
      } catch (error) {
        console.error('Submit error:', error)
        setErrors(prev => ({ ...prev, submit: error.message || 'Submission failed' }))
      }
    }
    
    setIsSubmitting(false)
  }, [values, validateAll, onSubmit, schema])
  
  const reset = useCallback(() => {
    setValues({})
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
    setIsValid(false)
  }, [])
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
    validateField,
    validateAll,
  }
}

export const validationSchemas = {
  login: yup.object({
    username: yup.string().required('Username is required'),
    password: yup.string().required('Password is required'),
  }),
  
  register: yup.object({
    username: yup.string()
      .required('Username is required')
      .min(3, 'Username must be at least 3 characters')
      .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: yup.string()
      .required('Email is required')
      .email('Invalid email address'),
    full_name: yup.string()
      .required('Full name is required')
      .min(2, 'Full name must be at least 2 characters'),
    password: yup.string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
      .matches(/[0-9]/, 'Password must contain at least one number')
      .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    confirmPassword: yup.string()
      .oneOf([yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
    department: yup.string().required('Department is required'),
    year_of_study: yup.number()
      .required('Year of study is required')
      .min(1, 'Year must be between 1 and 4')
      .max(4, 'Year must be between 1 and 4'),
  }),
  
  resume: yup.object({
    skills: yup.array().of(yup.string()),
    experience: yup.array().of(yup.object()),
    education: yup.array().of(yup.object()),
  }),
}

export default useFormValidation
