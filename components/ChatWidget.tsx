"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { FiX, FiSend, FiImage, FiTrash2 } from "react-icons/fi";
import axios from "axios";
import { io as ClientIO } from "socket.io-client";
import Image from "next/image";
import LocalImageUpload from "./LocalImageUpload";

const WHATSAPP_NUMBER = "923023735860";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

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
  const [unreadCount, setUnreadCount] = useState(0);

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
    if (guestId && !session?.user) headers["x-guest-id"] = guestId;
    return headers;
  };

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
        socketInstance.on("connect", () => {});
        setSocket(socketInstance);
      } catch (err) {
        console.error("Socket init error:", err);
      }
    };
    initSocket();
    return () => { if (socketInstance) socketInstance.disconnect(); };
  }, [session]);

  useEffect(() => {
    if (socket && (session?.user || guestId)) {
      axios.get("/api/chat/my", { headers: getHeaders() })
        .then((res) => {
          setMessages(res.data.messages || []);
          setConversation(res.data.conversation);
          socket.emit("join-chat", res.data.conversation._id);
        }).catch(console.error);
    }
  }, [session, socket, guestId]);

  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.user || guestId) {
        axios.get("/api/chat/my", { headers: getHeaders() })
          .then((res) => {
            const newMessages = res.data.messages || [];
            setMessages((prev) => {
              if (newMessages.length > prev.length) {
                if (!isOpen) {
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg && lastMsg.senderModel !== "User") {
                    setUnreadCount((c) => c + 1);
                  }
                }
                return newMessages;
              }
              if (newMessages.length < prev.length) return newMessages;
              return prev;
            });
            if (res.data.conversation) setConversation(res.data.conversation);
          }).catch(() => {});
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [session, guestId, isOpen]);

  useEffect(() => {
    if (!socket) return;
    socket.on("new-message", (msg: any) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === msg._id)) return prev;
        if (!isOpen && msg.senderModel !== "User") setUnreadCount((c) => c + 1);
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
      const res = await axios.post("/api/chat/my", { text: newMessage, image: imageUrl }, { headers: getHeaders() });
      const messageObj = res.data.message;
      setMessages((prev) => [...prev, messageObj]);
      socket?.emit("send-message", { ...messageObj, conversationId: conversation?._id });
      setNewMessage("");
      setImageUrl("");
      setShowImageUpload(false);
    } catch (e) { console.error(e); }
  };

  const deleteMessage = async (msgId: string) => {
    try {
      await axios.delete(`/api/chat/message?id=${msgId}`, { headers: getHeaders() });
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
      socket?.emit("delete-message", { conversationId: conversation?._id, messageId: msgId });
    } catch (e) { console.error("Failed to delete message"); }
  };

  if (session?.user?.role === "admin") return null;

  return (
    <>
      {/* Floating widget wrapper */}
      <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-5 z-[9999] flex flex-col items-end gap-3">

        {/* ── Chat Dialog ── */}
        {isOpen && (
          <div className="
            w-[calc(100vw-1.5rem)] max-w-[370px]
            h-[520px] sm:h-[560px]
            max-h-[80dvh]
            bg-white rounded-2xl shadow-2xl
            flex flex-col overflow-hidden
            border border-gray-100
            origin-bottom-right
          ">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                {/* Logo */}
                <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 shrink-0 bg-gray-50 flex items-center justify-center">
                  <Image
                    src="/chatwidget.png"
                    alt="Support"
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                    onError={(e: any) => { e.target.style.display = "none"; }}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">Homy Organic</h3>
                  <p className="text-[11px] text-green-600 font-medium flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                    Support Team
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <FiX size={17} />
              </button>
            </div>

            {/* Notice Banner */}
            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 shrink-0">
              <p className="text-[11px] text-amber-800 leading-relaxed">
                ⏱ Reply thoda late ho sakta hai, lekin jawab zaroor milega! Ya phir{" "}
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-green-700 hover:underline"
                >
                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp karein
                </a>
              </p>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 px-4 py-3 overflow-y-auto space-y-3 bg-gray-50/40 text-sm"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-8">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-200 bg-white">
                    <Image src="/chatwidget.png" alt="Support" width={56} height={56} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-semibold text-gray-700">Homy Organic Support</p>
                  <p className="text-xs text-gray-400 max-w-[200px]">
                    Apna sawaal likhein, hum jald reply karenge!
                  </p>
                </div>
              )}
              {messages.map((msg) => {
                const isUser = msg.senderModel === "User";
                return (
                  <div key={msg._id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                    <div
                      className={`relative group max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                        isUser
                          ? "bg-gray-200 text-gray-900 rounded-tr-sm"
                          : "text-white rounded-tl-sm"
                      }`}
                      style={!isUser ? { backgroundColor: "#B9853A" } : {}}
                    >
                      {isUser && (
                        <button
                          onClick={() => deleteMessage(msg._id)}
                          className="absolute -left-7 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 group-hover:opacity-100 transition cursor-pointer hover:text-red-500 p-1"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      )}
                      {msg.image && (
                        <button onClick={() => setZoomedImage(msg.image)} className="block cursor-zoom-in mb-2" type="button">
                          <img src={msg.image} alt="Attachment" className="max-w-[140px] max-h-[140px] object-cover rounded-xl border border-black/10" />
                        </button>
                      )}
                      {msg.text && <p>{msg.text}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Image Upload Panel */}
            {showImageUpload && (
              <div className="px-4 py-2 border-t border-gray-100 bg-white shrink-0">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Attach Image</span>
                  <button
                    type="button"
                    onClick={() => { setShowImageUpload(false); setImageUrl(""); }}
                    className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                  >
                    <FiX size={13} />
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

            {/* Input Bar */}
            <div className="px-3 py-2.5 border-t border-gray-100 bg-white shrink-0">
              {/* WhatsApp quick link */}
              <div className="flex justify-center mb-2">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white px-3 py-1 rounded-full transition-all"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp: +92302 3735860
                </a>
              </div>
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageUpload(!showImageUpload)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer shrink-0 ${showImageUpload ? "text-white" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
                  style={showImageUpload ? { backgroundColor: "#B9853A" } : {}}
                >
                  <FiImage size={18} />
                </button>
                <input
                  type="text"
                  placeholder="Message likhein..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() && !imageUrl}
                  className="p-2.5 rounded-full text-white transition-all cursor-pointer disabled:opacity-40 shrink-0"
                  style={{ backgroundColor: "#B9853A" }}
                >
                  <FiSend size={15} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Floating Trigger Button ── */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative cursor-pointer hover:scale-105 transition-transform drop-shadow-xl"
          aria-label="Open chat"
        >
          {/* Unread badge */}
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full z-10 animate-bounce">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          {isOpen ? (
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-800 shadow-xl">
              <FiX size={24} className="text-white" />
            </div>
          ) : (
            <Image
              src="/chatwidget.png"
              alt="Chat with us"
              width={140}
              height={140}
              className="w-32 h-32 sm:w-36 sm:h-36 object-contain drop-shadow-2xl"
            />
          )}
        </button>
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)" }}
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition cursor-pointer"
          >
            <FiX size={18} />
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="max-w-full max-h-[88vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
