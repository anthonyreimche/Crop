// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The slice of Safelight's extension API this extension touches, mirrored from
// the app's src/extensions/types.ts, src/extensions/develop-host.tsx,
// src/catalog/types.ts, src/state/{develop-store,catalog-store,settings-store}.ts,
// src/modules/develop/canvas-tool.ts and src/ui/components/{Panel,Slider}.tsx.
// Extensions are standalone bundles, so the host's source is not on the type
// path; React types come from @types/react (dev only).

import type { ComponentType, ReactNode } from "react";

/** A release line: the process version its stage text was written for, and
 *  the extension's major version. */
export type Line = 1 | 2 | 3;

export interface StoreApi<T> {
  (): T;
  <U>(selector: (state: T) => U): U;
  getState(): T;
  setState(partial: Partial<T> | ((s: T) => Partial<T>)): void;
  subscribe(listener: (state: T, prev: T) => void): () => void;
}

/** A region of the transformed image, 0 to 1 of the image, y down. */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TransformParams {
  perspectiveV: number;
  perspectiveH: number;
  aspect: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  flipH: boolean;
  flipV: boolean;
}

/** The develop params this extension reads. Core's carry many more fields. */
export interface DevelopParams {
  crop: CropRect;
  /** Degrees, -45 to 45. */
  straighten: number;
  transform: TransformParams;
}

export interface DevelopStoreState {
  params: DevelopParams;
  /** The decoded source's size; 0 before its first frame. */
  sourceSize: { width: number; height: number };
  /** Panels whose preview-off eye is held, by panel id. */
  bypassedPanels: Record<string, boolean>;
  setParam<K extends keyof DevelopParams>(key: K, value: DevelopParams[K]): void;
  /** End a gesture: one undoable history step under `label`. */
  commitEdit(label: string): Promise<void>;
  /** Put `keys` back to their defaults as one undoable step under `label`. */
  resetParams(keys: (keyof DevelopParams)[], label: string): Promise<void>;
}

export interface CatalogStoreState {
  photos: { id: string; width: number; height: number }[];
  activePhotoId: string | null;
}

export interface SettingsState {
  /** Preferences ▸ Interface scale: the CSS zoom on the app's body. */
  uiScale: number;
}

export interface PanelDockDefault {
  module: "library" | "develop";
  direction: "left" | "right" | "bottom";
  order?: number;
  width?: number;
  height?: number;
}

export interface PanelContribution {
  /** Globally unique, e.g. "core.crop" or "my-ext.fancy-curves". */
  id: string;
  title: string;
  component: ComponentType;
  defaultDock?: PanelDockDefault;
  /** Right-clicking the panel's dock header offers "Reset to defaults". */
  onReset?: () => void;
}

/** A matrix a geometry stage derives, row-major: `normalized` acts on image
 *  coordinates (0 to 1), then `square` in the image's square space (centred,
 *  x scaled by the aspect). Core binds Ainv · square · A · normalized. */
export interface ImageSpaceMatrix {
  square: number[];
  normalized: number[];
}

export interface UniformDeclaration {
  key: string;
  glslType: "vec4" | "mat3";
  default: number[];
  /** A mat3 whose derived value is an ImageSpaceMatrix. */
  space?: "image";
}

export type StageValue = number[] | ImageSpaceMatrix;

export interface StageDeriveContext {
  /** One of this extension's settings, or `fallback`. */
  settings<T>(key: string, fallback: T): T;
}

export type StageDerive = (params: DevelopParams, ctx: StageDeriveContext) => Record<string, StageValue>;

export interface ProcessingStageContribution {
  id: string;
  name: string;
  phase: "geometry";
  priority?: number;
  /** Where in the develop program the block runs (official stages only). */
  anchor?: "geometry";
  /** The stage's block in main(); empty: the stage only declares. */
  glsl: string;
  /** Functions main() calls, declared ahead of it. */
  helpers?: string;
  uniforms: UniformDeclaration[];
  /** Textures the block samples (none here; part of a line's text). */
  textures?: { key: string; kind: "photo" }[];
  /** This stage is the photo's geometry: the uniforms of its region and of
   *  its matrix from the transformed image to the source. */
  geometry?: { region: string; inverse: string };
  /** The uniforms' values for a photo (official extensions only). */
  derive?: StageDerive;
}

export interface StylesheetContribution {
  id: string;
  css: string;
}

export interface KeyActionContribution {
  /** Unique action id. */
  id: string;
  label: string;
  category?: "General" | "Develop" | "Library";
  /** Default key combo, e.g. "Shift+O". */
  defaultCombo: string;
  handler(): void;
}

/** One field in an extension's settings section (Preferences ▸ Extensions). */
export interface SettingsSelectField {
  key: string;
  label: string;
  hint?: string;
  type: "select";
  default: string;
  options: { value: string; label: string }[];
}

/** Declarative settings, drawn by the host as the extension's section. */
export interface SettingsContribution {
  title?: string;
  fields: SettingsSelectField[];
}

/** The theme's CSS variables as `var(--color-…)` strings. */
export interface UiTokens {
  readonly surface2: string;
  readonly surface3: string;
  readonly surface4: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly sliderFill: string;
  readonly white: string;
}

export interface PanelProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  /** Double-clicking the track resets to this. */
  defaultValue?: number;
  onChange(value: number): void;
  onCommit?(): void;
}

export interface OverlayRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The develop canvas's mapping, for an overlay. */
export interface DevelopOverlayState {
  /** The region of the transformed image the frame shows; null until first
   *  layout. */
  region: CropRect | null;
  /** The decoded image's width over its height. */
  imageAspect: number;
}

/** An on-image tool holding the develop canvas. */
export interface CanvasTool {
  /** Drawn over the image inside the view; `rect` is the box the frame shows. */
  overlay: ComponentType<{ rect: OverlayRect }>;
  /** Whether zoom and pan still reach the canvas under the overlay. */
  zoomable?: boolean;
  /** The params the live view draws while the tool is held. */
  viewParams?(params: DevelopParams): DevelopParams;
  /** Escape was pressed: core lets the tool go after this. */
  onEscape?(): void;
}

export interface VariableSnapshot<T> {
  name: string;
  value: T;
}

/** Named JSON values every extension can share, in every window. */
export interface SharedVariablesAPI {
  register<T>(name: string, init: { initial: T; description?: string }): VariableSnapshot<T>;
  get<T>(name: string): VariableSnapshot<T> | undefined;
  subscribe<T>(name: string, listener: (snapshot: VariableSnapshot<T>) => void): () => void;
  update<T>(name: string, fn: (current: T) => T): unknown;
}

export interface SafelightAPI {
  version: 1;
  extensionId: string;
  react: typeof import("react");
  registerPanel(c: PanelContribution): void;
  registerProcessingStage(c: ProcessingStageContribution): void;
  registerStylesheet(c: StylesheetContribution): void;
  registerKeybinding(c: KeyActionContribution): void;
  registerSettings(c: SettingsContribution): void;
  /** Persisted per-extension key/value settings. */
  settings: {
    get<T>(key: string, fallback: T): T;
    set(key: string, value: unknown): void;
    /** Fires when any of this extension's settings change (any window). */
    onChange(cb: (key: string, value: unknown) => void): () => void;
  };
  components: {
    /** Core's collapsible panel; inside a dock panel of the same title it
     *  draws its content only. */
    Panel: ComponentType<PanelProps>;
    Slider: ComponentType<SliderProps>;
  };
  stores: {
    useDevelopStore: StoreApi<DevelopStoreState>;
    useCatalogStore: StoreApi<CatalogStoreState>;
    useSettings: StoreApi<SettingsState>;
  };
  develop: {
    /** React hook: the canvas mapping, for an overlay. */
    useDevelopOverlay(): DevelopOverlayState;
    /** Hold the canvas with an on-image tool, or with null let go of it. */
    setCanvasTool(tool: CanvasTool | null): void;
    /** React hook: whether this extension holds the canvas tool. */
    useCanvasToolHeld(): boolean;
  };
  cursors: {
    /** A cursor token's CSS cursor value, as the theme draws it. */
    resolve(token: string): string;
  };
  variables: SharedVariablesAPI;
  ui: { tokens: UiTokens };
}

export interface ExtensionModule {
  activate(api: SafelightAPI): void;
  deactivate?(): void;
}
