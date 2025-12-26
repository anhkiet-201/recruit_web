"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { ImageIcon } from "lucide-react";

interface SafeImageProps extends Omit<ImageProps, "src"> {
  src?: string | null;
  fallback?: string;
  alt: string;
}

export default function SafeImage({
  src,
  fallback = "https://placehold.co/800x400?text=No+Image",
  alt,
  className = "",
  priority = false, // Added priority prop
  ...props
}: SafeImageProps) {
  const [prevSrc, setPrevSrc] = useState<string | null | undefined>(src);
  const [imgSrc, setImgSrc] = useState<string>(src || fallback);
  const [loading, setLoading] = useState(true);

  // Derived state pattern: adjust state during render if props change
  if (src !== prevSrc) {
    setPrevSrc(src);
    setImgSrc(src || fallback);
    // We might want to reset loading state too if src changes
    // But if we do, we risk flickering if it's the same image.
    // However, usually a new src means new loading.
    setLoading(true);
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center z-10 transition-opacity duration-500">
          <ImageIcon className="text-gray-300" size={24} />
        </div>
      )}

      <div className="relative w-full h-full transition-transform duration-1000 ease-[cubic-bezier(0.2,0,0,1)] will-change-transform group-hover:scale-110">
        <Image
          src={imgSrc}
          alt={alt}
          fill={props.fill !== false}
          priority={priority} // Pass priority to Next.js Image
          onLoad={() => setLoading(false)}
          onError={() => {
            setImgSrc(fallback);
            setLoading(false);
          }}
          className={`object-cover transition-all duration-700 ease-out ${
            loading
              ? "blur-xl opacity-0 scale-110"
              : "blur-0 opacity-100 scale-100"
          }`}
          {...props}
        />
      </div>
    </div>
  );
}
