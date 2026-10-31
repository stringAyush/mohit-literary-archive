"use client";

import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  BookOpen,
  LayoutGrid,
  List,
  Maximize2,
  Menu,
  Minimize2,
  RotateCcw,
  SlidersHorizontal,
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
    <div className="flex min-h-[460px] w-full items-center justify-center rounded-2xl border border-line bg-surface/60 p-12 text-center">
      <div className="space-y-4">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="font-editorial text-xl italic text-ink/80">Binding the folio pages…</p>
        <p className="font-sans text-xs text-muted">Preparing poems and stories for book view</p>
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
      className={`page-sheet relative h-full w-full select-none overflow-hidden ${className}`}
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
  onSwitchToNormalView?: () => void;
}) {
  const bookRef = useRef<FlipBookInstance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [bookTheme, setBookTheme] = useState<BookTheme>("parchment");
  const [isSiteDark, setIsSiteDark] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenMenu, setShowFullscreenMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const lastLightPaperRef = useRef<PaperTheme>("parchment");
  const previousDarkRef = useRef<boolean | null>(null);

  // Exact dimensions calculated to fit screen perfectly on both PC and mobile
  const [dimensions, setDimensions] = useState({
    pageWidth: 420,
    pageHeight: 580,
    isMobile: false,
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
          const maxAvailW = Math.max(w - 40, 260);
          const pWidth = Math.min(maxAvailW, 360);
          const pHeight = Math.min(Math.round(pWidth * 1.45), 520);
          setDimensions({ pageWidth: pWidth, pageHeight: pHeight, isMobile: true });
        } else {
          const pWidth = Math.min(Math.floor((Math.min(w, 1080) - 100) / 2), 430);
          const pHeight = Math.round(pWidth * 1.36);
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

  const flipNext = useCallback(() => {
    try {
      const pf = bookRef.current?.pageFlip();
      if (!pf) return;
      const state = pf.getState?.();
      if (state && state !== "read") return;
      const now = Date.now();
      const minInterval = dimensions.isMobile ? 380 : 600;
      if (now - lastFlipTimeRef.current < minInterval) return;
      lastFlipTimeRef.current = now;
      if (pf.flipNext) {
        pf.flipNext("bottom");
      } else if (pf.turnToNextPage) {
        pf.turnToNextPage();
      }
    } catch {
      // ignore
    }
  }, [dimensions.isMobile]);

  const flipPrev = useCallback(() => {
    try {
      const pf = bookRef.current?.pageFlip();
      if (!pf) return;
      const state = pf.getState?.();
      if (state && state !== "read") return;
      const now = Date.now();
      const minInterval = dimensions.isMobile ? 380 : 600;
      if (now - lastFlipTimeRef.current < minInterval) return;
      lastFlipTimeRef.current = now;
      pf.flipPrev();
    } catch {
      // ignore
    }
  }, [dimensions.isMobile]);

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
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = touch.clientX - rect.left;
      if (clickX > rect.width * 0.45) {
        flipNext();
      } else {
        flipPrev();
      }
    }
  }, [flipNext, flipPrev]);

  const handleStageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent synthetic mouse clicks after touch events
    if (Date.now() - lastTouchTimeRef.current < 500) return;

    const target = e.target as HTMLElement | null;
    if (target && target.closest("a, button, input")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX > rect.width * 0.45) {
      flipNext();
    } else {
      flipPrev();
    }
  }, [flipNext, flipPrev]);

  const jumpToPage = useCallback((pageNum: number) => {
    try {
      const pf = bookRef.current?.pageFlip();
      if (!pf) return;
      const state = pf.getState?.();
      if (state && state !== "read") return;
      lastFlipTimeRef.current = Date.now();
      pf.flip(pageNum);
      setShowFullscreenMenu(false);
    } catch {
      // ignore
    }
  }, []);

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
    setShowFullscreenMenu(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {
        setIsFullscreen(false);
      });
    } else {
      setIsFullscreen(false);
    }
  }, []);

  // Close fullscreen menu on click outside or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowFullscreenMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowFullscreenMenu(false);
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
        setShowFullscreenMenu(false);
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

  const colophonPageNum = formattedPages.length + 3;
  const backCoverPageNum = colophonPageNum + 1;

  // Memoize all page elements to prevent react-pageflip from destroying and reloading HTML on re-renders
  const pageElements = useMemo(() => {
    return [
      /* ════ PAGE 0: HARDCOVER FRONT ════ */
      <Page
        key="page-cover-front"
        isHard={!dimensions.isMobile}
        className="book-cover-sheet p-5 sm:p-7 flex flex-col justify-between border-r-2"
      >
        <div className="relative h-full w-full rounded-sm border-2 border-amber-400/30 p-5 sm:p-7 flex flex-col justify-between text-center">
          <span className="absolute top-2 left-2 text-[10px] text-amber-300/60 select-none">✦</span>
          <span className="absolute top-2 right-2 text-[10px] text-amber-300/60 select-none">✦</span>
          <span className="absolute bottom-2 left-2 text-[10px] text-amber-300/60 select-none">✦</span>
          <span className="absolute bottom-2 right-2 text-[10px] text-amber-300/60 select-none">✦</span>

          <div className="pt-2">
            <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-amber-200/80 font-medium">
              Digital Literary Folio
            </span>
            <div className="mx-auto mt-2 h-px w-14 bg-amber-400/35" />
          </div>

          <div className="my-auto py-4 space-y-3">
            <p className="font-sans text-[10px] sm:text-xs uppercase tracking-[0.28em] text-amber-200/70">
              The Collected Writings of
            </p>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[2rem] font-normal tracking-[0.03em] text-amber-50">
              Mohit Yenugwar
            </h1>
            <div className="mx-auto flex items-center justify-center gap-2 text-amber-300/60 my-2">
              <span className="h-px w-8 bg-amber-400/35" />
              <span className="text-xs">✦</span>
              <span className="h-px w-8 bg-amber-400/35" />
            </div>
            <p className="font-editorial text-sm sm:text-base italic text-amber-100/85 leading-snug max-w-[260px] mx-auto">
              Poems, Short Stories &amp; Quiet Reflections
            </p>
          </div>

          <div className="border-t border-amber-400/25 pt-3 flex items-center justify-between font-sans text-[9px] uppercase tracking-[0.22em] text-amber-200/70">
            <span>Nagpur · India</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                flipNext();
              }}
              className="text-amber-300 hover:text-amber-100 transition-colors cursor-pointer"
            >
              Open Folio
            </button>
          </div>
        </div>
      </Page>,

      /* ════ PAGE 1: TITLE & DEDICATION PAGE ════ */
      <Page
        key="page-title-dedication"
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
              onClick={() => jumpToPage(fp.pageNumber)}
              className="group flex w-full items-center justify-between py-1 text-left transition-colors hover:text-accent"
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
          <span>Flip to read</span>
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
            <div className="flex-1 flex flex-col justify-center py-3 overflow-hidden">
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
        className="book-page-sheet book-spine-left p-6 sm:p-9 flex flex-col justify-between border-r hairline"
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

      /* ════ HARDCOVER BACK ════ */
      <Page
        key="page-cover-back"
        isHard={!dimensions.isMobile}
        className="book-cover-sheet p-5 sm:p-7 flex flex-col justify-between border-l-2"
      >
        <div className="relative h-full w-full rounded-sm border-2 border-amber-400/30 p-5 sm:p-7 flex flex-col justify-between text-center">
          <span className="text-amber-300 text-xs">✦</span>

          <div className="my-auto space-y-3">
            <p className="font-editorial text-base sm:text-lg italic text-amber-100/90 leading-snug">
              &ldquo;Some things are better left in words.&rdquo;
            </p>
            <div className="mx-auto h-px w-12 bg-amber-400/35" />
            <p className="font-sans text-[11px] uppercase tracking-[0.24em] text-amber-200/70">
              Mohit Yenugwar
            </p>
          </div>

          <div className="font-sans text-[9px] uppercase tracking-[0.2em] text-amber-200/60">
            mohityenugwar.com
          </div>
        </div>
      </Page>,
    ];
  }, [formattedPages, colophonPageNum, jumpToPage, dimensions.isMobile, flipNext]);

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
          className="book-stage relative flex items-center justify-center select-none shadow-[0_24px_60px_-15px_rgba(0,0,0,0.45)] rounded-sm cursor-pointer overflow-hidden"
          data-book-theme={bookTheme}
          onClick={handleStageClick}
          onTouchStart={handleStageTouchStart}
          onTouchEnd={handleStageTouchEnd}
          style={{
            width: dimensions.isMobile ? dimensions.pageWidth : dimensions.pageWidth * 2,
            height: dimensions.pageHeight,
            minHeight: dimensions.pageHeight,
            touchAction: dimensions.isMobile ? "pan-y" : "none",
          }}
        >
          <HTMLFlipBook
            key={`${dimensions.isMobile ? "m" : "d"}-${dimensions.pageWidth}-${dimensions.pageHeight}-${isFullscreen ? "fs" : "norm"}`}
            width={dimensions.pageWidth}
            height={dimensions.pageHeight}
            size="fixed"
            minWidth={dimensions.pageWidth}
            maxWidth={dimensions.pageWidth}
            minHeight={dimensions.pageHeight}
            maxHeight={dimensions.pageHeight}
            drawShadow={!dimensions.isMobile}
            maxShadowOpacity={dimensions.isMobile ? 0 : 0.45}
            showCover={true}
            mobileScrollSupport={false}
            clickEventForward={true}
            usePortrait={dimensions.isMobile}
            flippingTime={dimensions.isMobile ? 380 : 600}
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
            onClick={() => jumpToPage(0)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line/80 bg-surface/80 px-3 py-1.5 font-sans text-xs text-muted hover:text-ink shadow-xs transition-all hover:bg-surface whitespace-nowrap shrink-0"
            title="Return to Cover"
          >
            <RotateCcw className="h-3 w-3 text-accent" />
            <span>Return to Cover</span>
          </button>
        </div>
      )}

      {/* ─── Fullscreen / Maximized Mode: Bottom-Left Menu Button & Glass Drawer ─── */}
      {isFullscreen && (
        <>
          {/* Bottom-Left Floating Menu Trigger */}
          <div className="fixed bottom-5 left-5 z-50">
            <button
              type="button"
              onClick={() => setShowFullscreenMenu(!showFullscreenMenu)}
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2.5 text-xs font-medium text-white shadow-2xl backdrop-blur-md transition-all hover:bg-black/85 hover:scale-105 active:scale-95"
              title="Reading Options"
            >
              <Menu className="h-4 w-4 text-accent transition-transform group-hover:rotate-90" />
              <span className="font-sans text-[11px] font-semibold tracking-wider uppercase">Menu</span>
            </button>
          </div>

          {/* Bottom-Left Glass Options Drawer */}
          {showFullscreenMenu && (
            <div
              ref={menuRef}
              className="fixed bottom-18 left-5 z-50 w-72 rounded-2xl border border-white/15 bg-black/85 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl text-white animate-in fade-in slide-in-from-bottom-4 duration-200"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-accent" />
                  <span className="font-sans text-xs font-semibold uppercase tracking-wider text-white/90">
                    Reader Menu
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullscreenMenu(false)}
                  className="rounded-lg p-1 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Action buttons list */}
              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  onClick={exitFullscreen}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left font-medium text-white/90 hover:bg-white/15 transition-colors"
                >
                  <Minimize2 className="h-4 w-4 text-accent" />
                  <span>Exit Fullscreen</span>
                </button>

                {onSwitchToNormalView && (
                  <button
                    type="button"
                    onClick={() => {
                      exitFullscreen();
                      onSwitchToNormalView();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left font-medium text-white/90 hover:bg-white/15 transition-colors"
                  >
                    <LayoutGrid className="h-4 w-4 text-accent" />
                    <span>Return to Standard Archive</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => jumpToPage(dimensions.isMobile ? 0 : 2)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left font-medium text-white/90 hover:bg-white/15 transition-colors"
                >
                  <List className="h-4 w-4 text-accent" />
                  <span>Table of Contents</span>
                </button>

                <button
                  type="button"
                  onClick={() => jumpToPage(0)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left font-medium text-white/90 hover:bg-white/15 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 text-accent" />
                  <span>Return to Cover</span>
                </button>
              </div>

              {/* Theme Settings (Parchment, Ivory, and Night in dark mode) */}
              <div className="border-t border-white/10 pt-3.5 mt-3.5">
                <span className="block font-sans text-[10px] uppercase tracking-wider text-white/60 mb-2 font-medium">
                  Paper Theme
                </span>
                <div className={`grid ${isSiteDark ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
                  {isSiteDark && (
                    <button
                      type="button"
                      onClick={() => handleSelectTheme("night")}
                      className={`rounded-xl py-1.5 text-center font-sans text-xs font-medium transition-all ${
                        bookTheme === "night"
                          ? "bg-accent text-white font-semibold shadow-xs"
                          : "border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      Night
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelectTheme("parchment")}
                    className={`rounded-xl py-1.5 text-center font-sans text-xs font-medium transition-all ${
                      bookTheme === "parchment"
                        ? "bg-accent text-white font-semibold shadow-xs"
                        : "border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    Parchment
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTheme("ivory")}
                    className={`rounded-xl py-1.5 text-center font-sans text-xs font-medium transition-all ${
                      bookTheme === "ivory"
                        ? "bg-accent text-white font-semibold shadow-xs"
                        : "border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    Ivory
                  </button>
                </div>
              </div>

              {/* Page Scrubber Slider */}
              <div className="border-t border-white/10 pt-3.5 mt-3.5">
                <div className="flex items-center justify-between text-[11px] text-white/70 mb-1.5 font-mono">
                  <span>Page {currentPage}</span>
                  <span>of {backCoverPageNum}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={backCoverPageNum}
                  value={currentPage}
                  onChange={(e) => jumpToPage(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
