"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FiTrash2,
  FiSend,
  FiImage,
  FiUser,
  FiArrowLeft,
  FiX,
  FiBell,
} from "react-icons/fi";
import { io as ClientIO } from "socket.io-client";
import LocalImageUpload from "@/components/LocalImageUpload";
import toast from "react-hot-toast";

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    let socketInstance: any;

    const initSocket = async () => {
      try {
        await fetch("/api/socket/io");
        socketInstance = ClientIO(process.env.NEXT_PUBLIC_SITE_URL || "", {
          path: "/api/socket/io",
          addTrailingSlash: false,
        });

        socketInstance.on("connect", () => {
          socketInstance.emit("join-admin");
        });

        setSocket(socketInstance);
      } catch (err) {
        console.error("Socket error", err);
      }
    };
    initSocket();

    return () => {
      if (socketInstance) socketInstance.disconnect();
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await axios.get("/api/chat/admin/conversations");
      setConversations(res.data.conversations || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadChat = async (conv: any) => {
    setActiveChat(conv);
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      delete updated[conv._id];
      return updated;
    });

    try {
      const res = await axios.get(`/api/chat/admin/messages?id=${conv._id}`);
      setMessages(res.data.messages || []);
      socket?.emit("join-chat", conv._id);
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-refresh fallback to ensure real-time chat works even if socket connection gets dropped.
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
      if (activeChat) {
        axios
          .get(`/api/chat/admin/messages?id=${activeChat._id}`)
          .then((res) => {
            const newMessages = res.data.messages || [];
            setMessages((prev) => {
              if (newMessages.length !== prev.length) {
                return newMessages;
              }
              return prev;
            });
          })
          .catch(() => {});
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeChat]);

  useEffect(() => {
    if (!socket) return;

    socket.on("new-message", (msg: any) => {
      // Only push to active chat screen if it matches the current conversation.
      if (activeChat && msg.conversationId === activeChat._id) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      fetchConversations(); // refresh list
    });

    socket.on("admin-new-message", (msg: any) => {
      // If message is for a chat we haven't opened right now, show toast and unread dot
      if (!activeChat || activeChat._id !== msg.conversationId) {
        toast.custom(
          (t) => (
            <div className="bg-white border-l-4 border-blue-500 shadow-md p-4 rounded flex gap-4 w-72">
              <div className="flex-1">
                <h3 className="font-bold text-sm text-gray-800">New Message</h3>
                <p className="text-xs text-gray-600 truncate">
                  {msg.text || "Sent an image"}
                </p>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX />
              </button>
            </div>
          ),
          { position: "top-right", duration: 4000 },
        );

        setUnreadCounts((prev) => ({
          ...prev,
          [msg.conversationId]: (prev[msg.conversationId] || 0) + 1,
        }));
      }
      fetchConversations();
    });

    socket.on("message-deleted", (msgId: string) => {
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    });

    return () => {
      socket.off("new-message");
      socket.off("admin-new-message");
      socket.off("message-deleted");
    };
  }, [socket, activeChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || (!newMessage.trim() && !imageUrl)) return;

    try {
      const res = await axios.post("/api/chat/admin/messages", {
        conversationId: activeChat._id,
        text: newMessage,
        image: imageUrl,
      });
      const messageObj = res.data.message;
      setMessages((prev) => [...prev, messageObj]);

      socket?.emit("send-message", messageObj);

      setNewMessage("");
      setImageUrl("");
      setShowUpload(false);
      fetchConversations();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMessage = async (msgId: string) => {
    try {
      await axios.delete(`/api/chat/message?id=${msgId}`);
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
      socket?.emit("delete-message", {
        conversationId: activeChat._id,
        messageId: msgId,
      });
    } catch (e) {
      console.error("Failed to delete message");
    }
  };

  const deleteConversation = async () => {
    if (!activeChat) return;
    if (
      !confirm(
        "Are you sure you want to delete this entire chat conversation? This cannot be undone.",
      )
    )
      return;

    try {
      await axios.delete(`/api/chat/admin/conversations?id=${activeChat._id}`);
      setConversations((prev) => prev.filter((c) => c._id !== activeChat._id));
      setActiveChat(null);
      setMessages([]);
    } catch (e) {
      console.error("Failed to delete conversation", e);
      alert("Failed to delete chat. Please try again.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-transparent pt-4 gap-0 relative border-t border-gray-100">
      {/* Sidebar list */}
      <div
        className={`${activeChat ? "hidden md:block" : "block"} w-full md:w-1/4 lg:w-1/5 bg-transparent border-r border-gray-100 overflow-y-auto`}
      >
        <div className="p-5 font-light tracking-widest text-xs uppercase text-gray-400 border-b border-gray-100">
          User Chats
        </div>
        {conversations.map((c) => (
          <div
            key={c._id}
            onClick={() => loadChat(c)}
            className={`p-4 border-b border-gray-100 cursor-pointer relative transition flex items-center justify-between ${
              activeChat?._id === c._id
                ? "bg-gray-50/80"
                : "hover:bg-gray-50/50"
            } ${unreadCounts[c._id] ? "bg-gray-50/30" : ""}`}
          >
            <div className="flex items-center gap-3 w-10/12">
              <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 overflow-hidden shrink-0">
                {c.user?.image ? (
                  <img
                    src={c.user.image}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiUser size={14} />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p
                  className={`text-sm truncate font-medium ${unreadCounts[c._id] ? "text-black" : "text-gray-900 font-light"}`}
                >
                  {c.isGuest
                    ? c.guestName || "Guest"
                    : c.user?.name || "Customer"}
                </p>
                <p
                  className={`text-xs truncate font-light ${unreadCounts[c._id] ? "text-gray-900 font-medium" : "text-gray-400"}`}
                >
                  {c.lastMessageText || "Image sent"}
                </p>
              </div>
            </div>

            {/* Unread indicator */}
            {unreadCounts[c._id] && (
              <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse shrink-0"></div>
            )}
          </div>
        ))}
      </div>

      {/* Main Chat Area */}
      <div
        className={`${!activeChat ? "hidden md:flex" : "flex"} w-full md:flex-1 bg-transparent flex-col relative`}
      >
        {activeChat ? (
          <>
            {/* Header */}
            <div className="px-6 py-5 bg-transparent border-b border-gray-100 flex justify-between items-center text-sm">
              <div className="flex gap-4 items-center tracking-tight font-light text-gray-900">
                <button
                  onClick={() => setActiveChat(null)}
                  className="md:hidden p-1 -ml-1 text-gray-400 hover:text-black transition"
                >
                  <FiArrowLeft size={18} />
                </button>
                <span className="uppercase tracking-widest text-xs font-semibold">
                  {activeChat.isGuest
                    ? activeChat.guestName || "Guest"
                    : activeChat.user?.name || "Customer"}
                </span>
              </div>
              <button
                onClick={deleteConversation}
                title="Delete Conversation"
                className="text-gray-400 cursor-pointer hover:text-red-500 transition-colors"
              >
                <FiTrash2 size={16} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 p-6 overflow-y-auto space-y-6"
            >
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.senderModel === "Admin" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`relative max-w-[85%] group ${
                      msg.senderModel === "Admin"
                        ? "flex flex-col items-end"
                        : "flex flex-col items-start"
                    }`}
                  >
                    <div
                      className={`relative px-4 py-3 text-sm font-light leading-relaxed border ${
                        msg.senderModel === "Admin"
                          ? "bg-black text-white border-black rounded-l-2xl rounded-tr-2xl"
                          : "bg-transparent text-gray-900 border-gray-200 rounded-r-2xl rounded-tl-2xl"
                      }`}
                    >
                      <button
                        onClick={() => deleteMessage(msg._id)}
                        className={`absolute top-2 text-red-500/50 cursor-pointer hover:text-red-500 opacity-0 group-hover:opacity-100 transition ${msg.senderModel === "Admin" ? "-left-8" : "-right-8"}`}
                      >
                        <FiTrash2 size={14} />
                      </button>
                      {msg.image && (
                        <button
                          onClick={() => setZoomedImage(msg.image)}
                          className="block text-left w-full cursor-zoom-in"
                          type="button"
                        >
                          <img
                            src={msg.image}
                            alt="Upload"
                            className="max-w-[150px] md:max-w-[200px] max-h-[200px] object-contain rounded-md mb-3"
                          />
                        </button>
                      )}
                      <p>{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input area */}
            <div className="px-6 py-4 bg-transparent border-t border-gray-100 relative">
              {showUpload && (
                <div className="absolute bottom-[70px] left-6 bg-white border border-gray-100 rounded-none p-3 z-10 w-[140px] shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                      Image
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUpload(false);
                        setImageUrl("");
                      }}
                      className="text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5"
                      title="Cancel Upload"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                  <LocalImageUpload
                    value={imageUrl}
                    onChange={(val) => setImageUrl(val)}
                    onRemove={() => setImageUrl("")}
                  />
                </div>
              )}
              <form onSubmit={sendMessage} className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowUpload(!showUpload)}
                  className="p-2 text-gray-400 hover:text-black transition-colors cursor-pointer"
                >
                  <FiImage strokeWidth={1.5} size={22} />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 border-b border-gray-200 bg-transparent px-2 py-2 focus:outline-none focus:border-black font-light text-sm text-gray-900 transition-colors placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() && !imageUrl}
                  className="text-gray-400 hover:text-black cursor-pointer p-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <FiSend strokeWidth={1.5} size={22} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-light">
              Select a conversation to start
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
