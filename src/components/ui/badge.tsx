import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "accent" | "muted";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-surface-2 text-ink border-line/80",
    secondary: "bg-paper text-muted border-line/60",
    outline: "bg-transparent text-ink border-line/80",
    accent: "bg-accent/10 text-accent border-accent/25 font-medium",
    muted: "bg-ink/5 text-muted border-transparent",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 text-[0.6875rem] font-sans font-medium tracking-[0.06em] uppercase rounded-full border transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
