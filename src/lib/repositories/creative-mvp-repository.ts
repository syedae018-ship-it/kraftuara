import {
  Designer,
  CreativeMessage,
  Deliverable,
  Assignment,
  TimelineEvent,
  DeliverableVersion,
  StorageProvider,
} from "@/types/creative-mvp";
import { CreativeStatus, PriorityLevel } from "@/types/creative";

export interface ICreativeMVPRepository {
  getDesigners(): Promise<Designer[]>;
  getMessages(orderId: string): Promise<CreativeMessage[]>;
  sendMessage(orderId: string, content: string, senderRole: "customer" | "designer", attachments?: any[]): Promise<CreativeMessage>;
  getDeliverables(orderId: string): Promise<Deliverable[]>;
  addDeliverable(orderId: string, input: { filename: string; size: string; url: string; provider: StorageProvider; version: DeliverableVersion; description?: string }): Promise<Deliverable>;
  getAssignment(orderId: string): Promise<Assignment>;
  updateAssignment(orderId: string, partial: Partial<Assignment>): Promise<Assignment>;
  getTimeline(orderId: string): Promise<TimelineEvent[]>;
}

const mockDesigners: Designer[] = [
  { id: "des-1", name: "Zayn Al-Mansoor", email: "zayn@studio.io", role: "Senior 3D Artist & Brand Designer", activeOrdersCount: 2, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" },
  { id: "des-2", name: "Aria Chen", email: "aria@studio.io", role: "Motion Designer & AI Specialist", activeOrdersCount: 1, avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100" },
  { id: "des-3", name: "Vikram Mehta", email: "vikram@studio.io", role: "Packaging & Vector Illustrator", activeOrdersCount: 3, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
];

const mockMessages: Record<string, CreativeMessage[]> = {
  "ord-cr-101": [
    {
      id: "msg-1",
      orderId: "ord-cr-101",
      senderId: "sys",
      senderName: "System",
      senderRole: "system",
      type: "system",
      content: "Order brief submitted by customer.",
      createdAt: "2026-02-04T10:00:00Z",
    },
    {
      id: "msg-2",
      orderId: "ord-cr-101",
      senderId: "des-1",
      senderName: "Zayn Al-Mansoor",
      senderRole: "system",
      type: "system",
      content: "Designer Zayn Al-Mansoor was assigned to this order.",
      createdAt: "2026-02-04T10:30:00Z",
    },
    {
      id: "msg-3",
      orderId: "ord-cr-101",
      senderId: "des-1",
      senderName: "Zayn Al-Mansoor",
      senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
      senderRole: "designer",
      type: "text",
      content: "Hi Syed! I've reviewed your brief for the Eid Collection banners. Starting 3D rendering for Royal Amber Oud now. Will match the #800020 maroon background.",
      createdAt: "2026-02-04T11:00:00Z",
    },
    {
      id: "msg-4",
      orderId: "ord-cr-101",
      senderId: "cust-1",
      senderName: "Syed Mustafa",
      senderRole: "customer",
      type: "text",
      content: "Sounds great Zayn! Please make sure the gold accent highlights on the bottle cap are prominent.",
      createdAt: "2026-02-04T11:15:00Z",
    },
  ],
};

const mockDeliverables: Record<string, Deliverable[]> = {
  "ord-cr-101": [
    {
      id: "del-1",
      orderId: "ord-cr-101",
      filename: "Royal_Amber_Oud_Eid_Banner_v1.png",
      size: "4.8 MB",
      url: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200",
      provider: "s3",
      uploadedBy: "Zayn Al-Mansoor",
      version: "v1",
      description: "Initial 3D render preview with gold reflections.",
      createdAt: "2026-02-04T16:00:00Z",
    },
    {
      id: "del-2",
      orderId: "ord-cr-101",
      filename: "Royal_Amber_Oud_Eid_Banner_Final.png",
      size: "8.2 MB",
      url: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=1200",
      provider: "gdrive",
      uploadedBy: "Zayn Al-Mansoor",
      version: "final",
      description: "High-resolution final render package (PSD + PNG).",
      createdAt: "2026-02-05T09:00:00Z",
    },
  ],
};

const mockAssignments: Record<string, Assignment> = {
  "ord-cr-101": {
    orderId: "ord-cr-101",
    designerId: "des-1",
    designerName: "Zayn Al-Mansoor",
    priority: "high",
    status: "working",
    estimatedHours: 8,
    dueDate: "2026-02-06",
    internalNotes: "High-priority luxury client. Maintain strict Maroon/Gold contrast.",
    updatedAt: "2026-02-04T10:30:00Z",
  },
  "ord-cr-102": {
    orderId: "ord-cr-102",
    designerId: "des-2",
    designerName: "Aria Chen",
    priority: "medium",
    status: "delivered",
    estimatedHours: 4,
    dueDate: "2026-02-03",
    internalNotes: "Delivered 5-slide carousel PSD files.",
    updatedAt: "2026-02-03T18:00:00Z",
  },
};

const mockTimelines: Record<string, TimelineEvent[]> = {
  "ord-cr-101": [
    { id: "tm-1", orderId: "ord-cr-101", title: "Order Created", description: "Customer submitted brief for Eid Collection Banners.", timestamp: "2026-02-04T10:00:00Z", type: "created" },
    { id: "tm-2", orderId: "ord-cr-101", title: "Designer Assigned", description: "Zayn Al-Mansoor assigned to design brief.", timestamp: "2026-02-04T10:30:00Z", type: "assigned" },
    { id: "tm-3", orderId: "ord-cr-101", title: "Production Started", description: "Status changed to In Production.", timestamp: "2026-02-04T11:00:00Z", type: "working" },
    { id: "tm-4", orderId: "ord-cr-101", title: "Deliverable v1 Uploaded", description: "Uploaded Royal_Amber_Oud_Eid_Banner_v1.png.", timestamp: "2026-02-04T16:00:00Z", type: "delivered" },
  ],
};

class MockCreativeMVPRepositoryImpl implements ICreativeMVPRepository {
  async getDesigners(): Promise<Designer[]> {
    return [...mockDesigners];
  }

  async getMessages(orderId: string): Promise<CreativeMessage[]> {
    return [...(mockMessages[orderId] || [])];
  }

  async sendMessage(orderId: string, content: string, senderRole: "customer" | "designer", attachments?: any[]): Promise<CreativeMessage> {
    const list = mockMessages[orderId] || [];
    const newMessage: CreativeMessage = {
      id: `msg-${Date.now()}`,
      orderId,
      senderId: senderRole === "customer" ? "cust-1" : "des-1",
      senderName: senderRole === "customer" ? "Syed Mustafa" : "Zayn Al-Mansoor",
      senderAvatar: senderRole === "designer" ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" : undefined,
      senderRole,
      type: attachments && attachments.length > 0 ? "file" : "text",
      content,
      attachments,
      createdAt: new Date().toISOString(),
    };
    list.push(newMessage);
    mockMessages[orderId] = list;
    return newMessage;
  }

  async getDeliverables(orderId: string): Promise<Deliverable[]> {
    return [...(mockDeliverables[orderId] || [])];
  }

  async addDeliverable(orderId: string, input: { filename: string; size: string; url: string; provider: StorageProvider; version: DeliverableVersion; description?: string }): Promise<Deliverable> {
    const list = mockDeliverables[orderId] || [];
    const created: Deliverable = {
      ...input,
      id: `del-${Date.now()}`,
      orderId,
      uploadedBy: "Zayn Al-Mansoor",
      createdAt: new Date().toISOString(),
    };
    list.push(created);
    mockDeliverables[orderId] = list;

    // Record system timeline event
    const timeline = mockTimelines[orderId] || [];
    timeline.push({
      id: `tm-${Date.now()}`,
      orderId,
      title: `Deliverable ${input.version.toUpperCase()} Uploaded`,
      description: `Uploaded ${input.filename}`,
      timestamp: new Date().toISOString(),
      type: "delivered",
    });
    mockTimelines[orderId] = timeline;

    return created;
  }

  async getAssignment(orderId: string): Promise<Assignment> {
    if (!mockAssignments[orderId]) {
      mockAssignments[orderId] = {
        orderId,
        designerId: "des-1",
        designerName: "Zayn Al-Mansoor",
        priority: "high",
        status: "working",
        estimatedHours: 6,
        dueDate: "2026-02-15",
        updatedAt: new Date().toISOString(),
      };
    }
    return { ...mockAssignments[orderId] };
  }

  async updateAssignment(orderId: string, partial: Partial<Assignment>): Promise<Assignment> {
    const current = await this.getAssignment(orderId);
    const updated: Assignment = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    mockAssignments[orderId] = updated;

    // Record system timeline event if status changed
    if (partial.status && partial.status !== current.status) {
      const timeline = mockTimelines[orderId] || [];
      timeline.push({
        id: `tm-${Date.now()}`,
        orderId,
        title: `Status Changed`,
        description: `Order status updated to ${partial.status.toUpperCase()}`,
        timestamp: new Date().toISOString(),
        type: partial.status as any,
      });
      mockTimelines[orderId] = timeline;

      // Add system message to chat
      const msgs = mockMessages[orderId] || [];
      msgs.push({
        id: `msg-sys-${Date.now()}`,
        orderId,
        senderId: "sys",
        senderName: "System",
        senderRole: "system",
        type: "system",
        content: `Order status changed to ${partial.status.toUpperCase()}.`,
        createdAt: new Date().toISOString(),
      });
      mockMessages[orderId] = msgs;
    }

    return updated;
  }

  async getTimeline(orderId: string): Promise<TimelineEvent[]> {
    return [...(mockTimelines[orderId] || [])];
  }
}

export const creativeMVPRepository: ICreativeMVPRepository = new MockCreativeMVPRepositoryImpl();
