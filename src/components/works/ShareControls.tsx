"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / insecure contexts: fall back to a hidden textarea.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  }
}

export function ShareControls({
  url,
  copyText,
  shareTitle,
  artworkHref,
}: {
  url: string;
  copyText: string;
  shareTitle: string;
  artworkHref: string;
}) {
  const [canShare, setCanShare] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function copy(text: string, done: string) {
    setMessage((await copyToClipboard(text)) ? done : "Copying is not available in this browser");
  }

  async function share() {
    try {
      await navigator.share({ title: shareTitle, url });
    } catch (error) {
      // Cancelling the share sheet is not an error worth reporting.
      if ((error as Error).name !== "AbortError") await copy(url, "Link copied");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-quiet" onClick={() => copy(copyText, "Copied")}>
          Copy text
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => copy(url, "Link copied")}>
          Copy link
        </button>
        {canShare && (
          <button type="button" className="btn btn-quiet" onClick={share}>
            Share
          </button>
        )}
        <Link href={artworkHref} className="btn btn-quiet">
          Download artwork
        </Link>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 font-sans text-sm text-accent">
        {message}
      </p>
    </div>
  );
}
