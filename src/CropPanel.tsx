// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The Develop "Crop & Straighten" panel: Crop / Done, aspect presets and a
// custom ratio, Straighten, the composition guides, Constrain to image and
// Reset. Until Safelight 3.2.0 it was core's built-in.

import { React, api } from "./rt";
import type { CropRect } from "./safelight";
import { computeCropForAspect, fitCropToImage } from "./crop-maths";
import { buildInverseTransform } from "./transform";
import { CROP_GUIDES } from "./crop-guides";
import { DEFAULT_CROP } from "./defaults";
import { setCropOptions, setCropping, setGuide, useCropMode, useCropOptions, useImageAspect, useLevelWith } from "./state";
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

const choiceClass = (active: boolean) => `${cls.choice}${active ? ` ${cls.active}` : ""}`;

export function CropPanel() {
  const { Panel, Slider } = api.components;
  const useDevelopStore = api.stores.useDevelopStore;
  const { cropping, guide } = useCropMode();
  const { constrain, aspect: cropAspect } = useCropOptions();
  const levelWith = useLevelWith();
  const straighten = useDevelopStore((s) => s.params.straighten);
  const transform = useDevelopStore((s) => s.params.transform);
  const crop = useDevelopStore((s) => s.params.crop);
  const setParam = useDevelopStore((s) => s.setParam);
  const commitEdit = useDevelopStore((s) => s.commitEdit);
  const aspect = useImageAspect();

  // The crop as it was before a straighten drag began. Fitting against this
  // (rather than the live, shrinking crop) lets rotating back un-crop outward.
  const baseCrop = React.useRef<CropRect | null>(null);

  // Custom ratio entry (width : height).
  const [customW, setCustomW] = React.useState("16");
  const [customH, setCustomH] = React.useState("10");
  const customRatio = (() => {
    const w = parseFloat(customW);
    const h = parseFloat(customH);
    return w > 0 && h > 0 ? w / h : 0;
  })();

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

  return (
    <Panel title="Crop & Straighten" defaultOpen={false}>
      <div className={cls.panel}>
        <button
          type="button"
          onClick={() => setCropping(!cropping)}
          aria-pressed={cropping}
          className={`${cls.toggle}${cropping ? ` ${cls.on}` : ""}`}
        >
          {cropping ? "Done" : "Crop"}
        </button>

        {cropping && (
          <>
            <div className={cls.grid}>
              {ASPECTS.map((a) => (
                <button key={a.label} type="button" onClick={() => applyAspect(a.ratio)} className={choiceClass(aspectActive(a.ratio))}>
                  {a.label}
                </button>
              ))}
            </div>

            {/* Custom ratio: width : height, applied like any preset. */}
            <div className={cls.custom}>
              <input
                type="number"
                min={1}
                aria-label="Custom ratio width"
                value={customW}
                onChange={(e) => setCustomW(e.target.value)}
                className={cls.number}
              />
              <span className={cls.colon}>:</span>
              <input
                type="number"
                min={1}
                aria-label="Custom ratio height"
                value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                className={cls.number}
              />
              <button
                type="button"
                disabled={customRatio <= 0}
                onClick={() => applyAspect(customRatio)}
                className={`${choiceClass(customRatio > 0 && aspectActive(customRatio))} ${cls.customButton}`}
              >
                Custom
              </button>
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
            <div className={cls.guidesHeader}>
              <span>Overlay</span>
              <span>O cycles · Shift+O flips</span>
            </div>
            <div className={cls.grid}>
              {CROP_GUIDES.map((g) => (
                <button key={g.id} type="button" onClick={() => setGuide(g.id)} className={choiceClass(guide === g.id)}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className={cls.check}>
          <input type="checkbox" checked={constrain} onChange={(e) => setCropOptions({ constrain: e.target.checked })} />
          Constrain to image
        </label>

        {cropping && (
          <p className={cls.hint}>
            Drag the edges/corners to crop · {levelWith === "right" ? "Right-drag" : "Ctrl-drag"} across a line to level.
          </p>
        )}

        <button type="button" onClick={resetCrop} className={cls.reset}>
          Reset crop
        </button>
      </div>
    </Panel>
  );
}
