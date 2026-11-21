// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// Show grid: a grid over the photo in Develop, drawn from core's click-through
// canvas overlay layer. It divides the whole photo at the grid size, so zoomed
// in it stays on the photo and only the lines in view draw. Crop mode has its
// own guides in the crop box, so the grid steps aside while cropping.

import { React, api } from "./rt";
import { gridStroke, useCropMode, useGridOptions } from "./state";
import { cls } from "./styles";

export const GRID_SLOT = "safelight.crop.grid";

/** Where the lines cutting `length`, from `start`, into `cells` fall strictly
 *  inside 0 to `extent`. */
function cuts(start: number, length: number, cells: number, extent: number): number[] {
  const at: number[] = [];
  for (let i = 1; i < cells; i++) {
    const p = start + (i / cells) * length;
    if (p > 0 && p < extent) at.push(p);
  }
  return at;
}

export function GridOverlay() {
  const { rect, imageRect } = api.develop.useDevelopOverlay();
  const { cropping } = useCropMode();
  const grid = useGridOptions();
  if (!grid.show || cropping || !rect || !imageRect) return null;
  const stroke = gridStroke(grid);
  const xs = cuts(imageRect.x - rect.x, imageRect.w, grid.size, rect.w);
  const ys = cuts(imageRect.y - rect.y, imageRect.h, grid.size, rect.h);
  return (
    <svg className={cls.photoGrid} style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}>
      {xs.map((x) => (
        <line key={`x${x}`} x1={x} y1={0} x2={x} y2={rect.h} stroke={stroke} strokeWidth={1} />
      ))}
      {ys.map((y) => (
        <line key={`y${y}`} x1={0} y1={y} x2={rect.w} y2={y} stroke={stroke} strokeWidth={1} />
      ))}
    </svg>
  );
}
