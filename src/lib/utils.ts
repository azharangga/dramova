/**
 * Utility: merge class names (lightweight replacement for clsx + tailwind-merge).
 */
export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}
