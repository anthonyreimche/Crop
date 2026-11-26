//#region src/rt.ts
var e, t;
function n(n) {
	t = n, e = n.react;
}
//#endregion
//#region src/transform.ts
function r(e, t) {
	let n = Array(9);
	for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) n[r * 3 + i] = e[r * 3 + 0] * t[0 + i] + e[r * 3 + 1] * t[3 + i] + e[r * 3 + 2] * t[6 + i];
	return n;
}
function i(e, t, n) {
	let r = e[0] * t + e[1] * n + e[2], i = e[3] * t + e[4] * n + e[5], a = e[6] * t + e[7] * n + e[8], o = a === 0 ? 1e-6 : a;
	return {
		x: r / o,
		y: i / o
	};
}
function a(e) {
	let t = Math.cos(e), n = Math.sin(e);
	return [
		t,
		-n,
		0,
		n,
		t,
		0,
		0,
		0,
		1
	];
}
function o(e, t) {
	return [
		e,
		0,
		0,
		0,
		t,
		0,
		0,
		0,
		1
	];
}
function s(e, t) {
	return [
		1,
		0,
		e,
		0,
		1,
		t,
		0,
		0,
		1
	];
}
function c(e) {
	return [[
		e,
		0,
		-.5 * e,
		0,
		1,
		-.5,
		0,
		0,
		1
	], [
		1 / e,
		0,
		.5,
		0,
		1,
		.5,
		0,
		0,
		1
	]];
}
function l(e, t, n) {
	return {
		theta: e * Math.PI / 180,
		gh: t.perspectiveH / 100 * .6,
		gv: t.perspectiveV / 100 * .6,
		as: 1.5 ** (t.aspect / 100),
		s: 2 ** ((t.scale - 100) / 200),
		tx: t.offsetX / 100 * .5 * n,
		ty: t.offsetY / 100 * .5,
		fh: t.flipH ? -1 : 1,
		fv: t.flipV ? -1 : 1
	};
}
function u(e, t, n) {
	let { theta: i, gh: u, gv: d, as: f, s: p, tx: m, ty: h, fh: g, fv: _ } = l(e, t, n), [v, y] = c(n), b = o(g, _), x = [
		1,
		0,
		0,
		0,
		1,
		0,
		-u,
		-d,
		1
	], S = o(1 / f, f), C = o(1 / p, 1 / p), w = s(-m, -h), T = r(a(i), b);
	return T = r(T, x), T = r(T, S), T = r(T, C), T = r(T, w), r(y, r(T, v));
}
function d(e, t, n) {
	let { theta: i, gh: u, gv: d, as: f, s: p, tx: m, ty: h, fh: g, fv: _ } = l(e, t, n), [v, y] = c(n), b = [
		1,
		0,
		0,
		0,
		1,
		0,
		u,
		d,
		1
	], x = o(g, _), S = r(s(m, h), o(p, p));
	return S = r(S, o(f, 1 / f)), S = r(S, b), S = r(S, x), S = r(S, a(-i)), r(y, r(S, v));
}
//#endregion
//#region src/crop-maths.ts
function f(e, t) {
	let n = e.x - .5, r = e.y - .5, i = .5 * Math.sqrt(t.aspect * t.aspect + 1), a = Math.hypot(n * t.aspect, r) / i, o = a * a, s = 1;
	t.model === 1 ? s = 1 - t.b + t.b * o : t.model === 2 ? s = 1 + t.b * o + t.a * o * o : t.model === 3 && (s = t.a * o * a + t.b * o + t.c * a + (1 - t.a - t.b - t.c)), Math.abs(t.manual) > .001 && (s += t.manual * 3e-4 * o);
	let c = .5 + n * s, l = .5 + r * s;
	return t.autoCropScale > 1.001 && (c = .5 + (c - .5) / t.autoCropScale, l = .5 + (l - .5) / t.autoCropScale), {
		x: c,
		y: l
	};
}
function p(e, t) {
	let n = e / t, r, i;
	return n >= 1 ? (r = 1, i = 1 / n) : (i = 1, r = n), {
		x: (1 - r) / 2,
		y: (1 - i) / 2,
		width: r,
		height: i
	};
}
function m(e, t = 1.06) {
	let n = [
		[0, 0],
		[1, 0],
		[1, 1],
		[0, 1]
	], r = Infinity, a = Infinity, o = -Infinity, s = -Infinity;
	for (let [t, c] of n) {
		let n = i(e, t, c);
		r = Math.min(r, n.x), a = Math.min(a, n.y), o = Math.max(o, n.x), s = Math.max(s, n.y);
	}
	let c = (r + o) / 2, l = (a + s) / 2, u = (o - r) / 2 * t, d = (s - a) / 2 * t;
	return {
		x: c - u,
		y: l - d,
		width: 2 * u,
		height: 2 * d
	};
}
function h(e, t, n) {
	let r = i(t, e.x, e.y);
	return n && (r = f(r, n)), r.x >= -1e-7 && r.x <= 1.0000001 && r.y >= -1e-7 && r.y <= 1.0000001;
}
function g(e, t, n) {
	let r = e.x + e.width, i = e.y + e.height;
	if (!h({
		x: e.x,
		y: e.y
	}, t, n) || !h({
		x: r,
		y: e.y
	}, t, n) || !h({
		x: e.x,
		y: i
	}, t, n) || !h({
		x: r,
		y: i
	}, t, n)) return !1;
	if (!n) return !0;
	for (let a = 1; a < 4; a++) {
		let o = a / 4, s = e.x + o * e.width, c = e.y + o * e.height;
		if (!h({
			x: s,
			y: e.y
		}, t, n) || !h({
			x: s,
			y: i
		}, t, n) || !h({
			x: e.x,
			y: c
		}, t, n) || !h({
			x: r,
			y: c
		}, t, n)) return !1;
	}
	return !0;
}
var _ = .04;
function v(e, t) {
	let n = (e) => t.every((t) => t.nx * e.x + t.ny * e.y <= t.b + 1e-7);
	if (n(e)) return e;
	let r = {
		x: 0,
		y: 0
	}, i = e.x * e.x + e.y * e.y, a = (t) => {
		if (!n(t)) return;
		let a = (t.x - e.x) ** 2 + (t.y - e.y) ** 2;
		a < i && (i = a, r = t);
	};
	for (let n of t) {
		let t = n.nx * n.nx + n.ny * n.ny;
		if (t < 1e-12) continue;
		let r = (n.nx * e.x + n.ny * e.y - n.b) / t;
		a({
			x: e.x - r * n.nx,
			y: e.y - r * n.ny
		});
	}
	for (let e = 0; e < t.length; e++) for (let n = e + 1; n < t.length; n++) {
		let r = t[e], i = t[n], o = r.nx * i.ny - r.ny * i.nx;
		Math.abs(o) < 1e-12 || a({
			x: (r.b * i.ny - r.ny * i.b) / o,
			y: (r.nx * i.b - r.b * i.nx) / o
		});
	}
	return r;
}
function y(e, t, n) {
	if (n(t)) return t;
	let r = e, i = t;
	for (let e = 0; e < 22; e++) {
		let e = (r + i) / 2;
		n(e) ? r = e : i = e;
	}
	return r;
}
function b(e, t, n, r, a, o, s, c) {
	if (g(t, r, c)) return t;
	let l = (e, t, n, i) => n - e >= _ && i - t >= _ && g({
		x: e,
		y: t,
		width: n - e,
		height: i - t
	}, r, c), u = t.x, d = t.y, f = t.x + t.width, p = t.y + t.height;
	if (n === "move") {
		if (c) {
			let n = t.x - e.x, i = t.y - e.y, a = (r) => ({
				x: e.x + n * r,
				y: e.y + i * r,
				width: t.width,
				height: t.height
			}), o = 0, s = 1;
			for (let e = 0; e < 24; e++) {
				let e = (o + s) / 2;
				g(a(e), r, c) ? o = e : s = e;
			}
			return a(o);
		}
		let n = t.width, s = t.height, l = [
			i(a, 0, 0),
			i(a, 1, 0),
			i(a, 1, 1),
			i(a, 0, 1)
		], f = (l[0].x + l[1].x + l[2].x + l[3].x) / 4, p = (l[0].y + l[1].y + l[2].y + l[3].y) / 4, m = [
			{
				x: e.x,
				y: e.y
			},
			{
				x: e.x + n,
				y: e.y
			},
			{
				x: e.x + n,
				y: e.y + s
			},
			{
				x: e.x,
				y: e.y + s
			}
		], h = [];
		for (let e = 0; e < 4; e++) {
			let t = l[e], n = l[(e + 1) % 4], r = n.y - t.y, i = -(n.x - t.x), a = r * t.x + i * t.y;
			r * f + i * p > a && (r = -r, i = -i, a = -a);
			let s = -Infinity;
			for (let e of m) s = Math.max(s, r * e.x + i * e.y);
			h.push({
				nx: r / o,
				ny: i,
				b: a - s
			});
		}
		let _ = v({
			x: (u - e.x) * o,
			y: d - e.y
		}, h);
		return {
			x: e.x + _.x / o,
			y: e.y + _.y,
			width: n,
			height: s
		};
	}
	if (s) {
		let e, i;
		return n === "e" || n === "w" ? (e = n === "e" ? t.x : t.x + t.width, i = t.y + t.height / 2) : n === "n" || n === "s" ? (e = t.x + t.width / 2, i = n === "s" ? t.y : t.y + t.height) : (e = n.includes("e") ? t.x : t.x + t.width, i = n.includes("s") ? t.y : t.y + t.height), x(t, e, i, r, c);
	}
	let m = e.x, h = e.y, b = e.x + e.width, S = e.y + e.height;
	for (let e = 0; e < 8; e++) n.includes("w") && (m = y(m, u, (e) => l(e, h, b, S))), n.includes("e") && (b = y(b, f, (e) => l(m, h, e, S))), n.includes("n") && (h = y(h, d, (e) => l(m, e, b, S))), n.includes("s") && (S = y(S, p, (e) => l(m, h, b, e)));
	return {
		x: m,
		y: h,
		width: b - m,
		height: S - h
	};
}
function x(e, t, n, r, i) {
	if (g(e, r, i)) return e;
	let a = (r) => ({
		x: t + (e.x - t) * r,
		y: n + (e.y - n) * r,
		width: e.width * r,
		height: e.height * r
	}), o = 0, s = 1;
	for (let e = 0; e < 24; e++) {
		let e = (o + s) / 2;
		g(a(e), r, i) ? o = e : s = e;
	}
	return a(o);
}
function S(e, t, n) {
	if (g(e, t, n)) return e;
	let r = e.x + e.width / 2, i = e.y + e.height / 2, a = 0, o = 1;
	for (let s = 0; s < 24; s++) {
		let s = (a + o) / 2, c = e.width * s, l = e.height * s;
		g({
			x: r - c / 2,
			y: i - l / 2,
			width: c,
			height: l
		}, t, n) ? a = s : o = s;
	}
	let s = e.width * a, c = e.height * a;
	return {
		x: r - s / 2,
		y: i - c / 2,
		width: s,
		height: c
	};
}
//#endregion
//#region src/crop-guides.ts
var C = [
	{
		id: "thirds",
		label: "Thirds"
	},
	{
		id: "golden",
		label: "Golden"
	},
	{
		id: "diagonal",
		label: "Diagonal"
	},
	{
		id: "triangle",
		label: "Triangle"
	},
	{
		id: "grid",
		label: "Grid"
	},
	{
		id: "spiral",
		label: "Spiral"
	}
];
function w(e) {
	return C[(C.findIndex((t) => t.id === e) + 1) % C.length].id;
}
var T = {
	min: 2,
	max: 20,
	initial: 8
}, E = .5 - .5 / Math.sqrt(5), D = .5 + .5 / Math.sqrt(5);
function O(e, t, n, r, i, a) {
	let o = i - n, s = a - r, c = ((e - n) * o + (t - r) * s) / (o * o + s * s);
	return {
		x: n + c * o,
		y: r + c * s
	};
}
function k(e, t) {
	let n = (1 + Math.sqrt(5)) / 2, r = e / n, i = t - t / n, a = 2 / Math.PI * Math.log(n), o = Math.hypot(Math.max(r, e - r), Math.max(i, t - i)) * 1.15, s = Math.atan2(-i, e - r), c = Math.PI / 2 * 4.5, l = "";
	for (let e = 0; e <= 120; e++) {
		let t = e / 120 * c, n = o * Math.exp(-a * t), u = s + t, d = r + n * Math.cos(u), f = i + n * Math.sin(u);
		l += `${e === 0 ? "M" : "L"} ${d.toFixed(2)} ${f.toFixed(2)} `;
	}
	return l.trim();
}
function A(e, t, n, r = T.initial) {
	let i = [], a = [], o = (e) => i.push({
		x1: e * t,
		y1: 0,
		x2: e * t,
		y2: n
	}), s = (e) => i.push({
		x1: 0,
		y1: e * n,
		x2: t,
		y2: e * n
	});
	switch (e) {
		case "thirds":
			o(1 / 3), o(2 / 3), s(1 / 3), s(2 / 3);
			break;
		case "golden":
			o(E), o(D), s(E), s(D);
			break;
		case "grid":
			for (let e = 1; e < r; e++) o(e / r);
			for (let e = 1; e < r; e++) s(e / r);
			break;
		case "diagonal": {
			let e = Math.min(t, n);
			i.push({
				x1: 0,
				y1: 0,
				x2: e,
				y2: e
			}), i.push({
				x1: t,
				y1: 0,
				x2: t - e,
				y2: e
			}), i.push({
				x1: 0,
				y1: n,
				x2: e,
				y2: n - e
			}), i.push({
				x1: t,
				y1: n,
				x2: t - e,
				y2: n - e
			});
			break;
		}
		case "triangle": {
			i.push({
				x1: 0,
				y1: 0,
				x2: t,
				y2: n
			});
			let e = O(t, 0, 0, 0, t, n);
			i.push({
				x1: t,
				y1: 0,
				x2: e.x,
				y2: e.y
			});
			let r = O(0, n, 0, 0, t, n);
			i.push({
				x1: 0,
				y1: n,
				x2: r.x,
				y2: r.y
			});
			break;
		}
		case "spiral": o(E), o(D), s(E), s(D), a.push(k(t, n));
	}
	return {
		lines: i,
		paths: a
	};
}
//#endregion
//#region src/state.ts
var j = {
	cropping: !1,
	guide: "thirds",
	guideFlip: 0
}, M = /* @__PURE__ */ new Set(), N = (e) => {
	j = {
		...j,
		...e
	};
	for (let e of M) e();
}, P = () => j, F = (e) => j.cropping !== e && N({ cropping: e }), I = (e) => N({ guide: e }), L = () => N({ guide: w(j.guide) }), R = () => N({ guideFlip: (j.guideFlip + 1) % 4 }), z = (e) => (M.add(e), () => void M.delete(e)), B = () => e.useSyncExternalStore(z, P), ee = () => N({
	cropping: !1,
	guide: "thirds",
	guideFlip: 0
}), V = "safelight.crop.options", te = {
	constrain: !0,
	aspect: -1
};
function ne() {
	t.variables.register(V, {
		initial: te,
		description: "Crop & Straighten: whether a crop keeps inside the image, and its aspect lock."
	});
}
var re = () => t.variables.get("safelight.crop.options")?.value ?? te, H = (e) => void t.variables.update(V, (t) => ({
	...t,
	...e
}));
function ie() {
	let [n, r] = e.useState(re);
	return e.useEffect(() => t.variables.subscribe(V, (e) => r(e.value)), []), n;
}
function U() {
	let { sourceSize: e } = t.stores.useDevelopStore.getState();
	if (e.width > 0 && e.height > 0) return e.width / e.height;
	let { photos: n, activePhotoId: r } = t.stores.useCatalogStore.getState(), i = n.find((e) => e.id === r);
	return i && i.width > 0 && i.height > 0 ? i.width / i.height : 1;
}
function ae() {
	return t.stores.useDevelopStore((e) => e.sourceSize), t.stores.useCatalogStore((e) => {
		let t = e.photos.find((t) => t.id === e.activePhotoId);
		return t ? `${t.width}x${t.height}` : "";
	}), U();
}
var oe = "levelWith", W = "showGrid", G = "gridSize", se = "gridColour", K = "gridOpacity", ce = /* @__PURE__ */ new Set([
	W,
	G,
	se,
	K
]), q = {
	min: 10,
	max: 100,
	initial: 40
};
function le() {
	t.registerSettings({
		title: "Crop & Straighten",
		fields: [
			{
				key: oe,
				label: "Level line",
				hint: "How you draw a line along the horizon or an edge to level the photo while cropping. Right-drag leaves Ctrl-drag to crop as a plain drag.",
				type: "select",
				default: "ctrl",
				options: [{
					value: "ctrl",
					label: "Ctrl-drag"
				}, {
					value: "right",
					label: "Right-drag"
				}]
			},
			{
				key: se,
				label: "Grid colour",
				hint: "The colour of the grid's lines. Black shows better over bright photos.",
				type: "select",
				default: "white",
				options: [{
					value: "white",
					label: "White"
				}, {
					value: "black",
					label: "Black"
				}]
			},
			{
				key: K,
				label: "Grid opacity",
				hint: "How strongly the grid's lines show, in percent.",
				type: "number",
				default: q.initial,
				min: q.min,
				max: q.max,
				step: 5
			}
		]
	});
}
var J = () => t.settings.get("levelWith", "ctrl") === "right" ? "right" : "ctrl";
function ue() {
	let [n, r] = e.useState(J);
	return e.useEffect(() => t.settings.onChange((e) => {
		e === "levelWith" && r(J());
	}), []), n;
}
var de = (e, t) => typeof e == "number" && Number.isFinite(e) ? Math.min(t.max, Math.max(t.min, Math.round(e))) : t.initial, fe = () => ({
	show: t.settings.get(W, !1) === !0,
	size: de(t.settings.get(G, T.initial), T),
	colour: t.settings.get("gridColour", "white") === "black" ? "black" : "white",
	opacity: de(t.settings.get(K, q.initial), q)
}), pe = (e) => t.settings.set(W, e), me = () => pe(!fe().show), he = (e) => t.settings.set(G, de(e, T)), ge = ({ colour: e, opacity: t }) => `rgba(${e === "black" ? "0, 0, 0" : "255, 255, 255"}, ${t / 100})`;
function _e() {
	let [n, r] = e.useState(fe);
	return e.useEffect(() => t.settings.onChange((e) => {
		ce.has(e) && r(fe());
	}), []), n;
}
//#endregion
//#region src/styles.ts
var Y = "safelight-crop", X = {
	panel: `${Y}-panel`,
	grid: `${Y}-grid`,
	custom: `${Y}-custom`,
	colon: `${Y}-colon`,
	customButton: `${Y}-custom-button`,
	guides: `${Y}-guides`,
	guidesHeader: `${Y}-guides-header`,
	canvas: `${Y}-canvas`,
	layer: `${Y}-layer`,
	dim: `${Y}-dim`,
	box: `${Y}-box`,
	handle: `${Y}-handle`,
	readout: `${Y}-readout`,
	photoGrid: `${Y}-photo-grid`
};
function ve(e) {
	return `
:where(.${X.panel} > :not(:last-child)) { margin-block: 0 0.5rem; }
:where(.${X.grid}) { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.25rem; }
:where(.${X.custom}) { display: flex; align-items: center; gap: 0.25rem; }
:where(.${X.colon}) { font-size: 11px; color: ${e.textMuted}; }
:where(.${X.customButton}) { min-width: 0; flex: 1 1 0%; }
:where(.${X.guides} > :not(:last-child)) { margin-block: 0 0.25rem; }
:where(.${X.guidesHeader}) { font-size: 10px; color: ${e.textMuted}; }
:where(.${X.canvas}) { position: absolute; inset: 0; touch-action: none; }
:where(.${X.layer}) { pointer-events: none; position: absolute; inset: 0; }
:where(.${X.dim}) { fill: rgba(0, 0, 0, 0.55); }
:where(.${X.box}) { pointer-events: none; position: absolute; border: 1px solid rgba(255, 255, 255, 0.8); }
:where(.${X.handle}) { pointer-events: none; position: absolute; width: 0.625rem; height: 0.625rem; transform: translate(-50%, -50%); border-radius: 0.125rem; border: 1px solid rgba(0, 0, 0, 0.4); background: #fff; }
:where(.${X.readout}) { pointer-events: none; position: absolute; border-radius: 0.25rem; background: rgba(0, 0, 0, 0.75); padding: 0.125rem 0.375rem; font-size: 11px; font-variant-numeric: tabular-nums; color: #fff; white-space: nowrap; }
:where(.${X.photoGrid}) { pointer-events: none; position: absolute; overflow: hidden; }
html.sl-larger-text .${X.guidesHeader} { font-size: 12px !important; }
`;
}
//#endregion
//#region src/CropBox.tsx
var ye = "<path d=\"M9 18A9 9 0 0 1 18 9\"/><path d=\"M6 15L9 18L12 15\"/><path d=\"M15 6L18 9L15 12\"/>", be = {
	id: "crop-rotate",
	image: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#fff" stroke-width="3">${ye}</g><g stroke="#111" stroke-width="1.4">${ye}</g></g></svg>`,
	hotspotX: 12,
	hotspotY: 12,
	fallback: "grab"
}, Z = (e) => t.cursors.resolve(e), Q = .04, xe = 12, Se = (e, t, n) => Math.min(n, Math.max(t, e)), $ = (e) => String(Math.round(e * 100) / 100), Ce = (e, t, n, r) => `M${$(e)} ${$(t)}H${$(n)}V${$(r)}H${$(e)}Z`, we = 6, Te = (e) => Math.round(e * 100) / 100, Ee = (e, t, n) => {
	let r = Math.atan2(n, t) * 180 / Math.PI;
	for (; r > 45;) r -= 90;
	for (; r < -45;) r += 90;
	return Te(Se(e + r, -45, 45));
}, De = (e) => J() === "right" ? e.button === 2 : e.button === 0 && (e.ctrlKey || e.metaKey), Oe = (e, t, n, r, i, a) => {
	let o = (Math.atan2(a - t, i - e) - Math.atan2(r - t, n - e)) * 180 / Math.PI;
	return o > 180 && (o -= 360), o <= -180 && (o += 360), o;
}, ke = (e) => `${(-e).toFixed(1)}°`, Ae = 14, je = (e, t, n) => {
	let r = e > n.x + n.w / 2, i = t > n.y + n.h / 2;
	return {
		left: r ? e - Ae : e + Ae,
		top: i ? t - Ae : t + Ae,
		transform: r || i ? `translate(${r ? "-100%" : "0"}, ${i ? "-100%" : "0"})` : void 0
	};
}, Me = (e) => {
	switch (e) {
		case "move": return Z("crop-move");
		case "nw":
		case "se": return Z("crop-resize-nwse");
		case "ne":
		case "sw": return Z("crop-resize-nesw");
		case "n":
		case "s": return Z("crop-resize-ns");
		case "e":
		case "w": return Z("crop-resize-ew");
		case "rotate": return Z(be.id);
		default: return Z("crosshair");
	}
};
function Ne({ rect: n, crop: r, viewCrop: a, inv: o, forward: s, distort: c, straightenDeg: l, aspect: u, imageAspect: d, constrain: f, guide: p, guideFlip: m, grid: h, onChange: g, onCommit: _, onLevel: v, onTurn: y, onTurnEnd: x }) {
	let S = e.useRef(null), [C, w] = e.useState(null), [T, E] = e.useState(null), [D, O] = e.useState(null), k = e.useId(), A = (e) => t.develop.framePoint(e.currentTarget, e.clientX, e.clientY), j = u > 0 ? u / d : 0, M = u > 0 ? 1 / (u * d) : 0, N = (e, t) => ({
		x: n.x + (e - a.x) / a.width * n.w,
		y: n.y + (t - a.y) / a.height * n.h
	}), P = N(r.x, r.y), F = N(r.x + r.width, r.y + r.height), I = P.x, L = P.y, R = F.x - P.x, z = F.y - P.y, B = [
		i(s, 0, 0),
		i(s, 1, 0),
		i(s, 1, 1),
		i(s, 0, 1)
	].map((e) => N(e.x, e.y)), ee = Math.min(B[0].x, B[1].x, B[2].x, B[3].x), V = Math.max(B[0].x, B[1].x, B[2].x, B[3].x), te = `${Ce(ee, Math.min(B[0].y, B[1].y, B[2].y, B[3].y), V, Math.max(B[0].y, B[1].y, B[2].y, B[3].y))}${Ce(I, L, I + R, L + z)}`, ne = B.map((e) => `${$(e.x)},${$(e.y)}`).join(" "), re = `safelight-crop-dim-${k.replace(/:/g, "")}`, H = [
		{
			id: "nw",
			x: I,
			y: L
		},
		{
			id: "ne",
			x: I + R,
			y: L
		},
		{
			id: "se",
			x: I + R,
			y: L + z
		},
		{
			id: "sw",
			x: I,
			y: L + z
		}
	], ie = [
		{
			id: "n",
			x: I + R / 2,
			y: L
		},
		{
			id: "e",
			x: I + R,
			y: L + z / 2
		},
		{
			id: "s",
			x: I + R / 2,
			y: L + z
		},
		{
			id: "w",
			x: I,
			y: L + z / 2
		}
	], U = [...H, ...ie], ae = (e, t) => {
		for (let n of U) if (Math.abs(e - n.x) <= xe && Math.abs(t - n.y) <= xe) return n.id;
		return e >= I && e <= I + R && t >= L && t <= L + z ? "move" : "rotate";
	}, oe = (e, t, n) => {
		let r = Te(Se(e.startDeg - Oe(e.cx, e.cy, e.sx, e.sy, t, n), -45, 45));
		E({
			x: t,
			y: n,
			deg: r
		}), r !== e.deg && (e.deg = r, e.turned = !0, y(r, e.startCrop));
	}, W = (e) => {
		E(null), e.turned && x();
	}, G = (e) => {
		let t = De(e);
		if (e.button !== 0 && !t) return;
		let { x: n, y: i } = A(e);
		if (e.currentTarget.setPointerCapture(e.pointerId), t) {
			S.current = {
				mode: "level",
				startCrop: r,
				sx: n,
				sy: i
			}, O("level"), w({
				x: n,
				y: i,
				dx: 0,
				dy: 0
			});
			return;
		}
		let a = ae(n, i);
		if (O(a), a === "rotate") {
			let e = I + R / 2, t = L + z / 2;
			S.current = {
				mode: a,
				startCrop: r,
				sx: n,
				sy: i,
				cx: e,
				cy: t,
				startDeg: l,
				deg: l,
				turned: !1
			}, E({
				x: n,
				y: i,
				deg: l
			});
		} else S.current = {
			mode: a,
			startCrop: r,
			sx: n,
			sy: i
		};
	}, se = (e) => {
		let t = S.current;
		if (!t) {
			let { x: t, y: n } = A(e);
			O(J() === "ctrl" && (e.ctrlKey || e.metaKey) ? "level" : ae(t, n));
			return;
		}
		let { x: r, y: i } = A(e);
		if (t.mode === "level") {
			w((e) => e && {
				...e,
				dx: r - t.sx,
				dy: i - t.sy
			});
			return;
		}
		if (t.mode === "rotate") {
			oe(t, r, i);
			return;
		}
		let l = (r - t.sx) / n.w * a.width, u = (i - t.sy) / n.h * a.height, p = Pe(t.mode, t.startCrop, l, u, j, M);
		p = f ? b(t.startCrop, p, t.mode, o, s, d, j > 0, c) : Ie(p, a), g(p);
	}, K = (e) => {
		let t = S.current;
		if (S.current = null, t) {
			if (t.mode === "level") {
				let { x: n, y: r } = A(e), i = n - t.sx, a = r - t.sy;
				w(null), Math.abs(i) + Math.abs(a) > we && v(Ee(l, i, a));
			} else if (t.mode === "rotate") {
				let { x: n, y: r } = A(e);
				oe(t, n, r), W(t);
			} else _();
		}
	}, ce = () => {
		let e = S.current;
		S.current = null, e && (e.mode === "level" ? w(null) : e.mode === "rotate" ? W(e) : _());
	};
	return /* @__PURE__ */ e.createElement("div", {
		className: X.canvas,
		style: { cursor: Me(D) },
		onPointerDown: G,
		onPointerMove: se,
		onPointerUp: K,
		onPointerCancel: ce,
		onLostPointerCapture: ce,
		onContextMenu: (e) => {
			J() === "right" && e.preventDefault();
		},
		onPointerLeave: () => {
			S.current || O(null);
		}
	}, /* @__PURE__ */ e.createElement("svg", {
		"data-dim": "",
		className: X.layer,
		width: "100%",
		height: "100%"
	}, /* @__PURE__ */ e.createElement("clipPath", { id: re }, /* @__PURE__ */ e.createElement("polygon", { points: ne })), /* @__PURE__ */ e.createElement("path", {
		className: X.dim,
		d: te,
		fillRule: "evenodd",
		clipPath: `url(#${re})`
	})), /* @__PURE__ */ e.createElement("div", {
		className: X.box,
		style: {
			left: I,
			top: L,
			width: R,
			height: z
		}
	}, /* @__PURE__ */ e.createElement(Fe, {
		guide: T ? "grid" : p,
		flip: T ? 0 : m,
		grid: h,
		w: R,
		h: z
	})), U.map((t) => /* @__PURE__ */ e.createElement("div", {
		key: t.id,
		"data-handle": t.id,
		className: X.handle,
		style: {
			left: t.x,
			top: t.y
		}
	})), C && /* @__PURE__ */ e.createElement("svg", {
		className: X.layer,
		width: "100%",
		height: "100%"
	}, /* @__PURE__ */ e.createElement("line", {
		x1: C.x,
		y1: C.y,
		x2: C.x + C.dx,
		y2: C.y + C.dy,
		stroke: "#4aa3ff",
		strokeWidth: 1.5
	})), C && Math.abs(C.dx) + Math.abs(C.dy) > we && /* @__PURE__ */ e.createElement("div", {
		className: X.readout,
		style: je(C.x + C.dx, C.y + C.dy, n)
	}, ke(Ee(l, C.dx, C.dy))), T && /* @__PURE__ */ e.createElement("div", {
		className: X.readout,
		style: je(T.x, T.y, n)
	}, ke(T.deg)));
}
function Pe(e, t, n, r, i, a) {
	let o = t.x, s = t.y, c = t.width, l = t.height;
	if (e === "move") o += n, s += r;
	else if (i > 0 && e.length === 2) {
		let u = e.includes("e"), d = e.includes("s"), f = u ? t.x : t.x + t.width, p = d ? t.y : t.y + t.height, m = Math.max(Q, u ? t.width + n : t.width - n), h = Math.max(Q, d ? t.height + r : t.height - r), g = a > 0 ? a : i, _ = m / h, v = Math.abs(Math.log(_ / i)) <= Math.abs(Math.log(_ / g)) ? i : g;
		c = Math.max(m, h * v), l = c / v, v >= 1 ? l < Q && (l = Q, c = l * v) : c < Q && (c = Q, l = c / v), o = u ? f : f - c, s = d ? p : p - l;
	} else if (i > 0) {
		let i = t.width / t.height, a = t.x + t.width / 2, u = t.y + t.height / 2;
		e === "e" || e === "w" ? (c = Math.max(Q, e === "e" ? t.width + n : t.width - n), l = c / i, l < Q && (l = Q, c = l * i), o = e === "e" ? t.x : t.x + t.width - c, s = u - l / 2) : (l = Math.max(Q, e === "s" ? t.height + r : t.height - r), c = l * i, c < Q && (c = Q, l = c / i), s = e === "s" ? t.y : t.y + t.height - l, o = a - c / 2);
	} else e.includes("e") && (c += n), e.includes("w") && (o += n, c -= n), e.includes("s") && (l += r), e.includes("n") && (s += r, l -= r);
	return c < Q && (e.includes("w") && (o = t.x + t.width - Q), c = Q), l < Q && (e.includes("n") && (s = t.y + t.height - Q), l = Q), {
		x: o,
		y: s,
		width: c,
		height: l
	};
}
function Fe({ guide: t, flip: n, grid: r, w: i, h: a }) {
	if (i <= 1 || a <= 1) return null;
	let { lines: o, paths: s } = A(t, i, a, r.size), c = t === "grid" ? ge(r) : "rgba(255,255,255,0.4)", l = n === 1 ? `translate(${i} 0) scale(-1 1)` : n === 2 ? `translate(0 ${a}) scale(1 -1)` : n === 3 ? `translate(${i} ${a}) scale(-1 -1)` : void 0;
	return /* @__PURE__ */ e.createElement("svg", {
		className: X.layer,
		width: i,
		height: a
	}, /* @__PURE__ */ e.createElement("g", { transform: l }, o.map((t, n) => /* @__PURE__ */ e.createElement("line", {
		key: n,
		x1: t.x1,
		y1: t.y1,
		x2: t.x2,
		y2: t.y2,
		stroke: c,
		strokeWidth: 1
	})), s.map((t, n) => /* @__PURE__ */ e.createElement("path", {
		key: `p${n}`,
		d: t,
		fill: "none",
		stroke: "rgba(255,255,255,0.55)",
		strokeWidth: 1
	}))));
}
function Ie(e, t) {
	let n = Math.min(e.width, t.width), r = Math.min(e.height, t.height);
	return {
		x: Math.min(Math.max(e.x, t.x), t.x + t.width - n),
		y: Math.min(Math.max(e.y, t.y), t.y + t.height - r),
		width: n,
		height: r
	};
}
//#endregion
//#region src/CropCanvas.tsx
var Le = (e) => ({
	...e,
	crop: m(d(e.straighten, e.transform, U()))
});
function Re({ rect: n }) {
	let r = t.stores.useDevelopStore, i = r((e) => e.params.crop), a = r((e) => e.params.straighten), o = r((e) => e.params.transform), s = r((e) => e.setParam), c = r((e) => e.commitEdit), l = r((e) => !!e.bypassedPanels["core.crop"] || !!e.bypassedPanels["core.transform"]), { region: f, imageAspect: p } = t.develop.useDevelopOverlay(), { guide: h, guideFlip: g } = B(), { constrain: _, aspect: v } = ie(), y = _e(), b = u(a, o, p), x = d(a, o, p), C = f ?? m(x), w = e.useRef(null), T = e.useRef(null), E = (e) => {
		w.current = e, T.current ??= requestAnimationFrame(() => {
			T.current = null;
			let e = w.current;
			w.current = null, e?.();
		});
	}, D = () => {
		T.current != null && (cancelAnimationFrame(T.current), T.current = null);
		let e = w.current;
		w.current = null, e?.();
	};
	return e.useEffect(() => () => {
		T.current != null && cancelAnimationFrame(T.current), w.current = null;
	}, []), l ? null : /* @__PURE__ */ e.createElement(Ne, {
		rect: n,
		crop: i,
		viewCrop: C,
		inv: b,
		forward: x,
		distort: null,
		straightenDeg: a,
		aspect: v === -1 ? p : v,
		imageAspect: p,
		constrain: _,
		guide: h,
		guideFlip: g,
		grid: y,
		onChange: (e) => E(() => s("crop", e)),
		onCommit: () => {
			D(), c("Crop");
		},
		onLevel: (e) => {
			s("straighten", e), _ && s("crop", S(i, u(e, o, p))), c("Straighten");
		},
		onTurn: (e, t) => E(() => {
			s("straighten", e), _ && s("crop", S(t, u(e, o, p)));
		}),
		onTurnEnd: () => {
			D(), c("Straighten");
		}
	});
}
var ze = {
	overlay: Re,
	zoomable: !1,
	viewParams: Le,
	onEscape: () => F(!1)
}, Be = {
	x: 0,
	y: 0,
	width: 1,
	height: 1
}, Ve = [
	{
		label: "Free",
		ratio: 0
	},
	{
		label: "Original",
		ratio: -1
	},
	{
		label: "1:1",
		ratio: 1
	},
	{
		label: "3:2",
		ratio: 3 / 2
	},
	{
		label: "4:3",
		ratio: 4 / 3
	},
	{
		label: "16:9",
		ratio: 16 / 9
	}
];
function He() {
	let { Panel: n, Slider: r } = t.components, { Button: i, NumberInput: a, Toggle: o } = t.ui, s = t.stores.useDevelopStore, { cropping: c, guide: l } = B(), { constrain: d, aspect: f } = ie(), m = ue(), h = _e(), g = s((e) => e.params.straighten), _ = s((e) => e.params.transform), v = s((e) => e.params.crop), y = s((e) => e.setParam), b = s((e) => e.commitEdit), x = ae(), w = t.develop.useCanvasToolHeld();
	e.useEffect(() => {
		c && !w && F(!1);
	}, [c, w]);
	let E = e.useRef(null), [D, O] = e.useState(16), [k, A] = e.useState(10), j = D > 0 && k > 0 ? D / k : 0, M = (e) => {
		if (F(!0), e === 0) {
			H({ aspect: 0 });
			return;
		}
		let t = e === -1 ? x : e;
		H({ aspect: e === -1 ? -1 : t });
		let n = p(t, x);
		d && (n = S(n, u(g, _, x))), y("crop", n), b("Crop");
	}, N = (e) => e === 0 ? f === 0 : e === -1 ? f === -1 : f > 0 && Math.abs(f - e) < 1e-4, P = () => {
		H({ aspect: -1 }), y("crop", { ...Be }), y("straighten", 0), b("Crop reset");
	}, L = /* @__PURE__ */ e.createElement(r, {
		label: "Grid size",
		value: h.size,
		min: T.min,
		max: T.max,
		step: 1,
		defaultValue: T.initial,
		onChange: he
	});
	return /* @__PURE__ */ e.createElement(n, {
		title: "Crop & Straighten",
		defaultOpen: !1
	}, /* @__PURE__ */ e.createElement("div", { className: X.panel }, /* @__PURE__ */ e.createElement(i, {
		full: !0,
		active: c,
		"aria-pressed": c,
		title: `Drag the edges or corners to crop · ${m === "right" ? "Right-drag" : "Ctrl-drag"} across a line to level`,
		onClick: () => F(!c)
	}, c ? "Done" : "Crop"), c && /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement("div", { className: X.grid }, Ve.map((t) => /* @__PURE__ */ e.createElement(i, {
		key: t.label,
		size: "sm",
		active: N(t.ratio),
		onClick: () => M(t.ratio)
	}, t.label))), /* @__PURE__ */ e.createElement("div", { className: X.custom }, /* @__PURE__ */ e.createElement(a, {
		min: 1,
		width: "3rem",
		"aria-label": "Custom ratio width",
		value: D,
		onChange: O
	}), /* @__PURE__ */ e.createElement("span", { className: X.colon }, ":"), /* @__PURE__ */ e.createElement(a, {
		min: 1,
		width: "3rem",
		"aria-label": "Custom ratio height",
		value: k,
		onChange: A
	}), /* @__PURE__ */ e.createElement(i, {
		size: "sm",
		disabled: j <= 0,
		active: j > 0 && N(j),
		onClick: () => M(j),
		className: X.customButton
	}, "Custom"))), /* @__PURE__ */ e.createElement(r, {
		label: "Straighten",
		value: -g,
		min: -45,
		max: 45,
		step: .1,
		onChange: (e) => {
			let t = -e;
			y("straighten", t), d && (E.current ||= v, y("crop", S(E.current, u(t, _, x))));
		},
		onCommit: () => {
			E.current = null, b("Straighten");
		}
	}), c && /* @__PURE__ */ e.createElement("div", { className: X.guides }, /* @__PURE__ */ e.createElement("div", { className: X.guidesHeader }, "Overlay"), /* @__PURE__ */ e.createElement("div", { className: X.grid }, C.map((t) => /* @__PURE__ */ e.createElement(i, {
		key: t.id,
		size: "sm",
		active: l === t.id,
		title: "O cycles · Shift+O flips",
		onClick: () => I(t.id)
	}, t.label))), l === "grid" && L), /* @__PURE__ */ e.createElement(o, {
		label: "Constrain to image",
		checked: d,
		onChange: (e) => H({ constrain: e })
	}), !c && /* @__PURE__ */ e.createElement("div", { title: "A grid over the photo, for checking horizons, verticals and lens distortion. Its shortcut is under Preferences ▸ Shortcuts." }, /* @__PURE__ */ e.createElement(o, {
		label: "Show grid",
		checked: h.show,
		onChange: pe
	})), !c && h.show && L, /* @__PURE__ */ e.createElement(i, {
		full: !0,
		onClick: P
	}, "Reset crop")));
}
//#endregion
//#region src/GridOverlay.tsx
var Ue = "safelight.crop.grid";
function We(e, t, n, r) {
	let i = [];
	for (let a = 1; a < n; a++) {
		let o = e + a / n * t;
		o > 0 && o < r && i.push(o);
	}
	return i;
}
function Ge() {
	let { rect: n, imageRect: r } = t.develop.useDevelopOverlay(), { cropping: i } = B(), a = _e();
	if (!a.show || i || !n || !r) return null;
	let o = ge(a), s = We(r.x - n.x, r.w, a.size, n.w), c = We(r.y - n.y, r.h, a.size, n.h);
	return /* @__PURE__ */ e.createElement("svg", {
		className: X.photoGrid,
		style: {
			left: n.x,
			top: n.y,
			width: n.w,
			height: n.h
		}
	}, s.map((t) => /* @__PURE__ */ e.createElement("line", {
		key: `x${t}`,
		x1: t,
		y1: 0,
		x2: t,
		y2: n.h,
		stroke: o,
		strokeWidth: 1
	})), c.map((t) => /* @__PURE__ */ e.createElement("line", {
		key: `y${t}`,
		x1: 0,
		y1: t,
		x2: n.w,
		y2: t,
		stroke: o,
		strokeWidth: 1
	})));
}
//#endregion
//#region src/stages.ts
var Ke = "safelight.crop.geometry", qe = "// The view's point (output, crop coordinates) to source UV: through the crop\n// to the transformed image, then the geometry transform's inverse (straighten,\n// perspective, stretch, scale, offset), which is independent of the crop. vUv\n// already has V flipped, so both are in top-left-origin image space.\nvec2 cropTransformUV(vec2 o) {\n  vec2 p = uCrop.xy + o * uCrop.zw;\n  vec3 q = uInvTransform * vec3(p, 1.0);\n  return q.xy / q.z;\n}", Je = (e, t) => [
	e,
	0,
	0,
	0,
	t,
	0,
	0,
	0,
	1
];
function Ye(e, t) {
	let n = e * Math.PI / 180, i = [
		Math.cos(n),
		-Math.sin(n),
		0,
		Math.sin(n),
		Math.cos(n),
		0,
		0,
		0,
		1
	], a = t.perspectiveH / 100 * .6, o = t.perspectiveV / 100 * .6, s = 1.5 ** (t.aspect / 100), c = 2 ** ((t.scale - 100) / 200), l = r(i, Je(t.flipH ? -1 : 1, t.flipV ? -1 : 1));
	l = r(l, [
		1,
		0,
		0,
		0,
		1,
		0,
		-a,
		-o,
		1
	]), l = r(l, Je(1 / s, s)), l = r(l, Je(1 / c, 1 / c));
	let u = [
		1,
		0,
		-(t.offsetX / 100) * .5,
		0,
		1,
		-(t.offsetY / 100) * .5,
		0,
		0,
		1
	];
	return {
		square: l,
		normalized: u
	};
}
function Xe(e) {
	return {
		id: Ke,
		name: "Crop & Straighten",
		phase: "geometry",
		anchor: "geometry",
		glsl: "",
		helpers: qe,
		uniforms: [{
			key: "uCrop",
			glslType: "vec4",
			default: [
				0,
				0,
				1,
				1
			]
		}, {
			key: "uInvTransform",
			glslType: "mat3",
			space: "image",
			default: [
				1,
				0,
				0,
				0,
				1,
				0,
				0,
				0,
				1
			]
		}],
		geometry: {
			region: "uCrop",
			inverse: "uInvTransform"
		},
		derive: (e) => ({
			uCrop: [
				e.crop.x,
				e.crop.y,
				e.crop.width,
				e.crop.height
			],
			uInvTransform: Ye(e.straighten, e.transform)
		})
	};
}
//#endregion
//#region src/index.tsx
var Ze = "core.crop", Qe = "safelight.crop.styles", $e = 3, et = null;
function tt(e) {
	n(e), ee(), ne(), le(), e.registerStylesheet({
		id: Qe,
		css: ve(e.ui.tokens)
	}), e.registerCursor(be), e.registerSlot({
		id: Ue,
		slot: "develop-canvas-overlay",
		component: Ge
	}), e.registerProcessingStage(Xe(3)), e.registerPanel({
		id: Ze,
		title: "Crop & Straighten",
		component: He,
		defaultDock: {
			module: "develop",
			direction: "right",
			order: 3,
			width: 280,
			height: 150
		},
		modules: ["develop"],
		onReset: () => {
			H({ aspect: 0 }), e.stores.useDevelopStore.getState().resetParams(["crop", "straighten"], "Reset Crop & Straighten");
		}
	}), et?.(), et = z(() => e.develop.setCanvasTool(P().cropping ? ze : null));
	let t = (e) => () => {
		P().cropping && e();
	};
	e.registerKeybinding({
		id: "crop.cycleGuide",
		label: "Cycle crop guide",
		category: "Develop",
		defaultCombo: "O",
		handler: t(L)
	}), e.registerKeybinding({
		id: "crop.flipGuide",
		label: "Flip crop guide",
		category: "Develop",
		defaultCombo: "Shift+O",
		handler: t(R)
	}), e.registerKeybinding({
		id: "crop.toggleGrid",
		label: "Show grid",
		category: "Develop",
		defaultCombo: "Ctrl+Alt+O",
		handler: me
	});
}
function nt() {
	et?.(), et = null, ee();
}
//#endregion
export { $e as LINE, Ze as PANEL_ID, Qe as STYLESHEET_ID, tt as activate, nt as deactivate };

//# sourceMappingURL=index.js.map