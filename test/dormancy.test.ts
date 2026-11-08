// Crop declares no dormantWhen: it is a geometry stage, and geometry stages
// decide where every pixel is read from (core ignores a rule on one).

import { describe, expect, it } from "vitest";
import { geometryStage } from "../src/stages";

describe("dormantWhen", () => {
  it.each([1, 2, 3] as const)("is not declared on line %i", (line) => {
    expect(geometryStage(line)).not.toHaveProperty("dormantWhen");
  });
});
