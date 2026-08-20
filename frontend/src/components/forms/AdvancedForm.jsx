// frontend/src/components/forms/AdvancedForm.jsx

import React, { useState, useCallback } from 'react'
import { useForm } from '../../hooks/useForm'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/outline'

export const FormStep = ({ children, step, currentStep, onNext, onPrev, isLast }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
      <div className="mt-6 flex justify-between">
        {step > 1 && (
          <Button variant="secondary" onClick={onPrev}>
            Previous
          </Button>
        )}
        <Button onClick={onNext}>
          {isLast ? 'Submit' : 'Next'}
        </Button>
      </div>
    </motion.div>
  )
}

export const MultiStepForm = ({ steps, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = steps.length
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      onSubmit()
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <FormStep
          key={currentStep}
          step={currentStep}
          currentStep={currentStep}
          onNext={handleNext}
          onPrev={handlePrev}
          isLast={currentStep === totalSteps}
        >
          {steps[currentStep - 1].content}
        </FormStep>
      </AnimatePresence>
    </div>
  )
}

export const FormField = ({ label, error, children }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}

export const FormSection = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        {isOpen ? (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronRightIcon className="h-5 w-5 text-gray-500" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}