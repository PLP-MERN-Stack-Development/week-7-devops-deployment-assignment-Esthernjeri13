"use client"

import type React from "react"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"

export interface Message {
  id: string
  text: string
  userId: string
  userName: string
  userAvatar: string
  timestamp: Date
  roomId: string
  type: "message" | "system"
  reactions?: { [emoji: string]: string[] }
  readBy?: string[]
}

export interface User {
  id: string
  name: string
  avatar: string
  isOnline: boolean
  lastSeen: Date
  isTyping: boolean
  currentRoom: string
}

export interface ChatRoom {
  id: string
  name: string
  description: string
  userCount: number
  isPrivate: boolean
}

interface ChatState {
  messages: Message[]
  users: User[]
  rooms: ChatRoom[]
  currentRoom: string
  typingUsers: string[]
  notifications: number
}

type ChatAction =
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_MESSAGES"; payload: Message[] }
  | { type: "UPDATE_USER"; payload: User }
  | { type: "SET_USERS"; payload: User[] }
  | { type: "SET_CURRENT_ROOM"; payload: string }
  | { type: "SET_TYPING"; payload: { userId: string; isTyping: boolean } }
  | { type: "ADD_REACTION"; payload: { messageId: string; emoji: string; userId: string } }
  | { type: "INCREMENT_NOTIFICATIONS" }
  | { type: "RESET_NOTIFICATIONS" }

const initialState: ChatState = {
  messages: [],
  users: [],
  rooms: [
    { id: "general", name: "General", description: "General discussion", userCount: 0, isPrivate: false },
    { id: "tech", name: "Tech Talk", description: "Technology discussions", userCount: 0, isPrivate: false },
    { id: "random", name: "Random", description: "Random conversations", userCount: 0, isPrivate: false },
  ],
  currentRoom: "general",
  typingUsers: [],
  notifications: 0,
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      }
    case "SET_MESSAGES":
      return {
        ...state,
        messages: action.payload,
      }
    case "UPDATE_USER":
      return {
        ...state,
        users: state.users.map((user) => (user.id === action.payload.id ? action.payload : user)),
      }
    case "SET_USERS":
      return {
        ...state,
        users: action.payload,
      }
    case "SET_CURRENT_ROOM":
      return {
        ...state,
        currentRoom: action.payload,
        notifications: 0,
      }
    case "SET_TYPING":
      const { userId, isTyping } = action.payload
      return {
        ...state,
        typingUsers: isTyping
          ? [...state.typingUsers.filter((id) => id !== userId), userId]
          : state.typingUsers.filter((id) => id !== userId),
      }
    case "ADD_REACTION":
      return {
        ...state,
        messages: state.messages.map((msg) => {
          if (msg.id === action.payload.messageId) {
            const reactions = { ...msg.reactions }
            const emoji = action.payload.emoji
            const userId = action.payload.userId

            if (!reactions[emoji]) {
              reactions[emoji] = []
            }

            if (reactions[emoji].includes(userId)) {
              reactions[emoji] = reactions[emoji].filter((id) => id !== userId)
              if (reactions[emoji].length === 0) {
                delete reactions[emoji]
              }
            } else {
              reactions[emoji].push(userId)
            }

            return { ...msg, reactions }
          }
          return msg
        }),
      }
    case "INCREMENT_NOTIFICATIONS":
      return {
        ...state,
        notifications: state.notifications + 1,
      }
    case "RESET_NOTIFICATIONS":
      return {
        ...state,
        notifications: 0,
      }
    default:
      return state
  }
}

const ChatContext = createContext<{
  state: ChatState
  dispatch: React.Dispatch<ChatAction>
  sendMessage: (text: string) => void
  setTyping: (isTyping: boolean) => void
  switchRoom: (roomId: string) => void
  addReaction: (messageId: string, emoji: string) => void
} | null>(null)

export function ChatProvider({
  children,
  user,
}: {
  children: ReactNode
  user: { id: string; name: string; avatar: string }
}) {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate other users joining/leaving
      const simulatedUsers: User[] = [
        {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          isOnline: true,
          lastSeen: new Date(),
          isTyping: false,
          currentRoom: state.currentRoom,
        },
        {
          id: "bot1",
          name: "Alice",
          avatar: "bg-green-500",
          isOnline: Math.random() > 0.3,
          lastSeen: new Date(Date.now() - Math.random() * 300000),
          isTyping: false,
          currentRoom: "general",
        },
        {
          id: "bot2",
          name: "Bob",
          avatar: "bg-blue-500",
          isOnline: Math.random() > 0.4,
          lastSeen: new Date(Date.now() - Math.random() * 600000),
          isTyping: false,
          currentRoom: "tech",
        },
        {
          id: "bot3",
          name: "Charlie",
          avatar: "bg-purple-500",
          isOnline: Math.random() > 0.5,
          lastSeen: new Date(Date.now() - Math.random() * 900000),
          isTyping: false,
          currentRoom: "random",
        },
      ]

      dispatch({ type: "SET_USERS", payload: simulatedUsers })

      // Occasionally send bot messages
      if (Math.random() > 0.95) {
        const botMessages = [
          "Hey everyone! How's it going?",
          "Just finished a great project!",
          "Anyone working on something interesting?",
          "Beautiful day today! ☀️",
          "Coffee time! ☕",
        ]

        const randomBot = simulatedUsers[Math.floor(Math.random() * (simulatedUsers.length - 1)) + 1]
        if (randomBot.isOnline) {
          const message: Message = {
            id: Math.random().toString(36).substr(2, 9),
            text: botMessages[Math.floor(Math.random() * botMessages.length)],
            userId: randomBot.id,
            userName: randomBot.name,
            userAvatar: randomBot.avatar,
            timestamp: new Date(),
            roomId: state.currentRoom,
            type: "message",
            reactions: {},
            readBy: [],
          }

          dispatch({ type: "ADD_MESSAGE", payload: message })
          if (state.currentRoom !== state.currentRoom) {
            dispatch({ type: "INCREMENT_NOTIFICATIONS" })
          }
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [user, state.currentRoom])

  const sendMessage = (text: string) => {
    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      timestamp: new Date(),
      roomId: state.currentRoom,
      type: "message",
      reactions: {},
      readBy: [],
    }

    dispatch({ type: "ADD_MESSAGE", payload: message })
  }

  const setTyping = (isTyping: boolean) => {
    dispatch({ type: "SET_TYPING", payload: { userId: user.id, isTyping } })
  }

  const switchRoom = (roomId: string) => {
    dispatch({ type: "SET_CURRENT_ROOM", payload: roomId })
  }

  const addReaction = (messageId: string, emoji: string) => {
    dispatch({ type: "ADD_REACTION", payload: { messageId, emoji, userId: user.id } })
  }

  return (
    <ChatContext.Provider
      value={{
        state,
        dispatch,
        sendMessage,
        setTyping,
        switchRoom,
        addReaction,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
