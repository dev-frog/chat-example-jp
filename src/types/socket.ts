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

export interface IMessage {
  _id?: string;
  roomId: string;
  text?: string;
  imageUrl?: string;
  senderId: string;
  creatorId: string;
  senderType: SenderTypes;
  sendAt: Date;
  isRead: boolean;
  type: MessageTypes;
  sender?: ISender;
}

export interface IChatRoom {
  roomId: string;
  participants: string[];
  creatorId: string;
  lastMessage?: string;
  lastActivity: Date;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
