const User = require("../models/User")
const Message = require("../models/Message")
const Room = require("../models/Room")

module.exports = (io, socket) => {
  // Handle user joining
  const handleUserJoin = async () => {
    try {
      // Update user online status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        socketId: socket.id,
        lastSeen: new Date(),
      })

      // Join default room
      socket.join("general")

      // Broadcast user online status
      socket.broadcast.emit("userStatusUpdate", {
        userId: socket.userId,
        username: socket.username,
        isOnline: true,
      })

      // Send current online users to the new user
      const onlineUsers = await User.find({ isOnline: true }).select("username avatar lastSeen currentRoom isTyping")

      socket.emit("onlineUsers", onlineUsers)

      console.log(`${socket.username} joined the chat`)
    } catch (error) {
      console.error("Error handling user join:", error)
    }
  }

  // Handle joining a room
  const handleJoinRoom = async (roomId) => {
    try {
      // Leave current rooms
      const rooms = Array.from(socket.rooms)
      rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room)
        }
      })

      // Join new room
      socket.join(roomId)

      // Update user's current room
      await User.findByIdAndUpdate(socket.userId, {
        currentRoom: roomId,
      })

      // Get room info and recent messages
      const room = await Room.findOne({ roomId })
      const messages = await Message.find({ roomId })
        .populate("userId", "username avatar")
        .sort({ createdAt: -1 })
        .limit(50)

      socket.emit("roomJoined", {
        roomId,
        room,
        messages: messages.reverse(),
      })

      // Notify others in the room
      socket.to(roomId).emit("userJoinedRoom", {
        userId: socket.userId,
        username: socket.username,
        roomId,
      })

      console.log(`${socket.username} joined room: ${roomId}`)
    } catch (error) {
      console.error("Error joining room:", error)
      socket.emit("error", { message: "Failed to join room" })
    }
  }

  // Handle sending messages
  const handleSendMessage = async (data) => {
    try {
      const { text, roomId } = data

      if (!text || !roomId) {
        socket.emit("error", { message: "Message text and room ID are required" })
        return
      }

      // Create new message
      const message = new Message({
        text: text.trim(),
        userId: socket.userId,
        roomId,
      })

      await message.save()

      // Populate user data
      await message.populate("userId", "username avatar")

      // Update room last activity
      await Room.findOneAndUpdate({ roomId }, { lastActivity: new Date() })

      // Broadcast message to room
      io.to(roomId).emit("newMessage", {
        id: message._id,
        text: message.text,
        userId: message.userId._id,
        userName: message.userId.username,
        userAvatar: message.userId.avatar,
        timestamp: message.createdAt,
        roomId: message.roomId,
        type: message.type,
        reactions: message.reactions,
      })

      console.log(`Message sent by ${socket.username} in ${roomId}: ${text}`)
    } catch (error) {
      console.error("Error sending message:", error)
      socket.emit("error", { message: "Failed to send message" })
    }
  }

  // Handle typing indicators
  const handleTyping = async (data) => {
    try {
      const { isTyping, roomId } = data

      // Update user typing status
      await User.findByIdAndUpdate(socket.userId, { isTyping })

      // Broadcast typing status to room (except sender)
      socket.to(roomId).emit("userTyping", {
        userId: socket.userId,
        username: socket.username,
        isTyping,
        roomId,
      })
    } catch (error) {
      console.error("Error handling typing:", error)
    }
  }

  // Handle message reactions
  const handleReaction = async (data) => {
    try {
      const { messageId, emoji } = data

      const message = await Message.findById(messageId)
      if (!message) {
        socket.emit("error", { message: "Message not found" })
        return
      }

      // Find existing reaction
      const reactionIndex = message.reactions.findIndex((r) => r.emoji === emoji)

      if (reactionIndex === -1) {
        // Add new reaction
        message.reactions.push({
          emoji,
          users: [socket.userId],
        })
      } else {
        // Toggle user in existing reaction
        const userIndex = message.reactions[reactionIndex].users.indexOf(socket.userId)

        if (userIndex === -1) {
          message.reactions[reactionIndex].users.push(socket.userId)
        } else {
          message.reactions[reactionIndex].users.splice(userIndex, 1)

          // Remove reaction if no users left
          if (message.reactions[reactionIndex].users.length === 0) {
            message.reactions.splice(reactionIndex, 1)
          }
        }
      }

      await message.save()

      // Broadcast reaction update to room
      io.to(message.roomId).emit("reactionUpdate", {
        messageId,
        reactions: message.reactions,
      })
    } catch (error) {
      console.error("Error handling reaction:", error)
      socket.emit("error", { message: "Failed to add reaction" })
    }
  }

  // Handle private messages
  const handlePrivateMessage = async (data) => {
    try {
      const { text, recipientId } = data

      // Create private room ID (sorted user IDs)
      const roomId = [socket.userId, recipientId].sort().join("_")

      // Create message
      const message = new Message({
        text: text.trim(),
        userId: socket.userId,
        roomId,
        type: "message",
      })

      await message.save()
      await message.populate("userId", "username avatar")

      // Send to both users
      const recipientUser = await User.findById(recipientId)
      if (recipientUser && recipientUser.socketId) {
        io.to(recipientUser.socketId).emit("privateMessage", {
          id: message._id,
          text: message.text,
          userId: message.userId._id,
          userName: message.userId.username,
          userAvatar: message.userId.avatar,
          timestamp: message.createdAt,
          roomId: message.roomId,
          isPrivate: true,
        })
      }

      // Send confirmation to sender
      socket.emit("privateMessage", {
        id: message._id,
        text: message.text,
        userId: message.userId._id,
        userName: message.userId.username,
        userAvatar: message.userId.avatar,
        timestamp: message.createdAt,
        roomId: message.roomId,
        isPrivate: true,
      })
    } catch (error) {
      console.error("Error sending private message:", error)
      socket.emit("error", { message: "Failed to send private message" })
    }
  }

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        socketId: null,
        lastSeen: new Date(),
        isTyping: false,
      })

      // Broadcast user offline status
      socket.broadcast.emit("userStatusUpdate", {
        userId: socket.userId,
        username: socket.username,
        isOnline: false,
        lastSeen: new Date(),
      })

      console.log(`${socket.username} disconnected`)
    } catch (error) {
      console.error("Error handling disconnect:", error)
    }
  }

  // Register event handlers
  socket.on("join", handleUserJoin)
  socket.on("joinRoom", handleJoinRoom)
  socket.on("sendMessage", handleSendMessage)
  socket.on("typing", handleTyping)
  socket.on("reaction", handleReaction)
  socket.on("privateMessage", handlePrivateMessage)
  socket.on("disconnect", handleDisconnect)

  // Auto-join user when connected
  handleUserJoin()
}
