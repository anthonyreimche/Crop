// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The crop tool's view state, never part of the edit: whether crop mode is on,
// and the composition guide. Ephemeral: it starts closed, on the thirds, each
// session, as core's did. The crop's options (constrain to image, aspect lock)
// live in a shared variable, so the Transform extension refits the crop the
// way this panel would.

import { React, api } from "./rt";
import { nextGuide, type CropGuide } from "./crop-guides";

interface CropMode {
  cropping: boolean;
  guide: CropGuide;
  /** 0-3: identity / mirror-x / mirror-y / 180°. */
  guideFlip: number;
}

let mode: CropMode = { cropping: false, guide: "thirds", guideFlip: 0 };
const listeners = new Set<() => void>();

const set = (partial: Partial<CropMode>) => {
  mode = { ...mode, ...partial };
  for (const listener of listeners) listener();
};

export const cropMode = (): CropMode => mode;
export const setCropping = (cropping: boolean) => mode.cropping !== cropping && set({ cropping });
export const setGuide = (guide: CropGuide) => set({ guide });
export const cycleGuide = () => set({ guide: nextGuide(mode.guide) });
export const cycleGuideFlip = () => set({ guideFlip: (mode.guideFlip + 1) % 4 });

export const subscribeCropMode = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

/** React hook: the crop tool's view state. */
export const useCropMode = (): CropMode => React.useSyncExternalStore(subscribeCropMode, cropMode);

/** Back to closed, on the thirds (tests, and a new activation). */
export const resetCropMode = () => set({ cropping: false, guide: "thirds", guideFlip: 0 });

/** Whether a crop keeps inside the image, and its aspect lock: -1 the image's
 *  own, 0 free, else width over height in pixels. */
export interface CropOptions {
  constrain: boolean;
  aspect: number;
}

export const OPTIONS = "safelight.crop.options";
const INITIAL: CropOptions = { constrain: true, aspect: -1 };

export function registerOptions(): void {
  api.variables.register<CropOptions>(OPTIONS, {
    initial: INITIAL,
    description: "Crop & Straighten: whether a crop keeps inside the image, and its aspect lock.",
  });
}

export const cropOptions = (): CropOptions => api.variables.get<CropOptions>(OPTIONS)?.value ?? INITIAL;

export const setCropOptions = (partial: Partial<CropOptions>) =>
  void api.variables.update<CropOptions>(OPTIONS, (current) => ({ ...current, ...partial }));

/** React hook: the crop's options. */
export function useCropOptions(): CropOptions {
  const [options, setOptions] = React.useState(cropOptions);
  React.useEffect(() => api.variables.subscribe<CropOptions>(OPTIONS, (s) => setOptions(s.value)), []);
  return options;
}

/** The decoded image's width over its height: the source's own size once it
 *  has a frame, the photo's stored size before. Decode paths disagree on
 *  baking EXIF orientation, so the stored size can be transposed. */
export function imageAspect(): number {
  const { sourceSize } = api.stores.useDevelopStore.getState();
  if (sourceSize.width > 0 && sourceSize.height > 0) return sourceSize.width / sourceSize.height;
  const { photos, activePhotoId } = api.stores.useCatalogStore.getState();
  const photo = photos.find((p) => p.id === activePhotoId);
  return photo && photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 1;
}

/** React hook: imageAspect, kept up to date with the source's first frame and
 *  with a switch or rotate of the open photo. */
export function useImageAspect(): number {
  api.stores.useDevelopStore((s) => s.sourceSize);
  api.stores.useCatalogStore((s) => {
    const photo = s.photos.find((p) => p.id === s.activePhotoId);
    return photo ? `${photo.width}x${photo.height}` : "";
  });
  return imageAspect();
}

/** What draws the level line: Ctrl/⌘-drag, or a right-button drag. A setting
 *  of this extension's, under Preferences ▸ Extensions. */
export type LevelWith = "ctrl" | "right";

export const LEVEL_WITH = "levelWith";

export function registerLevelSetting(): void {
  api.registerSettings({
    title: "Crop & Straighten",
    fields: [
      {
        key: LEVEL_WITH,
        label: "Level line",
        hint: "How you draw a line along the horizon or an edge to level the photo while cropping. Right-drag leaves Ctrl-drag to crop as a plain drag.",
        type: "select",
        default: "ctrl",
        options: [
          { value: "ctrl", label: "Ctrl-drag" },
          { value: "right", label: "Right-drag" },
        ],
      },
    ],
  });
}

export const levelWith = (): LevelWith => (api.settings.get<string>(LEVEL_WITH, "ctrl") === "right" ? "right" : "ctrl");

/** React hook: the level-line gesture, following a change in Preferences. */
export function useLevelWith(): LevelWith {
  const [value, setValue] = React.useState(levelWith);
  React.useEffect(
    () =>
      api.settings.onChange((key) => {
        if (key === LEVEL_WITH) setValue(levelWith());
      }),
    [],
  );
  return value;
}
