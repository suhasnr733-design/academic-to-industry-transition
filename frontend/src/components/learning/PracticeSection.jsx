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
  'JavaScript': [
    { id: 1, platform: 'leetcode', sourceName: 'LeetCode', title: 'Create Hello World Function', number: 'LeetCode #2667', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'JavaScript Closures', url: 'https://leetcode.com/problems/create-hello-world-function/' },
    { id: 2, platform: 'leetcode', sourceName: 'LeetCode', title: 'Counter & State Management', number: 'LeetCode #2620', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'Closures & Scopes', url: 'https://leetcode.com/problems/counter/' },
    { id: 3, platform: 'hackerrank', sourceName: 'HackerRank', title: '10 Days of JavaScript: Loops & Functions', number: 'HackerRank Easy', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'JavaScript Syntax & Loops', url: 'https://www.hackerrank.com/domains/tutorials/10-days-of-javascript' },
    { id: 4, platform: 'gfg', sourceName: 'GeeksforGeeks', title: 'JavaScript Asynchronous Promises & Fetch', number: 'GFG Practice', difficulty: 'Medium', difficultyType: 'Platform Difficulty', topic: 'Async / Await & Promises', url: 'https://practice.geeksforgeeks.org/explore?page=1&category[]=JavaScript' },
    { id: 5, platform: 'leetcode', sourceName: 'LeetCode', title: 'Apply Transform Over Each Element in Array', number: 'LeetCode #2635', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'Functional Array Mapping', url: 'https://leetcode.com/problems/apply-transform-over-each-element-in-array/' },
    { id: 6, platform: 'hackerrank', sourceName: 'HackerRank', title: 'JavaScript Objects & Inheritance', number: 'HackerRank Medium', difficulty: 'Medium', difficultyType: 'Platform Difficulty', topic: 'Object Prototypes', url: 'https://www.hackerrank.com/domains/tutorials/10-days-of-javascript' }
  ],
  'React': [
    { id: 1, platform: 'leetcode', sourceName: 'LeetCode', title: 'Array Reduce Transformation', number: 'LeetCode #2626', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'State Transformation', url: 'https://leetcode.com/problems/array-reduce-transformation/' },
    { id: 2, platform: 'hackerrank', sourceName: 'HackerRank', title: 'React Basic Skills Certification', number: 'HackerRank Verified', difficulty: 'Medium', difficultyType: 'Platform Difficulty', topic: 'Components & Hooks', url: 'https://www.hackerrank.com/skills-verification/react_basic' },
    { id: 3, platform: 'gfg', sourceName: 'GeeksforGeeks', title: 'React State Lifecycle & Hooks Challenges', number: 'GFG Practice', difficulty: 'Medium', difficultyType: 'Platform Difficulty', topic: 'React Hooks & Context', url: 'https://practice.geeksforgeeks.org/explore?page=1&category[]=ReactJS' }
  ],
  'MongoDB': [
    { id: 1, platform: 'hackerrank', sourceName: 'HackerRank', title: 'NoSQL Aggregation Pipeline & Grouping', number: 'HackerRank Intermediate', difficulty: 'Medium', difficultyType: 'Platform Difficulty', topic: 'Document Pipelines', url: 'https://www.hackerrank.com/domains/databases' },
    { id: 2, platform: 'gfg', sourceName: 'GeeksforGeeks', title: 'MongoDB Indexing & Query Optimizations', number: 'GFG Practice', difficulty: 'Medium', difficultyType: 'Platform Difficulty', topic: 'BSON Queries & Indexing', url: 'https://practice.geeksforgeeks.org/explore?page=1&category[]=MongoDB' },
    { id: 3, platform: 'leetcode', sourceName: 'LeetCode', title: 'Design Document Key-Value Storage Engine', number: 'LeetCode Design', difficulty: 'Medium', difficultyType: 'Platform Difficulty', topic: 'Document Store Architecture', url: 'https://leetcode.com/problemset/all/?search=design' }
  ],
  'REST APIs': [
    { id: 1, platform: 'hackerrank', sourceName: 'HackerRank', title: 'REST API Intermediate Skills Verification', number: 'HackerRank Verified', difficulty: 'Medium', difficultyType: 'Platform Difficulty', topic: 'HTTP Routing & JSON', url: 'https://www.hackerrank.com/skills-verification/rest_api_intermediate' },
    { id: 2, platform: 'leetcode', sourceName: 'LeetCode', title: 'Design Twitter API Service', number: 'LeetCode #355', difficulty: 'Medium', difficultyType: 'Platform Difficulty', topic: 'API Endpoints & Feeds', url: 'https://leetcode.com/problems/design-twitter/' },
    { id: 3, platform: 'gfg', sourceName: 'GeeksforGeeks', title: 'RESTful API CRUD & Authentication Endpoints', number: 'GFG Practice', difficulty: 'Medium', difficultyType: 'Platform Difficulty', topic: 'API Architecture & Auth', url: 'https://practice.geeksforgeeks.org/explore?page=1&category[]=Computer%20Networks' }
  ],
  'Data Structures': [
    { id: 1, platform: 'leetcode', sourceName: 'LeetCode', title: 'Two Sum', number: 'LeetCode #1', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'Arrays & HashMaps', url: 'https://leetcode.com/problems/two-sum/' },
    { id: 2, platform: 'hackerrank', sourceName: 'HackerRank', title: 'Array Manipulation & Max Value', number: 'HackerRank Hard', difficulty: 'Hard', difficultyType: 'Platform Difficulty', topic: 'Arrays & Difference Array', url: 'https://www.hackerrank.com/challenges/crush/problem' },
    { id: 3, platform: 'gfg', sourceName: 'GeeksforGeeks', title: 'Subarray with Given Sum', number: 'GFG Must-Do', difficulty: 'Medium', difficultyType: 'Platform Difficulty', topic: 'Arrays & Sliding Window', url: 'https://practice.geeksforgeeks.org/problems/subarray-with-given-sum-1587115621/1' },
    { id: 4, platform: 'leetcode', sourceName: 'LeetCode', title: 'Valid Parentheses', number: 'LeetCode #20', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'Stacks & Strings', url: 'https://leetcode.com/problems/valid-parentheses/' },
    { id: 5, platform: 'hackerrank', sourceName: 'HackerRank', title: 'Tree: Inorder Traversal', number: 'HackerRank Easy', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'Trees & Traversal', url: 'https://www.hackerrank.com/challenges/tree-inorder-traversal/problem' },
    { id: 6, platform: 'gfg', sourceName: 'GeeksforGeeks', title: 'Left View of Binary Tree', number: 'GFG Must-Do', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'Binary Trees & BFS', url: 'https://practice.geeksforgeeks.org/problems/left-view-of-binary-tree/1' }
  ],
  'Algorithms': [
    { id: 1, platform: 'leetcode', sourceName: 'LeetCode', title: 'Binary Search', number: 'LeetCode #704', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'Searching & Binary Search', url: 'https://leetcode.com/problems/binary-search/' },
    { id: 2, platform: 'hackerrank', sourceName: 'HackerRank', title: 'Dijkstra: Shortest Reach 2', number: 'HackerRank Medium', difficulty: 'Medium', difficultyType: 'Platform Difficulty', topic: 'Graph Algorithms', url: 'https://www.hackerrank.com/challenges/dijkstrashortreach/problem' },
    { id: 3, platform: 'gfg', sourceName: 'GeeksforGeeks', title: '0 - 1 Knapsack Problem', number: 'GFG Must-Do', difficulty: 'Medium', difficultyType: 'Platform Difficulty', topic: 'Dynamic Programming', url: 'https://practice.geeksforgeeks.org/problems/0-1-knapsack-problem0945/1' }
  ],
  'Problem Solving': [
    { id: 1, platform: 'leetcode', sourceName: 'LeetCode', title: 'Two Sum', number: 'LeetCode #1', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'Arrays & Logic', url: 'https://leetcode.com/problems/two-sum/' },
    { id: 2, platform: 'hackerrank', sourceName: 'HackerRank', title: 'Grading Students & Apple and Orange', number: 'HackerRank Easy', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'Implementation & Math', url: 'https://www.hackerrank.com/domains/algorithms' },
    { id: 3, platform: 'gfg', sourceName: 'GeeksforGeeks', title: 'Missing Number in Array', number: 'GFG Must-Do', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'Arrays & Math', url: 'https://practice.geeksforgeeks.org/problems/missing-number-in-array1416/1' }
  ],
  'Python': [
    { id: 1, platform: 'leetcode', sourceName: 'LeetCode', title: 'Contains Duplicate', number: 'LeetCode #217', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'Arrays & Sets', url: 'https://leetcode.com/problems/contains-duplicate/' },
    { id: 2, platform: 'hackerrank', sourceName: 'HackerRank', title: 'Python If-Else & Loops Challenge', number: 'HackerRank Easy', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'Python Basics', url: 'https://www.hackerrank.com/domains/python' },
    { id: 3, platform: 'gfg', sourceName: 'GeeksforGeeks', title: 'Python List & Dictionary Manipulation', number: 'GFG Practice', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'Data Structures in Python', url: 'https://practice.geeksforgeeks.org/explore?page=1&category[]=Python' }
  ],
  'Java': [
    { id: 1, platform: 'leetcode', sourceName: 'LeetCode', title: 'Reverse Linked List', number: 'LeetCode #206', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'LinkedLists & Pointers', url: 'https://leetcode.com/problems/reverse-linked-list/' },
    { id: 2, platform: 'hackerrank', sourceName: 'HackerRank', title: 'Java Stacks & Deque Challenge', number: 'HackerRank Medium', difficulty: 'Medium', difficultyType: 'Platform Difficulty', topic: 'Java Collections', url: 'https://www.hackerrank.com/domains/java' },
    { id: 3, platform: 'gfg', sourceName: 'GeeksforGeeks', title: 'Java OOP Inheritance & Exception Handling', number: 'GFG Practice', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'Java OOP', url: 'https://practice.geeksforgeeks.org/explore?page=1&category[]=Java' }
  ],
  'SQL': [
    { id: 1, platform: 'leetcode', sourceName: 'LeetCode', title: 'Combine Two Tables', number: 'LeetCode #175', difficulty: 'Easy', difficultyType: 'Platform Difficulty', topic: 'SQL LEFT JOIN', url: 'https://leetcode.com/problems/combine-two-tables/' },
    { id: 2, platform: 'hackerrank', sourceName: 'HackerRank', title: 'The PADS & Weather Observation Station', number: 'HackerRank Medium', difficulty: 'Medium', difficultyType: 'Platform Difficulty', topic: 'SQL Joins & String Aggregation', url: 'https://www.hackerrank.com/domains/sql' },
    { id: 3, platform: 'gfg', sourceName: 'GeeksforGeeks', title: 'Top 50 SQL Query Interview Questions', number: 'GFG Practice', difficulty: 'Medium', difficultyType: 'Platform Difficulty', topic: 'Relational Database Queries', url: 'https://practice.geeksforgeeks.org/explore?page=1&category[]=SQL' }
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

  // Get skill-specific problems or honest platform discovery problems
  const getSkillProblems = (skName) => {
    if (MULTI_PLATFORM_PROBLEMS_BY_SKILL[skName]) {
      return MULTI_PLATFORM_PROBLEMS_BY_SKILL[skName]
    }
    const clean = skName || 'Technical'
    const slug = encodeURIComponent(clean)
    return [
      {
        id: 1,
        platform: 'leetcode',
        sourceName: 'LeetCode',
        title: `${clean} Interview Coding Questions`,
        number: 'LeetCode Catalog',
        difficulty: 'Medium',
        difficultyType: 'Platform Difficulty',
        topic: `${clean} Problem Solving`,
        url: `https://leetcode.com/problemset/all/?search=${slug}`
      },
      {
        id: 2,
        platform: 'hackerrank',
        sourceName: 'HackerRank',
        title: `${clean} Coding Practice & Certification`,
        number: 'HackerRank Track',
        difficulty: 'Intermediate',
        difficultyType: 'Platform Difficulty',
        topic: `${clean} Practice Challenges`,
        url: 'https://www.hackerrank.com/domains'
      },
      {
        id: 3,
        platform: 'gfg',
        sourceName: 'GeeksforGeeks',
        title: `Curated ${clean} Interview Problems`,
        number: 'GFG Topic Set',
        difficulty: 'Medium',
        difficultyType: 'Platform Difficulty',
        topic: `${clean} Core Practice`,
        url: `https://practice.geeksforgeeks.org/explore?page=1&search=${slug}`
      }
    ]
  }

  const rawProblems = getSkillProblems(skillName)

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
            {filteredProblems.map((prob) => {
              const handleOpen = () => {
                if (prob.url && (prob.url.startsWith('http://') || prob.url.startsWith('https://'))) {
                  window.open(prob.url, '_blank', 'noopener,noreferrer')
                } else {
                  alert('Challenge link is temporarily unavailable.')
                }
              }

              return (
                <div 
                  key={prob.id}
                  onClick={handleOpen}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleOpen() }}
                  aria-label={`Open ${prob.title} on ${prob.sourceName}`}
                  className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 p-4 rounded-xl transition-all group cursor-pointer flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-amber-400"
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

                      <span 
                        title="Official difficulty assigned by platform"
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          prob.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          prob.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {prob.sourceName}: {prob.difficulty}
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
              )
            })}
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
