"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  FiMessageCircle,
  FiX,
  FiSend,
  FiImage,
  FiTrash2,
} from "react-icons/fi";
import axios from "axios";
import { io as ClientIO } from "socket.io-client";
import Image from "next/image";
import LocalImageUpload from "./LocalImageUpload";

export default function ChatWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [guestId, setGuestId] = useState<string>("");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Setup guest ID if not logged in
  useEffect(() => {
    if (!session?.user) {
      let storedGuestId = localStorage.getItem("guest_chat_id");
      if (!storedGuestId) {
        storedGuestId = "guest_" + Math.random().toString(36).substring(2, 10);
        localStorage.setItem("guest_chat_id", storedGuestId);
      }
      setGuestId(storedGuestId);
    }
  }, [session]);

  const getHeaders = () => {
    const headers: any = {};
    if (guestId && !session?.user) {
      headers["x-guest-id"] = guestId;
    }
    return headers;
  };

  // Initialize and connect socket
  useEffect(() => {
    if (session?.user?.role === "admin") return;

    let socketInstance: any;

    const initSocket = async () => {
      try {
        await fetch("/api/socket/io");
        socketInstance = ClientIO(process.env.NEXT_PUBLIC_SITE_URL || "", {
          path: "/api/socket/io",
          addTrailingSlash: false,
        });

        socketInstance.on("connect", () => {
          console.log("Connected to chat socket");
        });

        setSocket(socketInstance);
      } catch (err) {
        console.error("Socket init error:", err);
      }
    };

    initSocket();

    return () => {
      if (socketInstance) socketInstance.disconnect();
    };
  }, [session]);

  // Load old messages & get conversation ID
  useEffect(() => {
    if (socket && (session?.user || guestId)) {
      axios
        .get("/api/chat/my", { headers: getHeaders() })
        .then((res) => {
          setMessages(res.data.messages || []);
          setConversation(res.data.conversation);
          socket.emit("join-chat", res.data.conversation._id);
        })
        .catch(console.error);
    }
  }, [session, socket, guestId]);

  // Read status & bounce icon
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Polling fallback to ensure messages are constantly synced
  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.user || guestId) {
        axios
          .get("/api/chat/my", { headers: getHeaders() })
          .then((res) => {
            const newMessages = res.data.messages || [];

            setMessages((prev) => {
              if (newMessages.length > prev.length) {
                // If chat isn't open and new message is from admin, bump counter
                if (!isOpen) {
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg && lastMsg.senderModel !== "User") {
                    setUnreadCount((c) => c + 1);
                  }
                }
                return newMessages;
              }
              // If deleted
              if (newMessages.length < prev.length) {
                return newMessages;
              }
              return prev;
            });

            if (res.data.conversation) {
              setConversation(res.data.conversation);
            }
          })
          .catch(() => {});
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [session, guestId, isOpen]);

  // Add listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("new-message", (msg: any) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === msg._id)) return prev;

        // If chat isn't open, bump the counter
        if (!isOpen && msg.senderModel !== "User") {
          setUnreadCount((c) => c + 1);
        }
        return [...prev, msg];
      });
    });

    socket.on("message-deleted", (msgId: string) => {
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    });

    return () => {
      socket.off("new-message");
      socket.off("message-deleted");
    };
  }, [socket, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !imageUrl) return;

    try {
      const res = await axios.post(
        "/api/chat/my",
        {
          text: newMessage,
          image: imageUrl,
        },
        { headers: getHeaders() },
      );

      const messageObj = res.data.message;

      // Update local state instantly map ->
      setMessages((prev) => [...prev, messageObj]);

      // Emit to socket
      socket?.emit("send-message", {
        ...messageObj,
        conversationId: conversation?._id,
      });

      setNewMessage("");
      setImageUrl("");
      setShowImageUpload(false);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMessage = async (msgId: string) => {
    try {
      await axios.delete(`/api/chat/message?id=${msgId}`, {
        headers: getHeaders(),
      });
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
      socket?.emit("delete-message", {
        conversationId: conversation?._id,
        messageId: msgId,
      });
    } catch (e) {
      console.error("Failed to delete message");
    }
  };

  if (session?.user?.role === "admin") return null;

  return (
    <>
      <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[9999] flex flex-col items-end">
        {/* Chat Window */}
        {isOpen && (
          <div className="mb-4 w-[calc(100vw-2rem)] sm:w-80 md:w-[380px] h-[550px] max-h-[75vh] md:max-h-[70vh] bg-white rounded-3xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.15)] flex flex-col border border-gray-100/50 origin-bottom-right transition-all overflow-hidden ring-1 ring-gray-900/5">
            <div className="px-5 py-4 cursor-pointer bg-white border-b border-gray-100 flex justify-between items-center w-full z-10 sticky top-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[var(--primary-color,#000)]">
                  <FiMessageCircle size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Support Chat
                  </h3>
                  <p className="text-[11px] text-[var(--primary-color,#000)] font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-color,#000)] animate-pulse"></span>
                    We usually reply instantly
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-900 rounded-full cursor-pointer hover:bg-gray-100 transition-colors"
                title="Close chat"
              >
                <FiX size={18} />
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 p-4 overflow-y-auto space-y-4 bg-white text-sm"
            >
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex flex-col ${
                    msg.senderModel === "User" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`relative p-3 max-w-[80%] ${
                      msg.senderModel === "User"
                        ? "bg-gray-100/80 text-gray-900 rounded-2xl rounded-tr-sm"
                        : "bg-[var(--primary-color,#000)] text-white rounded-2xl rounded-tl-sm"
                    } group`}
                  >
                    {msg.senderModel === "User" && (
                      <button
                        onClick={() => deleteMessage(msg._id)}
                        className="absolute -left-7 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-red-500 p-1"
                        title="Delete message"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    )}
                    {msg.image && (
                      <button
                        onClick={() => setZoomedImage(msg.image)}
                        className="block text-left w-full cursor-zoom-in"
                        type="button"
                      >
                        <img
                          src={msg.image}
                          alt="Upload"
                          className="max-w-[150px] max-h-[150px] object-cover rounded-xl mb-2 border border-black/5"
                        />
                      </button>
                    )}
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t p-3 bg-white rounded-b-xl border-gray-100 relative">
              {showImageUpload && (
                <div className="absolute bottom-[70px] left-3 bg-white shadow-lg border border-gray-200 rounded-lg p-2 z-10 w-[100px]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      Upload
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowImageUpload(false);
                        setImageUrl("");
                      }}
                      className="text-gray-400 hover:text-red-500 transition cursor-pointer bg-gray-100 rounded-full p-1"
                    >
                      <FiX size={10} />
                    </button>
                  </div>
                  <LocalImageUpload
                    value={imageUrl}
                    onChange={(val) => setImageUrl(val)}
                    onRemove={() => setImageUrl("")}
                    className="w-full h-20"
                    hideReplaceBadge
                  />
                </div>
              )}
              <form onSubmit={sendMessage} className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => setShowImageUpload(!showImageUpload)}
                  className="text-gray-500 cursor-pointer hover:text-black transition p-2"
                >
                  <FiImage size={20} />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-full focus:outline-none focus:border-black bg-gray-50 text-black"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() && !imageUrl}
                  className="text-white cursor-pointer  bg-black p-2 rounded-full hover:bg-gray-800 disabled:opacity-50"
                >
                  <FiSend size={18} className="cursor-pointer" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Floating Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-black cursor-pointer text-white p-4 rounded-full shadow-xl hover:bg-gray-800 hover:scale-105 transition-all relative self-end"
        >
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full animate-bounce">
              {unreadCount}
            </span>
          )}
          {isOpen ? (
            <FiX className="cursor-pointer" size={24} />
          ) : (
            <FiMessageCircle size={24} />
          )}
        </button>
      </div>

      {/* Image Modal Lightbox */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100000] bg-black bg-opacity-90 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-screen">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2"
            >
              <FiX size={30} />
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed"
              className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
