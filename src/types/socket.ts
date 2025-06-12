export enum SenderTypes {
  USER = "user",
  CREATOR = "creator",
  CLUB = "club",
}

export enum MessageTypes {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  TIPS = "tips",
}

export interface ISender {
  userId: string;
  firstName: string;
  lastName?: string;
  profilePicture?: string;
}

export interface IChatRoom {
  lastActivity: Date;
  _id: string;
  roomId: string;
  type: "direct" | "group";
  participants: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  }[];
  lastMessage?: IMessage;
  unreadCount: number;
  lastSeen: Record<string, Date>;
  unreadCounts: Record<string, number>;
  name?: string;
  createdBy: string;
}

export interface IMessage {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  content?: string;
  type: "text" | "image" | "video" | "tips";
  sendAt: string;
  readBy: string[];
  isRead: boolean;
  isEdited?: boolean;
  isPinned?: boolean;
}
export interface IPagination {
  page: number;
  limit: number;
  totalMessages: number;
  totalPages: number;
  hasMore: boolean;
}
