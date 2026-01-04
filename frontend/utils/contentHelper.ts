/**
 * Helper functions để xử lý job content (HTML vs plain text)
 * Đảm bảo backward compatibility với plain text jobs hiện tại
 */

/**
 * Kiểm tra xem content có phải là HTML không
 */
export function isHtmlContent(content: string): boolean {
  if (!content) return false;

  // Check for HTML tags
  return /<[a-z][\s\S]*>/i.test(content);
}

/**
 * Convert plain text thành HTML với formatting cơ bản
 * Preserves paragraphs và line breaks
 */
export function convertPlainTextToHtml(text: string): string {
  if (!text) return "";

  // Split by double newlines (paragraphs)
  const paragraphs = text.split(/\n\s*\n/);

  return paragraphs
    .map((para) => {
      // Replace single newlines with <br> tags
      const formatted = para.trim().replace(/\n/g, "<br>");
      return `<p>${formatted}</p>`;
    })
    .join("");
}

/**
 * Extract plain text từ HTML content
 * Useful cho search indexing và preview
 */
export function htmlToPlainText(html: string): string {
  if (typeof window === "undefined") {
    // Server-side: simple regex-based stripping
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, "")
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Client-side: use DOM parser
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}

/**
 * Truncate HTML content to specified length
 * Preserves HTML structure
 */
export function truncateHtml(html: string, maxLength: number): string {
  const plainText = htmlToPlainText(html);

  if (plainText.length <= maxLength) {
    return html;
  }

  // Truncate plain text first
  const truncated = plainText.substring(0, maxLength);

  // Try to break at word boundary
  const lastSpace = truncated.lastIndexOf(" ");
  const final = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;

  return final + "...";
}

/**
 * Count words in content (HTML hoặc plain text)
 */
export function countWords(content: string): number {
  const text = isHtmlContent(content) ? htmlToPlainText(content) : content;
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Count characters in content (excluding HTML tags)
 */
export function countCharacters(content: string): number {
  const text = isHtmlContent(content) ? htmlToPlainText(content) : content;
  return text.length;
}

/**
 * Extract first heading từ HTML content
 * Useful for auto-generating title suggestions
 */
export function extractFirstHeading(html: string): string | null {
  if (!isHtmlContent(html)) return null;

  const headingMatch = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
  return headingMatch ? htmlToPlainText(headingMatch[1]) : null;
}
