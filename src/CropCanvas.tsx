// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// Crop mode on the canvas: the canvas tool this extension holds while
// cropping. The live view draws the whole transformed image past the crop
// (viewParams), and the crop box is drawn over the region the canvas shows,
// which until the renderer draws the view asked for (crop mode opening, a
// straighten) is still the one before. A drag's writes, a crop or a turn of
// the photo, are throttled to one per frame, so it doesn't re-render the
// panels on every pointer event.

import { React, api } from "./rt";
import type { CanvasTool, DevelopParams, OverlayRect } from "./safelight";
import { fitCropToImage, transformedViewCrop } from "./crop-maths";
import { buildForwardTransform, buildInverseTransform } from "./transform";
import { CropBox } from "./CropBox";
import { cycleGuide, imageAspect, setCropping, useCropMode, useCropOptions, useGridOptions } from "./state";

/** The params the live view draws in crop mode: the crop widened to enclose
 *  the whole transformed image. */
export const viewParams = (p: DevelopParams): DevelopParams => ({
  ...p,
  crop: transformedViewCrop(buildForwardTransform(p.straighten, p.transform, imageAspect())),
});

export function CropCanvas({ rect }: { rect: OverlayRect }) {
  const useDevelopStore = api.stores.useDevelopStore;
  const crop = useDevelopStore((s) => s.params.crop);
  const straighten = useDevelopStore((s) => s.params.straighten);
  const transform = useDevelopStore((s) => s.params.transform);
  const setParam = useDevelopStore((s) => s.setParam);
  const commitEdit = useDevelopStore((s) => s.commitEdit);
  // While the Crop or Transform panel's preview-off eye is held, the renderer
  // shows the un-cropped / un-transformed frame: hide the box, whose handles
  // come from the live, un-bypassed edit.
  const bypassed = useDevelopStore((s) => !!s.bypassedPanels["core.crop"] || !!s.bypassedPanels["core.transform"]);
  const { region, imageAspect: aspect } = api.develop.useDevelopOverlay();
  const { guide, guideFlip } = useCropMode();
  const { constrain, aspect: lock } = useCropOptions();
  const grid = useGridOptions();

  const inv = buildInverseTransform(straighten, transform, aspect);
  const forward = buildForwardTransform(straighten, transform, aspect);
  const viewCrop = region ?? transformedViewCrop(forward);

  // The drag's latest write, waiting for the next frame.
  const pending = React.useRef<(() => void) | null>(null);
  const raf = React.useRef<number | null>(null);
  const schedule = (write: () => void) => {
    pending.current = write;
    if (raf.current == null) {
      raf.current = requestAnimationFrame(() => {
        raf.current = null;
        const run = pending.current;
        pending.current = null;
        run?.();
      });
    }
  };
  const flush = () => {
    if (raf.current != null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
    const run = pending.current;
    pending.current = null;
    run?.();
  };
  // Drop a queued write on unmount (photo or module switch mid-drag) so it
  // can't land this photo's crop in the next photo's params.
  React.useEffect(
    () => () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      pending.current = null;
    },
    [],
  );

  if (bypassed) return null;
  return (
    <CropBox
      rect={rect}
      crop={crop}
      viewCrop={viewCrop}
      inv={inv}
      forward={forward}
      distort={null}
      straightenDeg={straighten}
      aspect={lock === -1 ? aspect : lock}
      imageAspect={aspect}
      constrain={constrain}
      guide={guide}
      guideFlip={guideFlip}
      grid={grid}
      onChange={(next) => schedule(() => setParam("crop", next))}
      onCommit={() => {
        flush();
        void commitEdit("Crop");
      }}
      onLevel={(deg) => {
        setParam("straighten", deg);
        if (constrain) setParam("crop", fitCropToImage(crop, buildInverseTransform(deg, transform, aspect)));
        void commitEdit("Straighten");
      }}
      // As the Straighten slider does: refit from the crop the drag began
      // with, so turning back un-crops.
      onTurn={(deg, from) =>
        schedule(() => {
          setParam("straighten", deg);
          if (constrain) setParam("crop", fitCropToImage(from, buildInverseTransform(deg, transform, aspect)));
        })
      }
      onTurnEnd={() => {
        flush();
        void commitEdit("Straighten");
      }}
    />
  );
}

/** The tool held while cropping. */
export const CROP_TOOL: CanvasTool = {
  overlay: CropCanvas,
  zoomable: false,
  viewParams,
  onEscape: () => setCropping(false),
};

export { cycleGuide };
