import { IChatRoom, IMessage, IPagination } from "@/types/socket";
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface SocketHook {
  socket: Socket | null;
  isConnected: boolean;
  messages: IMessage[];
  rooms: IChatRoom[];
  pagination: IPagination | null;
  joinRoom: (roomId: string) => void;
  sendMessage: (
    data: {
      creatorId: string;
      message?: string;
      type: "text" | "image" | "video" | "tips";
      imageUrl?: string;
      roomId?: string;
      asCreator?: boolean;
    },
    callback?: (response: { message?: IMessage; error?: string }) => void
  ) => void;
  fetchRooms: () => void;
  markAsRead: (roomId: string, messageIds: string[]) => void;
}

const useSocket = (): SocketHook => {
  const [, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [rooms, setRooms] = useState<IChatRoom[]>([]);
  const [pagination, setPagination] = useState<IPagination | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        const token = process.env.NEXT_PUBLIC_TOKEN ?? "";

        if (!token) {
          console.error("No authentication token available");
          return;
        }

        const socketInstance = io(
          process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000",
          {
            transports: ["websocket", "polling"],
            auth: {
              token: token,
            },
            extraHeaders: {
              "x-auth-token": token,
            },
          }
        );

        console.log("Sending headers:", {
          "x-auth-token": token.substring(0, 20) + "...",
        });

        socketRef.current = socketInstance;
        setSocket(socketInstance);

        console.log("Connecting to socket...");

        socketInstance.on("connect", () => {
          setIsConnected(true);
          console.log("Socket connected:", socketInstance.id);
          socketInstance.emit("joinUser");
        });

        socketInstance.on("connect_error", (error: unknown) => {
          console.error("Socket connection error:", error);
          setIsConnected(false);
        });

        socketInstance.on("userId", (userId: string) => {
          console.log("Joined user channel:", userId);
        });

        socketInstance.on("roomMessages", (newMessages: IMessage[]) => {
          setMessages(newMessages);
        });

        socketInstance.on("receiveMessage", (message: IMessage) => {
          setMessages((prev) => [...prev, message]);
        });

        socketInstance.on(
          "rooms",
          ({
            rooms,
            pagination,
          }: {
            rooms: IChatRoom[];
            pagination: IPagination;
          }) => {
            setRooms(rooms);
            setPagination(pagination);
          }
        );

        socketInstance.on(
          "messageRead",
          ({ messageIds }: { messageIds: string[] }) => {
            setMessages((prev) =>
              prev.map((msg) =>
                messageIds.includes(msg._id!) ? { ...msg, isRead: true } : msg
              )
            );
          }
        );

        socketInstance.on("error", ({ message }: { message: string }) => {
          console.error("Socket error:", message);
        });

        socketInstance.on("disconnect", () => {
          setIsConnected(false);
          console.log("Socket disconnected");
        });
      } catch (error) {
        console.error("Failed to initialize socket:", error);
      }
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("joinRoom", { roomId });
    }
  }, []);

  const sendMessage = useCallback(
    (
      data: {
        creatorId: string;
        message?: string;
        type: "text" | "image" | "video" | "tips";
        imageUrl?: string;
        roomId?: string;
        asCreator?: boolean;
      },
      callback?: (response: { message?: IMessage; error?: string }) => void
    ) => {
      if (socketRef.current) {
        socketRef.current.emit("sendMessage", data, callback);
      }
    },
    []
  );

  const fetchRooms = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("fetchRooms");
    }
  }, []);

  const markAsRead = useCallback((roomId: string, messageIds: string[]) => {
    if (socketRef.current) {
      socketRef.current.emit("markAsRead", { roomId, messageIds });
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    messages,
    rooms,
    pagination,
    joinRoom,
    sendMessage,
    fetchRooms,
    markAsRead,
  };
};

export default useSocket;
