// The grid: its size (the Grid guide's divisions each way, 2 to 20, kept in
// the extension's settings), Show grid over the photo outside crop mode with
// its shortcut, and the grid's colour and opacity from Preferences.

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { activate, deactivate } from "../src/index";
import { React, initRuntime } from "../src/rt";
import { CropPanel } from "../src/CropPanel";
import { CropCanvas } from "../src/CropCanvas";
import { GRID_SLOT, GridOverlay } from "../src/GridOverlay";
import { guideShapes } from "../src/crop-guides";
import {
  GRID_COLOUR,
  GRID_OPACITY,
  GRID_SIZE,
  SHOW_GRID,
  gridOptions,
  registerOptions,
  resetCropMode,
  setCropping,
  setGuide,
} from "../src/state";
import { fakeApi, type Rig } from "./support/fake-api";

let rig: Rig;

beforeEach(() => {
  rig = fakeApi();
  initRuntime(rig.api);
  resetCropMode();
  registerOptions();
});

afterEach(() => {
  deactivate();
  cleanup();
});

const RECT = { x: 0, y: 0, w: 600, h: 400 };

const setting = (key: string) => rig.api.settings.get<unknown>(key, undefined);

const labels = (root: ParentNode) => rig.sliders(root).map((s) => s.label);
const gridSlider = (root: ParentNode) => {
  const slider = rig.sliders(root).find((s) => s.label === "Grid size");
  if (!slider) throw new Error("no Grid size slider");
  return slider;
};

const lines = (root: ParentNode) => [...root.querySelectorAll("line")];
const at = (attr: string) => (l: Element) => Number(l.getAttribute(attr));
const verticals = (root: ParentNode) => lines(root).filter((l) => l.getAttribute("x1") === l.getAttribute("x2")).map(at("x1"));
const horizontals = (root: ParentNode) => lines(root).filter((l) => l.getAttribute("y1") === l.getAttribute("y2")).map(at("y1"));

/** The crop box over a 600×400 frame showing the whole 3:2 image. */
const mountBox = () => {
  rig.overlay.setState({ region: { x: 0, y: 0, width: 1, height: 1 }, imageAspect: 1.5 });
  const view = render(<CropCanvas rect={RECT} />);
  const box = view.container.querySelector(".safelight-crop-box");
  if (!box) throw new Error("no crop box");
  return box;
};

describe("the grid size", () => {
  it("divides the Grid guide into that many cells each way", () => {
    const s = guideShapes("grid", 1600, 1000, 4);
    expect(s.lines.filter((l) => l.x1 === l.x2).map((l) => l.x1)).toEqual([400, 800, 1200]);
    expect(s.lines.filter((l) => l.y1 === l.y2).map((l) => l.y1)).toEqual([250, 500, 750]);
  });

  it("is 8 until it is set, and stays a whole 2 to 20", () => {
    expect(gridOptions().size).toBe(8);
    for (const [stored, read] of [
      [12, 12],
      [1, 2],
      [50, 20],
      [6.6, 7],
      ["many", 8],
    ] as const) {
      rig.setSetting(GRID_SIZE, stored);
      expect(gridOptions().size).toBe(read);
    }
  });

  it("has a slider under Overlay while Grid is the guide, and only then", () => {
    const view = render(<CropPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Crop" }));
    expect(labels(view.container)).toEqual(["Straighten"]);
    fireEvent.click(screen.getByRole("button", { name: "Grid" }));
    expect(labels(view.container)).toEqual(["Straighten", "Grid size"]);
    expect(gridSlider(view.container)).toMatchObject({ value: 8, min: 2, max: 20, step: 1, defaultValue: 8 });
    fireEvent.click(screen.getByRole("button", { name: "Thirds" }));
    expect(labels(view.container)).toEqual(["Straighten"]);
  });

  it("redraws the box's grid live as the slider moves, and keeps the size in the settings", () => {
    const panel = render(<CropPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Crop" }));
    fireEvent.click(screen.getByRole("button", { name: "Grid" }));
    const box = mountBox();
    expect(lines(box)).toHaveLength(14);
    act(() => gridSlider(panel.container).onChange(5));
    expect(setting(GRID_SIZE)).toBe(5);
    expect(gridSlider(panel.container).value).toBe(5);
    expect(lines(box)).toHaveLength(8);
  });

  it("opens on the size it was left at", () => {
    rig.setSetting(GRID_SIZE, 3);
    act(() => setGuide("grid"));
    expect(lines(mountBox())).toHaveLength(4);
  });
});

describe("Show grid", () => {
  const showing = (over: Partial<{ rect: typeof RECT; imageRect: typeof RECT }> = {}) => {
    rig.overlay.setState({ rect: RECT, imageRect: RECT, ...over });
    rig.setSetting(SHOW_GRID, true);
    rig.setSetting(GRID_SIZE, 4);
    return render(<GridOverlay />).container;
  };

  it("is a checkbox outside crop mode, off until ticked, with the grid size under it", () => {
    const view = render(<CropPanel />);
    const box = screen.getByRole("checkbox", { name: "Show grid" }) as HTMLInputElement;
    expect(box.checked).toBe(false);
    expect(labels(view.container)).toEqual(["Straighten"]);
    fireEvent.click(box);
    expect(setting(SHOW_GRID)).toBe(true);
    expect(box.checked).toBe(true);
    expect(labels(view.container)).toEqual(["Straighten", "Grid size"]);
    act(() => gridSlider(view.container).onChange(12));
    expect(setting(GRID_SIZE)).toBe(12);
  });

  it("leaves crop mode to the Overlay guides", () => {
    render(<CropPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Crop" }));
    expect(screen.queryByRole("checkbox", { name: "Show grid" })).toBeNull();
  });

  // Ctrl+' is Virtual Copies' (Lightroom's virtual copy), which registers
  // first; Ctrl+Alt+O is Lightroom's own key for its loupe grid overlay.
  it("toggles with a Develop shortcut, Ctrl+Alt+O until rebound", () => {
    activate(rig.api);
    const key = rig.keys.find((k) => k.id === "crop.toggleGrid");
    expect(key).toMatchObject({ label: "Show grid", category: "Develop", defaultCombo: "Ctrl+Alt+O" });
    key?.handler();
    expect(setting(SHOW_GRID)).toBe(true);
    key?.handler();
    expect(setting(SHOW_GRID)).toBe(false);
  });

  it("draws from the canvas overlay layer", () => {
    activate(rig.api);
    expect(rig.slots).toEqual([{ id: GRID_SLOT, slot: "develop-canvas-overlay", component: GridOverlay }]);
  });

  it("draws nothing while it's off", () => {
    rig.overlay.setState({ rect: RECT, imageRect: RECT });
    expect(lines(render(<GridOverlay />).container)).toEqual([]);
  });

  it("divides the photo at the grid size, and follows the size live", () => {
    const root = showing();
    expect(verticals(root)).toEqual([150, 300, 450]);
    expect(horizontals(root)).toEqual([100, 200, 300]);
    act(() => rig.setSetting(GRID_SIZE, 2));
    expect(verticals(root)).toEqual([300]);
    expect(horizontals(root)).toEqual([200]);
  });

  it("sits on the shown photo", () => {
    const shown = { x: 40, y: 10, w: 600, h: 400 };
    const svg = showing({ rect: shown, imageRect: shown }).querySelector("svg");
    expect(svg?.style).toMatchObject({ left: "40px", top: "10px", width: "600px", height: "400px" });
    expect(verticals(svg as Element)).toEqual([150, 300, 450]);
  });

  it("stays on the photo zoomed in, drawing only the lines in view", () => {
    const root = showing({ imageRect: { x: -600, y: -400, w: 1800, h: 1200 } });
    expect(verticals(root)).toEqual([300]);
    expect(horizontals(root)).toEqual([200]);
  });

  it("hides while cropping, where the box draws its guide", () => {
    const root = showing();
    act(() => setCropping(true));
    expect(lines(root)).toEqual([]);
    act(() => setCropping(false));
    expect(lines(root)).toHaveLength(6);
  });
});

describe("the grid's colour and opacity", () => {
  const stroke = (root: ParentNode) => [...new Set(lines(root).map((l) => l.getAttribute("stroke")))];

  it("are Preferences: white at 40% until changed", () => {
    activate(rig.api);
    const fields = rig.settingsSections.flatMap((s) => s.fields);
    expect(fields.find((f) => f.key === GRID_COLOUR)).toEqual({
      key: GRID_COLOUR,
      label: "Grid colour",
      hint: expect.any(String),
      type: "select",
      default: "white",
      options: [
        { value: "white", label: "White" },
        { value: "black", label: "Black" },
      ],
    });
    expect(fields.find((f) => f.key === GRID_OPACITY)).toEqual({
      key: GRID_OPACITY,
      label: "Grid opacity",
      hint: expect.any(String),
      type: "number",
      default: 40,
      min: 10,
      max: 100,
      step: 5,
    });
    expect(gridOptions()).toMatchObject({ colour: "white", opacity: 40 });
  });

  it("keep the opacity between 10% and 100%, and an unknown colour white", () => {
    rig.setSetting(GRID_OPACITY, 0);
    rig.setSetting(GRID_COLOUR, "teal");
    expect(gridOptions()).toMatchObject({ colour: "white", opacity: 10 });
    rig.setSetting(GRID_OPACITY, 400);
    expect(gridOptions().opacity).toBe(100);
  });

  it("colour Show grid and the box's grid alike, live", () => {
    rig.setSetting(GRID_COLOUR, "black");
    rig.setSetting(GRID_OPACITY, 70);
    rig.overlay.setState({ rect: RECT, imageRect: RECT });
    rig.setSetting(SHOW_GRID, true);
    const shown = render(<GridOverlay />).container;
    act(() => setGuide("grid"));
    const box = mountBox();
    expect(stroke(shown)).toEqual(["rgba(0, 0, 0, 0.7)"]);
    expect(stroke(box)).toEqual(["rgba(0, 0, 0, 0.7)"]);
    act(() => rig.setSetting(GRID_COLOUR, "white"));
    expect(stroke(shown)).toEqual(["rgba(255, 255, 255, 0.7)"]);
    expect(stroke(box)).toEqual(["rgba(255, 255, 255, 0.7)"]);
  });

  it("leave the other guides as they were", () => {
    rig.setSetting(GRID_COLOUR, "black");
    expect(stroke(mountBox())).toEqual(["rgba(255,255,255,0.4)"]);
  });
});
