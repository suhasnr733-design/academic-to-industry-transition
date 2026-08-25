// src/components/learning/PracticeSection.jsx

import React, { useState } from 'react'
import { LightBulbIcon, CheckCircleIcon, XCircleIcon, ArrowRightIcon } from '@heroicons/react/outline'

export const PracticeSection = ({ questions, skillName, onCompletePractice }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [showHint, setShowHint] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [finishedAll, setFinishedAll] = useState(false)

  if (!questions || questions.length === 0) return null

  const currentQ = questions[currentIndex]
  const isCorrect = selectedOption === currentQ.correct_index

  const handleSubmit = () => {
    if (selectedOption === null) return
    setSubmitted(true)
    if (isCorrect) {
      setScore(prev => prev + 1)
    }
  }

  const handleNext = () => {
    setSelectedOption(null)
    setShowHint(false)
    setSubmitted(false)

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setFinishedAll(true)
      if (onCompletePractice) onCompletePractice()
    }
  }

  if (finishedAll) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
        <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto" />
        <h4 className="text-lg font-bold text-green-900">Practice Module Complete!</h4>
        <p className="text-sm text-green-800">
          You scored <span className="font-bold">{score}</span> / {questions.length} on {skillName} practice questions.
        </p>
        <button
          onClick={() => {
            setCurrentIndex(0)
            setScore(0)
            setFinishedAll(false)
            setSelectedOption(null)
            setSubmitted(false)
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-xs hover:bg-green-700 transition-colors"
        >
          Retake Practice
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
          <h4 className="font-bold text-sm text-gray-900">{skillName} Interactive Practice</h4>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Question text */}
      <h5 className="font-bold text-base text-gray-900 leading-snug">
        {currentQ.question}
      </h5>

      {/* Hint toggle */}
      {currentQ.hint && (
        <div>
          <button
            onClick={() => setShowHint(!showHint)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
          >
            <LightBulbIcon className="w-4 h-4" />
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </button>
          {showHint && (
            <div className="mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-lg">
              💡 {currentQ.hint}
            </div>
          )}
        </div>
      )}

      {/* Options List */}
      <div className="space-y-2 pt-2">
        {currentQ.options.map((opt, oIdx) => {
          let optStyle = "border-gray-200 hover:border-indigo-300 bg-white"
          if (submitted) {
            if (oIdx === currentQ.correct_index) {
              optStyle = "border-green-500 bg-green-50 text-green-950 font-bold"
            } else if (selectedOption === oIdx) {
              optStyle = "border-red-500 bg-red-50 text-red-950"
            } else {
              optStyle = "border-gray-100 bg-gray-50 opacity-60"
            }
          } else if (selectedOption === oIdx) {
            optStyle = "border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 font-semibold"
          }

          return (
            <button
              key={oIdx}
              disabled={submitted}
              onClick={() => setSelectedOption(oIdx)}
              className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between ${optStyle}`}
            >
              <span>{opt}</span>
              {submitted && oIdx === currentQ.correct_index && (
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              )}
              {submitted && selectedOption === oIdx && oIdx !== currentQ.correct_index && (
                <XCircleIcon className="w-5 h-5 text-red-500" />
              )}
            </button>
          )
        })}
      </div>

      {/* Submitted Explanation */}
      {submitted && currentQ.explanation && (
        <div className={`p-3 rounded-xl text-xs ${isCorrect ? 'bg-green-50 text-green-900 border border-green-200' : 'bg-red-50 text-red-900 border border-red-200'}`}>
          <span className="font-bold">{isCorrect ? '✓ Correct!' : '✕ Incorrect.'}</span> {currentQ.explanation}
        </div>
      )}

      {/* Footer controls */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">Score: {score}</span>

        {!submitted ? (
          <button
            disabled={selectedOption === null}
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow"
          >
            {currentIndex + 1 < questions.length ? 'Next Question' : 'Finish Practice'}
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
