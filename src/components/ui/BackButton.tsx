"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type BackButtonProps = {
  fallbackHref?: string;
  label?: string;
  className?: string;
};

export function BackButton({
  fallbackHref = "/",
  label = "Back",
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`group inline-flex items-center gap-1.5 rounded-full border border-line/80 bg-surface/80 px-3.5 py-1.5 font-sans text-xs font-medium text-ink shadow-xs backdrop-blur-md transition-all hover:bg-surface hover:text-accent hover:border-accent/40 hover:-translate-x-0.5 active:translate-x-0 cursor-pointer ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
      <span>{label}</span>
    </button>
  );
}

export default BackButton;
