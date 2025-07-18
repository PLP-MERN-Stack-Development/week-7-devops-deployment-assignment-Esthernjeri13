"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle } from "lucide-react"

interface LoginFormProps {
  onLogin: (user: { id: string; name: string; avatar: string }) => void
}

const avatarColors = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
]

export function LoginForm({ onLogin }: LoginFormProps) {
  const [name, setName] = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onLogin({
        id: Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        avatar: avatarColors[selectedAvatar],
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Join the Chat</CardTitle>
          <CardDescription>Enter your name to start chatting</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-center"
                maxLength={20}
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2 text-center">Choose your avatar color:</p>
              <div className="flex justify-center space-x-2">
                {avatarColors.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedAvatar(index)}
                    className={`w-8 h-8 rounded-full ${color} ${
                      selectedAvatar === index ? "ring-2 ring-gray-400" : ""
                    }`}
                  />
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={!name.trim()}>
              Start Chatting
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
