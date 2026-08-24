"use client";

import React from "react";
import { CreativeMessage } from "@/types/creative-mvp";
import { formatRelativeTime } from "@/lib/utils";
import { Sparkles, Paperclip, CheckCircle2, User, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatBubbleProps {
  message: CreativeMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isSystem = message.senderRole === "system" || message.type === "system";
  const isCustomer = message.senderRole === "customer";

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-zinc-400 font-mono">
          <Sparkles className="w-3 h-3 text-maroon-400 shrink-0" />
          <span>{message.content}</span>
          <span className="text-[10px] text-zinc-600 ml-1">{formatRelativeTime(message.createdAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3 my-3 max-w-[85%]", isCustomer ? "ml-auto flex-row-reverse" : "mr-auto flex-row")}>
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-maroon-800 to-maroon-950 border border-maroon-600/40 flex items-center justify-center text-white text-xs font-bold font-heading shrink-0 overflow-hidden mt-0.5">
        {message.senderAvatar ? (
          <img src={message.senderAvatar} alt={message.senderName} className="w-full h-full object-cover" />
        ) : isCustomer ? (
          <User className="w-3.5 h-3.5 text-zinc-300" />
        ) : (
          <UserCheck className="w-3.5 h-3.5 text-maroon-300" />
        )}
      </div>

      {/* Bubble Content */}
      <div className={cn("space-y-1 font-body text-xs", isCustomer && "items-end text-right")}>
        <div className="flex items-center gap-2 px-1">
          <span className="font-semibold font-heading text-white text-[11px]">{message.senderName}</span>
          <span className="text-[10px] text-zinc-500 font-mono">{formatRelativeTime(message.createdAt)}</span>
        </div>

        <div
          className={cn(
            "p-3 rounded-2xl leading-relaxed text-zinc-200 border",
            isCustomer
              ? "bg-maroon-950/80 border-maroon-700/50 text-white shadow-glow rounded-tr-xs"
              : "bg-[#151515] border-white/10 rounded-tl-xs"
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>

          {/* File Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
              {message.attachments.map((att, i) => (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-1.5 rounded-lg bg-black/40 text-[11px] text-maroon-300 hover:text-white font-mono truncate"
                >
                  <Paperclip className="w-3 h-3 shrink-0" /> {att.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
