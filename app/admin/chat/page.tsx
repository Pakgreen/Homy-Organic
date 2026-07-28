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
  FiMessageCircle,
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
    return () => { if (socketInstance) socketInstance.disconnect(); };
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await axios.get("/api/chat/admin/conversations");
      setConversations(res.data.conversations || []);
    } catch (e) { console.error(e); }
  };

  const loadChat = async (conv: any) => {
    setActiveChat(conv);
    setUnreadCounts((prev) => { const u = { ...prev }; delete u[conv._id]; return u; });
    try {
      const res = await axios.get(`/api/chat/admin/messages?id=${conv._id}`);
      setMessages(res.data.messages || []);
      socket?.emit("join-chat", conv._id);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
      if (activeChat) {
        axios.get(`/api/chat/admin/messages?id=${activeChat._id}`)
          .then((res) => {
            const newMsgs = res.data.messages || [];
            setMessages((prev) => newMsgs.length !== prev.length ? newMsgs : prev);
          }).catch(() => {});
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeChat]);

  useEffect(() => {
    if (!socket) return;
    socket.on("new-message", (msg: any) => {
      if (activeChat && msg.conversationId === activeChat._id) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      fetchConversations();
    });
    socket.on("admin-new-message", (msg: any) => {
      if (!activeChat || activeChat._id !== msg.conversationId) {
        toast.custom(
          (t) => (
            <div className="bg-white border-l-4 shadow-lg p-4 rounded-xl flex gap-3 w-72" style={{ borderColor: "#B9853A" }}>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-gray-800">New Message</h3>
                <p className="text-xs text-gray-500 truncate mt-0.5">{msg.text || "Sent an image"}</p>
              </div>
              <button onClick={() => toast.dismiss(t.id)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <FiX size={14} />
              </button>
            </div>
          ),
          { position: "top-right", duration: 4000 }
        );
        setUnreadCounts((prev) => ({ ...prev, [msg.conversationId]: (prev[msg.conversationId] || 0) + 1 }));
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
    } catch (e) { console.error(e); }
  };

  const deleteMessage = async (msgId: string) => {
    try {
      await axios.delete(`/api/chat/message?id=${msgId}`);
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
      socket?.emit("delete-message", { conversationId: activeChat._id, messageId: msgId });
    } catch (e) { console.error("Failed to delete message"); }
  };

  const deleteConversation = async () => {
    if (!activeChat) return;
    if (!confirm("Delete this entire conversation? This cannot be undone.")) return;
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

  const activeName = activeChat
    ? (activeChat.isGuest ? activeChat.guestName || "Guest" : activeChat.user?.name || "Customer")
    : "";

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex h-[calc(100dvh-120px)] md:h-[calc(100dvh-80px)] overflow-hidden rounded-xl border border-gray-100 bg-white">

      {/* ── Conversation Sidebar ── */}
      <div className={`${activeChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 lg:w-80 border-r border-gray-100 shrink-0`}>

        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900">Chats</h3>
            {totalUnread > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: "#B9853A" }}>
                {totalUnread}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">{conversations.length} total</span>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
              <FiMessageCircle size={32} className="text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">No conversations yet</p>
            </div>
          ) : (
            conversations.map((c) => {
              const name = c.isGuest ? c.guestName || "Guest" : c.user?.name || "Customer";
              const isActive = activeChat?._id === c._id;
              const hasUnread = !!unreadCounts[c._id];
              return (
                <div
                  key={c._id}
                  onClick={() => loadChat(c)}
                  className={`px-4 py-3 flex items-center gap-3 cursor-pointer border-b border-gray-50 transition-colors ${isActive ? "bg-[#FDF6EC]" : "hover:bg-gray-50"}`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                      {c.user?.image ? (
                        <img src={c.user.image} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <FiUser size={16} className="text-gray-400" />
                      )}
                    </div>
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white animate-pulse" style={{ backgroundColor: "#B9853A" }} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm truncate ${hasUnread ? "font-bold text-gray-900" : "font-medium text-gray-800"}`}>
                        {name}
                      </p>
                      {hasUnread && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: "#B9853A" }}>
                          {unreadCounts[c._id]}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${hasUnread ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                      {c.lastMessageText || "Image sent"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className={`${!activeChat ? "hidden md:flex" : "flex"} flex-1 flex-col min-w-0`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveChat(null)}
                  className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition cursor-pointer"
                >
                  <FiArrowLeft size={18} />
                </button>
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                  {activeChat.user?.image ? (
                    <img src={activeChat.user.image} alt={activeName} className="w-full h-full object-cover" />
                  ) : (
                    <FiUser size={15} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{activeName}</p>
                  {activeChat.user?.email && (
                    <p className="text-xs text-gray-400">{activeChat.user.email}</p>
                  )}
                </div>
              </div>
              <button
                onClick={deleteConversation}
                title="Delete Conversation"
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <FiTrash2 size={15} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-3 bg-gray-50/40">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-gray-400">No messages yet. Say hello! 👋</p>
                </div>
              )}
              {messages.map((msg) => {
                const isAdmin = msg.senderModel === "Admin";
                return (
                  <div key={msg._id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                    <div className={`relative group max-w-[75%] sm:max-w-[65%] ${isAdmin ? "items-end" : "items-start"} flex flex-col`}>

                      {/* Delete hover button */}
                      <button
                        onClick={() => deleteMessage(msg._id)}
                        className={`absolute top-2 opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-600 cursor-pointer z-10 ${isAdmin ? "-left-7" : "-right-7"}`}
                      >
                        <FiTrash2 size={13} />
                      </button>

                      <div
                        className={`px-3.5 py-2.5 text-sm leading-relaxed rounded-2xl ${
                          isAdmin
                            ? "text-white rounded-br-sm"
                            : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                        }`}
                        style={isAdmin ? { backgroundColor: "#B9853A" } : {}}
                      >
                        {msg.image && (
                          <button
                            onClick={() => setZoomedImage(msg.image)}
                            className="block cursor-zoom-in mb-2"
                            type="button"
                          >
                            <img
                              src={msg.image}
                              alt="Attachment"
                              className="max-w-[180px] max-h-[200px] rounded-lg object-contain"
                            />
                          </button>
                        )}
                        {msg.text && <p>{msg.text}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Image Upload Preview */}
            {showUpload && (
              <div className="px-4 py-3 border-t border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Attach Image</span>
                  <button
                    type="button"
                    onClick={() => { setShowUpload(false); setImageUrl(""); }}
                    className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                  >
                    <FiX size={15} />
                  </button>
                </div>
                <LocalImageUpload
                  value={imageUrl}
                  onChange={(val) => setImageUrl(val)}
                  onRemove={() => setImageUrl("")}
                />
              </div>
            )}

            {/* Input Bar */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUpload(!showUpload)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer shrink-0 ${showUpload ? "text-white" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
                  style={showUpload ? { backgroundColor: "#B9853A" } : {}}
                >
                  <FiImage size={18} />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() && !imageUrl}
                  className="p-2.5 rounded-xl text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  style={{ backgroundColor: "#B9853A" }}
                >
                  <FiSend size={16} />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* No chat selected */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-[#FDF6EC] flex items-center justify-center mb-4">
              <FiMessageCircle size={28} style={{ color: "#B9853A" }} />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">Select a conversation</h3>
            <p className="text-sm text-gray-400">Choose a chat from the sidebar to start replying</p>
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
          onClick={() => setZoomedImage(null)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition cursor-pointer"
            onClick={() => setZoomedImage(null)}
          >
            <FiX size={18} />
          </button>
          <img
            src={zoomedImage}
            alt="Full size"
            className="max-w-full max-h-[85vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
