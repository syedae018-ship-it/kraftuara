import React from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  fullPage?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred while loading this section. Please try again or contact support if the issue persists.",
  onRetry,
  fullPage = false,
  className,
}: ErrorStateProps) {
  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 bg-red-950/20 border border-maroon-600/30 rounded-2xl max-w-lg mx-auto",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-maroon-900/40 border border-maroon-600/40 flex items-center justify-center mb-4 text-maroon-400">
        <AlertOctagon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold font-heading text-white tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-zinc-400 font-body mt-1.5 max-w-md leading-relaxed">
        {description}
      </p>
      {onRetry && (
        <Button
          variant="primary"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="mt-6"
        >
          Try Again
        </Button>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        {content}
      </div>
    );
  }

  return content;
}
