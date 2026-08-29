// src/components/learning/PracticeSection.jsx

import React, { useState } from 'react'
import { SkillBrandLogo } from './SkillBrandLogo'
import { LightBulbIcon, CheckCircleIcon, XCircleIcon, ArrowRightIcon, ExternalLinkIcon, CodeIcon } from '@heroicons/react/outline'

const PRACTICE_PLATFORMS = [
  { id: 'all', name: 'All Platforms' },
  { id: 'leetcode', name: '🧩 LeetCode' },
  { id: 'hackerrank', name: '🟢 HackerRank' },
  { id: 'gfg', name: '💻 GeeksforGeeks' }
]

const MULTI_PLATFORM_PROBLEMS_BY_SKILL = {
  'Data Structures': [
    { id: 1, platform: 'leetcode', sourceName: 'LeetCode', title: 'Two Sum', number: 'LeetCode #1', difficulty: 'Easy', topic: 'Arrays & HashMaps', url: 'https://leetcode.com/problems/two-sum/' },
    { id: 2, platform: 'hackerrank', sourceName: 'HackerRank', title: 'Array Manipulation & Max Value', number: 'HackerRank Hard', difficulty: 'Hard', topic: 'Arrays & Difference Array', url: 'https://www.hackerrank.com/challenges/crush/problem' },
    { id: 3, platform: 'gfg', sourceName: 'GeeksforGeeks', title: 'Subarray with Given Sum', number: 'GFG Must-Do', difficulty: 'Medium', topic: 'Arrays & Sliding Window', url: 'https://practice.geeksforgeeks.org/problems/subarray-with-given-sum-1587115621/1' },
    { id: 4, platform: 'leetcode', sourceName: 'LeetCode', title: 'Valid Parentheses', number: 'LeetCode #20', difficulty: 'Easy', topic: 'Stacks & Strings', url: 'https://leetcode.com/problems/valid-parentheses/' },
    { id: 5, platform: 'hackerrank', sourceName: 'HackerRank', title: 'Tree: Inorder Traversal', number: 'HackerRank Easy', difficulty: 'Easy', topic: 'Trees & Traversal', url: 'https://www.hackerrank.com/challenges/tree-inorder-traversal/problem' },
    { id: 6, platform: 'gfg', sourceName: 'GeeksforGeeks', title: 'Left View of Binary Tree', number: 'GFG Must-Do', difficulty: 'Easy', topic: 'Binary Trees & BFS', url: 'https://practice.geeksforgeeks.org/problems/left-view-of-binary-tree/1' }
  ],
  'Algorithms': [
    { id: 1, platform: 'leetcode', sourceName: 'LeetCode', title: 'Binary Search', number: 'LeetCode #704', difficulty: 'Easy', topic: 'Searching & Binary Search', url: 'https://leetcode.com/problems/binary-search/' },
    { id: 2, platform: 'hackerrank', sourceName: 'HackerRank', title: 'Dijkstra: Shortest Reach 2', number: 'HackerRank Medium', difficulty: 'Medium', topic: 'Graph Algorithms', url: 'https://www.hackerrank.com/challenges/dijkstrashortreach/problem' },
    { id: 3, platform: 'gfg', sourceName: 'GeeksforGeeks', title: '0 - 1 Knapsack Problem', number: 'GFG Must-Do', difficulty: 'Medium', topic: 'Dynamic Programming', url: 'https://practice.geeksforgeeks.org/problems/0-1-knapsack-problem0945/1' }
  ],
  'Problem Solving': [
    { id: 1, platform: 'leetcode', sourceName: 'LeetCode', title: 'Two Sum', number: 'LeetCode #1', difficulty: 'Easy', topic: 'Arrays & Logic', url: 'https://leetcode.com/problems/two-sum/' },
    { id: 2, platform: 'hackerrank', sourceName: 'HackerRank', title: 'Grading Students & Apple and Orange', number: 'HackerRank Easy', difficulty: 'Easy', topic: 'Implementation & Math', url: 'https://www.hackerrank.com/domains/algorithms' },
    { id: 3, platform: 'gfg', sourceName: 'GeeksforGeeks', title: 'Missing Number in Array', number: 'GFG Must-Do', difficulty: 'Easy', topic: 'Arrays & Math', url: 'https://practice.geeksforgeeks.org/problems/missing-number-in-array1416/1' }
  ],
  'Python': [
    { id: 1, platform: 'leetcode', sourceName: 'LeetCode', title: 'Contains Duplicate', number: 'LeetCode #217', difficulty: 'Easy', topic: 'Arrays & Sets', url: 'https://leetcode.com/problems/contains-duplicate/' },
    { id: 2, platform: 'hackerrank', sourceName: 'HackerRank', title: 'Python If-Else & Loops Challenge', number: 'HackerRank Easy', difficulty: 'Easy', topic: 'Python Basics', url: 'https://www.hackerrank.com/domains/python' },
    { id: 3, platform: 'gfg', sourceName: 'GeeksforGeeks', title: 'Python List & Dictionary Manipulation', number: 'GFG Practice', difficulty: 'Easy', topic: 'Data Structures in Python', url: 'https://practice.geeksforgeeks.org/explore?page=1&category[]=Python' }
  ],
  'Java': [
    { id: 1, platform: 'leetcode', sourceName: 'LeetCode', title: 'Reverse Linked List', number: 'LeetCode #206', difficulty: 'Easy', topic: 'LinkedLists & Pointers', url: 'https://leetcode.com/problems/reverse-linked-list/' },
    { id: 2, platform: 'hackerrank', sourceName: 'HackerRank', title: 'Java Stacks & Deque Challenge', number: 'HackerRank Medium', difficulty: 'Medium', topic: 'Java Collections', url: 'https://www.hackerrank.com/domains/java' },
    { id: 3, platform: 'gfg', sourceName: 'GeeksforGeeks', title: 'Java OOP Inheritance & Exception Handling', number: 'GFG Practice', difficulty: 'Easy', topic: 'Java OOP', url: 'https://practice.geeksforgeeks.org/explore?page=1&category[]=Java' }
  ],
  'SQL': [
    { id: 1, platform: 'leetcode', sourceName: 'LeetCode', title: 'Combine Two Tables', number: 'LeetCode #175', difficulty: 'Easy', topic: 'SQL LEFT JOIN', url: 'https://leetcode.com/problems/combine-two-tables/' },
    { id: 2, platform: 'hackerrank', sourceName: 'HackerRank', title: 'The PADS & Weather Observation Station', number: 'HackerRank Medium', difficulty: 'Medium', topic: 'SQL Joins & String Aggregation', url: 'https://www.hackerrank.com/domains/sql' },
    { id: 3, platform: 'gfg', sourceName: 'GeeksforGeeks', title: 'Top 50 SQL Query Interview Questions', number: 'GFG Practice', difficulty: 'Medium', topic: 'Relational Database Queries', url: 'https://practice.geeksforgeeks.org/explore?page=1&category[]=SQL' }
  ]
}

export const PracticeSection = ({ questions, skillName, onCompletePractice }) => {
  const [selectedSource, setSelectedSource] = useState('all') // all, leetcode, hackerrank, gfg
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [showHint, setShowHint] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [finishedAll, setFinishedAll] = useState(false)

  // Get multi-platform problem set for this skill
  const rawProblems = MULTI_PLATFORM_PROBLEMS_BY_SKILL[skillName] || MULTI_PLATFORM_PROBLEMS_BY_SKILL['Data Structures']

  // Filter problems by selected platform source
  const filteredProblems = selectedSource === 'all' 
    ? rawProblems 
    : rawProblems.filter(p => p.platform === selectedSource)

  const currentQ = (questions && questions.length > 0) ? questions[currentIndex] : null
  const isCorrect = selectedOption === currentQ?.correct_index

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

  return (
    <div className="space-y-6">
      {/* 1. Multi-Platform Practice Challenges Section */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-500/20">
        
        {/* Header & Source Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-lg shadow-inner shrink-0">
              <CodeIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                <span>{skillName} Coding Challenges</span>
                <span className="text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Multi-Source Set
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Practice real interview problems across LeetCode, HackerRank, and GeeksforGeeks.
              </p>
            </div>
          </div>

          {/* Platform Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {PRACTICE_PLATFORMS.map((plat) => (
              <button
                key={plat.id}
                onClick={() => setSelectedSource(plat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                  selectedSource === plat.id
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/40'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                }`}
              >
                {plat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Problems Grid */}
        {filteredProblems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredProblems.map((prob) => (
              <div 
                key={prob.id}
                onClick={() => window.open(prob.url, '_blank')}
                className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 p-4 rounded-xl transition-all group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[11px] font-extrabold font-mono px-2 py-0.5 rounded border ${
                      prob.platform === 'leetcode' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                      prob.platform === 'hackerrank' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                      'text-sky-400 bg-sky-500/10 border-sky-500/20'
                    }`}>
                      {prob.number}
                    </span>

                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      prob.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      prob.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {prob.difficulty}
                    </span>
                  </div>

                  <h5 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors leading-snug">
                    {prob.title}
                  </h5>

                  <span className="text-[11px] text-slate-400 font-medium block mt-1">
                    Topic: {prob.topic}
                  </span>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-700/60 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:text-amber-300">
                    Solve on {prob.sourceName}
                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                  </span>
                  <SkillBrandLogo skillName={skillName} className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-slate-800/40 rounded-xl border border-slate-700/60">
            <p className="text-xs text-slate-400">No practice problems found for the selected platform.</p>
          </div>
        )}
      </div>

      {/* 2. Interactive Conceptual Practice Quiz */}
      {currentQ && !finishedAll && (
        <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <h4 className="font-bold text-sm text-gray-900">{skillName} Concept Quiz</h4>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>

          <h5 className="font-bold text-base text-gray-900 leading-snug">
            {currentQ.question}
          </h5>

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
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between cursor-pointer ${optStyle}`}
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

          {submitted && currentQ.explanation && (
            <div className={`p-3 rounded-xl text-xs ${isCorrect ? 'bg-green-50 text-green-900 border border-green-200' : 'bg-red-50 text-red-900 border border-red-200'}`}>
              <span className="font-bold">{isCorrect ? '✓ Correct!' : '✕ Incorrect.'}</span> {currentQ.explanation}
            </div>
          )}

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Score: {score}</span>

            {!submitted ? (
              <button
                disabled={selectedOption === null}
                onClick={handleSubmit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
              >
                {currentIndex + 1 < questions.length ? 'Next Question' : 'Finish Practice'}
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PracticeSection
