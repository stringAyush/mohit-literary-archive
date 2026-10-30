"use client";

import * as React from "react";
import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/ui/icons";

export function CopyQuoteButton({
  text,
  author,
  title,
  className = "",
}: {
  text: string;
  author?: string;
  title?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const attribution = author ? `\n\n— ${author}${title ? ` (${title})` : ""}` : "";
      await navigator.clipboard.writeText(`“${text.trim()}”${attribution}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`group/copy relative inline-flex items-center gap-1.5 rounded-lg border border-line/80 bg-surface/60 px-2.5 py-1 text-xs font-sans font-medium text-muted transition-all hover:border-accent hover:text-ink hover:bg-surface active:scale-95 ${className}`}
      title="Copy passage with citation"
      aria-label={copied ? "Passage copied to clipboard" : "Copy passage to clipboard"}
    >
      {copied ? (
        <>
          <CheckIcon className="h-3.5 w-3.5 text-accent animate-pulse" />
          <span className="text-accent font-semibold">Copied!</span>
        </>
      ) : (
        <>
          <CopyIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover/copy:scale-110" />
          <span>Copy passage</span>
        </>
      )}
    </button>
  );
}

export default CopyQuoteButton;
