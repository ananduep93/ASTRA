/**
 * Concatenate class names, filtering out falsy values.
 * Lightweight alternative to clsx + tailwind-merge.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
