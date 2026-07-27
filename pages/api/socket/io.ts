import { Server as NetServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as ServerIO } from "socket.io";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: any) => {
  if (!res.socket.server.io) {
    const path = "/api/socket/io";
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      // User joins their own conversation room (or admin joins a selected room)
      socket.on("join-chat", (conversationId: string) => {
        socket.join(conversationId);
      });

      // Admin global room to receive notifications across all chats
      socket.on("join-admin", () => {
        socket.join("admin-room");
      });

      // Send message
      socket.on("send-message", (content: any) => {
        // Send to the specific conversation room
        io.to(content.conversationId).emit("new-message", content);
        // Also send to all connected admins
        io.to("admin-room").emit("admin-new-message", content);
      });

      // Delete message real-time trigger
      socket.on(
        "delete-message",
        (data: { conversationId: string; messageId: string }) => {
          io.to(data.conversationId).emit("message-deleted", data.messageId);
        },
      );
    });

    res.socket.server.io = io;
  }
  res.end();
};

export default ioHandler;
