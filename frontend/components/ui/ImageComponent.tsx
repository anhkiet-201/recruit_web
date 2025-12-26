"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface ImageComponentProps extends Omit<ImageProps, "onError"> {
    fallbackSrc?: string;
    priority?: boolean;
}

export default function ImageComponent({
    src,
    alt,
    className,
    fallbackSrc = "https://placehold.co/800x400?text=No+Image",
    priority = false,
    ...props
}: ImageComponentProps) {
    const [error, setError] = useState(false);

    // If there's an error, show fallback or placeholder
    if (error) {
        // If we want a simple placeholder div instead of an image for errors:
        // return <div className={`flex items-center justify-center bg-gray-100 ${className}`}><ImageIcon className="text-gray-400" /></div>;

        // But for consistency with Image props, we might want to render a fallback Image
        return (
            <div className={`relative bg-gray-100 overflow-hidden ${className}`} style={{ width: props.width, height: props.height }}>
                 <Image
                    src={fallbackSrc}
                    alt={alt || "Fallback"}
                    className="object-cover"
                    {...props} // pass through width/height/fill
                    onError={undefined} // Prevent infinite loop if fallback fails
                />
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            className={className}
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            onError={() => setError(true)}
            {...props}
        />
    );
}
