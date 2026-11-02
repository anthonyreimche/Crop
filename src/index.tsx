// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// Registers the Develop "Crop & Straighten" panel, crop mode on the canvas,
// its guide shortcuts, and the photo's geometry stage. It was core's built-in
// `core.crop` until Safelight 3.2.0 and keeps that panel id, so saved layouts
// keep it where it was.

import { CROP_TOOL } from "./CropCanvas";
import { CropPanel } from "./CropPanel";
import { initRuntime } from "./rt";
import type { Line, SafelightAPI } from "./safelight";
import { geometryStage } from "./stages";
import { cropMode, cycleGuide, cycleGuideFlip, registerLevelSetting, registerOptions, resetCropMode, setCropOptions, subscribeCropMode } from "./state";
import { cropCss } from "./styles";

export const PANEL_ID = "core.crop";
export const STYLESHEET_ID = "safelight.crop.styles";

/** The release line: this release's major version (vite.config.ts). */
export const LINE = __SAFELIGHT_LINE__ as Line;

let stopFollowing: (() => void) | null = null;

export function activate(host: SafelightAPI): void {
  initRuntime(host);
  resetCropMode();
  registerOptions();
  registerLevelSetting();
  host.registerStylesheet({ id: STYLESHEET_ID, css: cropCss(host.ui.tokens) });
  host.registerProcessingStage(geometryStage(LINE));
  host.registerPanel({
    id: PANEL_ID,
    title: "Crop & Straighten",
    component: CropPanel,
    defaultDock: { module: "develop", direction: "right", order: 3, width: 280, height: 150 },
    onReset: () => {
      setCropOptions({ aspect: 0 });
      void host.stores.useDevelopStore.getState().resetParams(["crop", "straighten"], "Reset Crop & Straighten");
    },
  });
  // Crop mode holds the canvas; letting go of it (Escape, or another tool
  // taking the canvas) leaves crop mode.
  stopFollowing?.();
  stopFollowing = subscribeCropMode(() => host.develop.setCanvasTool(cropMode().cropping ? CROP_TOOL : null));
  const whileCropping = (run: () => void) => () => {
    if (cropMode().cropping) run();
  };
  host.registerKeybinding({ id: "crop.cycleGuide", label: "Cycle crop guide", category: "Develop", defaultCombo: "O", handler: whileCropping(cycleGuide) });
  host.registerKeybinding({ id: "crop.flipGuide", label: "Flip crop guide", category: "Develop", defaultCombo: "Shift+O", handler: whileCropping(cycleGuideFlip) });
}

export function deactivate(): void {
  stopFollowing?.();
  stopFollowing = null;
  resetCropMode();
}
