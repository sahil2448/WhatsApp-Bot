// frontend/src/hooks/useSocket.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  id: string;
  from?: string;
  to?: string;
  body: string;
  timestamp: number;
  direction: "incoming" | "outgoing";
  type: string;
}

interface ConnectionStatus {
  state: "qr" | "authenticated" | "ready" | "disconnected" | "auth_failure";
  message?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>({ state: "disconnected" });
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("✅ Connected to backend");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from backend");
      setIsConnected(false);
    });

    socket.on("qr", (data: { dataUrl: string }) => {
      console.log("📱 QR Code received");
      setQrCode(data.dataUrl);
    });

    socket.on("status", (status: ConnectionStatus) => {
      console.log("📊 Status update:", status);
      setStatus(status);
      if (status.state === "ready") {
        setQrCode(null); // Clear QR code when connected
      }
    });

    socket.on("message_received", (message: Message) => {
      setMessages(prev => [message, ...prev]);
    });

    socket.on("message_sent", (message: Message) => {
      setMessages(prev => [message, ...prev]);
    });

    socket.on("error", (error: any) => {
      console.error("Socket error:", error);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = (to: string, message: string) => {
    if (socketRef.current) {
      socketRef.current.emit("send_message", { to, message });
    }
  };

  return {
    isConnected,
    qrCode,
    status,
    messages,
    sendMessage,
  };
}
