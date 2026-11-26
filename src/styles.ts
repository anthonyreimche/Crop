// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The look core gave the Crop & Straighten panel and the crop box with
// Tailwind utilities, as plain CSS (the app's Tailwind build never scans an
// extension). `:where()` drops every rule to zero specificity, so a stylesheet
// that restyles the panel or its buttons wins over them. The
// `html.sl-larger-text` rules repeat core's Accessibility rule for small text.

import type { UiTokens } from "./safelight";

const P = "safelight-crop";

export const cls = {
  panel: `${P}-panel`,
  grid: `${P}-grid`,
  custom: `${P}-custom`,
  colon: `${P}-colon`,
  customButton: `${P}-custom-button`,
  guides: `${P}-guides`,
  guidesHeader: `${P}-guides-header`,
  canvas: `${P}-canvas`,
  layer: `${P}-layer`,
  dim: `${P}-dim`,
  box: `${P}-box`,
  handle: `${P}-handle`,
  readout: `${P}-readout`,
  photoGrid: `${P}-photo-grid`,
} as const;

export function cropCss(t: UiTokens): string {
  return `
:where(.${cls.panel} > :not(:last-child)) { margin-block: 0 0.5rem; }
:where(.${cls.grid}) { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.25rem; }
:where(.${cls.custom}) { display: flex; align-items: center; gap: 0.25rem; }
:where(.${cls.colon}) { font-size: 11px; color: ${t.textMuted}; }
:where(.${cls.customButton}) { min-width: 0; flex: 1 1 0%; }
:where(.${cls.guides} > :not(:last-child)) { margin-block: 0 0.25rem; }
:where(.${cls.guidesHeader}) { font-size: 10px; color: ${t.textMuted}; }
:where(.${cls.canvas}) { position: absolute; inset: 0; touch-action: none; }
:where(.${cls.layer}) { pointer-events: none; position: absolute; inset: 0; }
:where(.${cls.dim}) { fill: rgba(0, 0, 0, 0.55); }
:where(.${cls.box}) { pointer-events: none; position: absolute; border: 1px solid rgba(255, 255, 255, 0.8); }
:where(.${cls.handle}) { pointer-events: none; position: absolute; width: 0.625rem; height: 0.625rem; transform: translate(-50%, -50%); border-radius: 0.125rem; border: 1px solid rgba(0, 0, 0, 0.4); background: #fff; }
:where(.${cls.readout}) { pointer-events: none; position: absolute; border-radius: 0.25rem; background: rgba(0, 0, 0, 0.75); padding: 0.125rem 0.375rem; font-size: 11px; font-variant-numeric: tabular-nums; color: #fff; white-space: nowrap; }
:where(.${cls.photoGrid}) { pointer-events: none; position: absolute; overflow: hidden; }
html.sl-larger-text .${cls.guidesHeader} { font-size: 12px !important; }
`;
}
