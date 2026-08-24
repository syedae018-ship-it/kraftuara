import React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-[#111111]">
      <table className={cn("w-full text-left border-collapse text-sm", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn("bg-[#151515] border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-zinc-400 font-heading", className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("divide-y divide-white/5 font-body text-zinc-300", className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("hover:bg-white/[0.02] transition-colors group", className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn("px-4 py-3.5 font-medium select-none text-zinc-400", className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn("px-4 py-3.5 font-normal align-middle text-zinc-300 text-left", className)} {...props}>
      {children}
    </th>
  );
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "maroon" | "outline";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-zinc-800/60 text-zinc-300 border-zinc-700/50",
    success: "bg-emerald-950/50 text-emerald-300 border-emerald-800/40",
    warning: "bg-amber-950/50 text-amber-300 border-amber-800/40",
    error: "bg-red-950/50 text-red-300 border-red-800/40",
    maroon: "bg-maroon-950/70 text-maroon-300 border-maroon-800/50",
    outline: "bg-transparent text-zinc-400 border-white/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-body border",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
