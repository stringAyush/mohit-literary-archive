import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantStyles = {
      default: "bg-accent text-white shadow-xs hover:bg-accent-hover hover:shadow-sm",
      secondary: "bg-ink text-paper shadow-xs hover:bg-ink/90",
      outline: "border border-line/80 bg-surface/80 text-ink shadow-xs backdrop-blur-sm hover:bg-surface hover:border-ink/50",
      ghost: "text-ink hover:bg-ink/5 hover:text-ink",
      link: "text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent-hover hover:decoration-accent",
    };

    const sizeStyles = {
      default: "min-h-10 px-4 py-2 text-sm",
      sm: "min-h-8 px-3 py-1.5 text-xs rounded-lg",
      lg: "min-h-12 px-6 py-3 text-base rounded-2xl",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-sans font-medium tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
