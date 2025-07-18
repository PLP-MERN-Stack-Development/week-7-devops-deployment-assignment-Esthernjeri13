const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

const User = require("../models/User")
const Room = require("../models/Room")
const Message = require("../models/Message")

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/chatapp")
    console.log("Connected to MongoDB")

    // Clear existing data
    await User.deleteMany({})
    await Room.deleteMany({})
    await Message.deleteMany({})
    console.log("Cleared existing data")

    // Create sample users
    const hashedPassword = await bcrypt.hash("password123", 10)

    const users = await User.create([
      {
        username: "alice",
        email: "alice@example.com",
        password: hashedPassword,
        avatar: "bg-pink-500",
      },
      {
        username: "bob",
        email: "bob@example.com",
        password: hashedPassword,
        avatar: "bg-blue-500",
      },
      {
        username: "charlie",
        email: "charlie@example.com",
        password: hashedPassword,
        avatar: "bg-green-500",
      },
    ])

    console.log("Created sample users")

    // Create default rooms
    const rooms = await Room.create([
      {
        name: "General",
        description: "General discussion for everyone",
        roomId: "general",
        isPrivate: false,
        createdBy: users[0]._id,
      },
      {
        name: "Tech Talk",
        description: "Technology discussions and programming",
        roomId: "tech",
        isPrivate: false,
        createdBy: users[1]._id,
      },
      {
        name: "Random",
        description: "Random conversations and fun topics",
        roomId: "random",
        isPrivate: false,
        createdBy: users[2]._id,
      },
    ])

    console.log("Created default rooms")

    // Create sample messages
    const messages = await Message.create([
      {
        text: "Welcome to the chat! 👋",
        userId: users[0]._id,
        roomId: "general",
        type: "message",
      },
      {
        text: "Hey everyone! How is everyone doing today?",
        userId: users[1]._id,
        roomId: "general",
        type: "message",
      },
      {
        text: "Anyone working on interesting projects?",
        userId: users[2]._id,
        roomId: "tech",
        type: "message",
      },
      {
        text: "Just finished setting up this chat app! 🚀",
        userId: users[0]._id,
        roomId: "tech",
        type: "message",
      },
    ])

    console.log("Created sample messages")

    console.log("Database seeded successfully!")
    console.log("\nSample login credentials:")
    console.log("Email: alice@example.com | Password: password123")
    console.log("Email: bob@example.com | Password: password123")
    console.log("Email: charlie@example.com | Password: password123")
  } catch (error) {
    console.error("Error seeding database:", error)
  } finally {
    await mongoose.connection.close()
    console.log("Database connection closed")
  }
}

seedDatabase()
