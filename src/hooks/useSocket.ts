import { IChatRoom, IMessage, IPagination } from "@/types/socket";
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface SocketHook {
  socket: Socket | null;
  isConnected: boolean;
  messages: IMessage[];
  conversations: IChatRoom[];
  pagination: IPagination | null;
  joinConversation: (conversationId: string) => void;
  sendMessage: (
    data: {
      conversationId: string;
      content?: string;
      type: "text" | "image" | "video" | "tips";
      imageUrl?: string;
      asCreator?: boolean;
    },
    callback?: (response: { message?: IMessage; error?: string }) => void
  ) => void;
  fetchConversations: () => void;
  markAsRead: (conversationId: string) => void;
  fetchMessages: (
    conversationId: string,
    page?: number,
    limit?: number
  ) => void;
}

const useSocket = (): SocketHook => {
  const [, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [conversations, setConversations] = useState<IChatRoom[]>([]);
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
              token,
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
          // Automatically fetch conversations on connect
          socketInstance.emit("get_conversations");
        });

        socketInstance.on("connect_error", (error: unknown) => {
          console.error("Socket connection error:", error);
          setIsConnected(false);
        });

        socketInstance.on(
          "conversations_list",
          (conversations: IChatRoom[]) => {
            setConversations(conversations);
          }
        );

        socketInstance.on(
          "messages_list",
          ({
            messages,
            pagination,
          }: {
            messages: IMessage[];
            pagination: IPagination;
            conversationId: string;
          }) => {
            setMessages(messages);
            setPagination(pagination);
          }
        );

        socketInstance.on("message_received", (message: IMessage) => {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((msg) => msg._id === message._id)) {
              return prev;
            }
            return [...prev, message];
          });
        });

        socketInstance.on("conversation_updated", (conversation: IChatRoom) => {
          setConversations((prev) =>
            prev.map((c) => (c._id === conversation._id ? conversation : c))
          );
        });

        socketInstance.on("conversation_created", (conversation: IChatRoom) => {
          setConversations((prev) => {
            if (prev.some((c) => c._id === conversation._id)) {
              return prev;
            }
            return [...prev, conversation];
          });
        });

        socketInstance.on(
          "members_added",
          ({
            conversationId,
            newMembers,
          }: {
            conversationId: string;
            newMembers: {
              _id: string;
              firstName: string;
              lastName: string;
              email: string;
              profilePicture?: string;
            }[];
          }) => {
            setConversations((prev) =>
              prev.map((c) =>
                c._id === conversationId
                  ? { ...c, participants: [...c.participants, ...newMembers] }
                  : c
              )
            );
          }
        );

        socketInstance.on(
          "member_removed",
          ({
            conversationId,
            removedUserId,
          }: {
            conversationId: string;
            removedUserId: string;
          }) => {
            setConversations((prev) =>
              prev.map((c) =>
                c._id === conversationId
                  ? {
                      ...c,
                      participants: c.participants.filter(
                        (p) => p._id !== removedUserId
                      ),
                    }
                  : c
              )
            );
          }
        );

        socketInstance.on(
          "removed_from_group",
          ({ conversationId }: { conversationId: string }) => {
            setConversations((prev) =>
              prev.filter((c) => c._id !== conversationId)
            );
          }
        );

        socketInstance.on("error", (message: string) => {
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

  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("join", conversationId);
    }
  }, []);

  const sendMessage = useCallback(
    (
      data: {
        conversationId: string;
        content?: string;
        type: "text" | "image" | "video" | "tips";
        imageUrl?: string;
        asCreator?: boolean;
      },
      callback?: (response: { message?: IMessage; error?: string }) => void
    ) => {
      if (socketRef.current) {
        socketRef.current.emit(
          "send_message",
          {
            conversationId: data.conversationId,
            content: data.content,
            type: data.type,
          },
          callback
        );
      }
    },
    []
  );

  const fetchConversations = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("get_conversations");
    }
  }, []);

  const fetchMessages = useCallback(
    (conversationId: string, page: number = 1, limit: number = 50) => {
      if (socketRef.current) {
        socketRef.current.emit("get_messages", { conversationId, page, limit });
      }
    },
    []
  );

  const markAsRead = useCallback((conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("mark_as_read", conversationId);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    messages,
    conversations,
    pagination,
    joinConversation,
    sendMessage,
    fetchConversations,
    fetchMessages,
    markAsRead,
  };
};

export default useSocket;
