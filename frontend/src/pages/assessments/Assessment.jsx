// src/pages/assessment/Assessment.jsx

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessments } from '../../hooks/useAssessments'
import { Button } from '../../components/common/Button'
import { Heading } from '../../components/common/Typography'
import { Input } from '../../components/common/Input'
import toast from 'react-hot-toast'

export const Assessment = () => {
  const navigate = useNavigate()
  const { startAssessment, submitAssessment } = useAssessments()
  const [isLoading, setIsLoading] = React.useState(false)
  const [currentQuestion, setCurrentQuestion] = React.useState(0)
  const [answers, setAnswers] = React.useState({})
  const [questions, setQuestions] = React.useState([])

  React.useEffect(() => {
    const loadQuestions = async () => {
      const data = await startAssessment()
      setQuestions(data.questions)
    }
    loadQuestions()
  }, [startAssessment])

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = async () => {
    try {
      setIsLoading(true)
      const result = await submitAssessment(answers)
      toast.success('Assessment completed!')
      navigate(`/assessment/results/${result.id}`)
    } catch (error) {
      toast.error(error.message || 'Failed to submit assessment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Heading level={2}>Skill Assessment</Heading>
            <p className="text-gray-500 mt-1">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full ${
                  idx === currentQuestion ? 'bg-primary-500' :
                  answers[questions[idx]?.id] ? 'bg-green-500' :
                  'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {questions.length > 0 && questions[currentQuestion] && (
          <div>
            <p className="text-lg font-medium text-gray-900 mb-6">
              {questions[currentQuestion].question}
            </p>

            <div className="space-y-3">
              {questions[currentQuestion].options?.map((option, idx) => (
                <label
                  key={idx}
                  className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                    answers[questions[currentQuestion].id] === option
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question_${questions[currentQuestion].id}`}
                    value={option}
                    checked={answers[questions[currentQuestion].id] === option}
                    onChange={() => handleAnswer(questions[currentQuestion].id, option)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-3 text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="secondary"
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          {currentQuestion === questions.length - 1 ? (
            <Button onClick={handleSubmit} isLoading={isLoading}>
              Submit Assessment
            </Button>
          ) : (
            <Button onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}>
              Next Question
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}