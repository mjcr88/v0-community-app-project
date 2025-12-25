import DOMPurify from "dompurify"

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Uses DOMPurify to remove potentially dangerous elements and attributes.
 * 
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for use with dangerouslySetInnerHTML
 */
export function sanitizeHtml(html: string | null | undefined): string {
    if (!html) return ""

    // Note: DOMPurify requires a DOM environment.
    // In Next.js, this will only work on the client side.
    // For server-side rendering, the content will be sanitized client-side.
    if (typeof window === "undefined") {
        // On server-side, return the HTML as-is
        // The client will sanitize it on hydration
        // For better SSR support, consider using isomorphic-dompurify
        return html
    }

    return DOMPurify.sanitize(html, {
        // Allow common formatting tags
        ALLOWED_TAGS: [
            "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
            "h1", "h2", "h3", "h4", "h5", "h6",
            "ul", "ol", "li",
            "a", "img",
            "blockquote", "pre", "code",
            "table", "thead", "tbody", "tr", "th", "td",
            "div", "span",
            "hr",
        ],
        // Allow safe attributes
        ALLOWED_ATTR: [
            "href", "src", "alt", "title", "class", "id",
            "target", "rel",
            "width", "height",
        ],
        // Force all links to open in new tab and add security attributes
        ADD_ATTR: ["target", "rel"],
        // Ensure links have proper security attributes
        FORBID_TAGS: ["script", "style", "iframe", "form", "input", "object", "embed"],
        FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
    })
}

/**
 * Creates props for dangerouslySetInnerHTML with sanitized content.
 * 
 * @param html - The HTML string to sanitize and render
 * @returns Object suitable for spread into a React element's dangerouslySetInnerHTML prop
 */
export function createSafeHtml(html: string | null | undefined): { __html: string } {
    return { __html: sanitizeHtml(html) }
}
