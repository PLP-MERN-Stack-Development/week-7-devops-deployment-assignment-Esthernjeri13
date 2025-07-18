"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useChat } from "@/components/chat-provider"
import { Send, Paperclip, Smile } from "lucide-react"

export function MessageInput() {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const { sendMessage, setTyping } = useChat()
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Fixed line

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      sendMessage(message.trim())
      setMessage("")
      setIsTyping(false)
      setTyping(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)

    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true)
      setTyping(true)
    }

    if (typingTimeoutRef.current !== null) { // Updated check
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      setTyping(false)
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current !== null) { // Updated check
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <div className="flex-1 relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={handleInputChange}
          className="pr-20"
          maxLength={500}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
          <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Smile className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <Button type="submit" disabled={!message.trim()} className="px-4">
        <Send className="w-4 h-4" />
      </Button>
    </form>
  )
}