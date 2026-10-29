import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, containerClassName, children, ...props }, ref) => {
    return (
      <div className={cn("relative min-w-0 space-y-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={id}
            className="block font-sans text-[0.6875rem] font-semibold tracking-[0.12em] uppercase text-muted"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={id}
            ref={ref}
            className={cn(
              "w-full appearance-none rounded-xl border border-line/80 bg-surface/90 px-3.5 py-2.5 pr-9 font-sans text-sm text-ink shadow-xs backdrop-blur-xs transition-all duration-150",
              "hover:border-ink/40 hover:bg-surface",
              "focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-transform duration-150"
            aria-hidden="true"
          />
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";
