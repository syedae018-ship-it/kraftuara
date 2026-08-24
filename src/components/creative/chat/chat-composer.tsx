"use client";

import React, { useState } from "react";
import { Send, Paperclip, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChatComposerProps {
  onSendMessage: (content: string, attachments?: any[]) => void;
  isSending?: boolean;
  className?: string;
}

export function ChatComposer({ onSendMessage, isSending = false, className }: ChatComposerProps) {
  const [content, setContent] = useState("");

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim()) return;

    onSendMessage(content.trim());
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <form onSubmit={handleSend} className={cn("bg-[#111111] border border-white/10 rounded-2xl p-2 font-body", className)}>
      <textarea
        rows={2}
        placeholder="Type a message to designer... (Press Enter to send)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent p-2 text-xs text-white placeholder:text-zinc-500 outline-none resize-none"
      />

      <div className="flex items-center justify-between pt-1 px-2 border-t border-white/5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Attach image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!content.trim() || isSending}
          isLoading={isSending}
          leftIcon={<Send className="w-3.5 h-3.5" />}
        >
          Send
        </Button>
      </div>
    </form>
  );
}
