// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The photo's geometry, as the develop program reads it. Until Safelight 3.2.0
// it was core's own. main() maps each view point with
// `vec2 srcUv = cropTransformUV(viewUv);`; this stage declares that function
// and its two uniforms at the program's geometry anchor, and writes nothing
// into main() itself. Core sizes frames from the crop (the `geometry` region)
// and maps canvas points through the matrix, which it finishes for the image's
// aspect (an image-space matrix: the aspect is only known where the image is
// decoded). While this extension is away core maps the view unchanged. The
// stage never differed between process versions, so every line carries the
// same text.

import type { DevelopParams, ImageSpaceMatrix, Line, ProcessingStageContribution } from "./safelight";
import { mat3Mul, type Mat3 } from "./transform";

export const STAGE_ID = "safelight.crop.geometry";

const HELPERS = `// The view's point (output, crop coordinates) to source UV: through the crop
// to the transformed image, then the geometry transform's inverse (straighten,
// perspective, stretch, scale, offset), which is independent of the crop. vUv
// already has V flipped, so both are in top-left-origin image space.
vec2 cropTransformUV(vec2 o) {
  vec2 p = uCrop.xy + o * uCrop.zw;
  vec3 q = uInvTransform * vec3(p, 1.0);
  return q.xy / q.z;
}`;

const diag = (x: number, y: number): Mat3 => [x, 0, 0, 0, y, 0, 0, 0, 1];

/** The transformed image to the source, as an image-space matrix: rotation,
 *  flips, keystone, stretch and scale act in square space, the offset in
 *  image coordinates. Core's finish (Ainv · square · A · normalized) is
 *  buildInverseTransform for the image's aspect. */
export function inverseParts(straighten: number, t: DevelopParams["transform"]): ImageSpaceMatrix {
  const theta = (straighten * Math.PI) / 180;
  const rot: Mat3 = [Math.cos(theta), -Math.sin(theta), 0, Math.sin(theta), Math.cos(theta), 0, 0, 0, 1];
  const gh = (t.perspectiveH / 100) * 0.6;
  const gv = (t.perspectiveV / 100) * 0.6;
  const as = Math.pow(1.5, t.aspect / 100);
  const sc = Math.pow(2, (t.scale - 100) / 200);
  let square = mat3Mul(rot, diag(t.flipH ? -1 : 1, t.flipV ? -1 : 1));
  square = mat3Mul(square, [1, 0, 0, 0, 1, 0, -gh, -gv, 1]);
  square = mat3Mul(square, diag(1 / as, as));
  square = mat3Mul(square, diag(1 / sc, 1 / sc));
  const normalized: Mat3 = [1, 0, -(t.offsetX / 100) * 0.5, 0, 1, -(t.offsetY / 100) * 0.5, 0, 0, 1];
  return { square, normalized };
}

/** The stage of release line `_line`: the same on every line. */
export function geometryStage(_line: Line): ProcessingStageContribution {
  return {
    id: STAGE_ID,
    name: "Crop & Straighten",
    phase: "geometry",
    anchor: "geometry",
    glsl: "",
    helpers: HELPERS,
    uniforms: [
      { key: "uCrop", glslType: "vec4", default: [0, 0, 1, 1] },
      { key: "uInvTransform", glslType: "mat3", space: "image", default: [1, 0, 0, 0, 1, 0, 0, 0, 1] },
    ],
    geometry: { region: "uCrop", inverse: "uInvTransform" },
    derive: (p) => ({
      uCrop: [p.crop.x, p.crop.y, p.crop.width, p.crop.height],
      uInvTransform: inverseParts(p.straighten, p.transform),
    }),
  };
}
