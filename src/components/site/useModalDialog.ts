"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Opens a native <dialog> as a modal. The browser then handles focus, Escape and
 * makes the rest of the page inert; this hook also stops the page behind from scrolling
 * and closes the dialog when the backdrop is clicked.
 */
export function useModalDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    document.documentElement.style.overflow = "hidden";
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    ref.current?.close();
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => {
      document.documentElement.style.overflow = "";
      setIsOpen(false);
    };
    const handleClick = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };
    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("click", handleClick);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("click", handleClick);
      document.documentElement.style.overflow = "";
    };
  }, []);

  return { ref, isOpen, open, close };
}
