/**
 * ASTRA — Category Color Map
 * Maps each category name to its CSS variable and text pairing.
 */

export const CATEGORY_COLORS = {
  Arts:     { bg: 'var(--c-arts)',     text: 'var(--c-arts-text)',     hex: '#FF4D8D', textHex: '#111111', cls: 'bg-arts' },
  Tech:     { bg: 'var(--c-tech)',     text: 'var(--c-tech-text)',     hex: '#2F5BFF', textHex: '#FFFFFF', cls: 'bg-tech' },
  Gaming:   { bg: 'var(--c-gaming)',   text: 'var(--c-gaming-text)',   hex: '#B6FF3B', textHex: '#111111', cls: 'bg-gaming' },
  Business: { bg: 'var(--c-business)', text: 'var(--c-business-text)', hex: '#FF7A1A', textHex: '#111111', cls: 'bg-business' },
  Fun:      { bg: 'var(--c-fun)',      text: 'var(--c-fun-text)',      hex: '#FFD60A', textHex: '#111111', cls: 'bg-fun' },
}

/**
 * Returns the color config for a category, with a safe fallback.
 */
export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || { bg: 'var(--c-black)', text: 'var(--c-white)', hex: '#111111', textHex: '#FFFFFF', cls: '' }
}

/**
 * All five category hex values in order, used for hero color wipe.
 */
export const CATEGORY_HEX_SEQUENCE = ['#FF4D8D', '#2F5BFF', '#B6FF3B', '#FF7A1A', '#FFD60A']
