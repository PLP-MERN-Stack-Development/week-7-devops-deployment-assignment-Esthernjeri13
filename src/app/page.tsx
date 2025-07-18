"use client"

import { useState, useEffect } from "react"
import { ChatProvider } from "@/components/chat-provider"
import { LoginForm } from "@/components/login-form"
import { ChatInterface } from "@/components/chat-interface"

export default function Home() {
  const [user, setUser] = useState<{ id: string; name: string; avatar: string } | null>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("chatUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = (userData: { id: string; name: string; avatar: string }) => {
    setUser(userData)
    localStorage.setItem("chatUser", JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem("chatUser")
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  return (
    <ChatProvider user={user}>
      <ChatInterface user={user} onLogout={handleLogout} />
    </ChatProvider>
  )
}
