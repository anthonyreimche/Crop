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
  toggle: `${P}-toggle`,
  on: `${P}-on`,
  grid: `${P}-grid`,
  choice: `${P}-choice`,
  active: `${P}-active`,
  custom: `${P}-custom`,
  number: `${P}-number`,
  colon: `${P}-colon`,
  customButton: `${P}-custom-button`,
  guides: `${P}-guides`,
  guidesHeader: `${P}-guides-header`,
  check: `${P}-check`,
  hint: `${P}-hint`,
  reset: `${P}-reset`,
  canvas: `${P}-canvas`,
  layer: `${P}-layer`,
  piece: `${P}-piece`,
  box: `${P}-box`,
  handle: `${P}-handle`,
  readout: `${P}-readout`,
} as const;

export function cropCss(t: UiTokens): string {
  const button = `border-radius: 0.25rem; padding: 0.25rem 0.5rem; font-size: 11px;`;
  const idle = `background-color: ${t.surface2}; color: ${t.textSecondary};`;
  const hover = `background-color: ${t.surface3}; color: ${t.textPrimary};`;
  return `
:where(.${cls.panel} > :not(:last-child)) { margin-block: 0 0.5rem; }
:where(.${cls.toggle}) { width: 100%; ${button} font-weight: 500; ${idle} }
:where(.${cls.toggle}:hover) { ${hover} }
:where(.${cls.toggle}.${cls.on}) { background-color: ${t.sliderFill}; color: ${t.white}; }
:where(.${cls.toggle}.${cls.on}:hover) { background-color: ${t.surface4}; }
:where(.${cls.grid}) { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.25rem; }
:where(.${cls.choice}) { ${button} ${idle} }
:where(.${cls.choice}:hover), :where(.${cls.choice}.${cls.active}) { ${hover} }
:where(.${cls.custom}) { display: flex; align-items: center; gap: 0.25rem; }
:where(.${cls.number}) { width: 3rem; min-width: 0; border-radius: 0.25rem; background-color: ${t.surface2}; padding: 0.25rem 0.375rem; text-align: center; font-size: 11px; color: ${t.textPrimary}; outline: none; border: 0; }
:where(.${cls.number}:focus) { background-color: ${t.surface3}; }
:where(.${cls.colon}) { font-size: 11px; color: ${t.textMuted}; }
:where(.${cls.customButton}) { min-width: 0; flex: 1 1 0%; }
:where(.${cls.customButton}:disabled) { opacity: 0.4; }
:where(.${cls.guides} > :not(:last-child)) { margin-block: 0 0.25rem; }
:where(.${cls.guidesHeader}) { display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: ${t.textMuted}; }
:where(.${cls.check}) { display: flex; cursor: pointer; align-items: center; gap: 0.5rem; font-size: 11px; color: ${t.textSecondary}; }
:where(.${cls.check} input) { accent-color: ${t.sliderFill}; }
:where(.${cls.hint}) { font-size: 10px; line-height: 1.375; color: ${t.textMuted}; margin: 0; }
:where(.${cls.reset}) { width: 100%; ${button} ${idle} }
:where(.${cls.reset}:hover) { ${hover} }
:where(.${cls.canvas}) { position: absolute; inset: 0; touch-action: none; }
:where(.${cls.layer}) { pointer-events: none; position: absolute; inset: 0; }
:where(.${cls.piece}) { position: absolute; background: rgba(0, 0, 0, 0.55); }
:where(.${cls.box}) { pointer-events: none; position: absolute; border: 1px solid rgba(255, 255, 255, 0.8); }
:where(.${cls.handle}) { pointer-events: none; position: absolute; width: 0.625rem; height: 0.625rem; transform: translate(-50%, -50%); border-radius: 0.125rem; border: 1px solid rgba(0, 0, 0, 0.4); background: #fff; }
:where(.${cls.readout}) { pointer-events: none; position: absolute; border-radius: 0.25rem; background: rgba(0, 0, 0, 0.75); padding: 0.125rem 0.375rem; font-size: 11px; font-variant-numeric: tabular-nums; color: #fff; white-space: nowrap; }
html.sl-larger-text .${cls.hint}, html.sl-larger-text .${cls.guidesHeader} { font-size: 12px !important; }
`;
}
