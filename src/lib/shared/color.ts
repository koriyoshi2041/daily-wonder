/** Convert HSL to RGB (all values 0-1) */
export function hslToRgb(
  h: number,
  s: number,
  l: number
): [number, number, number] {
  if (s === 0) return [l, l, l]

  const hue2rgb = (p: number, q: number, t: number): number => {
    const tt = t < 0 ? t + 1 : t > 1 ? t - 1 : t
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)]
}

/** Lerp between two hex colors */
export function lerpColor(colorA: string, colorB: string, t: number): string {
  const a = hexToRgb(colorA)
  const b = hexToRgb(colorB)
  if (!a || !b) return colorA

  const r = Math.round(a.r + (b.r - a.r) * t)
  const g = Math.round(a.g + (b.g - a.g) * t)
  const bb = Math.round(a.b + (b.b - a.b) * t)

  return `rgb(${r}, ${g}, ${bb})`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

/** Common creative coding palettes */
export const palettes = {
  twilight: ['#0f0c29', '#302b63', '#24243e', '#5eead4', '#a78bfa'],
  warm: ['#ff6b6b', '#feca57', '#ff9ff3', '#f368e0', '#ff9f43'],
  ocean: ['#0a4c6a', '#1289a7', '#38ada9', '#78e08f', '#b8e994'],
  mono: ['#111111', '#333333', '#666666', '#999999', '#cccccc'],
} as const
