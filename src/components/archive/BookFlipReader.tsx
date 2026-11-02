"use client";

import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Maximize2,
  RotateCcw,
  X,
} from "lucide-react";
import type { FlipBookPiece } from "@/lib/works/queries";
import { contentTypeLabel } from "@/lib/constants";
import type { ContentType } from "@prisma/client";

interface FlipBookInstance {
  pageFlip: () => {
    flipNext: (corner?: string) => void;
    flipPrev: (corner?: string) => void;
    flip: (pageNum: number, corner?: string) => void;
    turnToNextPage?: () => void;
    turnToPrevPage?: () => void;
    turnToPage?: (pageNum: number) => void;
    getPageCount: () => number;
    getCurrentPageIndex: () => number;
    getState?: () => string;
  };
}

// Dynamically import HTMLFlipBook so it only runs in the client browser
const HTMLFlipBook = dynamic(() => import("react-pageflip"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[460px] w-full items-center justify-center p-12 text-center bg-transparent">
      <div className="space-y-4">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        <p className="font-editorial text-xl italic text-ink/80 dark:text-amber-100/90">Binding the folio pages…</p>
        <p className="font-sans text-xs text-muted dark:text-amber-200/60">Preparing poems and stories for book view</p>
      </div>
    </div>
  ),
}) as unknown as React.ComponentType<Record<string, unknown>>;

type PaperTheme = "parchment" | "ivory";
type BookTheme = "parchment" | "ivory" | "night";

type PageProps = {
  children: React.ReactNode;
  className?: string;
  isHard?: boolean;
};

// ForwardRef wrapper required by react-pageflip for DOM manipulation
const Page = forwardRef<HTMLDivElement, PageProps>(({ children, className = "", isHard = false }, ref) => {
  return (
    <div
      ref={ref}
      data-density={isHard ? "hard" : "soft"}
      className={`page-sheet relative h-full w-full select-none ${className}`}
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      {children}
    </div>
  );
});
Page.displayName = "Page";

export function BookFlipReader({
  works,
  onSwitchToNormalView,
}: {
  works: FlipBookPiece[];
  initialFullscreen?: boolean;
  onSwitchToNormalView?: () => void;
}) {
  const bookRef = useRef<FlipBookInstance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [bookSpreadState, setBookSpreadState] = useState<"front" | "spread" | "back">("front");
  const [bookTheme, setBookTheme] = useState<BookTheme>("parchment");
  const [isSiteDark, setIsSiteDark] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showContentsDrawer, setShowContentsDrawer] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const lastLightPaperRef = useRef<PaperTheme>("parchment");
  const previousDarkRef = useRef<boolean | null>(null);

  // Exact dimensions calculated to fit screen perfectly on both PC and mobile
  const [dimensions, setDimensions] = useState(() => {
    if (typeof window !== "undefined") {
      const w = window.innerWidth;
      const mobile = w < 768;
      if (mobile) {
        const maxAvailW = Math.max(w - 32, 260);
        const pWidth = Math.min(maxAvailW, 360);
        const pHeight = Math.min(Math.round(pWidth * 1.45), 520);
        return { pageWidth: pWidth, pageHeight: pHeight, isMobile: true };
      } else {
        const pWidth = Math.min(Math.floor((Math.min(w, 1080) - 100) / 2), 430);
        const pHeight = Math.round(pWidth * 1.36);
        return { pageWidth: pWidth, pageHeight: pHeight, isMobile: false };
      }
    }
    return { pageWidth: 420, pageHeight: 580, isMobile: false };
  });

  // Track site-wide dark mode automatically via MutationObserver and sync book theme
  useEffect(() => {
    setIsMounted(true);

    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsSiteDark(isDark);

      if (previousDarkRef.current !== null && previousDarkRef.current !== isDark) {
        // Site theme was toggled
        if (isDark) {
          setBookTheme("night");
        } else {
          setBookTheme(lastLightPaperRef.current);
        }
      } else if (previousDarkRef.current === null) {
        // First mount initialization
        if (isDark) {
          setBookTheme("night");
        }
      }
      previousDarkRef.current = isDark;
    };
    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Compute exact fit-to-screen dimensions on mount, resize, and fullscreen toggle
  useEffect(() => {
    const calculateDimensions = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w < 768;

      if (isFullscreen) {
        // ── Fullscreen Fit-to-Screen ──
        if (mobile) {
          // Mobile Portrait: single page fits screen with edge padding
          const availW = w - 24;
          const availH = h - 64;
          let pWidth = Math.min(availW, 380);
          let pHeight = Math.min(availH, Math.round(pWidth * 1.45));
          if (pHeight > availH) {
            pHeight = availH;
            pWidth = Math.round(pHeight / 1.45);
          }
          setDimensions({ pageWidth: pWidth, pageHeight: pHeight, isMobile: true });
        } else {
          // PC / Laptop / Tablet: 2-page spread fits available screen height & width
          const availW = w - 80;
          const availH = h - 70;
          const maxPageW = Math.floor(availW / 2);
          let pHeight = Math.min(availH, 740);
          let pWidth = Math.round(pHeight / 1.36);

          if (pWidth * 2 > availW) {
            pWidth = maxPageW;
            pHeight = Math.round(pWidth * 1.36);
          }
          setDimensions({ pageWidth: pWidth, pageHeight: pHeight, isMobile: false });
        }
      } else {
        // ── Normal In-Page Mode ──
        if (mobile) {
          const maxAvailW = Math.max(w - 32, 260);
          let pWidth = Math.min(maxAvailW, 360);
          let pHeight = Math.min(Math.round(pWidth * 1.45), 520);
          if (h > 400 && pHeight > h - 180) {
            pHeight = h - 180;
            pWidth = Math.min(pWidth, Math.round(pHeight / 1.45));
          }
          setDimensions({ pageWidth: pWidth, pageHeight: pHeight, isMobile: true });
        } else {
          // PC / Laptop / Tablet: 2-page spread fits available screen width and height
          const availW = Math.min(w, 1140) - (w < 1024 ? 48 : 96);
          const maxPageW = Math.floor(availW / 2);
          let pWidth = Math.min(maxPageW, 430);
          let pHeight = Math.round(pWidth * 1.36);

          if (h > 450 && pHeight > h - 160) {
            pHeight = h - 160;
            pWidth = Math.round(pHeight / 1.36);
          }

          setDimensions({ pageWidth: pWidth, pageHeight: pHeight, isMobile: false });
        }
      }
    };

    calculateDimensions();

    let lastW = window.innerWidth;
    let lastH = window.innerHeight;

    const handleResize = () => {
      // Debounce micro-height shifts on mobile while capturing actual orientation or fullscreen changes
      if (Math.abs(window.innerWidth - lastW) > 30 || Math.abs(window.innerHeight - lastH) > 60) {
        lastW = window.innerWidth;
        lastH = window.innerHeight;
        calculateDimensions();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isFullscreen]);

  const lastFlipTimeRef = useRef(0);
  const lastTouchTimeRef = useRef(0);

  // Helper to split works into pages cleanly without any cutoff or scrollbars
  type BookPageItem = {
    work: FlipBookPiece;
    partIndex: number;
    totalParts: number;
    text: string;
    pageNumber: number;
    isRightPage: boolean;
  };

  const formattedPages = useMemo(() => {
    const pages: BookPageItem[] = [];
    let pageCounter = 3;

    works.forEach((w) => {
      const rawBody = w.body.trim();
      const isPoem = w.contentType === "POEM";

      if (isPoem) {
        const lines = rawBody.split("\n");
        const maxLinesPerPage = 12;

        if (lines.length > maxLinesPerPage) {
          const chunks: string[] = [];
          for (let i = 0; i < lines.length; i += maxLinesPerPage) {
            chunks.push(lines.slice(i, i + maxLinesPerPage).join("\n").trim());
          }
          chunks.forEach((chunk, idx) => {
            pages.push({
              work: w,
              partIndex: idx + 1,
              totalParts: chunks.length,
              text: chunk,
              pageNumber: pageCounter,
              isRightPage: pageCounter % 2 === 0,
            });
            pageCounter++;
          });
        } else {
          pages.push({
            work: w,
            partIndex: 1,
            totalParts: 1,
            text: rawBody,
            pageNumber: pageCounter,
            isRightPage: pageCounter % 2 === 0,
          });
          pageCounter++;
        }
      } else {
        const maxChars = 500;
        if (rawBody.length > maxChars) {
          const chunks: string[] = [];
          let remaining = rawBody;

          while (remaining.length > 0) {
            if (remaining.length <= maxChars) {
              chunks.push(remaining.trim());
              break;
            }
            const sliceCandidate = remaining.slice(0, maxChars);
            let splitIdx = sliceCandidate.lastIndexOf("\n\n");
            if (splitIdx === -1 || splitIdx < 200) {
              splitIdx = sliceCandidate.lastIndexOf(". ");
            }
            if (splitIdx === -1 || splitIdx < 200) {
              splitIdx = sliceCandidate.lastIndexOf(" ");
            }
            if (splitIdx === -1) {
              splitIdx = maxChars;
            } else {
              splitIdx += 1;
            }

            chunks.push(remaining.slice(0, splitIdx).trim());
            remaining = remaining.slice(splitIdx).trim();
          }

          chunks.forEach((chunk, idx) => {
            pages.push({
              work: w,
              partIndex: idx + 1,
              totalParts: chunks.length,
              text: chunk,
              pageNumber: pageCounter,
              isRightPage: pageCounter % 2 === 0,
            });
            pageCounter++;
          });
        } else {
          pages.push({
            work: w,
            partIndex: 1,
            totalParts: 1,
            text: rawBody,
            pageNumber: pageCounter,
            isRightPage: pageCounter % 2 === 0,
          });
          pageCounter++;
        }
      }
    });

    return pages;
  }, [works]);

  const isColophonOdd = (formattedPages.length + 3) % 2 !== 0;
  const colophonPageNum = formattedPages.length + 3;
  const sealPageNum = isColophonOdd ? colophonPageNum + 1 : null;
  const backCoverPageNum = isColophonOdd ? colophonPageNum + 2 : colophonPageNum + 1;
  const currentWork = useMemo(() => {
    if (currentPage === 0) return { title: "Front Cover", type: "Cover" };
    if (currentPage === 1) return { title: "Title & Dedication", type: "Dedication" };
    if (currentPage === 2) return { title: "Table of Contents", type: "Index" };
    if (currentPage >= backCoverPageNum) return { title: "Back Cover", type: "Cover" };
    if (sealPageNum !== null && currentPage === sealPageNum) return { title: "Archival Seal", type: "Endpaper" };
    if (currentPage === colophonPageNum) return { title: "Folio Colophon", type: "Colophon" };
    const pageItem = formattedPages.find((p) => p.pageNumber === currentPage);
    if (pageItem) {
      return {
        title: pageItem.work.title || pageItem.text.slice(0, 32),
        type: contentTypeLabel(pageItem.work.contentType as ContentType),
      };
    }
    return { title: `Page ${currentPage}`, type: "Folio" };
  }, [currentPage, formattedPages, colophonPageNum, sealPageNum, backCoverPageNum]);

  const openBook = useCallback(() => {
    try {
      const pf = bookRef.current?.pageFlip();
      if (!pf) return;
      const state = pf.getState?.();
      if (state && state !== "read") return;
      const now = Date.now();
      if (now - lastFlipTimeRef.current < 750) return;
      lastFlipTimeRef.current = now;

      setBookSpreadState("spread");

      if (pf.flipNext) {
        pf.flipNext("bottom");
      } else if (pf.flip) {
        pf.flip(1, "bottom");
      } else if (pf.turnToPage) {
        pf.turnToPage(1);
      }
    } catch {
      // fallback
    }
  }, []);

  const closeToCover = useCallback(() => {
    try {
      const pf = bookRef.current?.pageFlip();
      if (!pf) return;
      const state = pf.getState?.();
      if (state && state !== "read") return;
      const now = Date.now();
      if (now - lastFlipTimeRef.current < 750) return;
      lastFlipTimeRef.current = now;

      setBookSpreadState("front");

      if (pf.flip) {
        pf.flip(0, "bottom");
      } else if (pf.flipPrev) {
        pf.flipPrev("bottom");
      } else if (pf.turnToPage) {
        pf.turnToPage(0);
      }
    } catch {
      // fallback
    }
  }, []);

  const flipNext = useCallback(() => {
    try {
      const pf = bookRef.current?.pageFlip();
      if (!pf) return;
      const state = pf.getState?.();
      if (state && state !== "read") return;
      const now = Date.now();
      const minInterval = dimensions.isMobile ? 380 : 700;
      if (now - lastFlipTimeRef.current < minInterval) return;
      lastFlipTimeRef.current = now;

      if (currentPage === 0) {
        openBook();
        return;
      }
      if (!dimensions.isMobile && currentPage >= colophonPageNum) {
        setBookSpreadState("back");
        if (pf.turnToPage) {
          pf.turnToPage(backCoverPageNum);
        } else {
          pf.flip(backCoverPageNum, "bottom");
        }
        setCurrentPage(backCoverPageNum);
        return;
      }

      setBookSpreadState("spread");
      if (pf.flipNext) {
        pf.flipNext("bottom");
      } else if (pf.turnToNextPage) {
        pf.turnToNextPage();
      }
    } catch {
      // fallback
    }
  }, [dimensions.isMobile, currentPage, openBook, colophonPageNum, backCoverPageNum]);

  const flipPrev = useCallback(() => {
    try {
      const pf = bookRef.current?.pageFlip();
      if (!pf) return;
      const state = pf.getState?.();
      if (state && state !== "read") return;
      const now = Date.now();
      const minInterval = dimensions.isMobile ? 380 : 700;
      if (now - lastFlipTimeRef.current < minInterval) return;
      lastFlipTimeRef.current = now;

      if (currentPage <= (dimensions.isMobile ? 1 : 2)) {
        closeToCover();
        return;
      }
      if (!dimensions.isMobile && currentPage >= backCoverPageNum) {
        setBookSpreadState("spread");
        if (pf.turnToPage) {
          pf.turnToPage(colophonPageNum);
        } else {
          pf.flip(colophonPageNum, "bottom");
        }
        setCurrentPage(colophonPageNum);
        return;
      }

      setBookSpreadState("spread");
      pf.flipPrev();
    } catch {
      // fallback
    }
  }, [dimensions.isMobile, currentPage, closeToCover, colophonPageNum, backCoverPageNum]);

  // Dedicated touch and click handlers to guarantee instant response on mobile devices
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleStageTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  }, []);

  const handleStageTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const start = touchStartRef.current;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const dt = Date.now() - start.time;
    touchStartRef.current = null;
    lastTouchTimeRef.current = Date.now();

    const target = e.target as HTMLElement | null;
    if (target && target.closest("a, button, input")) return;

    // Horizontal swipe gesture (> 25px in < 500ms)
    if (Math.abs(dx) > 25 && Math.abs(dy) < Math.abs(dx) * 1.5 && dt < 500) {
      if (dx < 0) {
        flipNext();
      } else {
        flipPrev();
      }
      return;
    }

    // Direct tap / click gesture (< 15px movement in < 350ms)
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 350) {
      if (currentPage === 0) {
        openBook();
        return;
      }
      if (currentPage >= backCoverPageNum) {
        try {
          const pf = bookRef.current?.pageFlip();
          if (pf?.turnToPage) {
            pf.turnToPage(colophonPageNum);
          } else {
            pf?.flipPrev();
          }
          setCurrentPage(colophonPageNum);
        } catch {}
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = touch.clientX - rect.left;
      if (clickX > rect.width * 0.45) {
        flipNext();
      } else {
        flipPrev();
      }
    }
  }, [currentPage, backCoverPageNum, colophonPageNum, openBook, flipNext, flipPrev]);

  const handleStageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent synthetic mouse clicks after touch events
    if (Date.now() - lastTouchTimeRef.current < 500) return;

    const target = e.target as HTMLElement | null;
    if (target && target.closest("a, button, input")) return;

    const now = Date.now();
    if (now - lastFlipTimeRef.current < 700) return;

    const pf = bookRef.current?.pageFlip();
    const state = pf?.getState?.();
    if (state && state !== "read") return;

    if (currentPage === 0) {
      openBook();
      return;
    }
    if (currentPage >= backCoverPageNum) {
      try {
        if (pf?.turnToPage) {
          pf.turnToPage(colophonPageNum);
        } else {
          pf?.flipPrev();
        }
        setCurrentPage(colophonPageNum);
      } catch {}
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX > rect.width * 0.45) {
      flipNext();
    } else {
      flipPrev();
    }
  }, [currentPage, backCoverPageNum, colophonPageNum, openBook, flipNext, flipPrev]);

  const jumpToPage = useCallback((pageNum: number) => {
    try {
      const pf = bookRef.current?.pageFlip();
      if (!pf) return;
      lastFlipTimeRef.current = Date.now();

      if (pageNum === 0) {
        setBookSpreadState("front");
      } else if (pageNum >= backCoverPageNum) {
        setBookSpreadState("back");
      } else {
        setBookSpreadState("spread");
      }

      if (pf.flip) {
        pf.flip(pageNum, "bottom");
      } else if (pf.turnToPage) {
        pf.turnToPage(pageNum);
      }
      setCurrentPage(pageNum);
    } catch {
      // fallback
    }
  }, [backCoverPageNum]);

  const handleScrubPage = useCallback((pageNum: number) => {
    try {
      const pf = bookRef.current?.pageFlip();
      if (!pf) return;
      lastFlipTimeRef.current = Date.now();

      if (pageNum === 0) {
        setBookSpreadState("front");
      } else if (pageNum >= backCoverPageNum) {
        setBookSpreadState("back");
      } else {
        setBookSpreadState("spread");
      }

      if (pf.turnToPage) {
        pf.turnToPage(pageNum);
      } else if (pf.flip) {
        pf.flip(pageNum);
      }
      setCurrentPage(pageNum);
    } catch {
      // fallback
    }
  }, [backCoverPageNum]);



  const enterFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
        setIsFullscreen(true);
      });
    } else {
      setIsFullscreen(true);
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    setShowContentsDrawer(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {
        setIsFullscreen(false);
      });
    } else {
      setIsFullscreen(false);
    }
  }, []);

  // Close drawer on click outside or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest?.("[data-drawer-trigger]")) return;
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setShowContentsDrawer(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowContentsDrawer(false);
        if (isFullscreen) {
          exitFullscreen();
        }
      } else {
        const activeTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (activeTag === "input" || activeTag === "textarea") return;

        if (e.key === "ArrowRight" || e.key === "PageDown") {
          e.preventDefault();
          flipNext();
        } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
          e.preventDefault();
          flipPrev();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen, exitFullscreen, flipNext, flipPrev]);

  useEffect(() => {
    const onFsChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      if (!isFs) {
        setShowContentsDrawer(false);
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Theme selection handler
  const handleSelectTheme = (theme: BookTheme) => {
    if (theme === "parchment" || theme === "ivory") {
      lastLightPaperRef.current = theme;
    }
    setBookTheme(theme);
  };

  // Memoize all page elements to prevent react-pageflip from destroying and reloading HTML on re-renders
  const pageElements = useMemo(() => {
    return [
      /* ════ PAGE 0: HARDCOVER FRONT ════ */
      <Page
        key="page-cover-front"
        isHard={!dimensions.isMobile}
        className="book-cover-sheet !p-0 border-r-2 overflow-hidden"
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            openBook();
          }}
          className="group relative h-full w-full cursor-pointer overflow-hidden select-none"
          title="Click to Open Folio"
        >
          <Image
            src="/art/book_cover.webp"
            alt="Mohit Yenugwar - A Digital Folio Book Cover"
            fill
            sizes="(max-width: 768px) 380px, 600px"
            className="object-cover object-center transform group-hover:scale-[1.01] transition-transform duration-500 ease-out"
            priority
          />

          {/* Left spine shadow & crease inside reader */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/50 via-black/15 to-transparent z-10" />

          {/* Subtle perimeter binding border */}
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/25 z-10" />

          {/* Interactive hover gloss sheen */}
          <div className="pointer-events-none absolute inset-0 bg-white/0 group-hover:bg-white/[0.04] transition-colors duration-300 z-10" />
        </div>
      </Page>,

      /* ════ PAGE 1: TITLE & DEDICATION PAGE ════ */
      <Page
        key="page-title-dedication"
        isHard={!dimensions.isMobile}
        className="book-page-sheet book-spine-left p-6 sm:p-9 flex flex-col justify-between border-r hairline"
      >
        <div className="text-center pt-6">
          <span className="eyebrow text-[0.6875rem] book-page-subtle">Literary Archive</span>
          <h2 className="mt-4 font-display text-xl sm:text-2xl text-ink font-normal">
            Some things are better left in words.
          </h2>
          <p className="mt-2 font-editorial text-sm italic book-page-subtle">
            Written &amp; Composed by Mohit Yenugwar
          </p>
        </div>

        <div className="my-auto max-w-[280px] mx-auto text-center border-y hairline py-5 my-6 book-page-rule border-line/60">
          <p className="font-editorial text-xs sm:text-sm leading-relaxed italic text-ink/85">
            &ldquo;A gathering of thoughts, verse, and narrative fragments composed in quiet hours, under natural light and open skies.&rdquo;
          </p>
        </div>

        <div className="border-t hairline pt-3 flex items-center justify-between font-sans text-[10px] book-page-subtle book-page-rule">
          <span>The Literary Archive</span>
          <span>Page 1</span>
        </div>
      </Page>,

      /* ════ PAGE 2: TABLE OF CONTENTS (INDEX) ════ */
      <Page
        key="page-table-of-contents"
        className="book-page-sheet book-spine-right p-6 sm:p-9 flex flex-col justify-between border-l hairline"
      >
        <div className="border-b hairline pb-2.5 mb-3 flex items-center justify-between book-page-rule">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-ink">
            Table of Contents
          </h3>
          <span className="font-sans text-[10px] book-page-subtle uppercase">Index</span>
        </div>

        <div className="overflow-hidden flex-1 space-y-1.5 text-xs py-1">
          {formattedPages.slice(0, dimensions.isMobile ? 8 : 14).map((fp, idx) => (
            <button
              key={`${fp.work.id}-${fp.partIndex}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                jumpToPage(fp.pageNumber);
              }}
              className="group flex w-full items-center justify-between py-1 text-left transition-colors hover:text-accent cursor-pointer rounded-xs px-1 -mx-1 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="font-sans text-[10px] tabular-nums book-page-subtle group-hover:text-accent">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="font-editorial text-xs sm:text-sm truncate font-medium text-ink group-hover:text-accent">
                  {fp.work.title || fp.text.slice(0, 28)}
                </span>
              </div>
              <span className="font-sans text-[10px] tabular-nums book-page-subtle shrink-0 ml-2">
                p. {fp.pageNumber}
              </span>
            </button>
          ))}
        </div>

        <div className="border-t hairline pt-3 mt-auto flex items-center justify-between font-sans text-[10px] book-page-subtle book-page-rule">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              flipNext();
            }}
            className="group/btn flex items-center gap-1.5 hover:text-accent cursor-pointer transition-colors font-medium text-ink/80"
            title="Turn to Page 3"
          >
            <span>Begin Reading</span>
            <ChevronRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
          <span>Page 2</span>
        </div>
      </Page>,

      /* ════ LITERARY PIECES PAGES (3..N) ════ */
      ...formattedPages.map((fp) => {
        const isPoem = fp.work.contentType === "POEM";
        const isRight = fp.isRightPage;
        const spineClass = isRight ? "book-spine-right" : "book-spine-left";
        const borderStyle = isRight ? "border-l hairline" : "border-r hairline";

        return (
          <Page
            key={`page-${fp.pageNumber}-${fp.work.id}-${fp.partIndex}`}
            className={`book-page-sheet ${spineClass} p-6 sm:p-9 flex flex-col justify-between ${borderStyle}`}
          >
            {/* Top Running Header */}
            <div
              className="flex h-7 items-center justify-between border-b book-page-rule pb-1.5 font-sans text-[9px] sm:text-[10px] uppercase tracking-[0.16em] book-page-subtle"
            >
              <span>{contentTypeLabel(fp.work.contentType as ContentType)}</span>
              <span className="truncate max-w-[140px] italic font-editorial lowercase">
                {fp.work.language === "hi" ? "हिंदी (hindi)" : "english"}
              </span>
            </div>

            {/* Piece Content Area */}
            <div className="flex-1 flex flex-col justify-start my-auto py-2.5 overflow-hidden">
              {fp.partIndex === 1 && fp.work.title && (
                <h4 className="mb-3 font-display text-lg sm:text-xl font-normal text-ink leading-tight">
                  {fp.work.title}
                </h4>
              )}

              {fp.partIndex > 1 && (
                <p className="mb-2 font-sans text-[9px] uppercase tracking-wider book-page-subtle">
                  (Continued)
                </p>
              )}

              <div
                className={`font-editorial text-[13.5px] sm:text-[14.5px] leading-[1.65] text-ink/90 ${
                  isPoem
                    ? "whitespace-pre-wrap pl-3 border-l border-accent/40"
                    : "whitespace-pre-wrap text-justify"
                }`}
                style={{
                  fontFamily:
                    fp.work.language === "hi"
                      ? "var(--font-devanagari), var(--font-editorial), serif"
                      : "var(--font-editorial), Georgia, serif",
                }}
              >
                {fp.text}
              </div>

              {fp.partIndex < fp.totalParts && (
                <p className="mt-2 font-sans text-[9px] italic book-page-subtle text-right">
                  (Continued on next page)
                </p>
              )}
            </div>

            {/* Bottom Running Footer */}
            <div
              className="h-7 border-t book-page-rule pt-1.5 flex items-center justify-between font-sans text-[9px] sm:text-[10px] book-page-subtle"
            >
              <Link
                href={`/works/${fp.work.slug}`}
                className="hover:text-accent truncate max-w-[170px] no-underline"
                title="Open full piece in standalone view"
              >
                {fp.work.title || "Open piece"}
              </Link>
              <span className="tabular-nums font-mono">
                — {fp.pageNumber} —
              </span>
            </div>
          </Page>
        );
      }),

      /* ════ COLOPHON PAGE ════ */
      <Page
        key="page-colophon"
        className={`book-page-sheet ${colophonPageNum % 2 === 0 ? "book-spine-right border-l hairline" : "book-spine-left border-r hairline"} p-6 sm:p-9 flex flex-col justify-between`}
      >
        <div className="text-center pt-6">
          <span className="eyebrow text-[0.6875rem] book-page-subtle">Folio Colophon</span>
          <div className="mx-auto my-3 h-px w-12 bg-line book-page-rule" />
        </div>

        <div className="my-auto max-w-[280px] mx-auto text-center space-y-3 font-editorial text-xs sm:text-sm text-ink/80 leading-relaxed">
          <p>
            This digital folio was composed and published from the personal literary archive of Mohit Yenugwar.
          </p>
          <p className="text-[11px] book-page-subtle font-sans">
            Typeset digitally in Cormorant Garamond, Instrument Serif, and Devanagari typography with lineated preservation.
          </p>
          <div className="text-sm text-accent">❦</div>
        </div>

        <div className="border-t hairline pt-3 flex items-center justify-between font-sans text-[10px] book-page-subtle book-page-rule">
          <span>Mohit Yenugwar Archive</span>
          <span>Page {colophonPageNum}</span>
        </div>
      </Page>,

      /* ════ ARCHIVAL FOLIO SEAL & ENDPAPER (Facing Colophon when needed for spread balance) ════ */
      ...(sealPageNum !== null
        ? [
            <Page
              key="page-archival-seal"
              className="book-page-sheet book-spine-right p-6 sm:p-9 flex flex-col justify-between border-l hairline"
            >
              <div className="border-b hairline pb-2.5 mb-3 flex items-center justify-between book-page-rule">
                <span className="font-sans text-[10px] book-page-subtle uppercase tracking-[0.2em]">
                  Literary Folio
                </span>
                <span className="font-sans text-[10px] book-page-subtle uppercase">Archive</span>
              </div>

              <div className="my-auto max-w-[280px] mx-auto text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-accent/5">
                  <span className="font-editorial text-2xl text-accent">✦</span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-display text-lg text-ink font-normal">
                    End of Volume I
                  </h4>
                  <p className="font-editorial text-xs italic text-ink/70">
                    Mohit Yenugwar · Literary Archive
                  </p>
                </div>
                <div className="mx-auto h-px w-12 bg-line book-page-rule" />
                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-muted">
                  Nagpur · MMXXVI
                </p>
              </div>

              <div className="border-t hairline pt-3 flex items-center justify-between font-sans text-[10px] book-page-subtle book-page-rule">
                <span>The Literary Archive</span>
                <span>Page {sealPageNum}</span>
              </div>
            </Page>,
          ]
        : []),

      /* ════ HARDCOVER BACK ════ */
      <Page
        key="page-cover-back"
        isHard={!dimensions.isMobile}
        className="book-cover-sheet p-5 sm:p-7 flex flex-col justify-between border-l-2"
      >
        <div className="relative h-full w-full rounded-xs border border-amber-400/30 p-5 sm:p-7 flex flex-col justify-between text-center">
          <span className="text-amber-300 text-xs">✦</span>

          <div className="my-auto space-y-4">
            {/* Circular Antique Medallion */}
            <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/10 shadow-[0_0_20px_rgba(217,119,6,0.2)] ring-1 ring-amber-300/30">
              <span className="font-editorial text-xl sm:text-2xl text-amber-200">❦</span>
            </div>

            <div className="space-y-2">
              <p className="font-editorial text-base sm:text-lg italic text-amber-100/90 leading-snug max-w-[260px] mx-auto">
                &ldquo;Fragments of thoughts, people, places, and the quiet in between.&rdquo;
              </p>
              <div className="mx-auto h-px w-14 bg-amber-400/35" />
              <p className="font-sans text-[10px] sm:text-[11px] uppercase tracking-[0.26em] text-amber-200/80 font-medium">
                Mohit Yenugwar
              </p>
              <p className="font-editorial text-xs italic text-white/50">
                A Digital Folio · Vol. I
              </p>
            </div>
          </div>

          <div className="font-sans text-[9px] uppercase tracking-[0.22em] text-amber-200/60">
            Nagpur · India · MMXXVI
          </div>
        </div>
      </Page>,
    ];
  }, [formattedPages, colophonPageNum, sealPageNum, jumpToPage, flipNext, dimensions.isMobile, openBook]);

  if (!isMounted) return null;

  return (
    <div
      ref={containerRef}
      data-book-theme={bookTheme}
      className={`book-reader-wrapper relative flex flex-col items-center justify-center transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen overflow-hidden bg-[#121110] p-0 dark:bg-[#080706]"
          : "rounded-3xl border border-line/80 bg-surface/50 p-3 sm:p-6 lg:p-8 backdrop-blur-md"
      }`}
    >
      {/* ─── Top Kindle / Apple Books Control Bar (Hidden when Maximized) ─── */}
      {!isFullscreen && (
        <div className="relative z-30 mb-4 sm:mb-6 flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 border-b hairline pb-3 sm:pb-4">
          <div className="flex items-center gap-2">
            {onSwitchToNormalView && (
              <button
                type="button"
                onClick={onSwitchToNormalView}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line/80 bg-surface/80 px-3.5 py-1.5 font-sans text-xs font-medium text-ink shadow-xs transition-all hover:bg-surface hover:text-accent"
                title="Return to standard archive directory"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Standard View</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => jumpToPage(2)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line/80 bg-surface/80 px-3 py-1.5 font-sans text-xs font-medium text-ink shadow-xs transition-all hover:bg-surface"
              title="Jump to Table of Contents"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Contents</span>
            </button>
          </div>

          {/* Center Folio Title */}
          <div className="hidden md:flex items-center gap-2 font-display text-sm text-ink/80">
            <BookOpen className="h-4 w-4 text-accent" />
            <span>The Collected Literary Folio</span>
          </div>

          {/* Right Tools: Paper Theme & Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Paper Theme Switcher: Parchment, Ivory, and Night in dark mode */}
            <div className="inline-flex items-center rounded-xl border border-line/80 bg-surface/80 p-0.5 shadow-xs">
              {isSiteDark && (
                <button
                  type="button"
                  onClick={() => handleSelectTheme("night")}
                  className={`rounded-lg px-2.5 py-1 font-sans text-[11px] font-medium transition-colors ${
                    bookTheme === "night" ? "bg-accent text-white" : "text-muted hover:text-ink"
                  }`}
                  title="Night Edition (Dark)"
                >
                  Night
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSelectTheme("parchment")}
                className={`rounded-lg px-2.5 py-1 font-sans text-[11px] font-medium transition-colors ${
                  bookTheme === "parchment" ? "bg-accent text-white" : "text-muted hover:text-ink"
                }`}
                title="Warm Parchment Paper"
              >
                Parchment
              </button>
              <button
                type="button"
                onClick={() => handleSelectTheme("ivory")}
                className={`rounded-lg px-2.5 py-1 font-sans text-[11px] font-medium transition-colors ${
                  bookTheme === "ivory" ? "bg-accent text-white" : "text-muted hover:text-ink"
                }`}
                title="Ivory Light Paper"
              >
                Ivory
              </button>
            </div>

            <button
              type="button"
              onClick={enterFullscreen}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-line/80 bg-surface/80 text-muted transition-colors hover:text-ink"
              aria-label="Maximize Fullscreen Reader"
              title="Open full-screen digital book"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Interactive Flip Book Stage (Click or hold & drag page to flip) ─── */}
      <div className={`relative z-10 flex w-full items-center justify-center ${isFullscreen ? "my-auto" : "py-2 sm:py-4"}`}>
        {/* Book Container: Locked dimensions prevent layout collapse and scrolling */}
        <div
          className="book-stage relative flex items-center justify-center select-none cursor-pointer"
          data-book-theme={bookTheme}
          onClick={handleStageClick}
          onTouchStart={handleStageTouchStart}
          onTouchEnd={handleStageTouchEnd}
          style={{
            width: dimensions.isMobile ? dimensions.pageWidth : dimensions.pageWidth * 2,
            height: dimensions.pageHeight + (dimensions.isMobile ? 0 : 20),
            minHeight: dimensions.pageHeight + (dimensions.isMobile ? 0 : 20),
            touchAction: dimensions.isMobile ? "pan-y" : "none",
            backgroundColor: "transparent",
            overflow: "visible",
          }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: dimensions.isMobile ? dimensions.pageWidth : dimensions.pageWidth * 2,
              height: dimensions.pageHeight,
              transform:
                !dimensions.isMobile
                  ? bookSpreadState === "front"
                    ? `translateX(-${dimensions.pageWidth / 2}px)`
                    : bookSpreadState === "back"
                    ? `translateX(${dimensions.pageWidth / 2}px)`
                    : "translateX(0px)"
                  : "none",
              transition: dimensions.isMobile ? "none" : "transform 650ms cubic-bezier(0.35, 0, 0.25, 1)",
              willChange: "transform",
              overflow: "visible",
            }}
          >
            <HTMLFlipBook
              key={`${dimensions.isMobile ? "m" : "d"}-${dimensions.pageWidth}-${dimensions.pageHeight}-${isFullscreen ? "fs" : "norm"}`}
              startPage={currentPage}
              width={dimensions.pageWidth}
              height={dimensions.pageHeight}
              size="fixed"
              minWidth={dimensions.pageWidth}
              maxWidth={dimensions.pageWidth}
              minHeight={dimensions.pageHeight}
              maxHeight={dimensions.pageHeight}
              drawShadow={!dimensions.isMobile}
              maxShadowOpacity={dimensions.isMobile ? 0 : 0.25}
              showCover={true}
              mobileScrollSupport={false}
              clickEventForward={true}
              usePortrait={dimensions.isMobile}
              flippingTime={dimensions.isMobile ? 380 : 650}
              swipeDistance={20}
              showPageCorners={false}
              disableFlipByClick={false}
              useMouseEvents={!dimensions.isMobile}
              autoSize={true}
              renderOnlyPageLengthChange={true}
              className="book-engine mx-auto"
              style={{ margin: "0 auto" }}
              ref={bookRef}
              onFlip={(e: { data: number }) => {
                setCurrentPage(e.data);
                if (e.data === 0) {
                  setBookSpreadState("front");
                } else if (e.data >= backCoverPageNum) {
                  setBookSpreadState("back");
                } else {
                  setBookSpreadState("spread");
                }
              }}
              onChangeState={(e: { data: string }) => {
                if (e.data !== "read") {
                  lastFlipTimeRef.current = Date.now();
                }
              }}
            >
              {pageElements}
            </HTMLFlipBook>
          </div>
        </div>
      </div>

      {/* ─── Bottom Navigation Bar (Hidden when Maximized) ─── */}
      {!isFullscreen && (
        <div className="relative z-30 mt-4 sm:mt-6 flex w-full max-w-4xl items-center justify-between gap-2 border-t hairline pt-3 sm:pt-4 px-2 pb-2">
          {/* Page progress indicator */}
          <div className="flex items-center gap-2 font-sans text-xs text-muted">
            <span className="font-mono text-ink font-semibold whitespace-nowrap">
              {currentPage === 0
                ? "Cover"
                : currentPage >= backCoverPageNum
                ? "Back Cover"
                : !dimensions.isMobile && currentPage % 2 === 1 && currentPage + 1 < backCoverPageNum
                ? `Pages ${currentPage}–${currentPage + 1} of ${backCoverPageNum}`
                : `Page ${currentPage} of ${backCoverPageNum}`}
            </span>
            <span className="text-line hidden md:inline">·</span>
            <span className="text-[11px] text-muted hidden md:inline">
              Click or hold &amp; drag the page to flip
            </span>
          </div>

          {/* Quick Return to Cover */}
          <button
            type="button"
            onClick={closeToCover}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line/80 bg-surface/80 px-3 py-1.5 font-sans text-xs text-muted hover:text-ink shadow-xs transition-all hover:bg-surface whitespace-nowrap shrink-0"
            title="Return to Cover"
          >
            <RotateCcw className="h-3 w-3 text-accent" />
            <span>Return to Cover</span>
          </button>
        </div>
      )}

      {/* ─── Fullscreen / Maximized Mode: Glass HUD, Bottom Dock & Contents Drawer ─── */}
      {isFullscreen && (
        <>
          {/* Top Floating Glass Header in Fullscreen */}
          <div className="fixed top-4 inset-x-3 sm:inset-x-8 z-40 flex items-center justify-between pointer-events-none">
            {/* Left: Book Title & Contents Button */}
            <div className="pointer-events-auto flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/75 px-4 py-2 backdrop-blur-xl shadow-2xl text-white">
                <BookOpen className="h-4 w-4 text-accent" />
                <span className="font-display text-sm text-white/90 hidden sm:inline">
                  Some Things Are Better Left in Words
                </span>
                <span className="font-display text-xs text-white/90 sm:hidden">
                  Folio Archive
                </span>
              </div>

              <button
                type="button"
                data-drawer-trigger="true"
                onClick={() => setShowContentsDrawer(!showContentsDrawer)}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/75 px-3.5 py-2 font-sans text-xs font-medium text-amber-200/90 hover:text-amber-100 backdrop-blur-xl shadow-2xl transition-all hover:bg-black/90 cursor-pointer"
                title="Table of Contents Drawer"
              >
                <List className="h-3.5 w-3.5 text-accent" />
                <span className="hidden sm:inline">Contents</span>
              </button>
            </div>

            {/* Right: Theme Pills & Standard View & Exit */}
            <div className="pointer-events-auto flex items-center gap-2">
              <div className="flex items-center rounded-full border border-white/15 bg-black/75 p-1 backdrop-blur-xl shadow-2xl text-white">
                {isSiteDark && (
                  <button
                    type="button"
                    onClick={() => handleSelectTheme("night")}
                    className={`rounded-full px-2.5 py-1 font-sans text-[11px] font-medium transition-colors cursor-pointer ${
                      bookTheme === "night" ? "bg-accent text-white" : "text-white/70 hover:text-white"
                    }`}
                  >
                    Night
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSelectTheme("parchment")}
                  className={`rounded-full px-2.5 py-1 font-sans text-[11px] font-medium transition-colors cursor-pointer ${
                    bookTheme === "parchment" ? "bg-accent text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  Parchment
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTheme("ivory")}
                  className={`rounded-full px-2.5 py-1 font-sans text-[11px] font-medium transition-colors cursor-pointer ${
                    bookTheme === "ivory" ? "bg-accent text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  Ivory
                </button>
              </div>

              {onSwitchToNormalView && (
                <button
                  type="button"
                  onClick={() => {
                    exitFullscreen();
                    onSwitchToNormalView();
                  }}
                  className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/75 px-3.5 py-2 font-sans text-xs font-medium text-white/80 hover:text-white backdrop-blur-xl shadow-2xl transition-all hover:bg-black/90 cursor-pointer"
                  title="Return to standard archive directory"
                >
                  <LayoutGrid className="h-3.5 w-3.5 text-accent" />
                  <span>Standard View</span>
                </button>
              )}

              <button
                type="button"
                onClick={exitFullscreen}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/75 text-white/80 hover:text-white backdrop-blur-xl shadow-2xl transition-all hover:bg-black/90 cursor-pointer"
                title="Exit Fullscreen (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Bottom Floating Scrubber Dock: Firmly visible, never disappears when sliding */}
          <div className="fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 rounded-full border border-white/15 bg-black/80 px-3.5 sm:px-6 py-2 sm:py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl text-white max-w-[95vw] sm:max-w-xl w-full">
            {/* Prev Button */}
            <button
              type="button"
              onClick={flipPrev}
              disabled={currentPage <= 0}
              className="rounded-full p-1.5 text-white/80 hover:text-white hover:bg-white/15 disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer shrink-0"
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Scrubber & Page Indicator */}
            <div className="flex-1 flex flex-col justify-center px-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] text-white/70 font-mono mb-1">
                <span className="truncate max-w-[150px] sm:max-w-[260px] text-amber-200 font-sans font-medium text-[11px]">
                  {currentWork.title}
                </span>
                <span className="shrink-0 text-[11px] tabular-nums ml-2">
                  {currentPage === 0
                    ? "Cover"
                    : currentPage >= backCoverPageNum
                    ? "Back Cover"
                    : !dimensions.isMobile && currentPage % 2 === 1 && currentPage + 1 < backCoverPageNum
                    ? `Pages ${currentPage}–${currentPage + 1} / ${backCoverPageNum}`
                    : `Page ${currentPage} / ${backCoverPageNum}`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={backCoverPageNum}
                value={currentPage}
                onChange={(e) => handleScrubPage(Number(e.target.value))}
                className="w-full accent-accent h-1.5 rounded-lg bg-white/20 cursor-pointer"
                title="Scrub Pages"
              />
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={flipNext}
              disabled={currentPage >= backCoverPageNum}
              className="rounded-full p-1.5 text-white/80 hover:text-white hover:bg-white/15 disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer shrink-0"
              title="Next Page (Right Arrow)"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Quick Return to Cover */}
            <button
              type="button"
              onClick={closeToCover}
              className="rounded-full p-1.5 text-white/70 hover:text-amber-200 hover:bg-white/15 transition-all cursor-pointer shrink-0"
              title="Return to Cover"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Slide-over Table of Contents Drawer */}
          {showContentsDrawer && (
            <div
              ref={drawerRef}
              className="fixed inset-y-0 left-0 z-50 w-full sm:w-96 bg-black/92 text-white backdrop-blur-2xl border-r border-white/10 p-5 sm:p-6 flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.8)] animate-in slide-in-from-left duration-200"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div>
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                    Table of Contents
                  </h3>
                  <p className="font-editorial text-xs italic text-white/60 mt-0.5">
                    {works.length} pieces in this folio
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowContentsDrawer(false)}
                  className="rounded-xl p-2 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {/* Fixed Folio Pages */}
                <button
                  type="button"
                  onClick={() => {
                    jumpToPage(0);
                    setShowContentsDrawer(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors cursor-pointer ${
                    currentPage === 0 ? "bg-accent text-white" : "hover:bg-white/10 text-white/80"
                  }`}
                >
                  <span className="font-editorial text-sm">Front Cover</span>
                  <span className="font-mono text-xs opacity-75">p. 0</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    jumpToPage(1);
                    setShowContentsDrawer(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors cursor-pointer ${
                    currentPage === 1 ? "bg-accent text-white" : "hover:bg-white/10 text-white/80"
                  }`}
                >
                  <span className="font-editorial text-sm">Title &amp; Dedication</span>
                  <span className="font-mono text-xs opacity-75">p. 1</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    jumpToPage(2);
                    setShowContentsDrawer(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors cursor-pointer ${
                    currentPage === 2 ? "bg-accent text-white" : "hover:bg-white/10 text-white/80"
                  }`}
                >
                  <span className="font-editorial text-sm">Folio Index</span>
                  <span className="font-mono text-xs opacity-75">p. 2</span>
                </button>

                <div className="border-t border-white/10 my-2" />

                {/* Literary Pieces List */}
                {formattedPages.map((fp, idx) => (
                  <button
                    key={`${fp.work.id}-${fp.partIndex}`}
                    type="button"
                    onClick={() => {
                      jumpToPage(fp.pageNumber);
                      setShowContentsDrawer(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors cursor-pointer ${
                      currentPage === fp.pageNumber
                        ? "bg-accent text-white font-semibold shadow-xs"
                        : "hover:bg-white/10 text-white/80 hover:text-white"
                    }`}
                  >
                    <div className="truncate mr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-amber-300/80">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="font-editorial text-sm truncate">
                          {fp.work.title || fp.text.slice(0, 30)}
                        </span>
                      </div>
                      <span className="font-sans text-[9px] uppercase tracking-wider opacity-60 ml-5">
                        {contentTypeLabel(fp.work.contentType as ContentType)}
                      </span>
                    </div>
                    <span className="font-mono text-xs opacity-75 shrink-0">
                      p. {fp.pageNumber}
                    </span>
                  </button>
                ))}

                <div className="border-t border-white/10 my-2" />

                <button
                  type="button"
                  onClick={() => {
                    jumpToPage(colophonPageNum);
                    setShowContentsDrawer(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors cursor-pointer ${
                    currentPage === colophonPageNum ? "bg-accent text-white" : "hover:bg-white/10 text-white/80"
                  }`}
                >
                  <span className="font-editorial text-sm">Folio Colophon</span>
                  <span className="font-mono text-xs opacity-75">p. {colophonPageNum}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    jumpToPage(backCoverPageNum);
                    setShowContentsDrawer(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors cursor-pointer ${
                    currentPage === backCoverPageNum ? "bg-accent text-white" : "hover:bg-white/10 text-white/80"
                  }`}
                >
                  <span className="font-editorial text-sm">Back Cover</span>
                  <span className="font-mono text-xs opacity-75">p. {backCoverPageNum}</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
