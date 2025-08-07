import dotenv from 'dotenv';  
dotenv.config();

import mongoose from "mongoose";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";

const server = createServer(app);
const io = new SocketIOServer(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  // Example: broadcast node/edge changes
  socket.on("canvas-update", (data) => {
    socket.broadcast.emit("canvas-update", data);
  });
  // Add more collaborative events as needed
});

const MONGO_URI = process.env.MONGO_URI || ""; // Set in your .env
mongoose.connect(MONGO_URI)
  .then(() => {
    server.listen(4000, () => {
      console.log("Backend listening on :4000");
    });
  })
  .catch((err) => console.error("DB connection error:", err));
