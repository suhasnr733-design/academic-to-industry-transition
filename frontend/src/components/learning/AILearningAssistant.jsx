// src/components/learning/AILearningAssistant.jsx

import React, { useState, useRef, useEffect } from 'react'
import { 
  SparklesIcon, 
  XIcon, 
  PaperAirplaneIcon, 
  RefreshIcon, 
  TrashIcon,
  ClipboardCopyIcon,
  CheckIcon
} from '@heroicons/react/outline'
import { api } from '../../services/api'

// Helper component for formatting markdown and code blocks cleanly
const FormattedMessage = ({ text }) => {
  const [copiedIndex, setCopiedIndex] = useState(null)

  const copyToClipboard = (code, index) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Parse text into code blocks and markdown paragraphs
  const parts = text.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-2 text-xs leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n')
          const firstLine = lines[0].trim()
          const language = /^[a-zA-Z0-9_-]+$/.test(firstLine) ? firstLine : ''
          const codeContent = language ? lines.slice(1).join('\n') : lines.join('\n')

          return (
            <div key={index} className="my-2 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-md">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 border-b border-slate-700 text-[10px] text-slate-300">
                <span className="font-mono font-semibold uppercase">{language || 'code'}</span>
                <button
                  onClick={() => copyToClipboard(codeContent, index)}
                  className="flex items-center gap-1 hover:text-white transition-colors text-slate-400"
                >
                  {copiedIndex === index ? (
                    <>
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCopyIcon className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre leading-normal selection:bg-indigo-500 selection:text-white">
                <code>{codeContent}</code>
              </pre>
            </div>
          )
        }

        // Regular Markdown formatting for headers, bold, bullets
        const lines = part.split('\n')
        return (
          <div key={index} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim()
              if (!trimmed) return <div key={lIdx} className="h-1" />

              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={lIdx} className="font-bold text-indigo-400 text-xs mt-2 mb-1 border-b border-gray-800 pb-0.5">
                    {trimmed.replace(/^###\s*/, '').replace(/\*\*/g, '')}
                  </h4>
                )
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={lIdx} className="font-bold text-white text-sm mt-2 mb-1">
                    {trimmed.replace(/^##\s*/, '').replace(/\*\*/g, '')}
                  </h3>
                )
              }
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const bulletText = trimmed.replace(/^[-*]\s*/, '')
                return (
                  <div key={lIdx} className="flex items-start gap-1.5 ml-1">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span dangerouslySetInnerHTML={{ 
                      __html: bulletText.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>') 
                    }} />
                  </div>
                )
              }
              if (/^\d+\.\s/.test(trimmed)) {
                return (
                  <div key={lIdx} className="ml-1" dangerouslySetInnerHTML={{ 
                    __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                  }} />
                )
              }

              return (
                <p key={lIdx} dangerouslySetInnerHTML={{ 
                  __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                }} />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// Helper to load cached messages from sessionStorage per skill
const getInitialMessages = (skill, role) => {
  const cacheKey = `ai_chat_${skill || 'General'}`
  try {
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    console.error('Failed to load cached chat messages:', e)
  }
  return [
    {
      sender: 'ai',
      text: `Hello! I am your AI Study Assistant for **${skill || 'Skill'}** (${role || 'Placement'} path).\n\nAsk me anything, or pick a quick topic below to start!`
    }
  ]
}

export const AILearningAssistant = ({ skillName, targetRole, stage, onClose }) => {
  const [messages, setMessages] = useState(() => getInitialMessages(skillName, targetRole))
  const [inputPrompt, setInputPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Load stored messages when active skill or role changes
  useEffect(() => {
    setMessages(getInitialMessages(skillName, targetRole))
  }, [skillName, targetRole])

  // Automatically save messages to sessionStorage whenever updated
  useEffect(() => {
    if (messages && messages.length > 0) {
      const cacheKey = `ai_chat_${skillName || 'General'}`
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(messages))
      } catch (e) {
        console.error('Failed to save chat history to sessionStorage:', e)
      }
    }
  }, [messages, skillName])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleQuickAction = async (promptType, label) => {
    setLoading(true)
    setMessages(prev => [
      ...prev,
      { sender: 'user', text: `Action: ${label}` }
    ])

    try {
      const res = await api.post('/learning/ai-assist', {
        skill: skillName || 'JavaScript',
        target_role: targetRole || 'Full Stack Developer',
        stage: stage || 'Intermediate',
        prompt_type: promptType
      })

      const botReply = res.data?.response || 'No response received from assistant.'
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: botReply }
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: `⚠️ Could not fetch response: ${err.response?.data?.error || err.response?.data?.message || err.message}` }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputPrompt.trim() || loading) return

    const userText = inputPrompt.trim()
    setInputPrompt('')
    setMessages(prev => [...prev, { sender: 'user', text: userText }])
    setLoading(true)

    try {
      const res = await api.post('/learning/ai-assist', {
        skill: skillName || 'JavaScript',
        target_role: targetRole || 'Full Stack Developer',
        stage: stage || 'Intermediate',
        custom_prompt: userText
      })

      const botReply = res.data?.response || 'No response received from assistant.'
      setMessages(prev => [...prev, { sender: 'ai', text: botReply }])
    } catch (err) {
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: `⚠️ Assistant error: ${err.response?.data?.error || err.response?.data?.message || err.message}` 
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    const cacheKey = `ai_chat_${skillName || 'General'}`
    try {
      sessionStorage.removeItem(cacheKey)
    } catch (e) {
      console.error('Failed to clear sessionStorage:', e)
    }
    setMessages([
      {
        sender: 'ai',
        text: `Chat cleared. Ask me anything about **${skillName || 'Skill'}**!`
      }
    ])
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#111827] shadow-2xl border-l border-gray-800 flex flex-col justify-between animate-slide-in">
      {/* Header */}
      <div className="p-4 bg-[#0F172A] border-b border-gray-800 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm tracking-tight text-white">AI Study Assistant</h4>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                Active
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium truncate max-w-[200px]">
              {skillName || 'General'} • {targetRole || 'Full Stack Developer'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={clearChat} 
            title="Clear Chat History"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose} 
            title="Close Assistant"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-2.5 bg-[#0F172A] border-b border-gray-800 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        {[
          { label: '💡 Explain Topic', type: 'explain' },
          { label: '📝 Practice Qs', type: 'practice' },
          { label: '💼 Interview Prep', type: 'interview' },
          { label: '🚀 Project Idea', type: 'project' }
        ].map((item, i) => (
          <button
            key={i}
            disabled={loading}
            onClick={() => handleQuickAction(item.type, item.label)}
            className="px-2.5 py-1.5 bg-[#1E293B] hover:bg-gradient-to-r hover:from-indigo-600 hover:to-violet-600 hover:text-white text-gray-300 border border-gray-700/80 rounded-xl font-semibold whitespace-nowrap shadow-xs transition-all disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#0F172A] text-xs">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3.5 rounded-2xl max-w-[90%] shadow-md ${
              m.sender === 'user'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-none'
                : 'bg-[#1E293B] border border-gray-800 text-gray-200 rounded-bl-none'
            }`}>
              {m.sender === 'user' ? (
                <p className="whitespace-pre-wrap font-medium">{m.text}</p>
              ) : (
                <FormattedMessage text={m.text} />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="p-3 bg-[#1E293B] border border-gray-800 rounded-2xl text-indigo-400 shadow-md flex items-center gap-2 text-xs font-semibold">
              <RefreshIcon className="w-4 h-4 animate-spin text-indigo-400" />
              AI Assistant is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-[#111827] border-t border-gray-800 flex items-center gap-2 shadow-2xl">
        <input
          type="text"
          placeholder={`Ask about ${skillName || 'this skill'}...`}
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          disabled={loading}
          className="flex-1 px-3.5 py-2.5 bg-[#1E293B] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !inputPrompt.trim()}
          className="p-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
        >
          <PaperAirplaneIcon className="w-4 h-4 transform rotate-90" />
        </button>
      </form>
    </div>
  )
}
