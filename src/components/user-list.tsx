"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useChat } from "@/components/chat-provider"
import { formatDistanceToNow } from "date-fns"

export function UserList() {
  const { state } = useChat()

  const onlineUsers = state.users.filter((user) => user.isOnline)
  const offlineUsers = state.users.filter((user) => !user.isOnline)

  return (
    <div className="p-4 border-t">
      <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">Users ({state.users.length})</h3>

      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs text-green-600 font-medium mb-2">Online ({onlineUsers.length})</h4>
          <div className="space-y-2">
            {onlineUsers.map((user) => (
              <div key={user.id} className="flex items-center space-x-2">
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={user.avatar}>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  {state.typingUsers.includes(user.id) && <p className="text-xs text-gray-500">typing...</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline Users */}
      {offlineUsers.length > 0 && (
        <div>
          <h4 className="text-xs text-gray-400 font-medium mb-2">Offline ({offlineUsers.length})</h4>
          <div className="space-y-2">
            {offlineUsers.map((user) => (
              <div key={user.id} className="flex items-center space-x-2 opacity-60">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className={user.avatar}>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-gray-400">{formatDistanceToNow(user.lastSeen, { addSuffix: true })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
