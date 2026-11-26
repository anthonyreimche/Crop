// What activate() registers, the geometry stage every line carries, crop mode
// (the canvas tool and its view), the panel's aspects and straighten, and the
// crop box: drags commit once, a drag the system ends keeps what it reached,
// a drag outside it turns the photo, and the guides draw in the box.

import { createHash } from "node:crypto";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LINE, PANEL_ID, STYLESHEET_ID, activate, deactivate } from "../src/index";
import { React, initRuntime } from "../src/rt";
import type { CropRect, Line, ProcessingStageContribution } from "../src/safelight";
import { STAGE_ID, geometryStage, inverseParts } from "../src/stages";
import { CropPanel } from "../src/CropPanel";
import { CROP_TOOL, CropCanvas, viewParams } from "../src/CropCanvas";
import { CROP_GUIDES, guideShapes } from "../src/crop-guides";
import { computeCropForAspect, fitCropToImage, transformedViewCrop } from "../src/crop-maths";
import { buildForwardTransform, buildInverseTransform, mat3Apply, mat3Mul, type Mat3 } from "../src/transform";
import { DEFAULT_CROP, DEFAULT_TRANSFORM } from "../src/defaults";
import { GRID_SIZE, LEVEL_WITH, OPTIONS, cropMode, cropOptions, registerOptions, resetCropMode, setCropOptions } from "../src/state";
import manifest from "../safelight.json";
import { fakeApi, type Rig } from "./support/fake-api";

/** The app's hash of this stage's text (src/rendering/webgl/essential-stages.test.ts). */
const LINE_HASH = "8b75ed903282d975542d751c938d58afdd762ce26463af4ab2f48ada743acc31";

/** What a line's hash covers, as the app's stageText writes it. */
const stageText = (s: ProcessingStageContribution): string =>
  JSON.stringify([s.id, s.phase, s.priority ?? null, s.anchor ?? null, s.glsl, s.helpers ?? null, s.uniforms, s.textures ?? null]);

const text = ({ derive: _, ...rest }: ProcessingStageContribution) => rest;

/** Core's finish of an image-space matrix (geometry.ts): Ainv · square · A · normalized. */
const finish = (m: { square: number[]; normalized: number[] }, aspect: number): Mat3 => {
  const A: Mat3 = [aspect, 0, -0.5 * aspect, 0, 1, -0.5, 0, 0, 1];
  const Ainv: Mat3 = [1 / aspect, 0, 0.5, 0, 1, 0.5, 0, 0, 1];
  return mat3Mul(Ainv, mat3Mul(m.square, mat3Mul(A, m.normalized)));
};

let rig: Rig;

// jsdom has no pointer capture; the box captures the pointer it is dragged with.
HTMLElement.prototype.setPointerCapture ??= () => {};

beforeEach(() => {
  rig = fakeApi();
  initRuntime(rig.api);
  resetCropMode();
  registerOptions();
  // Crop mode lasts while the canvas is held, which activate wires up.
  activate(rig.api);
});

afterEach(() => {
  deactivate();
  cleanup();
});

describe("geometryStage", () => {
  it.each([1, 2, 3] as Line[])("registers the same text on line %i, as the app froze it", (line) => {
    expect(createHash("sha256").update(stageText(geometryStage(line))).digest("hex")).toBe(LINE_HASH);
  });

  it("declares the geometry at its anchor: the crop is its region, the matrix image-space", () => {
    const stage = geometryStage(3);
    expect(stage).toMatchObject({ id: STAGE_ID, phase: "geometry", anchor: "geometry", glsl: "" });
    expect(stage.geometry).toEqual({ region: "uCrop", inverse: "uInvTransform" });
    expect(stage.helpers).toContain("vec2 cropTransformUV(vec2 o)");
    expect(stage.uniforms.find((u) => u.key === "uInvTransform")?.space).toBe("image");
  });

  it("binds the crop as the region", () => {
    const crop = { x: 0.1, y: 0.2, width: 0.5, height: 0.6 };
    const values = geometryStage(3).derive!({ crop, straighten: 0, transform: DEFAULT_TRANSFORM }, { settings: (_k, f) => f });
    expect(values.uCrop).toEqual([0.1, 0.2, 0.5, 0.6]);
  });

  // Core finishes the matrix for the image's aspect; finished, it is the
  // matrix core built itself before the move, for any aspect.
  it.each([
    ["straighten", 7.5, DEFAULT_TRANSFORM],
    ["keystone and flips", -3, { ...DEFAULT_TRANSFORM, perspectiveV: 30, perspectiveH: -20, flipH: true }],
    ["stretch, scale and offset", 0, { ...DEFAULT_TRANSFORM, aspect: 25, scale: 140, offsetX: 12, offsetY: -8 }],
  ] as const)("finishes to the transformed image's inverse: %s", (_label, straighten, transform) => {
    for (const aspect of [1.5, 2 / 3, 1]) {
      const got = finish(inverseParts(straighten, transform), aspect);
      const want = buildInverseTransform(straighten, transform, aspect);
      got.forEach((v, i) => expect(v).toBeCloseTo(want[i], 12));
    }
  });
});

describe("activate", () => {
  it("registers the Crop & Straighten panel for Develop only, as core's core.crop did, and the stage of its line", () => {
    expect(PANEL_ID).toBe("core.crop");
    expect(rig.panels).toEqual([
      {
        id: "core.crop",
        title: "Crop & Straighten",
        component: CropPanel,
        defaultDock: { module: "develop", direction: "right", order: 3, width: 280, height: 150 },
        modules: ["develop"],
        onReset: expect.any(Function),
      },
    ]);
    expect(LINE).toBe(Number(manifest.version.split(".")[0]));
    expect(rig.stages.map(text)).toEqual([text(geometryStage(LINE))]);
    expect(rig.stylesheets.map((s) => s.id)).toEqual([STYLESHEET_ID]);
  });

  it("resets the crop and straighten as one step, and frees the aspect", () => {
    rig.panels[0].onReset?.();
    expect(rig.calls).toEqual([{ resetParams: ["crop", "straighten"], label: "Reset Crop & Straighten" }]);
    expect(cropOptions().aspect).toBe(0);
  });

  it("registers the level-line gesture as a setting, Ctrl-drag by default", () => {
    expect(rig.settingsSections.map((s) => s.title)).toEqual(["Crop & Straighten"]);
    expect(rig.settingsSections[0].fields[0]).toEqual({
      key: LEVEL_WITH,
      label: "Level line",
      hint: expect.any(String),
      type: "select",
      default: "ctrl",
      options: [
        { value: "ctrl", label: "Ctrl-drag" },
        { value: "right", label: "Right-drag" },
      ],
    });
  });

  it("cycles and flips the guide with O and Shift+O, while cropping only", () => {
    expect(rig.keys.map((k) => [k.id, k.defaultCombo])).toEqual([
      ["crop.cycleGuide", "O"],
      ["crop.flipGuide", "Shift+O"],
      ["crop.toggleGrid", "Ctrl+Alt+O"],
    ]);
    rig.keys[0].handler();
    expect(cropMode().guide).toBe("thirds");
    act(() => {
      rig.api.develop.setCanvasTool(null);
    });
    render(<CropPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Crop" }));
    rig.keys[0].handler();
    rig.keys[1].handler();
    expect(cropMode()).toMatchObject({ guide: "golden", guideFlip: 1 });
  });
});

describe("crop mode", () => {
  it("holds the canvas while cropping, and lets go on Done", () => {
    render(<CropPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Crop" }));
    expect(rig.held()).toBe(CROP_TOOL);
    expect(CROP_TOOL).toMatchObject({ overlay: CropCanvas, zoomable: false });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(rig.held()).toBeNull();
  });

  it("is the kit's button, filled while cropping, with the gestures in its tooltip", () => {
    render(<CropPanel />);
    const start = screen.getByRole("button", { name: "Crop" });
    expect(start.dataset.active).toBeUndefined();
    fireEvent.click(start);
    const done = screen.getByRole("button", { name: "Done" });
    expect(done.dataset.active).toBe("true");
    expect(done.title).toMatch(/Drag the edges or corners to crop/);
  });

  it("leaves crop mode when another tool or a picker takes the canvas", () => {
    render(<CropPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Crop" }));
    act(() => rig.takeCanvas());
    expect(cropMode().cropping).toBe(false);
    expect(screen.getByRole("button", { name: "Crop" })).toBeTruthy();
  });

  it("leaves crop mode on Escape", () => {
    render(<CropPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Crop" }));
    act(() => CROP_TOOL.onEscape?.());
    expect(cropMode().cropping).toBe(false);
    expect(screen.getByRole("button", { name: "Crop" })).toBeTruthy();
  });

  it("draws the whole transformed image past the crop, for the image's aspect", () => {
    const p = { crop: { x: 0.2, y: 0.2, width: 0.5, height: 0.5 }, straighten: 4, transform: DEFAULT_TRANSFORM };
    expect(viewParams(p).crop).toEqual(transformedViewCrop(buildForwardTransform(4, DEFAULT_TRANSFORM, 1.5)));
    rig.develop.setState({ sourceSize: { width: 4000, height: 6000 } });
    expect(viewParams(p).crop).toEqual(transformedViewCrop(buildForwardTransform(4, DEFAULT_TRANSFORM, 4000 / 6000)));
    expect(viewParams(p).straighten).toBe(4);
  });
});

const crop = () => rig.develop.getState().params.crop;

describe("the panel's aspects", () => {
  const choose = (label: string) => {
    render(<CropPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Crop" }));
    fireEvent.click(screen.getByRole("button", { name: label }));
  };

  it.each([
    ["3:2", 3 / 2],
    ["1:1", 1],
    ["16:9", 16 / 9],
  ])("sizes a %s crop for the photo, and commits it", (label, ratio) => {
    choose(label);
    expect(crop()).toEqual(computeCropForAspect(ratio, 1.5));
    expect(rig.calls.at(-1)).toEqual({ commitEdit: "Crop" });
    expect(cropOptions().aspect).toBe(ratio);
  });

  it("fills the chosen aspect's button only", () => {
    choose("3:2");
    const filled = ["Free", "Original", "1:1", "3:2", "4:3", "16:9"].filter(
      (label) => screen.getByRole("button", { name: label }).dataset.active === "true",
    );
    expect(filled).toEqual(["3:2"]);
  });

  it("applies a custom ratio typed into the kit's number fields", () => {
    render(<CropPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Crop" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Custom ratio width" }), { target: { value: "2" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Custom ratio height" }), { target: { value: "1" } });
    const custom = screen.getByRole("button", { name: "Custom" });
    fireEvent.click(custom);
    expect(cropOptions().aspect).toBe(2);
    expect(custom.dataset.active).toBe("true");
  });

  it("keeps Original as the photo's own, whatever photo opens", () => {
    choose("Original");
    expect(cropOptions().aspect).toBe(-1);
    expect(crop()).toEqual(computeCropForAspect(1.5, 1.5));
  });

  it("frees the aspect and keeps the box with Free", () => {
    rig.develop.setState({ params: { ...rig.develop.getState().params, crop: { x: 0.1, y: 0.1, width: 0.3, height: 0.4 } } });
    choose("Free");
    expect(cropOptions().aspect).toBe(0);
    expect(crop()).toEqual({ x: 0.1, y: 0.1, width: 0.3, height: 0.4 });
  });

  it("fits a straightened photo's crop inside it when constrained", () => {
    rig.develop.setState({ params: { ...rig.develop.getState().params, straighten: 6 } });
    choose("1:1");
    expect(crop()).toEqual(fitCropToImage(computeCropForAspect(1, 1.5), buildInverseTransform(6, DEFAULT_TRANSFORM, 1.5)));
  });

  // The decoded source's size, once known, else the photo's stored size: a
  // switch or a rotate of the open photo sizes the next crop for it.
  it("sizes for the open photo, across its first frame, a switch and a rotate", () => {
    choose("1:1");
    expect(crop()).toMatchObject({ width: 4000 / 6000, height: 1 });
    act(() => rig.catalog.setState({ photos: [{ id: "p", width: 4000, height: 6000 }] }));
    fireEvent.click(screen.getByRole("button", { name: "1:1" }));
    expect(crop()).toMatchObject({ width: 1, height: 4000 / 6000 });
    act(() => rig.develop.setState({ sourceSize: { width: 6000, height: 4000 } }));
    fireEvent.click(screen.getByRole("button", { name: "1:1" }));
    expect(crop()).toMatchObject({ width: 4000 / 6000, height: 1 });
  });

  it("puts the crop and straighten back with Reset crop", () => {
    choose("1:1");
    fireEvent.click(screen.getByRole("button", { name: "Reset crop" }));
    expect(crop()).toEqual(DEFAULT_CROP);
    expect(rig.calls.slice(-3)).toEqual([
      { setParam: "crop", value: DEFAULT_CROP },
      { setParam: "straighten", value: 0 },
      { commitEdit: "Crop reset" },
    ]);
    expect(cropOptions().aspect).toBe(-1);
  });
});

describe("straightening from the panel", () => {
  it("refits the crop from where the drag began, so turning back un-crops", () => {
    const view = render(<CropPanel />);
    const [straighten] = rig.sliders(view.container);
    act(() => straighten.onChange(-10));
    const tilted = crop();
    expect(tilted).toEqual(fitCropToImage(DEFAULT_CROP, buildInverseTransform(10, DEFAULT_TRANSFORM, 1.5)));
    act(() => straighten.onChange(0));
    expect(crop()).toEqual(fitCropToImage(DEFAULT_CROP, buildInverseTransform(0, DEFAULT_TRANSFORM, 1.5)));
    act(() => straighten.onCommit?.());
    expect(rig.calls.at(-1)).toEqual({ commitEdit: "Straighten" });
  });

  it("leaves the crop alone unconstrained", () => {
    act(() => setCropOptions({ constrain: false }));
    const view = render(<CropPanel />);
    const [straighten] = rig.sliders(view.container);
    act(() => straighten.onChange(-10));
    expect(crop()).toEqual(DEFAULT_CROP);
    expect(rig.develop.getState().params.straighten).toBe(10);
  });

  it("shares Constrain to image through the options variable", () => {
    render(<CropPanel />);
    fireEvent.click(screen.getByRole("switch", { name: "Constrain to image" }));
    expect(rig.api.variables.get(OPTIONS)?.value).toEqual({ constrain: false, aspect: -1 });
  });
});

// The crop box over the canvas: the frame is 600×400 showing the whole 3:2
// image unchanged, so the crop maps straight onto it.
describe("the crop box", () => {
  const RECT = { x: 0, y: 0, w: 600, h: 400 };

  const mount = (over: Partial<{ crop: CropRect }> = {}) => {
    rig.overlay.setState({ region: { x: 0, y: 0, width: 1, height: 1 }, imageAspect: 1.5 });
    if (over.crop) rig.develop.setState({ params: { ...rig.develop.getState().params, crop: over.crop } });
    const view = render(<CropCanvas rect={RECT} />);
    const overlay = view.container.firstElementChild as HTMLElement;
    return { view, overlay };
  };

  // A straightened photo is a tilted quad on screen. The dim covered the quad's
  // bounding box, which darkened the surround in its corners.
  describe("the dim", () => {
    const points = (el: Element | null) =>
      (el?.getAttribute("points") ?? "")
        .trim()
        .split(/\s+/)
        .map((p) => p.split(",").map(Number));

    it("covers the straightened photo's own outline, and nothing past it", () => {
      const straighten = 10;
      rig.develop.setState({ params: { ...rig.develop.getState().params, straighten } });
      const { overlay } = mount({ crop: { x: 0.3, y: 0.3, width: 0.4, height: 0.4 } });
      const forward = buildForwardTransform(straighten, DEFAULT_TRANSFORM, 1.5);
      const want = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ].map(([u, v]) => {
        const t = mat3Apply(forward, u, v);
        return [t.x * RECT.w, t.y * RECT.h];
      });
      const outline = points(overlay.querySelector("[data-dim] clipPath polygon"));
      expect(outline).toHaveLength(4);
      outline.forEach(([x, y], i) => {
        expect(x).toBeCloseTo(want[i][0], 1);
        expect(y).toBeCloseTo(want[i][1], 1);
      });
    });

    it("leaves the crop undimmed", () => {
      const { overlay } = mount({ crop: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 } });
      const path = overlay.querySelector("[data-dim] path");
      expect(path?.getAttribute("d")).toContain("M150 100H450V300H150Z");
      expect(path?.getAttribute("fill-rule")).toBe("evenodd");
    });
  });

  it("reads the pointer in the frame's layout px under Interface scale", () => {
    act(() => setCropOptions({ aspect: 0 }));
    rig.setFrameZoom(2);
    const { overlay } = mount();
    fireEvent.pointerDown(overlay, { pointerId: 1, button: 0, clientX: 1200, clientY: 800 });
    fireEvent.pointerMove(overlay, { pointerId: 1, buttons: 1, clientX: 1000, clientY: 640 });
    fireEvent.pointerUp(overlay, { pointerId: 1, clientX: 1000, clientY: 640 });
    expect(crop().width).toBeCloseTo(500 / 600);
    expect(crop().height).toBeCloseTo(320 / 400);
  });

  it("hides while the Crop or Transform panel's preview-off eye is held", () => {
    rig.develop.setState({ bypassedPanels: { "core.transform": true } });
    const { view } = mount();
    expect(view.container.innerHTML).toBe("");
  });

  it("commits a drag once, though the capture is let go after the release", () => {
    act(() => setCropOptions({ aspect: 0 }));
    const { overlay } = mount();
    fireEvent.pointerDown(overlay, { pointerId: 1, button: 0, clientX: 600, clientY: 400 });
    fireEvent.pointerMove(overlay, { pointerId: 1, buttons: 1, clientX: 500, clientY: 320 });
    fireEvent.pointerUp(overlay, { pointerId: 1, clientX: 500, clientY: 320 });
    fireEvent.lostPointerCapture(overlay, { pointerId: 1 });
    expect(rig.calls.filter((c) => "commitEdit" in c)).toEqual([{ commitEdit: "Crop" }]);
  });

  it.each([
    ["the pointer is cancelled", (el: HTMLElement) => fireEvent.pointerCancel(el, { pointerId: 1 })],
    ["the capture is lost", (el: HTMLElement) => fireEvent.lostPointerCapture(el, { pointerId: 1 })],
  ])("stops resizing when %s, keeping the crop it reached", (_label, end) => {
    act(() => setCropOptions({ aspect: 0 }));
    const { overlay } = mount();
    fireEvent.pointerDown(overlay, { pointerId: 1, button: 0, clientX: 600, clientY: 400 });
    fireEvent.pointerMove(overlay, { pointerId: 1, buttons: 1, clientX: 500, clientY: 320 });
    end(overlay);
    expect(rig.calls).toContainEqual({ commitEdit: "Crop" });
    fireEvent.pointerMove(overlay, { pointerId: 1, buttons: 0, clientX: 300, clientY: 200 });
    expect(overlay.style.cursor).toBe("move");
  });
});

// The level line over the same 600×400 frame: a line 200 px across and 10 px
// down is 2.8624° off level, so the photo turns by that to a hundredth, shown
// as the panel shows it (negated).
describe("the level line", () => {
  const RECT = { x: 0, y: 0, w: 600, h: 400 };

  const mount = () => {
    rig.overlay.setState({ region: { x: 0, y: 0, width: 1, height: 1 }, imageAspect: 1.5 });
    const view = render(<CropCanvas rect={RECT} />);
    return view.container.firstElementChild as HTMLElement;
  };

  const straightened = () => rig.calls.flatMap((c) => ("setParam" in c && c.setParam === "straighten" ? [c.value as number] : []));

  const draw = (overlay: HTMLElement, down: { button: number; ctrlKey?: boolean }) => {
    fireEvent.pointerDown(overlay, { pointerId: 1, clientX: 100, clientY: 200, ...down });
    fireEvent.pointerMove(overlay, { pointerId: 1, clientX: 300, clientY: 210 });
  };

  it("levels to a Ctrl-drawn line, showing the angle while it is drawn", () => {
    const overlay = mount();
    draw(overlay, { button: 0, ctrlKey: true });
    expect(screen.getByText("-2.9°")).toBeTruthy();
    fireEvent.pointerUp(overlay, { pointerId: 1, clientX: 300, clientY: 210 });
    expect(straightened()).toEqual([2.86]);
    expect(rig.calls).toContainEqual({ commitEdit: "Straighten" });
    expect(screen.queryByText("-2.9°")).toBeNull();
  });

  it("adds the line's tilt to the straighten already there, in the readout too", () => {
    rig.develop.setState({ params: { ...rig.develop.getState().params, straighten: 1 } });
    const overlay = mount();
    draw(overlay, { button: 0, ctrlKey: true });
    expect(screen.getByText("-3.9°")).toBeTruthy();
  });

  it("ignores a right-drag while the gesture is Ctrl-drag", () => {
    const overlay = mount();
    draw(overlay, { button: 2 });
    fireEvent.pointerUp(overlay, { pointerId: 1, clientX: 300, clientY: 210 });
    expect(straightened()).toEqual([]);
  });

  it("levels with a right-drag once that's the setting, and keeps the menu away", () => {
    rig.setSetting(LEVEL_WITH, "right");
    const overlay = mount();
    expect(fireEvent.contextMenu(overlay)).toBe(false);
    draw(overlay, { button: 2 });
    expect(screen.getByText("-2.9°")).toBeTruthy();
    fireEvent.pointerUp(overlay, { pointerId: 1, clientX: 300, clientY: 210 });
    expect(straightened()).toEqual([2.86]);
  });

  it("lets Ctrl-drag crop as a plain drag under the right-drag setting", () => {
    rig.setSetting(LEVEL_WITH, "right");
    act(() => setCropOptions({ aspect: 0 }));
    const overlay = mount();
    fireEvent.pointerDown(overlay, { pointerId: 1, button: 0, ctrlKey: true, clientX: 600, clientY: 400 });
    fireEvent.pointerMove(overlay, { pointerId: 1, ctrlKey: true, clientX: 500, clientY: 320 });
    fireEvent.pointerUp(overlay, { pointerId: 1, clientX: 500, clientY: 320 });
    expect(straightened()).toEqual([]);
    expect(rig.calls).toContainEqual({ commitEdit: "Crop" });
  });

  it("names the gesture in the Crop button's tooltip, not in panel text", () => {
    render(<CropPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Crop" }));
    const done = () => screen.getByRole("button", { name: "Done" });
    expect(done().title).toMatch(/Ctrl-drag across a line to level/);
    act(() => rig.setSetting(LEVEL_WITH, "right"));
    expect(done().title).toMatch(/Right-drag across a line to level/);
    expect(screen.queryByText(/across a line to level/)).toBeNull();
  });
});

describe("the guide in the box", () => {
  it("names the guide shortcuts in the guide buttons' tooltips, not in panel text", () => {
    render(<CropPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Crop" }));
    for (const g of CROP_GUIDES) expect(screen.getByRole("button", { name: g.label }).title).toBe("O cycles · Shift+O flips");
    expect(screen.queryByText(/O cycles/)).toBeNull();
  });

  it("fills the chosen guide's button only", () => {
    render(<CropPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Crop" }));
    fireEvent.click(screen.getByRole("button", { name: "Golden" }));
    const filled = CROP_GUIDES.filter((g) => screen.getByRole("button", { name: g.label }).dataset.active === "true");
    expect(filled.map((g) => g.label)).toEqual(["Golden"]);
  });

  it.each(CROP_GUIDES.map((g) => [g.label, g.id] as const))("draws %s from its button", (label, id) => {
    rig.overlay.setState({ region: { x: 0, y: 0, width: 1, height: 1 }, imageAspect: 1.5 });
    render(<CropPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Crop" }));
    fireEvent.click(screen.getByRole("button", { name: label }));
    const view = render(<CropCanvas rect={{ x: 0, y: 0, w: 600, h: 400 }} />);
    const box = view.container.querySelector<HTMLElement>(".safelight-crop-box");
    if (!box) throw new Error("no crop box");
    const want = guideShapes(id, parseFloat(box.style.width), parseFloat(box.style.height));
    expect(box.querySelectorAll("svg line")).toHaveLength(want.lines.length);
    expect(box.querySelectorAll("svg path")).toHaveLength(want.paths.length);
  });
});

// A drag outside the crop box turns the photo about the box's centre. The
// 600×400 frame shows the whole 3:2 image and the crop is its middle 80%: a
// box from (60, 40) to (540, 360), centred on (300, 200). Drags start at
// (580, 200), 40 px right of the box's right edge.
describe("turning the photo outside the box", () => {
  const RECT = { x: 0, y: 0, w: 600, h: 400 };
  const CROP = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
  const START = { clientX: 580, clientY: 200 };
  /** The sweep about the centre to (x, y), clockwise on screen, in degrees. */
  const sweep = (x: number, y: number) => (Math.atan2(y - 200, x - 300) * 180) / Math.PI;
  /** An angle as the drag stores it, to a hundredth of a degree. */
  const hundredth = (deg: number) => Math.round(deg * 100) / 100;

  const mount = () => {
    rig.overlay.setState({ region: { x: 0, y: 0, width: 1, height: 1 }, imageAspect: 1.5 });
    rig.develop.setState({ params: { ...rig.develop.getState().params, crop: CROP } });
    const view = render(<CropCanvas rect={RECT} />);
    return view.container.firstElementChild as HTMLElement;
  };

  const straighten = () => rig.develop.getState().params.straighten;
  const commits = () => rig.calls.filter((c) => "commitEdit" in c);
  const guideLines = (overlay: HTMLElement) => overlay.querySelectorAll(".safelight-crop-box svg line").length;

  const press = (overlay: HTMLElement, extra: { ctrlKey?: boolean } = {}) =>
    fireEvent.pointerDown(overlay, { pointerId: 1, button: 0, ...START, ...extra });
  const moveTo = (overlay: HTMLElement, clientX: number, clientY: number) =>
    fireEvent.pointerMove(overlay, { pointerId: 1, buttons: 1, clientX, clientY });
  const release = (overlay: HTMLElement, clientX: number, clientY: number) =>
    fireEvent.pointerUp(overlay, { pointerId: 1, clientX, clientY });

  it("shows the rotate cursor outside the box, and the others where they were", () => {
    const overlay = mount();
    expect(rig.cursors.map((c) => c.id)).toEqual(["crop-rotate"]);
    fireEvent.pointerMove(overlay, START);
    expect(overlay.style.cursor).toBe(rig.api.cursors.resolve("crop-rotate"));
    fireEvent.pointerMove(overlay, { clientX: 300, clientY: 200 });
    expect(overlay.style.cursor).toBe("move");
    fireEvent.pointerMove(overlay, { clientX: 545, clientY: 365 });
    expect(overlay.style.cursor).toBe("nwse-resize");
  });

  it("turns the photo the way the pointer sweeps, showing the angle as the slider reads it", () => {
    const overlay = mount();
    press(overlay);
    moveTo(overlay, 580, 250);
    expect(screen.getByText(`${sweep(580, 250).toFixed(1)}°`)).toBeTruthy();
    release(overlay, 580, 250);
    expect(straighten()).toBe(hundredth(-sweep(580, 250)));
    // Clockwise on screen: the middle of the photo's right edge goes down.
    expect(mat3Apply(buildForwardTransform(straighten(), DEFAULT_TRANSFORM, 1.5), 1, 0.5).y).toBeGreaterThan(0.5);
    expect(screen.queryByText(/°$/)).toBeNull();
  });

  it("adds to the straighten already there", () => {
    rig.develop.setState({ params: { ...rig.develop.getState().params, straighten: 5 } });
    const overlay = mount();
    press(overlay);
    moveTo(overlay, 580, 250);
    expect(screen.getByText(`${(sweep(580, 250) - 5).toFixed(1)}°`)).toBeTruthy();
    release(overlay, 580, 250);
    expect(straighten()).toBe(hundredth(5 - sweep(580, 250)));
  });

  // The readout sits on the side of the pointer facing the photo's centre, so
  // it stays on the canvas however near its edge the drag runs.
  it.each([
    ["right of centre: to the pointer's left", 580, 200, { left: "566px", top: "187px", transform: "translate(-100%, -100%)" }],
    ["left of and below centre: above the pointer", 20, 390, { left: "34px", top: "377px", transform: "translate(0, -100%)" }],
    ["left of and above centre: below and right, as before", 20, 10, { left: "34px", top: "25px", transform: "" }],
  ])("keeps the angle on the canvas %s", (_name, x, y, want) => {
    const overlay = mount();
    fireEvent.pointerDown(overlay, { pointerId: 1, button: 0, clientX: x, clientY: y });
    moveTo(overlay, x, y + 1);
    const { left, top, transform } = screen.getByText(/°$/).style;
    expect({ left, top, transform }).toEqual(want);
  });

  it("stops at the slider's 45° either way", () => {
    const overlay = mount();
    press(overlay);
    moveTo(overlay, 300, 500);
    release(overlay, 300, 500);
    expect(straighten()).toBe(-45);
  });

  it("is one Straighten step, however long the drag", () => {
    const overlay = mount();
    press(overlay);
    moveTo(overlay, 580, 230);
    moveTo(overlay, 580, 280);
    moveTo(overlay, 580, 250);
    release(overlay, 580, 250);
    fireEvent.lostPointerCapture(overlay, { pointerId: 1 });
    expect(commits()).toEqual([{ commitEdit: "Straighten" }]);
  });

  it("leaves the photo be for a click outside the box", () => {
    const overlay = mount();
    press(overlay);
    release(overlay, START.clientX, START.clientY);
    expect(straighten()).toBe(0);
    expect(rig.calls).toEqual([]);
  });

  it.each([
    ["the pointer is cancelled", (el: HTMLElement) => fireEvent.pointerCancel(el, { pointerId: 1 })],
    ["the capture is lost", (el: HTMLElement) => fireEvent.lostPointerCapture(el, { pointerId: 1 })],
  ])("keeps the angle it reached when %s", (_label, end) => {
    const overlay = mount();
    press(overlay);
    moveTo(overlay, 580, 250);
    end(overlay);
    expect(straighten()).toBe(hundredth(-sweep(580, 250)));
    expect(commits()).toEqual([{ commitEdit: "Straighten" }]);
    fireEvent.pointerMove(overlay, { pointerId: 1, buttons: 0, clientX: 580, clientY: 350 });
    expect(straighten()).toBe(hundredth(-sweep(580, 250)));
  });

  it("draws the grid in the box while turning, at the grid size, then the guide again", () => {
    rig.setSetting(GRID_SIZE, 6);
    const overlay = mount();
    expect(guideLines(overlay)).toBe(4);
    press(overlay);
    moveTo(overlay, 580, 250);
    expect(guideLines(overlay)).toBe(10);
    release(overlay, 580, 250);
    expect(guideLines(overlay)).toBe(4);
  });

  describe("with each frame drawn", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("refits the crop from where the drag began when constrained, so turning back un-crops", () => {
      const overlay = mount();
      press(overlay);
      moveTo(overlay, 580, 400);
      act(() => vi.advanceTimersToNextFrame());
      const tilted = buildInverseTransform(straighten(), DEFAULT_TRANSFORM, 1.5);
      expect(crop()).toEqual(fitCropToImage(CROP, tilted));
      expect(crop().width).toBeLessThan(CROP.width);
      moveTo(overlay, 580, 200);
      release(overlay, 580, 200);
      expect(straighten()).toBeCloseTo(0, 6);
      expect(crop()).toEqual(fitCropToImage(CROP, buildInverseTransform(straighten(), DEFAULT_TRANSFORM, 1.5)));
      expect(crop().width).toBeCloseTo(CROP.width, 6);
    });

    it("leaves the crop alone unconstrained", () => {
      act(() => setCropOptions({ constrain: false }));
      const overlay = mount();
      press(overlay);
      moveTo(overlay, 580, 400);
      act(() => vi.advanceTimersToNextFrame());
      release(overlay, 580, 400);
      expect(straighten()).toBe(hundredth(-sweep(580, 400)));
      expect(crop()).toEqual(CROP);
    });
  });

  it("leaves Ctrl-drag to the level line, outside the box too", () => {
    const overlay = mount();
    press(overlay, { ctrlKey: true });
    moveTo(overlay, 780, 210);
    expect(guideLines(overlay)).toBe(4);
    release(overlay, 780, 210);
    expect(straighten()).toBe(2.86);
  });
});

