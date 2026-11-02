// A stand-in Safelight API over real React and zustand. The develop store holds
// the crop, straighten and transform the way core's does and records every
// write; the catalog store holds the open photo's stored size; the canvas tool
// and the shared variables are kept as core would keep them. Core's Panel draws
// its children, and core's Slider is a stub that keeps the props it was last
// rendered with, so a test can drive it the way the real one would. The
// extension's own settings are kept in a map, as core persists them.

import * as React from "react";
import { create } from "zustand";
import type {
  CanvasTool,
  CatalogStoreState,
  DevelopOverlayState,
  DevelopParams,
  DevelopStoreState,
  KeyActionContribution,
  PanelContribution,
  PanelProps,
  ProcessingStageContribution,
  SafelightAPI,
  SettingsContribution,
  SettingsState,
  SliderProps,
  StoreApi,
  StylesheetContribution,
  UiTokens,
  VariableSnapshot,
} from "../../src/safelight";
import { DEFAULT_CROP, DEFAULT_TRANSFORM } from "../../src/defaults";

export type DevelopCall =
  | { setParam: keyof DevelopParams; value: unknown }
  | { commitEdit: string }
  | { resetParams: (keyof DevelopParams)[]; label: string };

export const TOKENS: UiTokens = {
  surface2: "var(--color-surface-2)",
  surface3: "var(--color-surface-3)",
  surface4: "var(--color-surface-4)",
  textPrimary: "var(--color-text-primary)",
  textSecondary: "var(--color-text-secondary)",
  textMuted: "var(--color-text-muted)",
  sliderFill: "var(--color-slider-fill)",
  white: "var(--color-white)",
};

/** Core's default cursor tokens the crop box uses, as CSS. */
const CURSORS: Record<string, string> = {
  "crop-move": "move",
  "crop-resize-nwse": "nwse-resize",
  "crop-resize-nesw": "nesw-resize",
  "crop-resize-ns": "ns-resize",
  "crop-resize-ew": "ew-resize",
  crosshair: "crosshair",
};

export const PARAMS: DevelopParams = { crop: { ...DEFAULT_CROP }, straighten: 0, transform: { ...DEFAULT_TRANSFORM } };

export interface Rig {
  api: SafelightAPI;
  develop: StoreApi<DevelopStoreState>;
  catalog: StoreApi<CatalogStoreState>;
  overlay: StoreApi<DevelopOverlayState>;
  calls: DevelopCall[];
  panels: PanelContribution[];
  stages: ProcessingStageContribution[];
  stylesheets: StylesheetContribution[];
  keys: KeyActionContribution[];
  settingsSections: SettingsContribution[];
  /** Set one of the extension's settings, as Preferences would. */
  setSetting(key: string, value: unknown): void;
  /** The canvas tool this extension holds, or null. */
  held(): CanvasTool | null;
  /** The latest props of each slider drawn in `root`, in document order. */
  sliders(root: ParentNode): SliderProps[];
}

export function fakeApi({
  params = {} as Partial<DevelopParams>,
  source = { width: 0, height: 0 },
  photo = { width: 6000, height: 4000 },
} = {}): Rig {
  const calls: DevelopCall[] = [];
  const panels: PanelContribution[] = [];
  const stages: ProcessingStageContribution[] = [];
  const stylesheets: StylesheetContribution[] = [];
  const keys: KeyActionContribution[] = [];
  const settingsSections: SettingsContribution[] = [];
  const stored = new Map<string, unknown>();
  const settingListeners = new Set<(key: string, value: unknown) => void>();
  const setSetting = (key: string, value: unknown) => {
    stored.set(key, value);
    for (const l of settingListeners) l(key, value);
  };
  const tool = create<{ tool: CanvasTool | null }>(() => ({ tool: null }));
  const variables = new Map<string, unknown>();
  const listeners = new Map<string, Set<(s: VariableSnapshot<unknown>) => void>>();
  const sliderProps = new Map<number, SliderProps>();
  let nextSlider = 0;

  const develop: StoreApi<DevelopStoreState> = create<DevelopStoreState>()((set) => ({
    params: { ...PARAMS, ...params },
    sourceSize: source,
    bypassedPanels: {},
    setParam: (key, value) => {
      calls.push({ setParam: key, value });
      set((s) => ({ params: { ...s.params, [key]: value } }));
    },
    commitEdit: async (label) => {
      calls.push({ commitEdit: label });
    },
    resetParams: async (keys, label) => {
      calls.push({ resetParams: keys, label });
      set({ params: { ...PARAMS } });
    },
  }));
  const catalog: StoreApi<CatalogStoreState> = create<CatalogStoreState>()(() => ({
    photos: [{ id: "p", ...photo }],
    activePhotoId: "p",
  }));
  const settings: StoreApi<SettingsState> = create<SettingsState>()(() => ({ uiScale: 1 }));
  const overlay: StoreApi<DevelopOverlayState> = create<DevelopOverlayState>()(() => ({ region: null, imageAspect: 1.5 }));

  function Panel({ children, title }: PanelProps) {
    return React.createElement("section", { "aria-label": title }, children);
  }

  function Slider(props: SliderProps) {
    const id = React.useRef(nextSlider++).current;
    sliderProps.set(id, props);
    return React.createElement("div", { "data-slider": id }, `${props.label} ${props.value}`);
  }

  const snapshot = <T>(name: string): VariableSnapshot<T> => ({ name, value: variables.get(name) as T });

  const api: SafelightAPI = {
    version: 1,
    extensionId: "safelight.crop",
    react: React,
    registerPanel: (c) => void panels.push(c),
    registerProcessingStage: (c) => void stages.push(c),
    registerStylesheet: (c) => void stylesheets.push(c),
    registerKeybinding: (c) => void keys.push(c),
    registerSettings: (c) => void settingsSections.push(c),
    settings: {
      get: <T>(key: string, fallback: T) => (stored.has(key) ? (stored.get(key) as T) : fallback),
      set: setSetting,
      onChange: (cb) => {
        settingListeners.add(cb);
        return () => void settingListeners.delete(cb);
      },
    },
    components: { Panel, Slider },
    stores: { useDevelopStore: develop, useCatalogStore: catalog, useSettings: settings },
    develop: {
      useDevelopOverlay: () => overlay(),
      setCanvasTool: (t) => tool.setState({ tool: t }),
      useCanvasToolHeld: () => tool((s) => s.tool !== null),
    },
    cursors: { resolve: (token) => CURSORS[token] ?? "default" },
    variables: {
      register: (name, init) => {
        if (!variables.has(name)) variables.set(name, init.initial);
        return snapshot(name);
      },
      get: (name) => (variables.has(name) ? snapshot(name) : undefined),
      subscribe: (name, listener) => {
        const set = listeners.get(name) ?? new Set();
        listeners.set(name, set);
        set.add(listener as (s: VariableSnapshot<unknown>) => void);
        if (variables.has(name)) listener(snapshot(name));
        return () => void set.delete(listener as (s: VariableSnapshot<unknown>) => void);
      },
      update: (name, fn) => {
        variables.set(name, fn(variables.get(name) as never));
        for (const l of listeners.get(name) ?? []) l(snapshot(name));
        return { ok: true };
      },
    },
    ui: { tokens: TOKENS },
  };

  return {
    api,
    develop,
    catalog,
    overlay,
    calls,
    panels,
    stages,
    stylesheets,
    keys,
    settingsSections,
    setSetting,
    held: () => tool.getState().tool,
    sliders: (root) =>
      [...root.querySelectorAll("[data-slider]")].map((el) => {
        const props = sliderProps.get(Number(el.getAttribute("data-slider")));
        if (!props) throw new Error("a slider without props");
        return props;
      }),
  };
}
