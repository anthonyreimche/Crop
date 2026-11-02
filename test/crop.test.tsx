// What activate() registers, the geometry stage every line carries, crop mode
// (the canvas tool and its view), the panel's aspects and straighten, and the
// crop box: drags commit once, a drag the system ends keeps what it reached,
// and the guides draw in the box.

import { createHash } from "node:crypto";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LINE, PANEL_ID, STYLESHEET_ID, activate, deactivate } from "../src/index";
import { React, initRuntime } from "../src/rt";
import type { CropRect, Line, ProcessingStageContribution } from "../src/safelight";
import { STAGE_ID, geometryStage, inverseParts } from "../src/stages";
import { CropPanel } from "../src/CropPanel";
import { CROP_TOOL, CropCanvas, viewParams } from "../src/CropCanvas";
import { CROP_GUIDES, guideShapes } from "../src/crop-guides";
import { computeCropForAspect, fitCropToImage, transformedViewCrop } from "../src/crop-maths";
import { buildForwardTransform, buildInverseTransform, mat3Mul, type Mat3 } from "../src/transform";
import { DEFAULT_CROP, DEFAULT_TRANSFORM } from "../src/defaults";
import { LEVEL_WITH, OPTIONS, cropMode, cropOptions, registerOptions, resetCropMode, setCropOptions } from "../src/state";
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
  it("registers the Crop & Straighten panel, as core's core.crop did, and the stage of its line", () => {
    activate(rig.api);
    expect(PANEL_ID).toBe("core.crop");
    expect(rig.panels).toEqual([
      {
        id: "core.crop",
        title: "Crop & Straighten",
        component: CropPanel,
        defaultDock: { module: "develop", direction: "right", order: 3, width: 280, height: 150 },
        onReset: expect.any(Function),
      },
    ]);
    expect(LINE).toBe(Number(manifest.version.split(".")[0]));
    expect(rig.stages.map(text)).toEqual([text(geometryStage(LINE))]);
    expect(rig.stylesheets.map((s) => s.id)).toEqual([STYLESHEET_ID]);
  });

  it("resets the crop and straighten as one step, and frees the aspect", () => {
    activate(rig.api);
    rig.panels[0].onReset?.();
    expect(rig.calls).toEqual([{ resetParams: ["crop", "straighten"], label: "Reset Crop & Straighten" }]);
    expect(cropOptions().aspect).toBe(0);
  });

  it("registers the level-line gesture as a setting, Ctrl-drag by default", () => {
    activate(rig.api);
    expect(rig.settingsSections).toEqual([
      {
        title: "Crop & Straighten",
        fields: [
          {
            key: LEVEL_WITH,
            label: "Level line",
            hint: expect.any(String),
            type: "select",
            default: "ctrl",
            options: [
              { value: "ctrl", label: "Ctrl-drag" },
              { value: "right", label: "Right-drag" },
            ],
          },
        ],
      },
    ]);
  });

  it("cycles and flips the guide with O and Shift+O, while cropping only", () => {
    activate(rig.api);
    expect(rig.keys.map((k) => [k.id, k.defaultCombo])).toEqual([
      ["crop.cycleGuide", "O"],
      ["crop.flipGuide", "Shift+O"],
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
    activate(rig.api);
    render(<CropPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Crop" }));
    expect(rig.held()).toBe(CROP_TOOL);
    expect(CROP_TOOL).toMatchObject({ overlay: CropCanvas, zoomable: false });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(rig.held()).toBeNull();
  });

  it("leaves crop mode on Escape", () => {
    activate(rig.api);
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
    fireEvent.click(screen.getByRole("checkbox", { name: "Constrain to image" }));
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
// down is 2.86° off level, so the photo turns by that, shown as the panel
// shows it (negated).
describe("the level line", () => {
  const RECT = { x: 0, y: 0, w: 600, h: 400 };
  const LEVEL = 2.8624;

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
    expect(straightened()).toHaveLength(1);
    expect(straightened()[0]).toBeCloseTo(LEVEL, 3);
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
    expect(straightened()[0]).toBeCloseTo(LEVEL, 3);
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

  it("names the gesture in the panel's hint", () => {
    render(<CropPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Crop" }));
    expect(screen.getByText(/Ctrl-drag across a line to level/)).toBeTruthy();
    act(() => rig.setSetting(LEVEL_WITH, "right"));
    expect(screen.getByText(/Right-drag across a line to level/)).toBeTruthy();
  });
});

describe("the guide in the box", () => {
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

