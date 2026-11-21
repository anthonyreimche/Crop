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
function ee(e, t, n, r = T.initial) {
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
var A = {
	cropping: !1,
	guide: "thirds",
	guideFlip: 0
}, j = /* @__PURE__ */ new Set(), M = (e) => {
	A = {
		...A,
		...e
	};
	for (let e of j) e();
}, N = () => A, P = (e) => A.cropping !== e && M({ cropping: e }), F = (e) => M({ guide: e }), I = () => M({ guide: w(A.guide) }), L = () => M({ guideFlip: (A.guideFlip + 1) % 4 }), R = (e) => (j.add(e), () => void j.delete(e)), z = () => e.useSyncExternalStore(R, N), te = () => M({
	cropping: !1,
	guide: "thirds",
	guideFlip: 0
}), B = "safelight.crop.options", ne = {
	constrain: !0,
	aspect: -1
};
function re() {
	t.variables.register(B, {
		initial: ne,
		description: "Crop & Straighten: whether a crop keeps inside the image, and its aspect lock."
	});
}
var ie = () => t.variables.get("safelight.crop.options")?.value ?? ne, V = (e) => void t.variables.update(B, (t) => ({
	...t,
	...e
}));
function H() {
	let [n, r] = e.useState(ie);
	return e.useEffect(() => t.variables.subscribe(B, (e) => r(e.value)), []), n;
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
	toggle: `${Y}-toggle`,
	on: `${Y}-on`,
	grid: `${Y}-grid`,
	choice: `${Y}-choice`,
	active: `${Y}-active`,
	custom: `${Y}-custom`,
	number: `${Y}-number`,
	colon: `${Y}-colon`,
	customButton: `${Y}-custom-button`,
	guides: `${Y}-guides`,
	guidesHeader: `${Y}-guides-header`,
	check: `${Y}-check`,
	hint: `${Y}-hint`,
	reset: `${Y}-reset`,
	canvas: `${Y}-canvas`,
	layer: `${Y}-layer`,
	dim: `${Y}-dim`,
	box: `${Y}-box`,
	handle: `${Y}-handle`,
	readout: `${Y}-readout`,
	photoGrid: `${Y}-photo-grid`
};
function ve(e) {
	let t = "border-radius: 0.25rem; padding: 0.25rem 0.5rem; font-size: 11px;", n = `background-color: ${e.surface2}; color: ${e.textSecondary};`, r = `background-color: ${e.surface3}; color: ${e.textPrimary};`;
	return `
:where(.${X.panel} > :not(:last-child)) { margin-block: 0 0.5rem; }
:where(.${X.toggle}) { width: 100%; ${t} font-weight: 500; ${n} }
:where(.${X.toggle}:hover) { ${r} }
:where(.${X.toggle}.${X.on}) { background-color: ${e.sliderFill}; color: ${e.white}; }
:where(.${X.toggle}.${X.on}:hover) { background-color: ${e.surface4}; }
:where(.${X.grid}) { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.25rem; }
:where(.${X.choice}) { ${t} ${n} }
:where(.${X.choice}:hover), :where(.${X.choice}.${X.active}) { ${r} }
:where(.${X.custom}) { display: flex; align-items: center; gap: 0.25rem; }
:where(.${X.number}) { width: 3rem; min-width: 0; border-radius: 0.25rem; background-color: ${e.surface2}; padding: 0.25rem 0.375rem; text-align: center; font-size: 11px; color: ${e.textPrimary}; outline: none; border: 0; }
:where(.${X.number}:focus) { background-color: ${e.surface3}; }
:where(.${X.colon}) { font-size: 11px; color: ${e.textMuted}; }
:where(.${X.customButton}) { min-width: 0; flex: 1 1 0%; }
:where(.${X.customButton}:disabled) { opacity: 0.4; }
:where(.${X.guides} > :not(:last-child)) { margin-block: 0 0.25rem; }
:where(.${X.guidesHeader}) { display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: ${e.textMuted}; }
:where(.${X.check}) { display: flex; cursor: pointer; align-items: center; gap: 0.5rem; font-size: 11px; color: ${e.textSecondary}; }
:where(.${X.check} input) { accent-color: ${e.sliderFill}; }
:where(.${X.hint}) { font-size: 10px; line-height: 1.375; color: ${e.textMuted}; margin: 0; }
:where(.${X.reset}) { width: 100%; ${t} ${n} }
:where(.${X.reset}:hover) { ${r} }
:where(.${X.canvas}) { position: absolute; inset: 0; touch-action: none; }
:where(.${X.layer}) { pointer-events: none; position: absolute; inset: 0; }
:where(.${X.dim}) { fill: rgba(0, 0, 0, 0.55); }
:where(.${X.box}) { pointer-events: none; position: absolute; border: 1px solid rgba(255, 255, 255, 0.8); }
:where(.${X.handle}) { pointer-events: none; position: absolute; width: 0.625rem; height: 0.625rem; transform: translate(-50%, -50%); border-radius: 0.125rem; border: 1px solid rgba(0, 0, 0, 0.4); background: #fff; }
:where(.${X.readout}) { pointer-events: none; position: absolute; border-radius: 0.25rem; background: rgba(0, 0, 0, 0.75); padding: 0.125rem 0.375rem; font-size: 11px; font-variant-numeric: tabular-nums; color: #fff; white-space: nowrap; }
:where(.${X.photoGrid}) { pointer-events: none; position: absolute; overflow: hidden; }
html.sl-larger-text .${X.hint}, html.sl-larger-text .${X.guidesHeader} { font-size: 12px !important; }
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
};
function xe(e, n, r) {
	let i = t.stores.useSettings.getState().uiScale || 1;
	return {
		x: (n - e.left) / i,
		y: (r - e.top) / i
	};
}
var Z = (e) => t.cursors.resolve(e), Q = .04, Se = 12, Ce = (e, t, n) => Math.min(n, Math.max(t, e)), $ = (e) => String(Math.round(e * 100) / 100), we = (e, t, n, r) => `M${$(e)} ${$(t)}H${$(n)}V${$(r)}H${$(e)}Z`, Te = 6, Ee = (e) => Math.round(e * 100) / 100, De = (e, t, n) => {
	let r = Math.atan2(n, t) * 180 / Math.PI;
	for (; r > 45;) r -= 90;
	for (; r < -45;) r += 90;
	return Ee(Ce(e + r, -45, 45));
}, Oe = (e) => J() === "right" ? e.button === 2 : e.button === 0 && (e.ctrlKey || e.metaKey), ke = (e, t, n, r, i, a) => {
	let o = (Math.atan2(a - t, i - e) - Math.atan2(r - t, n - e)) * 180 / Math.PI;
	return o > 180 && (o -= 360), o <= -180 && (o += 360), o;
}, Ae = (e) => `${(-e).toFixed(1)}°`, je = 14, Me = (e, t, n) => {
	let r = e > n.x + n.w / 2, i = t > n.y + n.h / 2;
	return {
		left: r ? e - je : e + je,
		top: i ? t - je : t + je,
		transform: r || i ? `translate(${r ? "-100%" : "0"}, ${i ? "-100%" : "0"})` : void 0
	};
}, Ne = (e) => {
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
function Pe({ rect: t, crop: n, viewCrop: r, inv: a, forward: o, distort: s, straightenDeg: c, aspect: l, imageAspect: u, constrain: d, guide: f, guideFlip: p, grid: m, onChange: h, onCommit: g, onLevel: _, onTurn: v, onTurnEnd: y }) {
	let x = e.useRef(null), [S, C] = e.useState(null), [w, T] = e.useState(null), [E, D] = e.useState(null), O = e.useId(), k = (e) => xe(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY), ee = l > 0 ? l / u : 0, A = l > 0 ? 1 / (l * u) : 0, j = (e, n) => ({
		x: t.x + (e - r.x) / r.width * t.w,
		y: t.y + (n - r.y) / r.height * t.h
	}), M = j(n.x, n.y), N = j(n.x + n.width, n.y + n.height), P = M.x, F = M.y, I = N.x - M.x, L = N.y - M.y, R = [
		i(o, 0, 0),
		i(o, 1, 0),
		i(o, 1, 1),
		i(o, 0, 1)
	].map((e) => j(e.x, e.y)), z = Math.min(R[0].x, R[1].x, R[2].x, R[3].x), te = Math.max(R[0].x, R[1].x, R[2].x, R[3].x), B = `${we(z, Math.min(R[0].y, R[1].y, R[2].y, R[3].y), te, Math.max(R[0].y, R[1].y, R[2].y, R[3].y))}${we(P, F, P + I, F + L)}`, ne = R.map((e) => `${$(e.x)},${$(e.y)}`).join(" "), re = `safelight-crop-dim-${O.replace(/:/g, "")}`, ie = [
		{
			id: "nw",
			x: P,
			y: F
		},
		{
			id: "ne",
			x: P + I,
			y: F
		},
		{
			id: "se",
			x: P + I,
			y: F + L
		},
		{
			id: "sw",
			x: P,
			y: F + L
		}
	], V = [
		{
			id: "n",
			x: P + I / 2,
			y: F
		},
		{
			id: "e",
			x: P + I,
			y: F + L / 2
		},
		{
			id: "s",
			x: P + I / 2,
			y: F + L
		},
		{
			id: "w",
			x: P,
			y: F + L / 2
		}
	], H = [...ie, ...V], U = (e, t) => {
		for (let n of H) if (Math.abs(e - n.x) <= Se && Math.abs(t - n.y) <= Se) return n.id;
		return e >= P && e <= P + I && t >= F && t <= F + L ? "move" : "rotate";
	}, ae = (e, t, n) => {
		let r = Ee(Ce(e.startDeg - ke(e.cx, e.cy, e.sx, e.sy, t, n), -45, 45));
		T({
			x: t,
			y: n,
			deg: r
		}), r !== e.deg && (e.deg = r, e.turned = !0, v(r, e.startCrop));
	}, oe = (e) => {
		T(null), e.turned && y();
	}, W = (e) => {
		let t = Oe(e);
		if (e.button !== 0 && !t) return;
		let { x: r, y: i } = k(e);
		if (e.currentTarget.setPointerCapture(e.pointerId), t) {
			x.current = {
				mode: "level",
				startCrop: n,
				sx: r,
				sy: i
			}, D("level"), C({
				x: r,
				y: i,
				dx: 0,
				dy: 0
			});
			return;
		}
		let a = U(r, i);
		if (D(a), a === "rotate") {
			let e = P + I / 2, t = F + L / 2;
			x.current = {
				mode: a,
				startCrop: n,
				sx: r,
				sy: i,
				cx: e,
				cy: t,
				startDeg: c,
				deg: c,
				turned: !1
			}, T({
				x: r,
				y: i,
				deg: c
			});
		} else x.current = {
			mode: a,
			startCrop: n,
			sx: r,
			sy: i
		};
	}, G = (e) => {
		let n = x.current;
		if (!n) {
			let { x: t, y: n } = k(e);
			D(J() === "ctrl" && (e.ctrlKey || e.metaKey) ? "level" : U(t, n));
			return;
		}
		let { x: i, y: c } = k(e);
		if (n.mode === "level") {
			C((e) => e && {
				...e,
				dx: i - n.sx,
				dy: c - n.sy
			});
			return;
		}
		if (n.mode === "rotate") {
			ae(n, i, c);
			return;
		}
		let l = (i - n.sx) / t.w * r.width, f = (c - n.sy) / t.h * r.height, p = Fe(n.mode, n.startCrop, l, f, ee, A);
		p = d ? b(n.startCrop, p, n.mode, a, o, u, ee > 0, s) : Le(p, r), h(p);
	}, se = (e) => {
		let t = x.current;
		if (x.current = null, t) {
			if (t.mode === "level") {
				let { x: n, y: r } = k(e), i = n - t.sx, a = r - t.sy;
				C(null), Math.abs(i) + Math.abs(a) > Te && _(De(c, i, a));
			} else if (t.mode === "rotate") {
				let { x: n, y: r } = k(e);
				ae(t, n, r), oe(t);
			} else g();
		}
	}, K = () => {
		let e = x.current;
		x.current = null, e && (e.mode === "level" ? C(null) : e.mode === "rotate" ? oe(e) : g());
	};
	return /* @__PURE__ */ e.createElement("div", {
		className: X.canvas,
		style: { cursor: Ne(E) },
		onPointerDown: W,
		onPointerMove: G,
		onPointerUp: se,
		onPointerCancel: K,
		onLostPointerCapture: K,
		onContextMenu: (e) => {
			J() === "right" && e.preventDefault();
		},
		onPointerLeave: () => {
			x.current || D(null);
		}
	}, /* @__PURE__ */ e.createElement("svg", {
		"data-dim": "",
		className: X.layer,
		width: "100%",
		height: "100%"
	}, /* @__PURE__ */ e.createElement("clipPath", { id: re }, /* @__PURE__ */ e.createElement("polygon", { points: ne })), /* @__PURE__ */ e.createElement("path", {
		className: X.dim,
		d: B,
		fillRule: "evenodd",
		clipPath: `url(#${re})`
	})), /* @__PURE__ */ e.createElement("div", {
		className: X.box,
		style: {
			left: P,
			top: F,
			width: I,
			height: L
		}
	}, /* @__PURE__ */ e.createElement(Ie, {
		guide: w ? "grid" : f,
		flip: w ? 0 : p,
		grid: m,
		w: I,
		h: L
	})), H.map((t) => /* @__PURE__ */ e.createElement("div", {
		key: t.id,
		"data-handle": t.id,
		className: X.handle,
		style: {
			left: t.x,
			top: t.y
		}
	})), S && /* @__PURE__ */ e.createElement("svg", {
		className: X.layer,
		width: "100%",
		height: "100%"
	}, /* @__PURE__ */ e.createElement("line", {
		x1: S.x,
		y1: S.y,
		x2: S.x + S.dx,
		y2: S.y + S.dy,
		stroke: "#4aa3ff",
		strokeWidth: 1.5
	})), S && Math.abs(S.dx) + Math.abs(S.dy) > Te && /* @__PURE__ */ e.createElement("div", {
		className: X.readout,
		style: Me(S.x + S.dx, S.y + S.dy, t)
	}, Ae(De(c, S.dx, S.dy))), w && /* @__PURE__ */ e.createElement("div", {
		className: X.readout,
		style: Me(w.x, w.y, t)
	}, Ae(w.deg)));
}
function Fe(e, t, n, r, i, a) {
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
function Ie({ guide: t, flip: n, grid: r, w: i, h: a }) {
	if (i <= 1 || a <= 1) return null;
	let { lines: o, paths: s } = ee(t, i, a, r.size), c = t === "grid" ? ge(r) : "rgba(255,255,255,0.4)", l = n === 1 ? `translate(${i} 0) scale(-1 1)` : n === 2 ? `translate(0 ${a}) scale(1 -1)` : n === 3 ? `translate(${i} ${a}) scale(-1 -1)` : void 0;
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
function Le(e, t) {
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
var Re = (e) => ({
	...e,
	crop: m(d(e.straighten, e.transform, U()))
});
function ze({ rect: n }) {
	let r = t.stores.useDevelopStore, i = r((e) => e.params.crop), a = r((e) => e.params.straighten), o = r((e) => e.params.transform), s = r((e) => e.setParam), c = r((e) => e.commitEdit), l = r((e) => !!e.bypassedPanels["core.crop"] || !!e.bypassedPanels["core.transform"]), { region: f, imageAspect: p } = t.develop.useDevelopOverlay(), { guide: h, guideFlip: g } = z(), { constrain: _, aspect: v } = H(), y = _e(), b = u(a, o, p), x = d(a, o, p), C = f ?? m(x), w = e.useRef(null), T = e.useRef(null), E = (e) => {
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
	}, []), l ? null : /* @__PURE__ */ e.createElement(Pe, {
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
var Be = {
	overlay: ze,
	zoomable: !1,
	viewParams: Re,
	onEscape: () => P(!1)
}, Ve = {
	x: 0,
	y: 0,
	width: 1,
	height: 1
}, He = [
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
], Ue = (e) => `${X.choice}${e ? ` ${X.active}` : ""}`;
function We() {
	let { Panel: n, Slider: r } = t.components, i = t.stores.useDevelopStore, { cropping: a, guide: o } = z(), { constrain: s, aspect: c } = H(), l = ue(), d = _e(), f = i((e) => e.params.straighten), m = i((e) => e.params.transform), h = i((e) => e.params.crop), g = i((e) => e.setParam), _ = i((e) => e.commitEdit), v = ae(), y = e.useRef(null), [b, x] = e.useState("16"), [w, E] = e.useState("10"), D = (() => {
		let e = parseFloat(b), t = parseFloat(w);
		return e > 0 && t > 0 ? e / t : 0;
	})(), O = (e) => {
		if (P(!0), e === 0) {
			V({ aspect: 0 });
			return;
		}
		let t = e === -1 ? v : e;
		V({ aspect: e === -1 ? -1 : t });
		let n = p(t, v);
		s && (n = S(n, u(f, m, v))), g("crop", n), _("Crop");
	}, k = (e) => e === 0 ? c === 0 : e === -1 ? c === -1 : c > 0 && Math.abs(c - e) < 1e-4, ee = () => {
		V({ aspect: -1 }), g("crop", { ...Ve }), g("straighten", 0), _("Crop reset");
	}, A = /* @__PURE__ */ e.createElement(r, {
		label: "Grid size",
		value: d.size,
		min: T.min,
		max: T.max,
		step: 1,
		defaultValue: T.initial,
		onChange: he
	});
	return /* @__PURE__ */ e.createElement(n, {
		title: "Crop & Straighten",
		defaultOpen: !1
	}, /* @__PURE__ */ e.createElement("div", { className: X.panel }, /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: () => P(!a),
		"aria-pressed": a,
		className: `${X.toggle}${a ? ` ${X.on}` : ""}`
	}, a ? "Done" : "Crop"), a && /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement("div", { className: X.grid }, He.map((t) => /* @__PURE__ */ e.createElement("button", {
		key: t.label,
		type: "button",
		onClick: () => O(t.ratio),
		className: Ue(k(t.ratio))
	}, t.label))), /* @__PURE__ */ e.createElement("div", { className: X.custom }, /* @__PURE__ */ e.createElement("input", {
		type: "number",
		min: 1,
		"aria-label": "Custom ratio width",
		value: b,
		onChange: (e) => x(e.target.value),
		className: X.number
	}), /* @__PURE__ */ e.createElement("span", { className: X.colon }, ":"), /* @__PURE__ */ e.createElement("input", {
		type: "number",
		min: 1,
		"aria-label": "Custom ratio height",
		value: w,
		onChange: (e) => E(e.target.value),
		className: X.number
	}), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		disabled: D <= 0,
		onClick: () => O(D),
		className: `${Ue(D > 0 && k(D))} ${X.customButton}`
	}, "Custom"))), /* @__PURE__ */ e.createElement(r, {
		label: "Straighten",
		value: -f,
		min: -45,
		max: 45,
		step: .1,
		onChange: (e) => {
			let t = -e;
			g("straighten", t), s && (y.current ||= h, g("crop", S(y.current, u(t, m, v))));
		},
		onCommit: () => {
			y.current = null, _("Straighten");
		}
	}), a && /* @__PURE__ */ e.createElement("div", { className: X.guides }, /* @__PURE__ */ e.createElement("div", { className: X.guidesHeader }, /* @__PURE__ */ e.createElement("span", null, "Overlay"), /* @__PURE__ */ e.createElement("span", null, "O cycles · Shift+O flips")), /* @__PURE__ */ e.createElement("div", { className: X.grid }, C.map((t) => /* @__PURE__ */ e.createElement("button", {
		key: t.id,
		type: "button",
		onClick: () => F(t.id),
		className: Ue(o === t.id)
	}, t.label))), o === "grid" && A), /* @__PURE__ */ e.createElement("label", { className: X.check }, /* @__PURE__ */ e.createElement("input", {
		type: "checkbox",
		checked: s,
		onChange: (e) => V({ constrain: e.target.checked })
	}), "Constrain to image"), !a && /* @__PURE__ */ e.createElement("label", {
		className: X.check,
		title: "A grid over the photo, for checking horizons, verticals and lens distortion. Its shortcut is under Preferences ▸ Shortcuts."
	}, /* @__PURE__ */ e.createElement("input", {
		type: "checkbox",
		checked: d.show,
		onChange: (e) => pe(e.target.checked)
	}), "Show grid"), !a && d.show && A, a && /* @__PURE__ */ e.createElement("p", { className: X.hint }, "Drag the edges/corners to crop · ", l === "right" ? "Right-drag" : "Ctrl-drag", " across a line to level."), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: ee,
		className: X.reset
	}, "Reset crop")));
}
//#endregion
//#region src/GridOverlay.tsx
var Ge = "safelight.crop.grid";
function Ke(e, t, n, r) {
	let i = [];
	for (let a = 1; a < n; a++) {
		let o = e + a / n * t;
		o > 0 && o < r && i.push(o);
	}
	return i;
}
function qe() {
	let { rect: n, imageRect: r } = t.develop.useDevelopOverlay(), { cropping: i } = z(), a = _e();
	if (!a.show || i || !n || !r) return null;
	let o = ge(a), s = Ke(r.x - n.x, r.w, a.size, n.w), c = Ke(r.y - n.y, r.h, a.size, n.h);
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
var Je = "safelight.crop.geometry", Ye = "// The view's point (output, crop coordinates) to source UV: through the crop\n// to the transformed image, then the geometry transform's inverse (straighten,\n// perspective, stretch, scale, offset), which is independent of the crop. vUv\n// already has V flipped, so both are in top-left-origin image space.\nvec2 cropTransformUV(vec2 o) {\n  vec2 p = uCrop.xy + o * uCrop.zw;\n  vec3 q = uInvTransform * vec3(p, 1.0);\n  return q.xy / q.z;\n}", Xe = (e, t) => [
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
function Ze(e, t) {
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
	], a = t.perspectiveH / 100 * .6, o = t.perspectiveV / 100 * .6, s = 1.5 ** (t.aspect / 100), c = 2 ** ((t.scale - 100) / 200), l = r(i, Xe(t.flipH ? -1 : 1, t.flipV ? -1 : 1));
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
	]), l = r(l, Xe(1 / s, s)), l = r(l, Xe(1 / c, 1 / c));
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
function Qe(e) {
	return {
		id: Je,
		name: "Crop & Straighten",
		phase: "geometry",
		anchor: "geometry",
		glsl: "",
		helpers: Ye,
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
			uInvTransform: Ze(e.straighten, e.transform)
		})
	};
}
//#endregion
//#region src/index.tsx
var $e = "core.crop", et = "safelight.crop.styles", tt = 3, nt = null;
function rt(e) {
	n(e), te(), re(), le(), e.registerStylesheet({
		id: et,
		css: ve(e.ui.tokens)
	}), e.registerCursor(be), e.registerSlot({
		id: Ge,
		slot: "develop-canvas-overlay",
		component: qe
	}), e.registerProcessingStage(Qe(3)), e.registerPanel({
		id: $e,
		title: "Crop & Straighten",
		component: We,
		defaultDock: {
			module: "develop",
			direction: "right",
			order: 3,
			width: 280,
			height: 150
		},
		onReset: () => {
			V({ aspect: 0 }), e.stores.useDevelopStore.getState().resetParams(["crop", "straighten"], "Reset Crop & Straighten");
		}
	}), nt?.(), nt = R(() => e.develop.setCanvasTool(N().cropping ? Be : null));
	let t = (e) => () => {
		N().cropping && e();
	};
	e.registerKeybinding({
		id: "crop.cycleGuide",
		label: "Cycle crop guide",
		category: "Develop",
		defaultCombo: "O",
		handler: t(I)
	}), e.registerKeybinding({
		id: "crop.flipGuide",
		label: "Flip crop guide",
		category: "Develop",
		defaultCombo: "Shift+O",
		handler: t(L)
	}), e.registerKeybinding({
		id: "crop.toggleGrid",
		label: "Show grid",
		category: "Develop",
		defaultCombo: "Ctrl+Alt+O",
		handler: me
	});
}
function it() {
	nt?.(), nt = null, te();
}
//#endregion
export { tt as LINE, $e as PANEL_ID, et as STYLESHEET_ID, rt as activate, it as deactivate };

//# sourceMappingURL=index.js.map