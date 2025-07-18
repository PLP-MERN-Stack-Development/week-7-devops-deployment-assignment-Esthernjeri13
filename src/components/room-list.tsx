"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useChat } from "@/components/chat-provider"
import { Hash, Lock } from "lucide-react"

export function RoomList() {
  const { state, switchRoom } = useChat()

  return (
    <div className="p-4">
      <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">Rooms</h3>
      <div className="space-y-1">
        {state.rooms.map((room) => {
          const roomMessages = state.messages.filter((msg) => msg.roomId === room.id)
          const unreadCount = roomMessages.filter(
            (msg) => msg.roomId !== state.currentRoom && !msg.readBy?.includes(state.users.find((u) => u.id)?.id || ""),
          ).length

          return (
            <Button
              key={room.id}
              variant={state.currentRoom === room.id ? "secondary" : "ghost"}
              className="w-full justify-start h-auto p-3"
              onClick={() => switchRoom(room.id)}
            >
              <div className="flex items-center space-x-2 flex-1">
                {room.isPrivate ? (
                  <Lock className="w-4 h-4 text-gray-400" />
                ) : (
                  <Hash className="w-4 h-4 text-gray-400" />
                )}
                <div className="flex-1 text-left">
                  <div className="font-medium">{room.name}</div>
                  <div className="text-xs text-gray-500">{room.userCount} members</div>
                </div>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </div>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
