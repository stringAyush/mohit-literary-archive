"use client";

import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
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
    flipNext: () => void;
    flipPrev: () => void;
    flip: (pageNum: number) => void;
    getPageCount: () => number;
    getCurrentPageIndex: () => number;
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
        transform: "translate3d(0, 0, 0)",
        WebkitTransform: "translate3d(0, 0, 0)",
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
  const [paperTheme, setPaperTheme] = useState<PaperTheme>("parchment");
  const [isSiteDark, setIsSiteDark] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenMenu, setShowFullscreenMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Exact dimensions calculated to fit screen perfectly on both PC and mobile
  const [dimensions, setDimensions] = useState({
    pageWidth: 420,
    pageHeight: 580,
    isMobile: false,
  });

  // Track site-wide dark mode automatically via MutationObserver
  useEffect(() => {
    setIsMounted(true);

    const checkDarkMode = () => {
      setIsSiteDark(document.documentElement.classList.contains("dark"));
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
          let pWidth = Math.min(availW, 400);
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
          const pWidth = Math.min(Math.max(w - 36, 280), 360);
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

  const flipNext = useCallback(() => {
    try {
      bookRef.current?.pageFlip()?.flipNext();
    } catch {
      // ignore
    }
  }, []);

  const flipPrev = useCallback(() => {
    try {
      bookRef.current?.pageFlip()?.flipPrev();
    } catch {
      // ignore
    }
  }, []);

  const jumpToPage = useCallback((pageNum: number) => {
    try {
      bookRef.current?.pageFlip()?.flip(pageNum);
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

  // The book theme automatically switches to Night when site dark mode is active
  const effectiveTheme: "parchment" | "ivory" | "night" = isSiteDark ? "night" : paperTheme;

  // Theme palettes: Parchment, Ivory, Night
  const themeStyles = useMemo(() => {
    return {
      parchment: {
        bookBg: "bg-[#f5f0e6] text-[#29241f]",
        pageBorder: "border-[#dfd7c8]",
        spineShadowLeft: "shadow-[inset_-14px_0_20px_-10px_rgba(40,30,20,0.18)]",
        spineShadowRight: "shadow-[inset_14px_0_20px_-10px_rgba(40,30,20,0.18)]",
        subtleText: "text-[#756a5e]",
        ruleColor: "border-[#d8cfbe]",
        coverBg: "bg-linear-to-br from-[#1e2738] via-[#101726] to-[#080d18] text-[#f7f2ea]",
        coverBorder: "border-[#334155]",
      },
      ivory: {
        bookBg: "bg-[#fcfaf5] text-[#1c1917]",
        pageBorder: "border-[#ebe4d8]",
        spineShadowLeft: "shadow-[inset_-14px_0_18px_-10px_rgba(0,0,0,0.12)]",
        spineShadowRight: "shadow-[inset_14px_0_18px_-10px_rgba(0,0,0,0.12)]",
        subtleText: "text-[#78716c]",
        ruleColor: "border-[#e5ded2]",
        coverBg: "bg-linear-to-br from-[#292524] via-[#1c1917] to-[#0c0a09] text-[#fafaf9]",
        coverBorder: "border-[#44403c]",
      },
      night: {
        bookBg: "bg-[#161513] text-[#ece5d8]",
        pageBorder: "border-[#2b2723]",
        spineShadowLeft: "shadow-[inset_-14px_0_24px_-10px_rgba(0,0,0,0.6)]",
        spineShadowRight: "shadow-[inset_14px_0_24px_-10px_rgba(0,0,0,0.6)]",
        subtleText: "text-[#a39a8c]",
        ruleColor: "border-[#36312a]",
        coverBg: "bg-linear-to-br from-[#0d0c0b] via-[#141210] to-[#080706] text-[#f4efe8]",
        coverBorder: "border-[#27231f]",
      },
    }[effectiveTheme];
  }, [effectiveTheme]);

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
    let pageCounter = dimensions.isMobile ? 1 : 3;

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
  }, [works, dimensions.isMobile]);

  const colophonPageNum = formattedPages.length + (dimensions.isMobile ? 1 : 3);
  const backCoverPageNum = colophonPageNum + 1;

  // Memoize all page elements to prevent react-pageflip from destroying and reloading HTML on re-renders
  const pageElements = useMemo(() => {
    return [
      /* ════ PAGE 0: HARDCOVER FRONT ════ */
      <Page
        key="page-cover-front"
        isHard
        className={`p-5 sm:p-7 flex flex-col justify-between ${themeStyles.coverBg} border-r-2 ${themeStyles.coverBorder}`}
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
            <span className="text-amber-300">Open Book →</span>
          </div>
        </div>
      </Page>,

      /* ════ PAGE 1: TITLE & DEDICATION PAGE ════ */
      <Page
        key="page-title-dedication"
        className={`p-6 sm:p-9 flex flex-col justify-between ${themeStyles.bookBg} border-r hairline ${themeStyles.pageBorder} ${themeStyles.spineShadowLeft}`}
      >
        <div className="text-center pt-6">
          <span className="eyebrow text-[0.6875rem]">Literary Archive</span>
          <h2 className="mt-4 font-display text-xl sm:text-2xl text-ink font-normal">
            Some things are better left in words.
          </h2>
          <p className="mt-2 font-editorial text-sm italic text-muted">
            Written &amp; Composed by Mohit Yenugwar
          </p>
        </div>

        <div className="my-auto max-w-[280px] mx-auto text-center border-y hairline py-5 my-6 border-line/60">
          <p className="font-editorial text-xs sm:text-sm leading-relaxed italic text-ink/85">
            &ldquo;A gathering of thoughts, verse, and narrative fragments composed in quiet hours, under natural light and open skies.&rdquo;
          </p>
        </div>

        <div className="border-t hairline pt-3 flex items-center justify-between font-sans text-[10px] text-muted">
          <span>The Literary Archive</span>
          <span>Page 1</span>
        </div>
      </Page>,

      /* ════ PAGE 2: TABLE OF CONTENTS (INDEX) ════ */
      <Page
        key="page-table-of-contents"
        className={`p-6 sm:p-9 flex flex-col justify-between ${themeStyles.bookBg} border-l hairline ${themeStyles.pageBorder} ${themeStyles.spineShadowRight}`}
      >
        <div className="border-b hairline pb-2.5 mb-3 flex items-center justify-between">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-ink">
            Table of Contents
          </h3>
          <span className="font-sans text-[10px] text-muted uppercase">Index</span>
        </div>

        <div className="overflow-hidden flex-1 space-y-1.5 text-xs py-1">
          {formattedPages.slice(0, 14).map((fp, idx) => (
            <button
              key={`${fp.work.id}-${fp.partIndex}`}
              type="button"
              onClick={() => jumpToPage(fp.pageNumber)}
              className="group flex w-full items-center justify-between py-1 text-left transition-colors hover:text-accent"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="font-sans text-[10px] tabular-nums text-muted group-hover:text-accent">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="font-editorial text-xs sm:text-sm truncate font-medium text-ink group-hover:text-accent">
                  {fp.work.title || fp.text.slice(0, 28)}
                </span>
              </div>
              <span className="font-sans text-[10px] tabular-nums text-muted shrink-0 ml-2">
                p. {fp.pageNumber}
              </span>
            </button>
          ))}
        </div>

        <div className="border-t hairline pt-3 mt-auto flex items-center justify-between font-sans text-[10px] text-muted">
          <span>Flip forward to read</span>
          <span>Page 2</span>
        </div>
      </Page>,

      /* ════ LITERARY PIECES PAGES (3..N) ════ */
      ...formattedPages.map((fp) => {
        const isPoem = fp.work.contentType === "POEM";
        const isRight = fp.isRightPage;
        const spineShadow = isRight ? themeStyles.spineShadowRight : themeStyles.spineShadowLeft;
        const borderStyle = isRight
          ? `border-l hairline ${themeStyles.pageBorder}`
          : `border-r hairline ${themeStyles.pageBorder}`;

        return (
          <Page
            key={`page-${fp.pageNumber}-${fp.work.id}-${fp.partIndex}`}
            className={`p-6 sm:p-9 flex flex-col justify-between ${themeStyles.bookBg} ${borderStyle} ${spineShadow}`}
          >
            {/* Top Running Header */}
            <div
              className={`flex h-7 items-center justify-between border-b ${themeStyles.ruleColor} pb-1.5 font-sans text-[9px] sm:text-[10px] uppercase tracking-[0.16em] ${themeStyles.subtleText}`}
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
                <p className="mb-2 font-sans text-[9px] uppercase tracking-wider text-muted">
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
                <p className="mt-2 font-sans text-[9px] italic text-muted text-right">
                  Continued on next page →
                </p>
              )}
            </div>

            {/* Bottom Running Footer */}
            <div
              className={`h-7 border-t ${themeStyles.ruleColor} pt-1.5 flex items-center justify-between font-sans text-[9px] sm:text-[10px] ${themeStyles.subtleText}`}
            >
              <Link
                href={`/works/${fp.work.slug}`}
                className="hover:text-accent truncate max-w-[170px] no-underline"
                title="Open full piece in standalone view"
              >
                {fp.work.title || "Open piece"} ↗
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
        className={`p-6 sm:p-9 flex flex-col justify-between ${themeStyles.bookBg} border-r hairline ${themeStyles.pageBorder} ${themeStyles.spineShadowLeft}`}
      >
        <div className="text-center pt-6">
          <span className="eyebrow text-[0.6875rem]">Folio Colophon</span>
          <div className="mx-auto my-3 h-px w-12 bg-line" />
        </div>

        <div className="my-auto max-w-[280px] mx-auto text-center space-y-3 font-editorial text-xs sm:text-sm text-ink/80 leading-relaxed">
          <p>
            This digital folio was composed and published from the personal literary archive of Mohit Yenugwar.
          </p>
          <p className="text-[11px] text-muted font-sans">
            Typeset digitally in Cormorant Garamond, Instrument Serif, and Devanagari typography with lineated preservation.
          </p>
          <div className="text-sm text-accent">❦</div>
        </div>

        <div className="border-t hairline pt-3 flex items-center justify-between font-sans text-[10px] text-muted">
          <span>Mohit Yenugwar Archive</span>
          <span>Page {colophonPageNum}</span>
        </div>
      </Page>,

      /* ════ HARDCOVER BACK ════ */
      <Page
        key="page-cover-back"
        isHard
        className={`p-5 sm:p-7 flex flex-col justify-between ${themeStyles.coverBg} border-l-2 ${themeStyles.coverBorder}`}
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
  }, [formattedPages, themeStyles, colophonPageNum, jumpToPage]);

  if (!isMounted) return null;

  return (
    <div
      ref={containerRef}
      className={`book-reader-wrapper relative flex flex-col items-center justify-center transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen overflow-hidden bg-[#121110] p-0 dark:bg-[#080706]"
          : "rounded-3xl border border-line/80 bg-surface/50 p-3 sm:p-6 lg:p-8 backdrop-blur-md"
      }`}
    >
      {/* ─── Top Kindle / Apple Books Control Bar (Hidden when Maximized) ─── */}
      {!isFullscreen && (
        <div className="mb-4 sm:mb-6 flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 border-b hairline pb-3 sm:pb-4">
          <div className="flex items-center gap-2">
            {onSwitchToNormalView && (
              <button
                type="button"
                onClick={onSwitchToNormalView}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line/80 bg-surface/80 px-3.5 py-1.5 font-sans text-xs font-medium text-ink shadow-xs transition-all hover:bg-surface hover:text-accent"
                title="Return to standard archive directory"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Standard View</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => jumpToPage(dimensions.isMobile ? 0 : 2)}
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
            {/* Paper Theme Switcher: Only shown in light mode; in dark mode it is automatically Night */}
            {!isSiteDark && (
              <div className="inline-flex items-center rounded-xl border border-line/80 bg-surface/80 p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => setPaperTheme("parchment")}
                  className={`rounded-lg px-2.5 py-1 font-sans text-[11px] font-medium transition-colors ${
                    paperTheme === "parchment" ? "bg-accent text-white" : "text-muted hover:text-ink"
                  }`}
                  title="Warm Parchment Paper"
                >
                  Parchment
                </button>
                <button
                  type="button"
                  onClick={() => setPaperTheme("ivory")}
                  className={`rounded-lg px-2.5 py-1 font-sans text-[11px] font-medium transition-colors ${
                    paperTheme === "ivory" ? "bg-accent text-white" : "text-muted hover:text-ink"
                  }`}
                  title="Ivory Light Paper"
                >
                  Ivory
                </button>
              </div>
            )}

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

      {/* ─── Interactive Flip Book Stage (Fixed height prevents webpage scroll-up during flips) ─── */}
      <div className={`relative flex w-full items-center justify-center ${isFullscreen ? "my-auto" : "py-2 sm:py-4"}`}>
        {/* Previous page overlay arrow on left edge */}
        <button
          type="button"
          onClick={flipPrev}
          disabled={currentPage <= 0}
          className={`absolute ${
            isFullscreen ? "left-4 sm:left-8" : "-left-2 sm:-left-6"
          } top-1/2 -translate-y-1/2 z-30 inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-line/80 ${
            isFullscreen ? "bg-black/50 text-white/90 border-white/20 hover:bg-black/80" : "bg-surface/90 text-ink hover:bg-surface"
          } shadow-md backdrop-blur-md transition-all hover:scale-105 disabled:opacity-0 disabled:pointer-events-none`}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Next page overlay arrow on right edge */}
        <button
          type="button"
          onClick={flipNext}
          disabled={currentPage >= backCoverPageNum}
          className={`absolute ${
            isFullscreen ? "right-4 sm:right-8" : "-right-2 sm:-right-6"
          } top-1/2 -translate-y-1/2 z-30 inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-line/80 ${
            isFullscreen ? "bg-black/50 text-white/90 border-white/20 hover:bg-black/80" : "bg-surface/90 text-ink hover:bg-surface"
          } shadow-md backdrop-blur-md transition-all hover:scale-105 disabled:opacity-0 disabled:pointer-events-none`}
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Book Container: Locked dimensions prevent layout collapse and scrolling */}
        <div
          className="book-stage relative flex items-center justify-center select-none shadow-[0_24px_60px_-15px_rgba(0,0,0,0.45)] rounded-sm"
          style={{
            width: dimensions.isMobile ? dimensions.pageWidth : dimensions.pageWidth * 2,
            height: dimensions.pageHeight,
            minHeight: dimensions.pageHeight,
            touchAction: "pan-y",
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
            maxShadowOpacity={dimensions.isMobile ? 0.25 : 0.45}
            showCover={!dimensions.isMobile}
            mobileScrollSupport={true}
            clickEventForward={true}
            usePortrait={dimensions.isMobile}
            flippingTime={dimensions.isMobile ? 400 : 500}
            swipeDistance={20}
            showPageCorners={false}
            disableFlipByClick={false}
            renderOnlyPageLengthChange={true}
            className="book-engine mx-auto"
            style={{ margin: "0 auto" }}
            ref={bookRef}
            onFlip={(e: { data: number }) => {
              setCurrentPage(e.data);
            }}
          >
            {pageElements}
          </HTMLFlipBook>
        </div>
      </div>

      {/* ─── Bottom Navigation Bar (Hidden when Maximized) ─── */}
      {!isFullscreen && (
        <div className="mt-4 sm:mt-6 flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 border-t hairline pt-3 sm:pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={flipPrev}
              disabled={currentPage <= 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line/80 bg-surface/80 px-3.5 py-1.5 font-sans text-xs font-semibold text-ink shadow-xs transition-all hover:bg-surface disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={flipNext}
              disabled={currentPage >= backCoverPageNum}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line/80 bg-surface/80 px-3.5 py-1.5 font-sans text-xs font-semibold text-ink shadow-xs transition-all hover:bg-surface disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Page progress indicator */}
          <div className="flex items-center gap-3 font-sans text-xs text-muted">
            <span className="font-mono text-ink font-semibold">
              {currentPage === 0
                ? "Cover"
                : currentPage >= backCoverPageNum
                ? "Back Cover"
                : `Page ${currentPage} of ${backCoverPageNum}`}
            </span>
            <span className="text-line hidden sm:inline">·</span>
            <span className="text-[11px] hidden sm:inline">
              Turn pages by clicking corners or dragging
            </span>
          </div>

          {/* Quick Return to Cover */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => jumpToPage(0)}
              className="inline-flex items-center gap-1 text-muted hover:text-ink font-sans text-xs"
              title="Return to Cover"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Cover</span>
            </button>
          </div>
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
                    <ArrowLeft className="h-4 w-4 text-accent" />
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

              {/* Theme Settings (Only Parchment & Ivory shown in light mode) */}
              {!isSiteDark && (
                <div className="border-t border-white/10 pt-3.5 mt-3.5">
                  <span className="block font-sans text-[10px] uppercase tracking-wider text-white/60 mb-2 font-medium">
                    Paper Texture
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaperTheme("parchment")}
                      className={`rounded-xl py-1.5 text-center font-sans text-xs font-medium transition-all ${
                        paperTheme === "parchment"
                          ? "bg-accent text-white font-semibold shadow-xs"
                          : "border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      Parchment
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaperTheme("ivory")}
                      className={`rounded-xl py-1.5 text-center font-sans text-xs font-medium transition-all ${
                        paperTheme === "ivory"
                          ? "bg-accent text-white font-semibold shadow-xs"
                          : "border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      Ivory
                    </button>
                  </div>
                </div>
              )}

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
