"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageList } from "@/components/message-list"
import { MessageInput } from "@/components/message-input"
import { UserList } from "@/components/user-list"
import { RoomList } from "@/components/room-list"
import { useChat } from "@/components/chat-provider"
import { LogOut, Bell, BellOff, Menu, X } from "lucide-react"

interface ChatInterfaceProps {
  user: { id: string; name: string; avatar: string }
  onLogout: () => void
}

export function ChatInterface({ user, onLogout }: ChatInterfaceProps) {
  const { state, switchRoom } = useChat()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        setNotificationsEnabled(permission === "granted")
      })
    } else {
      setNotificationsEnabled(Notification.permission === "granted")
    }
  }, [])

  useEffect(() => {
    // Show browser notifications for new messages
    if (notificationsEnabled && state.notifications > 0) {
      const lastMessage = state.messages[state.messages.length - 1]
      if (lastMessage && lastMessage.userId !== user.id) {
        new Notification(`New message from ${lastMessage.userName}`, {
          body: lastMessage.text,
          icon: "/placeholder.svg?height=64&width=64",
        })
      }
    }
  }, [state.messages, notificationsEnabled, user.id, state.notifications])

  const currentRoom = state.rooms.find((room) => room.id === state.currentRoom)

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white border-r transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">Chat App</h1>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
                  {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Room List */}
          <div className="flex-1 overflow-hidden">
            <RoomList />
            <UserList />
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="font-semibold">{currentRoom?.name}</h2>
              <p className="text-sm text-gray-500">{currentRoom?.description}</p>
            </div>
          </div>
          {state.notifications > 0 && (
            <Badge variant="destructive" className="ml-2">
              {state.notifications}
            </Badge>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessageList />
        </div>

        {/* Message Input */}
        <div className="border-t bg-white p-4">
          <MessageInput />
        </div>
      </div>
    </div>
  )
}
