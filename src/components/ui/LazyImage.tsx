"use client";

import React, { useState } from "react";
import Image, { type ImageProps } from "next/image";

export interface LazyImageProps extends Omit<ImageProps, "onLoad"> {
  containerClassName?: string;
  showShimmer?: boolean;
}

export function LazyImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  showShimmer = true,
  priority = false,
  fill,
  sizes,
  ...rest
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={`relative overflow-hidden ${
        fill ? "h-full w-full" : ""
      } ${containerClassName}`}
    >
      {/* Background skeleton shimmer while image decodes */}
      {showShimmer && !isLoaded && !hasError && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-surface-2/60 animate-pulse transition-opacity duration-500"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      )}

      {hasError ? (
        <div className="flex h-full w-full items-center justify-center bg-surface-2/40 p-4 text-center text-xs text-muted">
          <span>Unable to load image</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          sizes={sizes}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`transition-all duration-700 ease-out ${
            isLoaded
              ? "opacity-100 scale-100 blur-0"
              : "opacity-0 scale-[0.98] blur-[4px]"
          } ${className}`}
          {...rest}
        />
      )}
    </div>
  );
}
