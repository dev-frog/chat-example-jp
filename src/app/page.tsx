"use client";

import useSocket from "@/hooks/useSocket";
import { IMessage, IChatRoom } from "@/types/socket";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

export default function ChatComponent() {
  const {
    isConnected,
    messages,
    conversations,
    pagination,
    joinConversation,
    sendMessage,
    fetchConversations,
    fetchMessages,
    markAsRead,
  } = useSocket();

  const [currentConversation, setCurrentConversation] = useState<string | null>(
    null
  );
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleJoinConversation = (conversationId: string) => {
    joinConversation(conversationId);
    setCurrentConversation(conversationId);
    fetchMessages(conversationId); // Fetch messages for the selected conversation
    markAsRead(conversationId); // Mark all messages as read
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentConversation) return;

    sendMessage(
      {
        conversationId: currentConversation,
        content: newMessage,
        type: "text",
      },
      (response) => {
        if (response.error) {
          console.error("Send message error:", response.error);
          // Optionally show error to user (e.g., toast notification)
        } else {
          setNewMessage("");
        }
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLoadMore = () => {
    if (pagination && pagination.hasMore && currentConversation) {
      fetchMessages(currentConversation, pagination.page + 1, pagination.limit);
    }
  };

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar with conversations */}
      <div className="w-1/4 bg-gray-950 border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-white">Chat Rooms</h2>
          <p className="text-sm text-gray-500">
            Status: {isConnected ? "Connected" : "Disconnected"}
          </p>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-60px)]">
          {conversations.length === 0 ? (
            <p className="p-4 text-gray-500">No conversations available</p>
          ) : (
            <ul>
              {conversations.map((conversation: IChatRoom) => (
                <li
                  key={conversation._id}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:text-violet-600 ${
                    currentConversation === conversation._id
                      ? "bg-gray-600"
                      : ""
                  }`}
                  onClick={() => handleJoinConversation(conversation._id)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white">
                      {conversation.name ||
                        conversation.participants
                          .map((p) => `${p.firstName} ${p.lastName}`)
                          .join(", ")}
                    </span>
                    {conversation.lastActivity && (
                      <span className="text-xs text-gray-500">
                        {new Date(
                          conversation.lastActivity
                        ).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-sm text-white truncate">
                      {typeof conversation.lastMessage === "object" &&
                      conversation.lastMessage !== null
                        ? conversation.lastMessage.content || "Media message"
                        : "Loading..."}
                    </p>
                  )}
                  {conversation.unreadCount > 0 && (
                    <span className="text-xs text-white bg-violet-600 rounded-full px-2 py-1">
                      {conversation.unreadCount}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-white">
                {conversations.find((c) => c._id === currentConversation)
                  ?.name || currentConversation.substring(0, 15) + "..."}
              </h2>
              {pagination && pagination.hasMore && (
                <button
                  onClick={handleLoadMore}
                  className="text-sm text-blue-500 hover:underline"
                >
                  Load More
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-600">
              {messages.filter((m) => m.conversation === currentConversation)
                .length === 0 ? (
                <p className="text-center text-gray-500 mt-8">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                <div className="space-y-4">
                  {messages
                    .filter((m) => m.conversation === currentConversation)
                    .map((message: IMessage) => (
                      <div
                        key={message._id}
                        className={`flex ${
                          message.sender._id === "current-user-id" // Replace with actual user ID
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender._id === "current-user-id"
                              ? "bg-blue-500 text-white"
                              : "bg-white border border-gray-200 text-black"
                          }`}
                        >
                          {message.content ? (
                            <p>{message.content}</p>
                          ) : message.type === "image" ||
                            message.type === "video" ? (
                            <Image
                              width={300}
                              height={300}
                              src={message.content || "/placeholder.png"} // Use placeholder if content is missing
                              alt="Message content"
                              className="max-w-full h-auto rounded"
                            />
                          ) : (
                            <p>Unsupported message type</p>
                          )}
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs opacity-70">
                              {message.sender?.firstName || "Unknown"}
                            </span>
                            <span className="text-xs opacity-70">
                              {new Date(message.sendAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 border text-black border-y-violet-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-medium text-gray-700">
                Select a conversation
              </h3>
              <p className="text-gray-500 mt-2">
                Choose a conversation from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
