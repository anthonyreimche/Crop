# Crop & Straighten for Safelight

The Develop **Crop & Straighten** panel, crop mode on the canvas, and the
photo's geometry.

- **Crop** opens crop mode: the canvas shows the whole photo past the crop,
  with the crop box over it. Drag the edges or corners to crop, drag inside to
  move, and Ctrl-drag across a line in the photo to level it. **Done** or
  Escape closes it.
- **Aspect:** Free, Original (the photo's own), 1:1, 3:2, 4:3, 16:9 or a
  custom ratio. A locked ratio flips orientation as you drag a corner.
- **Straighten** turns the photo up to 45° either way.
- **Overlay** guides in crop mode: thirds, golden, diagonal, triangle,
  spiral and more. O cycles them, Shift+O flips them; both are in
  Preferences ▸ Shortcuts.
- **Constrain to image** keeps the crop inside the photo as you straighten
  or transform it. The Transform extension reads the same setting.

Right-click the panel's header and choose **Reset to defaults** to put the
crop and straighten back as one step.

Until Safelight 3.2.0 this was built in. It keeps the built-in panel's id
(`core.crop`), so layouts saved before then keep it where it was. The photo's
geometry is this extension's stage: Safelight sizes each frame from the crop
and maps the canvas through the transform it derives, including Transform's
perspective. While this extension is off or uninstalled, photos show
uncropped and untransformed; Develop says so for photos that had a crop.

## Release lines

A release's major version is its line, the process version its stage text was
written for. The geometry never differed between process versions, so every
line carries the same text.

## Development

```bash
npm install
npm run typecheck
npm run build    # dist/index.js, the file Safelight loads
npm test         # vitest; the bundle checks read dist/, so build first
npm run check    # all three, in that order
```

`test/crop.test.tsx` pins the stage text with the same hash as Safelight's own
copy (`src/rendering/webgl/essential-stages.test.ts` in the app). Change both
together.
