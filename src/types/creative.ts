export type CreativeStatus =
  | "pending"
  | "accepted"
  | "working"
  | "revision"
  | "delivered"
  | "completed"
  | "cancelled";

export type PriorityLevel = "low" | "medium" | "high" | "urgent";

export type CreativeServiceCategory =
  | "Design"
  | "3D & Mockup"
  | "Branding"
  | "Video & Animation"
  | "AI Generation"
  | "Graphic Design"
  | "Copywriting";

export type CreativeService = {
  id: string;
  title: string;
  category: CreativeServiceCategory;
  description: string;
  startingPrice: number;
  deliveryTime: string;
  iconName: string;
  coverImage: string;
  features?: string[];
};

export type CreativeAttachment = {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: string;
};

export type CreativeOrder = {
  id: string;
  orderNumber: string;
  serviceId: string;
  serviceTitle: string;
  projectTitle: string;
  requirements: string;
  deadline: string;
  priority: PriorityLevel;
  status: CreativeStatus;
  attachments: CreativeAttachment[];
  referenceLinks: string[];
  notes?: string;
  createdAt: string;
  expectedDelivery: string;
};

export type CreateCreativeOrderInput = Omit<
  CreativeOrder,
  "id" | "orderNumber" | "status" | "createdAt" | "expectedDelivery"
>;
