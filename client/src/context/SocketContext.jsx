import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;

    const s = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      console.log('Connected to realtime server');
      s.emit('get_online_users');
    });

    s.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    s.on('user_online', ({ userId }) => {
      setOnlineUsers((prev) => Array.from(new Set([...prev, userId])));
    });

    s.on('user_offline', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    s.on('notification', (notif) => {
      toast(
        (t) => (
          <div className="flex items-start gap-3">
            <div className="text-xl">🔔</div>
            <div>
              <p className="font-semibold text-sm">{notif.title}</p>
              <p className="text-xs text-slate-500">{notif.message}</p>
            </div>
          </div>
        ),
        { duration: 5000 }
      );
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
