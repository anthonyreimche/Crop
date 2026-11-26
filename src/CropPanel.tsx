// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The Develop "Crop & Straighten" panel: Crop / Done, aspect presets and a
// custom ratio, Straighten, the composition guides, Constrain to image, Show
// grid and Reset. Until Safelight 3.2.0 it was core's built-in.

import { React, api } from "./rt";
import type { CropRect } from "./safelight";
import { computeCropForAspect, fitCropToImage } from "./crop-maths";
import { buildInverseTransform } from "./transform";
import { CROP_GUIDES, GRID_SIZES } from "./crop-guides";
import { DEFAULT_CROP } from "./defaults";
import {
  setCropOptions,
  setCropping,
  setGridSize,
  setGuide,
  setShowGrid,
  useCropMode,
  useCropOptions,
  useGridOptions,
  useImageAspect,
  useLevelWith,
} from "./state";
import { cls } from "./styles";

// ratio is width:height in pixels. 0 = Free (no lock); -1 = Original (locks to
// the source image's own aspect, resolved per photo). Locked ratios can be
// dragged into either orientation (3:2 ⇄ 2:3) from the handles.
export const ASPECTS: { label: string; ratio: number }[] = [
  { label: "Free", ratio: 0 },
  { label: "Original", ratio: -1 },
  { label: "1:1", ratio: 1 },
  { label: "3:2", ratio: 3 / 2 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "16:9", ratio: 16 / 9 },
];

export function CropPanel() {
  const { Panel, Slider } = api.components;
  const { Button, NumberInput, Toggle } = api.ui;
  const useDevelopStore = api.stores.useDevelopStore;
  const { cropping, guide } = useCropMode();
  const { constrain, aspect: cropAspect } = useCropOptions();
  const levelWith = useLevelWith();
  const grid = useGridOptions();
  const straighten = useDevelopStore((s) => s.params.straighten);
  const transform = useDevelopStore((s) => s.params.transform);
  const crop = useDevelopStore((s) => s.params.crop);
  const setParam = useDevelopStore((s) => s.setParam);
  const commitEdit = useDevelopStore((s) => s.commitEdit);
  const aspect = useImageAspect();
  const held = api.develop.useCanvasToolHeld();

  // Another tool or a picker took the canvas: crop mode is left.
  React.useEffect(() => {
    if (cropping && !held) setCropping(false);
  }, [cropping, held]);

  // The crop as it was before a straighten drag began. Fitting against this
  // (rather than the live, shrinking crop) lets rotating back un-crop outward.
  const baseCrop = React.useRef<CropRect | null>(null);

  // Custom ratio entry (width : height).
  const [customW, setCustomW] = React.useState(16);
  const [customH, setCustomH] = React.useState(10);
  const customRatio = customW > 0 && customH > 0 ? customW / customH : 0;

  const applyAspect = (ratio: number) => {
    setCropping(true);
    if (ratio === 0) {
      // Free: unlock the aspect but keep the current box.
      setCropOptions({ aspect: 0 });
      return;
    }
    // Original (-1) resolves to the source image's own aspect. Keep the -1
    // sentinel so "Original" stays selected across photos (and its ratio
    // re-resolves per photo) rather than freezing this photo's aspect.
    const resolved = ratio === -1 ? aspect : ratio;
    setCropOptions({ aspect: ratio === -1 ? -1 : resolved });
    // computeCropForAspect sizes the crop for the unrotated image; if the photo
    // is straightened, shrink it (ratio-preserving) so it fits the rotated
    // image and the handles stay inside.
    let next = computeCropForAspect(resolved, aspect);
    if (constrain) next = fitCropToImage(next, buildInverseTransform(straighten, transform, aspect));
    setParam("crop", next);
    void commitEdit("Crop");
  };

  const aspectActive = (ratio: number) => {
    if (ratio === 0) return cropAspect === 0;
    if (ratio === -1) return cropAspect === -1;
    return cropAspect > 0 && Math.abs(cropAspect - ratio) < 1e-4;
  };

  const resetCrop = () => {
    setCropOptions({ aspect: -1 });
    setParam("crop", { ...DEFAULT_CROP });
    setParam("straighten", 0);
    void commitEdit("Crop reset");
  };

  // Not an edit: the size lives in the extension's settings, so there is
  // nothing to commit.
  const gridSize = (
    <Slider
      label="Grid size"
      value={grid.size}
      min={GRID_SIZES.min}
      max={GRID_SIZES.max}
      step={1}
      defaultValue={GRID_SIZES.initial}
      onChange={setGridSize}
    />
  );

  return (
    <Panel title="Crop & Straighten" defaultOpen={false}>
      <div className={cls.panel}>
        <Button
          full
          active={cropping}
          aria-pressed={cropping}
          title={`Drag the edges or corners to crop · ${levelWith === "right" ? "Right-drag" : "Ctrl-drag"} across a line to level`}
          onClick={() => setCropping(!cropping)}
        >
          {cropping ? "Done" : "Crop"}
        </Button>

        {cropping && (
          <>
            <div className={cls.grid}>
              {ASPECTS.map((a) => (
                <Button key={a.label} size="sm" active={aspectActive(a.ratio)} onClick={() => applyAspect(a.ratio)}>
                  {a.label}
                </Button>
              ))}
            </div>

            {/* Custom ratio: width : height, applied like any preset. */}
            <div className={cls.custom}>
              <NumberInput min={1} width="3rem" aria-label="Custom ratio width" value={customW} onChange={setCustomW} />
              <span className={cls.colon}>:</span>
              <NumberInput min={1} width="3rem" aria-label="Custom ratio height" value={customH} onChange={setCustomH} />
              <Button
                size="sm"
                disabled={customRatio <= 0}
                active={customRatio > 0 && aspectActive(customRatio)}
                onClick={() => applyAspect(customRatio)}
                className={cls.customButton}
              >
                Custom
              </Button>
            </div>
          </>
        )}

        <Slider
          label="Straighten"
          // Displayed value is negated so dragging rotates the intuitive way;
          // the stored `straighten` (and leveling) keep their sign convention.
          value={-straighten}
          min={-45}
          max={45}
          step={0.1}
          onChange={(v) => {
            const s = -v;
            setParam("straighten", s);
            if (constrain) {
              if (!baseCrop.current) baseCrop.current = crop;
              setParam("crop", fitCropToImage(baseCrop.current, buildInverseTransform(s, transform, aspect)));
            }
          }}
          onCommit={() => {
            baseCrop.current = null;
            void commitEdit("Straighten");
          }}
        />

        {cropping && (
          <div className={cls.guides}>
            <div className={cls.guidesHeader}>Overlay</div>
            <div className={cls.grid}>
              {CROP_GUIDES.map((g) => (
                <Button key={g.id} size="sm" active={guide === g.id} title="O cycles · Shift+O flips" onClick={() => setGuide(g.id)}>
                  {g.label}
                </Button>
              ))}
            </div>
            {guide === "grid" && gridSize}
          </div>
        )}

        <Toggle label="Constrain to image" checked={constrain} onChange={(on) => setCropOptions({ constrain: on })} />

        {!cropping && (
          <div title="A grid over the photo, for checking horizons, verticals and lens distortion. Its shortcut is under Preferences ▸ Shortcuts.">
            <Toggle label="Show grid" checked={grid.show} onChange={setShowGrid} />
          </div>
        )}
        {!cropping && grid.show && gridSize}

        <Button full onClick={resetCrop}>
          Reset crop
        </Button>
      </div>
    </Panel>
  );
}
