import type { View } from '../model/store';
import type { Box } from '../model/types';

export const toWorld = (v: View, p: { x: number; y: number }) => ({ x: (p.x - v.x) / v.k, y: (p.y - v.y) / v.k });
export const toScreen = (v: View, x: number, y: number) => ({ x: v.x + x * v.k, y: v.y + y * v.k });
export const screenBox = (v: View, b: Box): Box => ({ x: v.x + b.x * v.k, y: v.y + b.y * v.k, w: b.w * v.k, h: b.h * v.k });
export const norm = (x0: number, y0: number, x1: number, y1: number): Box => ({ x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) });

export type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
export const HANDLES: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
export const handlePos = (h: Handle): [number, number] => ({ nw: [0, 0], n: [.5, 0], ne: [1, 0], e: [1, .5], se: [1, 1], s: [.5, 1], sw: [0, 1], w: [0, .5] } as Record<Handle, [number, number]>)[h];

/** Resize a local box by dragging handle `h` to local point (px, py), integer snapped, min size 1. */
export function resizeBox(orig: Box, h: Handle, px: number, py: number, minW = 1, minH = 1): Box {
  let x0 = orig.x, y0 = orig.y, x1 = orig.x + orig.w, y1 = orig.y + orig.h;
  const wx = Math.round(px), wy = Math.round(py);
  if (h.includes('w')) x0 = Math.min(wx, x1 - minW);
  if (h.includes('e')) x1 = Math.max(wx, x0 + minW);
  if (h.includes('n')) y0 = Math.min(wy, y1 - minH);
  if (h.includes('s')) y1 = Math.max(wy, y0 + minH);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
