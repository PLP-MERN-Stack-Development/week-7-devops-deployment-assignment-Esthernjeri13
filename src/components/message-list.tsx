"use client"

import { useEffect, useRef } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useChat } from "@/components/chat-provider"
import { formatDistanceToNow } from "date-fns"
import { Heart, ThumbsUp, Smile, Laugh } from "lucide-react"

const reactionEmojis = [
  { emoji: "👍", icon: ThumbsUp },
  { emoji: "❤️", icon: Heart },
  { emoji: "😊", icon: Smile },
  { emoji: "😂", icon: Laugh },
]

export function MessageList() {
  const { state, addReaction } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentRoomMessages = state.messages.filter((message) => message.roomId === state.currentRoom)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentRoomMessages])

  const typingUsers = state.users.filter(
    (user) => state.typingUsers.includes(user.id) && user.currentRoom === state.currentRoom,
  )

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {currentRoomMessages.map((message) => (
        <div key={message.id} className="flex space-x-3 group">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarFallback className={message.userAvatar}>{message.userName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-sm">{message.userName}</span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(message.timestamp, { addSuffix: true })}
              </span>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <p className="text-sm">{message.text}</p>

              {/* Reactions */}
              {message.reactions && Object.keys(message.reactions).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(message.reactions).map(([emoji, users]) => (
                    <Button
                      key={emoji}
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs bg-transparent"
                      onClick={() => addReaction(message.id, emoji)}
                    >
                      {emoji} {users.length}
                    </Button>
                  ))}
                </div>
              )}

              {/* Reaction buttons (show on hover) */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                <div className="flex space-x-1">
                  {reactionEmojis.map(({ emoji, icon: Icon }) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => addReaction(message.id, emoji)}
                    >
                      <Icon className="w-3 h-3" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Typing indicators */}
      {typingUsers.length > 0 && (
        <div className="flex space-x-3">
          <div className="w-10 h-10 flex-shrink-0" />
          <div className="flex-1">
            <div className="bg-gray-100 rounded-lg p-3 w-fit">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {typingUsers.map((user) => user.name).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
            </p>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
