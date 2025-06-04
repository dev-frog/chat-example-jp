"use client";

import useSocket from "@/hooks/useSocket";
import { IMessage, IChatRoom } from "@/types/socket";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

export default function ChatComponent() {
  const {
    isConnected,
    messages,
    rooms,
    joinRoom,
    sendMessage,
    fetchRooms,
    markAsRead,
  } = useSocket();

  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleJoinRoom = (roomId: string) => {
    joinRoom(roomId);
    setCurrentRoom(roomId);
    // Mark existing messages as read when joining a room
    const unreadMessages = messages
      .filter((msg) => msg.roomId === roomId && !msg.isRead)
      .map((msg) => msg._id!);
    if (unreadMessages.length > 0) {
      markAsRead(roomId, unreadMessages);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentRoom) return;

    sendMessage(
      {
        creatorId: "67d6b9f41a959043fee2f51a", // Replace with actual creator ID
        message: newMessage,
        type: "text",
        roomId: currentRoom,
        asCreator: false,
      },
      (response) => {
        if (response.error) {
          console.error("Send message error:", response.error);
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

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar with rooms */}
      <div className="w-1/4 bg-gray-950 border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Chat Rooms</h2>
          <p className="text-sm text-gray-500">
            Status: {isConnected ? "Connected" : "Disconnected"}
          </p>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-60px)]">
          {rooms.length === 0 ? (
            <p className="p-4 text-gray-500">No rooms available</p>
          ) : (
            <ul>
              {rooms.map((room: IChatRoom) => (
                <li
                  key={room.roomId}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:text-violet-600 ${
                    currentRoom === room.roomId ? "bg-gray-600" : ""
                  }`}
                  onClick={() => handleJoinRoom(room.roomId)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{room.roomId}</span>
                    {room.lastActivity && (
                      <span className="text-xs text-gray-500">
                        {new Date(room.lastActivity).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  {room.lastMessage && (
                    <p className="text-sm text-white truncate">
                      {typeof room.lastMessage === "object" &&
                      room.lastMessage !== null
                        ? (room.lastMessage as { text?: string }).text ||
                          "Media message"
                        : "Loading..."}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {currentRoom ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                Room: {currentRoom.substring(0, 15)}...
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-600">
              {messages.filter((m) => m.roomId === currentRoom).length === 0 ? (
                <p className="text-center text-gray-500 mt-8">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                <div className="space-y-4">
                  {messages
                    .filter((m) => m.roomId === currentRoom)
                    .map((message: IMessage) => (
                      <div
                        key={message._id}
                        className={`flex ${
                          message.senderType === "creator"
                            ? "justify-start"
                            : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderType === "creator"
                              ? "bg-white border border-gray-200"
                              : "bg-blue-500 text-white"
                          }`}
                        >
                          {message.text ? (
                            <p>{message.text}</p>
                          ) : message.imageUrl ? (
                            <Image
                              width={300}
                              height={300}
                              src={message.imageUrl}
                              alt="Message content"
                              className="max-w-full h-auto rounded"
                            />
                          ) : null}
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
                  className="
                  flex-1 border text-black border-y-violet-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                Select a chat room
              </h3>
              <p className="text-gray-500 mt-2">
                Choose a room from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
