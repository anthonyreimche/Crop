// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The crop box over the image: the box, its handles and guide, the dimmed
// photo outside it, the level line (Ctrl-drag, or right-drag by the setting)
// and turning the photo by a drag outside the box, each with its angle beside
// the pointer. Until Safelight 3.2.0 it was core's CropOverlay.

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { React, api } from "./rt";
import type { CropRect, CursorContribution } from "./safelight";
import { constrainCropToImage, type LensDistort } from "./crop-maths";
import { mat3Apply, type Mat3 } from "./transform";
import { guideShapes, type CropGuide } from "./crop-guides";
import { gridStroke, levelWith, type GridOptions } from "./state";
import { cls } from "./styles";

// A quarter arc with an arrowhead at each end, drawn twice (a white halo under
// a dark core) like core's colour picker, so it reads over any photo.
const ROTATE_ART = '<path d="M9 18A9 9 0 0 1 18 9"/><path d="M6 15L9 18L12 15"/><path d="M15 6L18 9L15 12"/>';

/** The cursor outside the crop box, where a drag turns the photo. Named in
 *  the vocabulary of core's crop cursors, so a cursor theme can restyle it. */
export const ROTATE_CURSOR: CursorContribution = {
  id: "crop-rotate",
  image:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
    '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
    `<g stroke="#fff" stroke-width="3">${ROTATE_ART}</g>` +
    `<g stroke="#111" stroke-width="1.4">${ROTATE_ART}</g>` +
    "</g></svg>",
  hotspotX: 12,
  hotspotY: 12,
  fallback: "grab",
};

const resolveCursorCss = (token: string) => api.cursors.resolve(token);

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Handle =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "move"
  | "level"
  | "rotate";

const MIN = 0.04; // smallest crop, normalized to image
const HIT = 12; // px hit radius for handles
// The dim is translucent (styles.ts) so the cropped-out image stays visible,
// darkened, rather than hidden behind a solid panel.

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** A screen coordinate as SVG text, to a hundredth of a pixel. */
const num = (v: number) => String(Math.round(v * 100) / 100);

/** An axis-aligned rectangle as one closed SVG subpath. */
const rectPath = (l: number, t: number, r: number, b: number) =>
  `M${num(l)} ${num(t)}H${num(r)}V${num(b)}H${num(l)}Z`;

// A shorter line is a click, not a line to level to.
const MIN_LINE = 6;

/** An angle to a hundredth of a degree, as the Straighten slider's value field
 *  fits it; 0.005° is under a pixel across an 8000 px photo. */
const hundredth = (deg: number) => Math.round(deg * 100) / 100;

/** The straighten that brings a line drawn (dx, dy) level: its tilt, reduced
 *  to the nearest axis, added to the straighten already there. */
const levelFor = (straightenDeg: number, dx: number, dy: number) => {
  let residual = (Math.atan2(dy, dx) * 180) / Math.PI;
  while (residual > 45) residual -= 90;
  while (residual < -45) residual += 90;
  return hundredth(clamp(straightenDeg + residual, -45, 45));
};

/** Whether this pointer starts a level line, under the gesture setting. */
const startsLevel = (e: { button: number; ctrlKey: boolean; metaKey: boolean }) =>
  levelWith() === "right" ? e.button === 2 : e.button === 0 && (e.ctrlKey || e.metaKey);

/** The angle (x, y) has swept about (cx, cy) since (sx, sy), in degrees,
 *  clockwise on screen, the shorter way round. */
const sweepAbout = (cx: number, cy: number, sx: number, sy: number, x: number, y: number) => {
  let deg = ((Math.atan2(y - cy, x - cx) - Math.atan2(sy - cy, sx - cx)) * 180) / Math.PI;
  if (deg > 180) deg -= 360;
  if (deg <= -180) deg += 360;
  return deg;
};

/** The angle beside the pointer, as the panel's Straighten slider reads it. */
const readout = (straightenDeg: number) => `${(-straightenDeg).toFixed(1)}°`;

// How far the readout sits from the pointer.
const READOUT_GAP = 14;

/** Where the readout for a pointer at (x, y) goes: on the side facing the
 *  centre of `rect`, so it stays on the canvas near any edge. */
const readoutAt = (x: number, y: number, rect: Rect): CSSProperties => {
  const left = x > rect.x + rect.w / 2;
  const up = y > rect.y + rect.h / 2;
  return {
    left: left ? x - READOUT_GAP : x + READOUT_GAP,
    top: up ? y - READOUT_GAP : y + READOUT_GAP,
    transform: left || up ? `translate(${left ? "-100%" : "0"}, ${up ? "-100%" : "0"})` : undefined,
  };
};

/** A turn of the photo by a drag outside the box: about the box's centre as
 *  it was when the drag began, from the straighten then. */
interface TurnDrag {
  mode: "rotate";
  startCrop: CropRect;
  sx: number;
  sy: number;
  cx: number;
  cy: number;
  startDeg: number;
  /** The straighten last handed on. */
  deg: number;
  turned: boolean;
}

type Drag = { mode: Exclude<Handle, "rotate">; startCrop: CropRect; sx: number; sy: number } | TurnDrag;

// CSS cursor matching the handle under the pointer, so resizing reads as
// resizing rather than a bare crosshair. Resolved through the shared cursor
// vocabulary (see cursor-store) so the whole app stays consistent.
const cursorFor = (h: Handle | null): string => {
  switch (h) {
    case "move":
      return resolveCursorCss("crop-move");
    case "nw":
    case "se":
      return resolveCursorCss("crop-resize-nwse");
    case "ne":
    case "sw":
      return resolveCursorCss("crop-resize-nesw");
    case "n":
    case "s":
      return resolveCursorCss("crop-resize-ns");
    case "e":
    case "w":
      return resolveCursorCss("crop-resize-ew");
    case "rotate":
      return resolveCursorCss(ROTATE_CURSOR.id);
    default:
      return resolveCursorCss("crosshair");
  }
};

export interface CropBoxProps {
  rect: Rect; // displayed canvas rect (frame coords); shows the viewCrop region
  crop: CropRect; // transformed-frame, normalized to the image
  viewCrop: CropRect; // transformed-frame region the canvas shows
  inv: Mat3; // transformed coord -> source UV (for image-bounds constraints)
  forward: Mat3; // source UV -> transformed coord (image quad for move clamp)
  distort: LensDistort | null; // lens distortion, so bounds match the warped image
  straightenDeg: number;
  aspect: number; // crop aspect lock, width:height in pixels (0 = free)
  imageAspect: number;
  constrain: boolean;
  guide: CropGuide;
  guideFlip: number; // 0-3: identity / mirror-x / mirror-y / 180°
  grid: GridOptions; // the Grid guide's, and the one drawn while turning
  onChange: (crop: CropRect) => void;
  onCommit: () => void;
  onLevel: (deg: number) => void;
  /** A drag outside the box turned the photo to `deg`; `from` is the crop
   *  when the drag began. */
  onTurn: (deg: number, from: CropRect) => void;
  /** The turn ended, having turned the photo. */
  onTurnEnd: () => void;
}

export function CropBox({
  rect,
  crop,
  viewCrop,
  inv,
  forward,
  distort,
  straightenDeg,
  aspect,
  imageAspect,
  constrain,
  guide,
  guideFlip,
  grid,
  onChange,
  onCommit,
  onLevel,
  onTurn,
  onTurnEnd,
}: CropBoxProps) {
  const dragRef = React.useRef<Drag | null>(null);
  const [line, setLine] = React.useState<{ x: number; y: number; dx: number; dy: number } | null>(
    null,
  );
  // A turn under way: where the pointer is, and the straighten it has reached.
  const [turn, setTurn] = React.useState<{ x: number; y: number; deg: number } | null>(null);
  // Drives the hover cursor; also reflects the active handle while dragging.
  const [hoverHandle, setHoverHandle] = React.useState<Handle | null>(null);
  const dimId = React.useId();

  const frameXY = (e: ReactPointerEvent) => api.develop.framePoint(e.currentTarget, e.clientX, e.clientY);

  const normRatio = aspect > 0 ? aspect / imageAspect : 0; // crop.w / crop.h
  // The same pixel ratio in the opposite orientation (e.g. 3:2 → 2:3), in
  // normalized crop.w/crop.h terms, so a drag can flip the lock automatically.
  const normRatioFlip = aspect > 0 ? 1 / (aspect * imageAspect) : 0;

  // "O" cycles the composition guide and Shift+O flips it, as rebindable
  // shortcuts (index.tsx).

  // straightened-frame point -> frame (screen) coords
  const toScreen = (px: number, py: number) => ({
    x: rect.x + ((px - viewCrop.x) / viewCrop.width) * rect.w,
    y: rect.y + ((py - viewCrop.y) / viewCrop.height) * rect.h,
  });

  const tl = toScreen(crop.x, crop.y);
  const br = toScreen(crop.x + crop.width, crop.y + crop.height);
  const bx = tl.x;
  const by = tl.y;
  const bw = br.x - tl.x;
  const bh = br.y - tl.y;

  // Dim only the cropped-out parts of the actual PHOTO. Its on-screen bounds are
  // the forward-mapped image quad — NOT the displayed buffer rect (`rect`), which
  // transformedViewCrop pads ~6% with a surround-coloured margin so the photo
  // isn't framed in black. Dimming that margin is what drew a dark frame around
  // the photo (and, in Assess, greyed the strip against the white mat); bounding
  // the dim to the photo keeps the margin matching the surround. A straightened
  // or keystoned photo is a quad, so the dim is clipped to the quad itself:
  // its bounding box darkened the surround in the corners.
  const imgPts = [
    mat3Apply(forward, 0, 0),
    mat3Apply(forward, 1, 0),
    mat3Apply(forward, 1, 1),
    mat3Apply(forward, 0, 1),
  ].map((t) => toScreen(t.x, t.y));
  const imgL = Math.min(imgPts[0].x, imgPts[1].x, imgPts[2].x, imgPts[3].x);
  const imgR = Math.max(imgPts[0].x, imgPts[1].x, imgPts[2].x, imgPts[3].x);
  const imgT = Math.min(imgPts[0].y, imgPts[1].y, imgPts[2].y, imgPts[3].y);
  const imgB = Math.max(imgPts[0].y, imgPts[1].y, imgPts[2].y, imgPts[3].y);
  // The quad's box with the crop cut out (even-odd), clipped to the quad: a
  // free crop dragged past the photo can't spill the dim onto the margin.
  const dimPath = `${rectPath(imgL, imgT, imgR, imgB)}${rectPath(bx, by, bx + bw, by + bh)}`;
  const dimOutline = imgPts.map((p) => `${num(p.x)},${num(p.y)}`).join(" ");
  const dimClip = `safelight-crop-dim-${dimId.replace(/:/g, "")}`;

  const cornerHandles: { id: Handle; x: number; y: number }[] = [
    { id: "nw", x: bx, y: by },
    { id: "ne", x: bx + bw, y: by },
    { id: "se", x: bx + bw, y: by + bh },
    { id: "sw", x: bx, y: by + bh },
  ];
  const edgeHandles: { id: Handle; x: number; y: number }[] = [
    { id: "n", x: bx + bw / 2, y: by },
    { id: "e", x: bx + bw, y: by + bh / 2 },
    { id: "s", x: bx + bw / 2, y: by + bh },
    { id: "w", x: bx, y: by + bh / 2 },
  ];
  // Always offer all eight handles, including under an aspect lock — the edge
  // handles let you resize the locked rect from a side anchor (the opposite edge
  // stays put, the perpendicular axis grows symmetrically), not just the corners.
  const handles = [...cornerHandles, ...edgeHandles];

  // Off the handles, inside the box moves it and outside turns the photo.
  const hitTest = (px: number, py: number): Handle => {
    for (const h of handles) {
      if (Math.abs(px - h.x) <= HIT && Math.abs(py - h.y) <= HIT) return h.id;
    }
    if (px >= bx && px <= bx + bw && py >= by && py <= by + bh) return "move";
    return "rotate";
  };

  const turnTo = (d: TurnDrag, px: number, py: number) => {
    // Clockwise on screen turns the photo clockwise: the straighten falls.
    const deg = hundredth(clamp(d.startDeg - sweepAbout(d.cx, d.cy, d.sx, d.sy, px, py), -45, 45));
    setTurn({ x: px, y: py, deg });
    if (deg === d.deg) return;
    d.deg = deg;
    d.turned = true;
    onTurn(deg, d.startCrop);
  };

  const endTurn = (d: TurnDrag) => {
    setTurn(null);
    if (d.turned) onTurnEnd();
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    const level = startsLevel(e);
    if (e.button !== 0 && !level) return;
    const { x: px, y: py } = frameXY(e);
    e.currentTarget.setPointerCapture(e.pointerId);

    if (level) {
      // sx/sy are frame-local layout px (matching frameXY), so deltas computed
      // against them stay in the handles' coordinate space under any UI zoom.
      dragRef.current = { mode: "level", startCrop: crop, sx: px, sy: py };
      setHoverHandle("level");
      setLine({ x: px, y: py, dx: 0, dy: 0 });
      return;
    }
    const mode = hitTest(px, py);
    setHoverHandle(mode);
    if (mode === "rotate") {
      const cx = bx + bw / 2;
      const cy = by + bh / 2;
      dragRef.current = { mode, startCrop: crop, sx: px, sy: py, cx, cy, startDeg: straightenDeg, deg: straightenDeg, turned: false };
      setTurn({ x: px, y: py, deg: straightenDeg });
      return;
    }
    dragRef.current = { mode, startCrop: crop, sx: px, sy: py };
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const d = dragRef.current;
    if (!d) {
      // Idle hover: reflect the handle under the cursor so the pointer shows a
      // matching resize arrow (and signals the handles are grabbable).
      const { x: px, y: py } = frameXY(e);
      setHoverHandle(levelWith() === "ctrl" && (e.ctrlKey || e.metaKey) ? "level" : hitTest(px, py));
      return;
    }
    const { x: px, y: py } = frameXY(e);
    if (d.mode === "level") {
      setLine((l) => (l ? { ...l, dx: px - d.sx, dy: py - d.sy } : l));
      return;
    }
    if (d.mode === "rotate") {
      turnTo(d, px, py);
      return;
    }
    // Screen delta -> straightened-frame delta (both now in layout px).
    const dnx = ((px - d.sx) / rect.w) * viewCrop.width;
    const dny = ((py - d.sy) / rect.h) * viewCrop.height;

    let next = applyDrag(d.mode, d.startCrop, dnx, dny, normRatio, normRatioFlip);
    if (constrain) {
      // Constrain straight to the image. This keeps the result inside the image
      // (and therefore inside the view), so the dragged handle rides the image
      // edge and the crop stays as large as fits. We must NOT pre-clamp to the
      // view first: clamping w/h independently breaks the aspect lock and shoves
      // the anchor corner outside the image, which then collapses the crop to a
      // sliver as the handle leaves the bounds.
      next = constrainCropToImage(
        d.startCrop,
        next,
        d.mode,
        inv,
        forward,
        imageAspect,
        normRatio > 0,
        distort,
      );
    } else {
      // No image constraint: just keep the crop within the visible view so the
      // handles stay reachable.
      next = clampToBounds(next, viewCrop);
    }
    onChange(next);
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (d.mode === "level") {
      const { x: px, y: py } = frameXY(e);
      const dx = px - d.sx;
      const dy = py - d.sy;
      setLine(null);
      if (Math.abs(dx) + Math.abs(dy) > MIN_LINE) onLevel(levelFor(straightenDeg, dx, dy));
      return;
    }
    if (d.mode === "rotate") {
      const { x: px, y: py } = frameXY(e);
      turnTo(d, px, py);
      endTurn(d);
      return;
    }
    onCommit();
  };

  // The system can end a drag without its pointerup: pointercancel, or the capture
  // lost to another window or a desktop gesture. A resize, move or turn keeps what
  // it reached, as on release; a level line, with no end point, is dropped. Without
  // this the box went on following the bare pointer.
  const onPointerEnd = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (d.mode === "level") {
      setLine(null);
      return;
    }
    if (d.mode === "rotate") {
      endTurn(d);
      return;
    }
    onCommit();
  };

  return (
    <div
      className={cls.canvas}
      style={{ cursor: cursorFor(hoverHandle) }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerEnd}
      onLostPointerCapture={onPointerEnd}
      // A right-drag that levels mustn't end in the context menu.
      onContextMenu={(e) => {
        if (levelWith() === "right") e.preventDefault();
      }}
      onPointerLeave={() => {
        if (!dragRef.current) setHoverHandle(null);
      }}
    >
      <svg data-dim="" className={cls.layer} width="100%" height="100%">
        <clipPath id={dimClip}>
          <polygon points={dimOutline} />
        </clipPath>
        <path className={cls.dim} d={dimPath} fillRule="evenodd" clipPath={`url(#${dimClip})`} />
      </svg>

      <div className={cls.box} style={{ left: bx, top: by, width: bw, height: bh }}>
        {/* While turning, the grid shows what's level and plumb in the box. */}
        <GuideSvg guide={turn ? "grid" : guide} flip={turn ? 0 : guideFlip} grid={grid} w={bw} h={bh} />
      </div>

      {handles.map((h) => (
        <div key={h.id} data-handle={h.id} className={cls.handle} style={{ left: h.x, top: h.y }} />
      ))}

      {line && (
        <svg className={cls.layer} width="100%" height="100%">
          <line
            x1={line.x}
            y1={line.y}
            x2={line.x + line.dx}
            y2={line.y + line.dy}
            stroke="#4aa3ff"
            strokeWidth={1.5}
          />
        </svg>
      )}
      {line && Math.abs(line.dx) + Math.abs(line.dy) > MIN_LINE && (
        <div className={cls.readout} style={readoutAt(line.x + line.dx, line.y + line.dy, rect)}>
          {readout(levelFor(straightenDeg, line.dx, line.dy))}
        </div>
      )}
      {turn && (
        <div className={cls.readout} style={readoutAt(turn.x, turn.y, rect)}>
          {readout(turn.deg)}
        </div>
      )}
    </div>
  );
}

function applyDrag(
  mode: Exclude<Handle, "level" | "rotate">,
  c: CropRect,
  dnx: number,
  dny: number,
  normRatio: number,
  normRatioFlip: number,
): CropRect {
  let x = c.x;
  let y = c.y;
  let w = c.width;
  let h = c.height;

  if (mode === "move") {
    x += dnx;
    y += dny;
  } else if (normRatio > 0 && mode.length === 2) {
    // Aspect-locked corner resize, anchored at the opposite corner. The lock
    // can take either orientation (e.g. 3:2 or 2:3); we pick whichever matches
    // the drag's shape, so dragging tall vs wide flips it automatically.
    const right = mode.includes("e");
    const bottom = mode.includes("s");
    const anchorX = right ? c.x : c.x + c.width;
    const anchorY = bottom ? c.y : c.y + c.height;
    const dw = Math.max(MIN, right ? c.width + dnx : c.width - dnx);
    const dh = Math.max(MIN, bottom ? c.height + dny : c.height - dny);
    const rFlip = normRatioFlip > 0 ? normRatioFlip : normRatio;
    const dragRatio = dw / dh;
    const r =
      Math.abs(Math.log(dragRatio / normRatio)) <=
      Math.abs(Math.log(dragRatio / rFlip))
        ? normRatio
        : rFlip;
    // Size so the locked rect reaches the cursor, then keep the smaller side
    // above MIN without breaking the ratio.
    w = Math.max(dw, dh * r);
    h = w / r;
    if (r >= 1) {
      if (h < MIN) {
        h = MIN;
        w = h * r;
      }
    } else if (w < MIN) {
      w = MIN;
      h = w / r;
    }
    x = right ? anchorX : anchorX - w;
    y = bottom ? anchorY : anchorY - h;
  } else if (normRatio > 0) {
    // Aspect-locked edge resize: drive the one axis the handle owns, derive the
    // other from the crop's current ratio, and grow it symmetrically about the
    // centre of the unchanged axis (the opposite edge stays anchored). Keeps the
    // lock's orientation rather than flipping it — that's the corners' job.
    const r = c.width / c.height;
    const cx = c.x + c.width / 2;
    const cy = c.y + c.height / 2;
    if (mode === "e" || mode === "w") {
      w = Math.max(MIN, mode === "e" ? c.width + dnx : c.width - dnx);
      h = w / r;
      if (h < MIN) {
        h = MIN;
        w = h * r;
      }
      x = mode === "e" ? c.x : c.x + c.width - w;
      y = cy - h / 2;
    } else {
      h = Math.max(MIN, mode === "s" ? c.height + dny : c.height - dny);
      w = h * r;
      if (w < MIN) {
        w = MIN;
        h = w / r;
      }
      y = mode === "s" ? c.y : c.y + c.height - h;
      x = cx - w / 2;
    }
  } else {
    if (mode.includes("e")) w += dnx;
    if (mode.includes("w")) {
      x += dnx;
      w -= dnx;
    }
    if (mode.includes("s")) h += dny;
    if (mode.includes("n")) {
      y += dny;
      h -= dny;
    }
  }

  if (w < MIN) {
    if (mode.includes("w")) x = c.x + c.width - MIN;
    w = MIN;
  }
  if (h < MIN) {
    if (mode.includes("n")) y = c.y + c.height - MIN;
    h = MIN;
  }
  return { x, y, width: w, height: h };
}

// The active composition guide, drawn in the crop box's pixel space. `flip`
// mirrors the shapes (Shift+O): 1 = horizontal, 2 = vertical, 3 = both (180°);
// asymmetric guides (golden, diagonal, triangle, spiral) get 4 orientations.
// The Grid guide takes the grid's size, colour and opacity.
function GuideSvg({
  guide,
  flip,
  grid,
  w,
  h,
}: {
  guide: CropGuide;
  flip: number;
  grid: GridOptions;
  w: number;
  h: number;
}) {
  if (w <= 1 || h <= 1) return null;
  const { lines, paths } = guideShapes(guide, w, h, grid.size);
  const lineStroke = guide === "grid" ? gridStroke(grid) : "rgba(255,255,255,0.4)";
  const transform =
    flip === 1
      ? `translate(${w} 0) scale(-1 1)`
      : flip === 2
        ? `translate(0 ${h}) scale(1 -1)`
        : flip === 3
          ? `translate(${w} ${h}) scale(-1 -1)`
          : undefined;
  return (
    <svg className={cls.layer} width={w} height={h}>
      <g transform={transform}>
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={lineStroke}
          strokeWidth={1}
        />
      ))}
      {paths.map((d, i) => (
        <path
          key={`p${i}`}
          d={d}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1}
        />
      ))}
      </g>
    </svg>
  );
}

// Keep the crop within the visible view region.
function clampToBounds(c: CropRect, vc: CropRect): CropRect {
  const w = Math.min(c.width, vc.width);
  const h = Math.min(c.height, vc.height);
  return {
    x: Math.min(Math.max(c.x, vc.x), vc.x + vc.width - w),
    y: Math.min(Math.max(c.y, vc.y), vc.y + vc.height - h),
    width: w,
    height: h,
  };
}
