"use client";

import React, { useState, useEffect } from "react";
import { CreativeMessage } from "@/types/creative-mvp";
import { creativeMVPRepository } from "@/lib/repositories/creative-mvp-repository";
import { ChatBubble } from "./chat-bubble";
import { ChatComposer } from "./chat-composer";
import { Card } from "@/components/ui/card";
import { Sparkles, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CreativeChatProps {
  orderId: string;
  className?: string;
}

export function CreativeChat({ orderId, className }: CreativeChatProps) {
  const [messages, setMessages] = useState<CreativeMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = async () => {
    const list = await creativeMVPRepository.getMessages(orderId);
    setMessages(list);
  };

  useEffect(() => {
    fetchMessages();
  }, [orderId]);

  const handleSendMessage = async (content: string) => {
    setIsSending(true);
    await creativeMVPRepository.sendMessage(orderId, content, "customer");
    await fetchMessages();
    setIsSending(false);
  };

  return (
    <Card className={cn("p-4 space-y-4 bg-[#151515] border-white/10 flex flex-col justify-between h-[500px]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-maroon-400" />
          <h4 className="text-xs font-bold font-heading text-white tracking-wide">
            Order Conversation & Feedback
          </h4>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">{messages.length} Messages</span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-1">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Message Composer */}
      <div className="shrink-0 pt-2 border-t border-white/10">
        <ChatComposer onSendMessage={handleSendMessage} isSending={isSending} />
      </div>
    </Card>
  );
}
