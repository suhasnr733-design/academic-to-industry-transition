// src/components/learning/SkillQuizModal.jsx

import React, { useState } from 'react'
import { XIcon, CheckCircleIcon, XCircleIcon, SparklesIcon, BadgeCheckIcon, ArrowRightIcon } from '@heroicons/react/outline'

const QUIZ_QUESTIONS_BY_SKILL = {
  'Python': [
    { id: 1, question: 'What is the main difference between a Python list and a tuple?', options: ['Lists are mutable while tuples are immutable.', 'Tuples can only store integers.', 'Lists cannot be iterated over.', 'There is no functional difference.'], correct_index: 0, explanation: 'Lists [] can be modified after creation, whereas tuples () cannot be altered once instantiated.' },
    { id: 2, question: 'What does the CPython Global Interpreter Lock (GIL) enforce?', options: ['Only one thread executes Python bytecode at a time per process.', 'Prevents memory leaks in recursive functions.', 'Restricts file access to superuser privileges.', 'Compiles Python directly into C machine code.'], correct_index: 0, explanation: 'The GIL is a mutex that protects access to Python objects, preventing multiple threads from executing Python bytecodes simultaneously.' },
    { id: 3, question: 'How do you create a generator function in Python?', options: ['By using the yield keyword instead of return.', 'By wrapping a function in @generator decorator.', 'By inheriting from the Generator base class.', 'By initializing a function with def gen().'], correct_index: 0, explanation: 'Using the yield keyword inside a function produces a generator object that lazily yields values one at a time.' },
    { id: 4, question: 'What is the output of type(lambda x: x)?', options: ['<class "function">', '<class "lambda">', '<class "expression">', '<class "type">'], correct_index: 0, explanation: 'Lambda functions in Python are standard function objects of class "function".' },
    { id: 5, question: 'What is the difference between == and is in Python?', options: ['== checks value equality, whereas is checks object memory identity.', 'is checks value equality, whereas == checks type equality.', 'There is no difference in Python 3.', '== works only on numbers, is works only on strings.'], correct_index: 0, explanation: '== compares object contents (value), while "is" checks if two variables point to the exact same object in memory.' },
    { id: 6, question: 'Which standard module is used for deep object copying in Python?', options: ['copy', 'clone', 'sys', 'duplicator'], correct_index: 0, explanation: 'The copy module provides copy.copy() for shallow copies and copy.deepcopy() for recursive deep copies.' },
    { id: 7, question: 'What does the @staticmethod decorator do inside a class?', options: ['Defines a method that does not receive self or cls as its first argument.', 'Prevents child classes from overriding the method.', 'Ensures the method can only be called once.', 'Converts the method into a class variable.'], correct_index: 0, explanation: '@staticmethod defines a plain utility function bounded to the class namespace without automatic self/cls binding.' },
    { id: 8, question: 'In try-except-else-finally, when does the else block execute?', options: ['Only if no exceptions occurred in the try block.', 'Only if an exception occurred and was caught.', 'Always, right before the finally block.', 'Never; else is not valid syntax in Python try statements.'], correct_index: 0, explanation: 'The else block in try statements runs exclusively when the try block executes cleanly without throwing any exceptions.' },
    { id: 9, question: 'What is the average time complexity of dictionary key lookups in Python?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'], correct_index: 0, explanation: 'Python dictionaries are implemented as hash tables, yielding O(1) average time complexity for lookups.' },
    { id: 10, question: 'How does Python handle primary memory management for unused objects?', options: ['Through reference counting combined with a cyclic garbage collector.', 'By requiring manual free() calls from developers.', 'By clearing all memory when functions exit.', 'Through Java-style generational pause-the-world sweeps only.'], correct_index: 0, explanation: 'Python uses reference counting as its main memory collector, backed by a generational garbage collector for circular references.' }
  ],
  'Data Structures': [
    { id: 1, question: 'What is the average time complexity of looking up a key in a HashMap?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'], correct_index: 0, explanation: 'HashMaps compute array index using hash function, achieving constant O(1) average lookup time.' },
    { id: 2, question: 'Which data structure operates on a Last-In, First-Out (LIFO) principle?', options: ['Stack', 'Queue', 'LinkedList', 'Priority Queue'], correct_index: 0, explanation: 'A Stack processes the most recently added item first (LIFO).' },
    { id: 3, question: 'How do you detect a cycle in a Singly Linked List efficiently?', options: ['Floyd Cycle-Finding Algorithm (Slow & Fast Pointers)', 'In-order Tree Traversal', 'Binary Search', 'Dijkstra Algorithm'], correct_index: 0, explanation: 'Floyd Tortoise & Hare uses two pointers (slow moving 1 step, fast moving 2 steps) to detect cycles in O(n) time and O(1) space.' },
    { id: 4, question: 'What traversal order on a Binary Search Tree (BST) visits nodes in ascending sorted order?', options: ['In-order Traversal', 'Pre-order Traversal', 'Post-order Traversal', 'Level-order Traversal'], correct_index: 0, explanation: 'In-order traversal (Left, Root, Right) visits BST nodes in monotonically increasing sorted order.' },
    { id: 5, question: 'Which data structure is best suited for implementing Breadth-First Search (BFS)?', options: ['Queue', 'Stack', 'Min-Heap', 'Binary Search Tree'], correct_index: 0, explanation: 'BFS explores graph nodes layer by layer using a FIFO Queue.' },
    { id: 6, question: 'What is the time complexity of finding the minimum element in a Min-Heap?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correct_index: 0, explanation: 'In a Min-Heap, the minimum element is always positioned at the root node (index 0), giving O(1) access time.' },
    { id: 7, question: 'What collision resolution strategy uses linked lists for same hash index in HashTables?', options: ['Separate Chaining', 'Open Addressing', 'Linear Probing', 'Double Hashing'], correct_index: 0, explanation: 'Separate Chaining stores all elements that hash to the same bucket inside a linked list or tree.' },
    { id: 8, question: 'What is the main advantage of a Doubly Linked List over a Singly Linked List?', options: ['Allows bidirectional traversal (forward and backward).', 'Uses less memory per node.', 'Guarantees O(1) searching for any item.', 'Requires zero pointer updates on deletion.'], correct_index: 0, explanation: 'Doubly Linked Lists maintain next and prev pointers, enabling backwards traversal and O(1) node deletion when node reference is known.' },
    { id: 9, question: 'What is the worst-case time complexity of Quicksort when bad pivot selection occurs?', options: ['O(n^2)', 'O(n log n)', 'O(n)', 'O(log n)'], correct_index: 0, explanation: 'When pivots are worst-case chosen (e.g. smallest or largest element on sorted input), Quicksort degrades to O(n^2).' },
    { id: 10, question: 'Which data structure is used to manage function call stacks and recursion in OS runtimes?', options: ['Call Stack', 'Queue', 'B-Tree', 'Hash Table'], correct_index: 0, explanation: 'The system Call Stack keeps track of active subroutines, local variables, and return addresses during execution.' }
  ],
  'Java': [
    { id: 1, question: 'What is the main purpose of the Java Virtual Machine (JVM)?', options: ['Executes compiled Java bytecode on any operating system.', 'Compiles source code into native machine assembly.', 'Generates HTML web pages automatically.', 'Optimizes SQL queries.'], correct_index: 0, explanation: 'The JVM provides a platform-independent runtime environment that executes compiled .class bytecode.' },
    { id: 2, question: 'Which keyword prevents a class from being inherited in Java?', options: ['final', 'static', 'abstract', 'private'], correct_index: 0, explanation: 'Declaring a class as final prevents other classes from extending or inheriting it.' },
    { id: 3, question: 'What is the difference between String and StringBuilder in Java?', options: ['String is immutable while StringBuilder is mutable.', 'StringBuilder is slower than String.', 'String cannot store spaces.', 'There is no difference.'], correct_index: 0, explanation: 'String objects cannot be changed after creation, whereas StringBuilder allows in-place string modification without extra heap allocations.' },
    { id: 4, question: 'What is the default value of an uninitialized boolean variable in a Java class?', options: ['false', 'true', 'null', '0'], correct_index: 0, explanation: 'In Java, boolean primitive fields default to false when initialized.' },
    { id: 5, question: 'Which Collection interface implementation does not allow duplicate elements in Java?', options: ['Set', 'List', 'ArrayList', 'Vector'], correct_index: 0, explanation: 'The Set interface (e.g., HashSet, TreeSet) guarantees uniqueness of elements.' },
    { id: 6, question: 'What happens if a static method is called on a null reference variable in Java?', options: ['Executes normally without NullPointerException.', 'Throws NullPointerException.', 'Triggers a runtime compiler warning.', 'Halts the JVM.'], correct_index: 0, explanation: 'Static methods belong to the class, not the instance, so invoking them on a null reference compiles and executes without NullPointerException.' },
    { id: 7, question: 'Which exception is unchecked (RuntimeException) in Java?', options: ['NullPointerException', 'IOException', 'SQLException', 'ClassNotFoundException'], correct_index: 0, explanation: 'NullPointerException inherits from RuntimeException and is an unchecked exception.' },
    { id: 8, question: 'What does the transient keyword do in Java serialization?', options: ['Prevents the field from being serialized into bytes.', 'Encrypts the field before saving.', 'Makes the field accessible across threads.', 'Marks the field as static.'], correct_index: 0, explanation: 'Fields marked as transient are skipped by ObjectOutputStream during serialization.' },
    { id: 9, question: 'What is the time complexity of HashSet contains() lookups in Java?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'], correct_index: 0, explanation: 'HashSet uses a HashMap internally, giving O(1) average lookup performance.' },
    { id: 10, question: 'What is the difference between method overloading and method overriding in Java?', options: ['Overloading occurs in the same class (same name, different params); Overriding occurs in child classes.', 'Overriding occurs in the same class.', 'Overloading requires the @Override annotation.', 'They are identical concepts.'], correct_index: 0, explanation: 'Overloading changes method signatures within a class, whereas Overriding changes implementation of inherited methods in a subclass.' }
  ],
  'SQL': [
    { id: 1, question: 'How do you retrieve the second highest salary from an Employee table in SQL?', options: ['SELECT MAX(salary) FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee)', 'SELECT salary FROM Employee ORDER BY salary DESC LIMIT 1', 'SELECT SECOND(salary) FROM Employee', 'SELECT salary FROM Employee WHERE rownum = 2'], correct_index: 0, explanation: 'The subquery finds the maximum salary below the top maximum salary, yielding the second highest.' },
    { id: 2, question: 'Which SQL JOIN returns all matching rows plus unmatched rows from the left table?', options: ['LEFT JOIN', 'INNER JOIN', 'RIGHT JOIN', 'CROSS JOIN'], correct_index: 0, explanation: 'LEFT JOIN keeps all records from the left table regardless of whether matching records exist in the right table.' },
    { id: 3, question: 'What is the difference between WHERE and HAVING clauses in SQL?', options: ['WHERE filters rows before grouping; HAVING filters aggregated groups after GROUP BY.', 'HAVING filters individual rows before grouping.', 'WHERE can only be used with SELECT statements.', 'There is no difference.'], correct_index: 0, explanation: 'WHERE applies filters on raw rows before aggregation, while HAVING filters aggregated metric groups produced by GROUP BY.' },
    { id: 4, question: 'Which constraint ensures all values in a SQL column are unique and non-null?', options: ['PRIMARY KEY', 'FOREIGN KEY', 'CHECK', 'DEFAULT'], correct_index: 0, explanation: 'A PRIMARY KEY constraint enforces both UNIQUE and NOT NULL constraints on the primary identifier column.' },
    { id: 5, question: 'How does a database B-Tree Index improve query performance?', options: ['Reduces search complexity from full table scan O(n) to tree lookup O(log n).', 'Deletes duplicate rows automatically.', 'Compresses table storage by 50%.', 'Locks the database during queries.'], correct_index: 0, explanation: 'Indexes structure column keys into a balanced B-Tree, allowing logarithmic O(log n) disk reads instead of scanning every table row.' },
    { id: 6, question: 'What is the difference between UNION and UNION ALL in SQL?', options: ['UNION eliminates duplicate rows; UNION ALL retains all duplicates.', 'UNION ALL is slower than UNION.', 'UNION works only on integer columns.', 'UNION ALL creates a temporary view.'], correct_index: 0, explanation: 'UNION runs a deduplication step across combined result sets, whereas UNION ALL combines rows directly without filtering duplicates.' },
    { id: 7, question: 'Which ACID property guarantees that all database operations in a transaction succeed or fail together?', options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'], correct_index: 0, explanation: 'Atomicity ensures "all or nothing" execution for multi-statement transactions.' },
    { id: 8, question: 'What does the TRUNCATE TABLE command do compared to DELETE FROM table?', options: ['TRUNCATE drops and recreates the table structure instantly without logging individual row deletes.', 'DELETE is faster than TRUNCATE.', 'TRUNCATE allows WHERE clauses.', 'TRUNCATE only removes index files.'], correct_index: 0, explanation: 'TRUNCATE deallocates data pages directly, making it much faster than row-by-row DELETE operations.' },
    { id: 9, question: 'Which SQL window function assigns a unique sequential rank without gaps to rows?', options: ['DENSE_RANK()', 'RANK()', 'ROW_NUMBER()', 'LEAD()'], correct_index: 2, explanation: 'ROW_NUMBER() assigns a unique sequential integer (1, 2, 3...) to every row within a partition.' },
    { id: 10, question: 'What is a Foreign Key constraint in relational databases?', options: ['A column that references the Primary Key of another table to maintain referential integrity.', 'A key imported from an external API.', 'A key that encrypts database passwords.', 'A unique key for temporary tables.'], correct_index: 0, explanation: 'Foreign Keys link rows between tables and prevent orphaned records, preserving referential integrity.' }
  ]
}

export const SkillQuizModal = ({ skillName, onClose, onPassQuiz }) => {
  const questions = QUIZ_QUESTIONS_BY_SKILL[skillName] || QUIZ_QUESTIONS_BY_SKILL['Data Structures']

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [completed, setCompleted] = useState(false)

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
    setSubmitted(false)

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setCompleted(true)
      const finalScore = score + (isCorrect ? 1 : 0)
      if (finalScore >= 6) { // 60%+ passing grade
        onPassQuiz()
      }
    }
  }

  const percentScore = Math.round((score / questions.length) * 100)
  const passed = score >= 6

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-800 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-extrabold">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                {skillName} Mastery Evaluation Quiz
              </h3>
              <p className="text-xs text-indigo-300">
                10 Technical Interview Questions • 15 Mins Assessment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        {!completed ? (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Question Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span className="text-indigo-400">{Math.round(((currentIndex + 1) / questions.length) * 100)}% Completed</span>
              </div>
              <div className="w-full h-2 bg-[#0F172A] rounded-full overflow-hidden border border-gray-800">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-300 rounded-full" 
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Title */}
            <h4 className="font-extrabold text-base text-white leading-snug">
              {currentQ.question}
            </h4>

            {/* Options List */}
            <div className="space-y-2.5 pt-1">
              {currentQ.options.map((opt, oIdx) => {
                let optStyle = "border-gray-700/80 hover:border-indigo-500/50 bg-[#1E293B] text-gray-200"
                if (submitted) {
                  if (oIdx === currentQ.correct_index) {
                    optStyle = "border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold"
                  } else if (selectedOption === oIdx) {
                    optStyle = "border-rose-500 bg-rose-950/40 text-rose-300"
                  } else {
                    optStyle = "border-gray-800 bg-[#0F172A] opacity-40 text-gray-500"
                  }
                } else if (selectedOption === oIdx) {
                  optStyle = "border-indigo-500 bg-indigo-950/60 ring-2 ring-indigo-500/30 text-white font-semibold"
                }

                return (
                  <button
                    key={oIdx}
                    disabled={submitted}
                    onClick={() => setSelectedOption(oIdx)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex items-center justify-between cursor-pointer ${optStyle}`}
                  >
                    <span className="pr-2">{opt}</span>
                    {submitted && oIdx === currentQ.correct_index && (
                      <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {submitted && selectedOption === oIdx && oIdx !== currentQ.correct_index && (
                      <XCircleIcon className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Explanation box after submit */}
            {submitted && currentQ.explanation && (
              <div className={`p-3.5 rounded-xl text-xs leading-relaxed ${isCorrect ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/30 text-rose-300 border border-rose-500/30'}`}>
                <span className="font-bold">{isCorrect ? '✓ Correct Answer:' : '✕ Explanation:'}</span> {currentQ.explanation}
              </div>
            )}
          </div>
        ) : (
          /* Quiz Results View */
          <div className="p-8 text-center space-y-4 my-auto">
            {passed ? (
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center shadow-lg">
                <BadgeCheckIcon className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto flex items-center justify-center shadow-lg">
                <SparklesIcon className="w-10 h-10" />
              </div>
            )}

            <div>
              <h3 className="text-xl font-extrabold text-white">
                {passed ? '🎉 Congratulations! You Passed!' : 'Practice Assessment Finished'}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                You scored <span className="font-bold text-indigo-400">{score}</span> out of {questions.length} ({percentScore}% Mastery).
              </p>
            </div>

            {passed && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl">
                ✓ {skillName} has been marked as COMPLETED on your dashboard!
              </div>
            )}

            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Close Assessment
            </button>
          </div>
        )}

        {/* Modal Footer Controls */}
        {!completed && (
          <div className="p-4 bg-[#0F172A] border-t border-gray-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Current Score: {score} / {questions.length}</span>

            {!submitted ? (
              <button
                disabled={selectedOption === null}
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow cursor-pointer transition-colors"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-extrabold rounded-xl shadow cursor-pointer transition-all"
              >
                <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'Finish Quiz'}</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SkillQuizModal
