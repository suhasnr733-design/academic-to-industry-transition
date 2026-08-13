// frontend/src/hooks/useAssessments.js

import { useState, useCallback } from 'react'

export const useAssessments = () => {
  const [isLoading, setIsLoading] = useState(false)

  const startAssessment = useCallback(async () => {
    return {
      id: 'assess_001',
      questions: [
        {
          id: 1,
          question: 'What is the time complexity of searching in a balanced Binary Search Tree?',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)']
        },
        {
          id: 2,
          question: 'Which of the following is a primary key constraint in SQL?',
          options: ['Allows Nulls', 'Uniquely identifies each row', 'Can have multiple per table', 'Must be a string']
        },
        {
          id: 3,
          question: 'What hook is used for side effects in React?',
          options: ['useState', 'useContext', 'useEffect', 'useReducer']
        },
        {
          id: 4,
          question: 'What is the main advantage of Stacking Ensemble ML models?',
          options: ['Faster training time', 'Combines predictions of multiple base models via a meta-learner', 'Uses fewer parameters', 'Requires no feature scaling']
        }
      ]
    }
  }, [])

  const submitAssessment = useCallback(async (answers) => {
    setIsLoading(true)
    await new Promise(res => setTimeout(res, 800))
    setIsLoading(false)
    return {
      id: 'res_001',
      score: 85,
      total: 100,
      answers
    }
  }, [])

  return {
    isLoading,
    startAssessment,
    submitAssessment
  }
}
