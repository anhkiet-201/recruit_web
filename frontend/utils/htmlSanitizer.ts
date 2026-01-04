import DOMPurify from "dompurify";

/**
 * Sanitize HTML content để prevent XSS attacks
 * Chỉ cho phép các tags an toàn cho job postings
 */
export function sanitizeHtml(html: string): string {
  // Client-side only
  if (typeof window === "undefined") {
    return html; // Skip on server-side, sẽ sanitize trên client
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "strong",
      "em",
      "u",
      "s",
      "a",
      "blockquote",
      "code",
      "pre",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Configuration cho DOMPurify - có thể customize per use case
 */
export const SANITIZE_CONFIG = {
  STRICT: {
    ALLOWED_TAGS: ["p", "br", "strong", "em"],
    ALLOWED_ATTR: [],
  },
  MODERATE: {
    ALLOWED_TAGS: [
      "p",
      "br",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "strong",
      "em",
      "u",
    ],
    ALLOWED_ATTR: [],
  },
  PERMISSIVE: {
    ALLOWED_TAGS: [
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "strong",
      "em",
      "u",
      "s",
      "a",
      "code",
      "pre",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
  },
};
