import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

export const useSocket = (onNotificationReceived) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Use the same origin in both dev and prod.
    // In dev: Vite proxy forwards /socket.io/* → localhost:5000
    // In prod: Vercel rewrite forwards /socket.io/* → the deployed backend
    const serverUrl = window.location.origin;

    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('Socket.io connected:', socket.id);
      
      // Join role room
      socket.emit('join_role_room', user.role);
    });

    socket.on('new_notification', (notification) => {
      console.log('Real-time notification received:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Socket.io disconnected');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, user, onNotificationReceived]);

  return { socket: socketRef.current, connected };
};
