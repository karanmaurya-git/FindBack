import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send,
  Image as ImageIcon,
  MoreVertical,
  ShieldAlert,
  ArrowLeft,
  Circle,
  Clock,
  CheckCheck,
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const imageInputRef = useRef(null);
  const [sendingImage, setSendingImage] = useState(false);

  // Fetch all conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get('/conversations');
        setConversations(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchConversations();
  }, []);

  // Set active conversation and load messages
  useEffect(() => {
    if (!conversationId) {
      if (conversations.length > 0) {
        navigate(`/messages/${conversations[0]._id}`, { replace: true });
      }
      setLoading(false);
      return;
    }

    const conv = conversations.find((c) => c._id === conversationId);
    setActiveConv(conv || null);

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/messages/${conversationId}?limit=50`);
        setMessages(res.data || []);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    // Socket: Join conversation room
    if (socket) {
      socket.emit('join_conversation', conversationId);
    }

    return () => {
      if (socket) {
        socket.emit('leave_conversation', conversationId);
      }
    };
  }, [conversationId, conversations, socket]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (msg.conversation === conversationId) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    };

    const handleTyping = ({ userId }) => {
      if (userId !== user._id) {
        setOtherUserTyping(true);
      }
    };

    const handleStopTyping = ({ userId }) => {
      if (userId !== user._id) {
        setOtherUserTyping(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket, conversationId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    setText(e.target.value);

    if (socket && conversationId) {
      socket.emit('typing_start', { conversationId });

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', { conversationId });
      }, 1500);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !conversationId) return;

    const content = text.trim();
    setText('');

    if (socket) {
      socket.emit('send_message', {
        conversationId,
        content,
      });
      socket.emit('typing_stop', { conversationId });
    } else {
      // Fallback to REST API
      try {
        const res = await api.post(`/messages/${conversationId}`, { content });
        setMessages((prev) => [...prev, res.data]);
        scrollToBottom();
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const handleSendImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    const data = new FormData();
    data.append('image', file);
    data.append('folder', 'chat');

    setSendingImage(true);
    try {
      const uploadRes = await api.post('/uploads/image', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const image = { url: uploadRes.data.url, public_id: uploadRes.data.public_id };

      if (socket) {
        socket.emit('send_message', {
          conversationId,
          content: '📷 Photo',
          type: 'image',
          image,
        });
      } else {
        const res = await api.post(`/messages/${conversationId}`, {
          content: '📷 Photo',
          type: 'image',
          image,
        });
        setMessages((prev) => [...prev, res.data]);
        scrollToBottom();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const getOtherParticipant = (conv) => {
    if (!conv) return null;
    return conv.participants.find((p) => p._id !== user._id) || conv.participants[0];
  };

  const otherUser = getOtherParticipant(activeConv);
  const isOtherOnline = otherUser && onlineUsers.includes(otherUser._id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-8rem)]">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl h-full shadow-xl shadow-brand-500/5 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left: Conversations List (4 cols) */}
        <div
          className={`md:col-span-4 border-r border-slate-100 dark:border-slate-800 flex flex-col h-full ${
            conversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">Messages</h2>
            <p className="text-xs text-slate-400">Encrypted peer coordination</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {conversations.length > 0 ? (
              conversations.map((conv) => {
                const partner = getOtherParticipant(conv);
                const isActive = conv._id === conversationId;
                const isPartnerOnline = partner && onlineUsers.includes(partner._id);

                return (
                  <div
                    key={conv._id}
                    onClick={() => navigate(`/messages/${conv._id}`)}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-brand-50/80 dark:bg-brand-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        {partner?.name?.charAt(0) || 'U'}
                      </div>
                      {isPartnerOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {partner?.name || 'User'}
                        </p>
                        {conv.lastMessage?.timestamp && (
                          <span className="text-[10px] text-slate-400">
                            {format(new Date(conv.lastMessage.timestamp), 'hh:mm a')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {conv.lastMessage?.content || 'Started a conversation'}
                      </p>
                      {conv.item && (
                        <span className="inline-block text-[10px] font-semibold text-brand-600 dark:text-brand-400 truncate mt-0.5">
                          Re: {conv.item.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No active conversations yet.
              </div>
            )}
          </div>
        </div>

        {/* Right: Message Window (8 cols) */}
        <div
          className={`md:col-span-8 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/40 ${
            !conversationId ? 'hidden md:flex items-center justify-center' : 'flex'
          }`}
        >
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/messages')}
                    className="md:hidden p-1 text-slate-500 hover:text-slate-900"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center text-xs">
                      {otherUser?.name?.charAt(0) || 'U'}
                    </div>
                    {isOtherOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {otherUser?.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      {isOtherOnline ? (
                        <span className="text-emerald-500 font-medium">● Online</span>
                      ) : (
                        <span>Offline</span>
                      )}
                      {activeConv.item && ` • Re: ${activeConv.item.name}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.sender?._id === user._id || msg.sender === user._id;

                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-sm sm:max-w-md rounded-2xl text-xs sm:text-sm leading-relaxed overflow-hidden ${
                          msg.type === 'image' ? 'p-1.5' : 'px-4 py-2.5'
                        } ${
                          isMe
                            ? 'bg-brand-600 text-white rounded-br-none shadow-md shadow-brand-500/10'
                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-bl-none shadow-sm'
                        }`}
                      >
                        {msg.type === 'image' && msg.image?.url ? (
                          <a href={msg.image.url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={msg.image.url}
                              alt="Shared attachment"
                              className="rounded-xl max-h-64 w-auto object-cover"
                            />
                          </a>
                        ) : (
                          msg.content
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 px-1 mt-1">
                        {format(new Date(msg.createdAt), 'hh:mm a')}
                      </span>
                    </div>
                  );
                })}
                {otherUserTyping && (
                  <div className="text-xs text-slate-400 italic flex items-center gap-1 animate-pulse">
                    <span>{otherUser?.name} is typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSendImage}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={sendingImage}
                  title="Send an image"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-brand-600 hover:border-brand-300 transition-all disabled:opacity-40 shrink-0"
                >
                  {sendingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                </button>
                <input
                  type="text"
                  value={text}
                  onChange={handleInputChange}
                  placeholder="Type your message securely..."
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-all disabled:opacity-40 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="text-center p-8 text-slate-400 text-xs">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
