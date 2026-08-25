// src/components/learning/AILearningAssistant.jsx

import React, { useState } from 'react'
import { SparklesIcon, XIcon, PaperAirplaneIcon, RefreshIcon } from '@heroicons/react/outline'
import { api } from '../../services/api'

export const AILearningAssistant = ({ skillName, targetRole, stage, onClose }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello! I am your AI Study Assistant for **${skillName}** (${targetRole} path). Ask me anything, or pick a quick topic below!`
    }
  ])
  const [inputPrompt, setInputPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  const handleQuickAction = async (promptType) => {
    setLoading(true)
    try {
      const res = await api.post('/learning/ai-assist', {
        skill: skillName,
        target_role: targetRole,
        stage: stage,
        prompt_type: promptType
      })

      setMessages(prev => [
        ...prev,
        { sender: 'user', text: `Action: ${promptType.toUpperCase()}` },
        { sender: 'ai', text: res.data.response }
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: `Sorry, could not fetch assistant response: ${err.message}` }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputPrompt.trim() || loading) return

    const userText = inputPrompt
    setInputPrompt('')
    setMessages(prev => [...prev, { sender: 'user', text: userText }])
    setLoading(true)

    try {
      const res = await api.post('/learning/ai-assist', {
        skill: skillName,
        target_role: targetRole,
        stage: stage,
        custom_prompt: userText
      })

      setMessages(prev => [...prev, { sender: 'ai', text: res.data.response }])
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: `Assistant error: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col justify-between">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-indigo-300" />
          <div>
            <h4 className="font-bold text-sm">AI Study Assistant</h4>
            <p className="text-[10px] text-indigo-200">{skillName} • {targetRole}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-300 hover:text-white p-1">
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-2 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        {[
          { label: '💡 Explain Topic', type: 'explain' },
          { label: '📝 Practice Qs', type: 'practice' },
          { label: '💼 Interview Prep', type: 'interview' },
          { label: '🚀 Project Idea', type: 'project' }
        ].map((item, i) => (
          <button
            key={i}
            disabled={loading}
            onClick={() => handleQuickAction(item.type)}
            className="px-2.5 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-lg font-semibold text-indigo-900 whitespace-nowrap"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50 text-xs">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
              m.sender === 'user'
                ? 'bg-indigo-600 text-white rounded-br-none'
                : 'bg-white border border-gray-200 text-gray-800 shadow-sm rounded-bl-none'
            }`}>
              <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br/>') }} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="p-3 bg-white border border-gray-200 rounded-xl text-gray-500 flex items-center gap-2">
              <RefreshIcon className="w-4 h-4 animate-spin text-indigo-600" />
              AI Assistant is thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
        <input
          type="text"
          placeholder={`Ask about ${skillName}...`}
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !inputPrompt.trim()}
          className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow"
        >
          <PaperAirplaneIcon className="w-4 h-4 transform rotate-90" />
        </button>
      </form>
    </div>
  )
}
