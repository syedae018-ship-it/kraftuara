import { PriorityLevel, CreativeStatus } from "./creative";

export type SenderRole = "customer" | "designer" | "system";

export type MessageType = "text" | "image" | "file" | "system";

export type StorageProvider = "s3" | "r2" | "gdrive" | "supabase";

export type DeliverableVersion = "v1" | "v2" | "final";

export type Designer = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  activeOrdersCount: number;
};

export type CreativeMessage = {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: SenderRole;
  type: MessageType;
  content: string;
  attachments?: {
    name: string;
    url: string;
    size?: string;
  }[];
  createdAt: string;
};

export type Deliverable = {
  id: string;
  orderId: string;
  filename: string;
  size: string;
  url: string;
  provider: StorageProvider;
  uploadedBy: string;
  version: DeliverableVersion;
  description?: string;
  createdAt: string;
};

export type Assignment = {
  orderId: string;
  designerId?: string;
  designerName?: string;
  priority: PriorityLevel;
  status: CreativeStatus;
  estimatedHours: number;
  dueDate: string;
  internalNotes?: string;
  updatedAt: string;
};

export type TimelineEvent = {
  id: string;
  orderId: string;
  title: string;
  description: string;
  timestamp: string;
  type: "created" | "assigned" | "working" | "revision" | "delivered" | "completed";
};
