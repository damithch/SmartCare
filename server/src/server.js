import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./socket.js";

const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
    
    // Initialize Socket.io
    initSocket(server);
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
