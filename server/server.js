const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const cors = require("cors")
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
require("dotenv").config()

// Import models
const User = require("./models/User")
const Message = require("./models/Message")
const Room = require("./models/Room")

// Import socket handlers
const socketHandlers = require("./socket/socketHandlers")

const app = express()
const server = http.createServer(app)

// Configure CORS for Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json())

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/chatapp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err))

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" })
    }
    req.user = user
    next()
  })
}

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date().toISOString() })
})

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email or username already exists",
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      avatar: avatar || "bg-blue-500",
    })

    await user.save()

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d",
    })

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d",
    })

    // Update last login
    user.lastSeen = new Date()
    await user.save()

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Protected Routes
app.get("/api/rooms", authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true })
      .populate("members", "username avatar isOnline")
      .sort({ createdAt: 1 })

    res.json(rooms)
  } catch (error) {
    console.error("Get rooms error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.get("/api/messages/:roomId", authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params
    const { page = 1, limit = 50 } = req.query

    const messages = await Message.find({ roomId })
      .populate("userId", "username avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    res.json(messages.reverse())
  } catch (error) {
    console.error("Get messages error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.get("/api/users/online", authenticateToken, async (req, res) => {
  try {
    const onlineUsers = await User.find({
      isOnline: true,
      _id: { $ne: req.user.userId },
    }).select("username avatar lastSeen")

    res.json(onlineUsers)
  } catch (error) {
    console.error("Get online users error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Socket.io connection handling
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error("Authentication error"))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    const user = await User.findById(decoded.userId)

    if (!user) {
      return next(new Error("User not found"))
    }

    socket.userId = user._id.toString()
    socket.username = user.username
    socket.avatar = user.avatar
    next()
  } catch (error) {
    next(new Error("Authentication error"))
  }
})

io.on("connection", (socket) => {
  console.log(`User ${socket.username} connected`)
  socketHandlers(io, socket)
})

// Initialize default rooms
const initializeRooms = async () => {
  try {
    const defaultRooms = [
      {
        name: "General",
        description: "General discussion for everyone",
        roomId: "general",
        isPrivate: false,
      },
      {
        name: "Tech Talk",
        description: "Technology discussions and programming",
        roomId: "tech",
        isPrivate: false,
      },
      {
        name: "Random",
        description: "Random conversations and fun topics",
        roomId: "random",
        isPrivate: false,
      },
    ]

    for (const roomData of defaultRooms) {
      const existingRoom = await Room.findOne({ roomId: roomData.roomId })
      if (!existingRoom) {
        const room = new Room(roomData)
        await room.save()
        console.log(`Created room: ${roomData.name}`)
      }
    }
  } catch (error) {
    console.error("Error initializing rooms:", error)
  }
}

// Start server
const PORT = process.env.PORT || 5000
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  await initializeRooms()
})

module.exports = { app, server, io }
