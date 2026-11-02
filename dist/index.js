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
var T = .5 - .5 / Math.sqrt(5), E = .5 + .5 / Math.sqrt(5);
function D(e, t, n, r, i, a) {
	let o = i - n, s = a - r, c = ((e - n) * o + (t - r) * s) / (o * o + s * s);
	return {
		x: n + c * o,
		y: r + c * s
	};
}
function O(e, t) {
	let n = (1 + Math.sqrt(5)) / 2, r = e / n, i = t - t / n, a = 2 / Math.PI * Math.log(n), o = Math.hypot(Math.max(r, e - r), Math.max(i, t - i)) * 1.15, s = Math.atan2(-i, e - r), c = Math.PI / 2 * 4.5, l = "";
	for (let e = 0; e <= 120; e++) {
		let t = e / 120 * c, n = o * Math.exp(-a * t), u = s + t, d = r + n * Math.cos(u), f = i + n * Math.sin(u);
		l += `${e === 0 ? "M" : "L"} ${d.toFixed(2)} ${f.toFixed(2)} `;
	}
	return l.trim();
}
function k(e, t, n) {
	let r = [], i = [], a = (e) => r.push({
		x1: e * t,
		y1: 0,
		x2: e * t,
		y2: n
	}), o = (e) => r.push({
		x1: 0,
		y1: e * n,
		x2: t,
		y2: e * n
	});
	switch (e) {
		case "thirds":
			a(1 / 3), a(2 / 3), o(1 / 3), o(2 / 3);
			break;
		case "golden":
			a(T), a(E), o(T), o(E);
			break;
		case "grid":
			for (let e = 1; e < 8; e++) a(e / 8);
			for (let e = 1; e < 8; e++) o(e / 8);
			break;
		case "diagonal": {
			let e = Math.min(t, n);
			r.push({
				x1: 0,
				y1: 0,
				x2: e,
				y2: e
			}), r.push({
				x1: t,
				y1: 0,
				x2: t - e,
				y2: e
			}), r.push({
				x1: 0,
				y1: n,
				x2: e,
				y2: n - e
			}), r.push({
				x1: t,
				y1: n,
				x2: t - e,
				y2: n - e
			});
			break;
		}
		case "triangle": {
			r.push({
				x1: 0,
				y1: 0,
				x2: t,
				y2: n
			});
			let e = D(t, 0, 0, 0, t, n);
			r.push({
				x1: t,
				y1: 0,
				x2: e.x,
				y2: e.y
			});
			let i = D(0, n, 0, 0, t, n);
			r.push({
				x1: 0,
				y1: n,
				x2: i.x,
				y2: i.y
			});
			break;
		}
		case "spiral": a(T), a(E), o(T), o(E), i.push(O(t, n));
	}
	return {
		lines: r,
		paths: i
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
}, N = () => A, P = (e) => A.cropping !== e && M({ cropping: e }), F = (e) => M({ guide: e }), I = () => M({ guide: w(A.guide) }), L = () => M({ guideFlip: (A.guideFlip + 1) % 4 }), R = (e) => (j.add(e), () => void j.delete(e)), z = () => e.useSyncExternalStore(R, N), B = () => M({
	cropping: !1,
	guide: "thirds",
	guideFlip: 0
}), V = "safelight.crop.options", H = {
	constrain: !0,
	aspect: -1
};
function ee() {
	t.variables.register(V, {
		initial: H,
		description: "Crop & Straighten: whether a crop keeps inside the image, and its aspect lock."
	});
}
var U = () => t.variables.get("safelight.crop.options")?.value ?? H, W = (e) => void t.variables.update(V, (t) => ({
	...t,
	...e
}));
function G() {
	let [n, r] = e.useState(U);
	return e.useEffect(() => t.variables.subscribe(V, (e) => r(e.value)), []), n;
}
function K() {
	let { sourceSize: e } = t.stores.useDevelopStore.getState();
	if (e.width > 0 && e.height > 0) return e.width / e.height;
	let { photos: n, activePhotoId: r } = t.stores.useCatalogStore.getState(), i = n.find((e) => e.id === r);
	return i && i.width > 0 && i.height > 0 ? i.width / i.height : 1;
}
function te() {
	return t.stores.useDevelopStore((e) => e.sourceSize), t.stores.useCatalogStore((e) => {
		let t = e.photos.find((t) => t.id === e.activePhotoId);
		return t ? `${t.width}x${t.height}` : "";
	}), K();
}
var ne = "levelWith";
function re() {
	t.registerSettings({
		title: "Crop & Straighten",
		fields: [{
			key: ne,
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
		}]
	});
}
var q = () => t.settings.get("levelWith", "ctrl") === "right" ? "right" : "ctrl";
function ie() {
	let [n, r] = e.useState(q);
	return e.useEffect(() => t.settings.onChange((e) => {
		e === "levelWith" && r(q());
	}), []), n;
}
//#endregion
//#region src/styles.ts
var J = "safelight-crop", Y = {
	panel: `${J}-panel`,
	toggle: `${J}-toggle`,
	on: `${J}-on`,
	grid: `${J}-grid`,
	choice: `${J}-choice`,
	active: `${J}-active`,
	custom: `${J}-custom`,
	number: `${J}-number`,
	colon: `${J}-colon`,
	customButton: `${J}-custom-button`,
	guides: `${J}-guides`,
	guidesHeader: `${J}-guides-header`,
	check: `${J}-check`,
	hint: `${J}-hint`,
	reset: `${J}-reset`,
	canvas: `${J}-canvas`,
	layer: `${J}-layer`,
	piece: `${J}-piece`,
	box: `${J}-box`,
	handle: `${J}-handle`,
	readout: `${J}-readout`
};
function ae(e) {
	let t = "border-radius: 0.25rem; padding: 0.25rem 0.5rem; font-size: 11px;", n = `background-color: ${e.surface2}; color: ${e.textSecondary};`, r = `background-color: ${e.surface3}; color: ${e.textPrimary};`;
	return `
:where(.${Y.panel} > :not(:last-child)) { margin-block: 0 0.5rem; }
:where(.${Y.toggle}) { width: 100%; ${t} font-weight: 500; ${n} }
:where(.${Y.toggle}:hover) { ${r} }
:where(.${Y.toggle}.${Y.on}) { background-color: ${e.sliderFill}; color: ${e.white}; }
:where(.${Y.toggle}.${Y.on}:hover) { background-color: ${e.surface4}; }
:where(.${Y.grid}) { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.25rem; }
:where(.${Y.choice}) { ${t} ${n} }
:where(.${Y.choice}:hover), :where(.${Y.choice}.${Y.active}) { ${r} }
:where(.${Y.custom}) { display: flex; align-items: center; gap: 0.25rem; }
:where(.${Y.number}) { width: 3rem; min-width: 0; border-radius: 0.25rem; background-color: ${e.surface2}; padding: 0.25rem 0.375rem; text-align: center; font-size: 11px; color: ${e.textPrimary}; outline: none; border: 0; }
:where(.${Y.number}:focus) { background-color: ${e.surface3}; }
:where(.${Y.colon}) { font-size: 11px; color: ${e.textMuted}; }
:where(.${Y.customButton}) { min-width: 0; flex: 1 1 0%; }
:where(.${Y.customButton}:disabled) { opacity: 0.4; }
:where(.${Y.guides} > :not(:last-child)) { margin-block: 0 0.25rem; }
:where(.${Y.guidesHeader}) { display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: ${e.textMuted}; }
:where(.${Y.check}) { display: flex; cursor: pointer; align-items: center; gap: 0.5rem; font-size: 11px; color: ${e.textSecondary}; }
:where(.${Y.check} input) { accent-color: ${e.sliderFill}; }
:where(.${Y.hint}) { font-size: 10px; line-height: 1.375; color: ${e.textMuted}; margin: 0; }
:where(.${Y.reset}) { width: 100%; ${t} ${n} }
:where(.${Y.reset}:hover) { ${r} }
:where(.${Y.canvas}) { position: absolute; inset: 0; touch-action: none; }
:where(.${Y.layer}) { pointer-events: none; position: absolute; inset: 0; }
:where(.${Y.piece}) { position: absolute; background: rgba(0, 0, 0, 0.55); }
:where(.${Y.box}) { pointer-events: none; position: absolute; border: 1px solid rgba(255, 255, 255, 0.8); }
:where(.${Y.handle}) { pointer-events: none; position: absolute; width: 0.625rem; height: 0.625rem; transform: translate(-50%, -50%); border-radius: 0.125rem; border: 1px solid rgba(0, 0, 0, 0.4); background: #fff; }
:where(.${Y.readout}) { pointer-events: none; position: absolute; border-radius: 0.25rem; background: rgba(0, 0, 0, 0.75); padding: 0.125rem 0.375rem; font-size: 11px; font-variant-numeric: tabular-nums; color: #fff; white-space: nowrap; }
html.sl-larger-text .${Y.hint}, html.sl-larger-text .${Y.guidesHeader} { font-size: 12px !important; }
`;
}
//#endregion
//#region src/CropBox.tsx
function oe(e, n, r) {
	let i = t.stores.useSettings.getState().uiScale || 1;
	return {
		x: (n - e.left) / i,
		y: (r - e.top) / i
	};
}
var X = (e) => t.cursors.resolve(e), Z = .04, se = 12, Q = (e, t, n) => Math.min(n, Math.max(t, e)), ce = 6, le = (e, t, n) => {
	let r = Math.atan2(n, t) * 180 / Math.PI;
	for (; r > 45;) r -= 90;
	for (; r < -45;) r += 90;
	return Q(e + r, -45, 45);
}, ue = (e) => q() === "right" ? e.button === 2 : e.button === 0 && (e.ctrlKey || e.metaKey), de = (e) => {
	switch (e) {
		case "move": return X("crop-move");
		case "nw":
		case "se": return X("crop-resize-nwse");
		case "ne":
		case "sw": return X("crop-resize-nesw");
		case "n":
		case "s": return X("crop-resize-ns");
		case "e":
		case "w": return X("crop-resize-ew");
		default: return X("crosshair");
	}
};
function fe({ rect: t, crop: n, viewCrop: r, inv: a, forward: o, distort: s, straightenDeg: c, aspect: l, imageAspect: u, constrain: d, guide: f, guideFlip: p, onChange: m, onCommit: h, onLevel: g }) {
	let _ = e.useRef(null), [v, y] = e.useState(null), [x, S] = e.useState(null), C = (e) => oe(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY), w = l > 0 ? l / u : 0, T = l > 0 ? 1 / (l * u) : 0, E = (e, n) => ({
		x: t.x + (e - r.x) / r.width * t.w,
		y: t.y + (n - r.y) / r.height * t.h
	}), D = E(n.x, n.y), O = E(n.x + n.width, n.y + n.height), k = D.x, A = D.y, j = O.x - D.x, M = O.y - D.y, N = [
		i(o, 0, 0),
		i(o, 1, 0),
		i(o, 1, 1),
		i(o, 0, 1)
	].map((e) => E(e.x, e.y)), P = Math.min(N[0].x, N[1].x, N[2].x, N[3].x), F = Math.max(N[0].x, N[1].x, N[2].x, N[3].x), I = Math.min(N[0].y, N[1].y, N[2].y, N[3].y), L = Math.max(N[0].y, N[1].y, N[2].y, N[3].y), R = Q(k, P, F), z = Q(k + j, P, F), B = Q(A, I, L), V = Q(A + M, I, L), H = [
		{
			id: "nw",
			x: k,
			y: A
		},
		{
			id: "ne",
			x: k + j,
			y: A
		},
		{
			id: "se",
			x: k + j,
			y: A + M
		},
		{
			id: "sw",
			x: k,
			y: A + M
		}
	], ee = [
		{
			id: "n",
			x: k + j / 2,
			y: A
		},
		{
			id: "e",
			x: k + j,
			y: A + M / 2
		},
		{
			id: "s",
			x: k + j / 2,
			y: A + M
		},
		{
			id: "w",
			x: k,
			y: A + M / 2
		}
	], U = [...H, ...ee], W = (e, t) => {
		for (let n of U) if (Math.abs(e - n.x) <= se && Math.abs(t - n.y) <= se) return n.id;
		return e >= k && e <= k + j && t >= A && t <= A + M ? "move" : null;
	}, G = (e) => {
		let t = ue(e);
		if (e.button !== 0 && !t) return;
		let { x: r, y: i } = C(e);
		if (e.currentTarget.setPointerCapture(e.pointerId), t) {
			_.current = {
				mode: "level",
				startCrop: n,
				sx: r,
				sy: i
			}, S("level"), y({
				x: r,
				y: i,
				dx: 0,
				dy: 0
			});
			return;
		}
		let a = W(r, i);
		a && (S(a), _.current = {
			mode: a,
			startCrop: n,
			sx: r,
			sy: i
		});
	}, K = (e) => {
		let n = _.current;
		if (!n) {
			let { x: t, y: n } = C(e);
			S(q() === "ctrl" && (e.ctrlKey || e.metaKey) ? "level" : W(t, n));
			return;
		}
		let { x: i, y: c } = C(e);
		if (n.mode === "level") {
			y((e) => e && {
				...e,
				dx: i - n.sx,
				dy: c - n.sy
			});
			return;
		}
		let l = (i - n.sx) / t.w * r.width, f = (c - n.sy) / t.h * r.height, p = pe(n.mode, n.startCrop, l, f, w, T);
		p = d ? b(n.startCrop, p, n.mode, a, o, u, w > 0, s) : he(p, r), m(p);
	}, te = (e) => {
		let t = _.current;
		if (_.current = null, t) {
			if (t.mode === "level") {
				let { x: n, y: r } = C(e), i = n - t.sx, a = r - t.sy;
				y(null), Math.abs(i) + Math.abs(a) > ce && g(le(c, i, a));
			} else h();
		}
	}, ne = () => {
		let e = _.current;
		_.current = null, e && (e.mode === "level" ? y(null) : h());
	};
	return /* @__PURE__ */ e.createElement("div", {
		className: Y.canvas,
		style: { cursor: de(x) },
		onPointerDown: G,
		onPointerMove: K,
		onPointerUp: te,
		onPointerCancel: ne,
		onLostPointerCapture: ne,
		onContextMenu: (e) => {
			q() === "right" && e.preventDefault();
		},
		onPointerLeave: () => {
			_.current || S(null);
		}
	}, /* @__PURE__ */ e.createElement("div", { className: Y.layer }, /* @__PURE__ */ e.createElement("div", {
		className: Y.piece,
		style: {
			left: P,
			top: I,
			width: Math.max(0, F - P),
			height: Math.max(0, B - I)
		}
	}), /* @__PURE__ */ e.createElement("div", {
		className: Y.piece,
		style: {
			left: P,
			top: V,
			width: Math.max(0, F - P),
			height: Math.max(0, L - V)
		}
	}), /* @__PURE__ */ e.createElement("div", {
		className: Y.piece,
		style: {
			left: P,
			top: B,
			width: Math.max(0, R - P),
			height: Math.max(0, V - B)
		}
	}), /* @__PURE__ */ e.createElement("div", {
		className: Y.piece,
		style: {
			left: z,
			top: B,
			width: Math.max(0, F - z),
			height: Math.max(0, V - B)
		}
	})), /* @__PURE__ */ e.createElement("div", {
		className: Y.box,
		style: {
			left: k,
			top: A,
			width: j,
			height: M
		}
	}, /* @__PURE__ */ e.createElement(me, {
		guide: f,
		flip: p,
		w: j,
		h: M
	})), U.map((t) => /* @__PURE__ */ e.createElement("div", {
		key: t.id,
		"data-handle": t.id,
		className: Y.handle,
		style: {
			left: t.x,
			top: t.y
		}
	})), v && /* @__PURE__ */ e.createElement("svg", {
		className: Y.layer,
		width: "100%",
		height: "100%"
	}, /* @__PURE__ */ e.createElement("line", {
		x1: v.x,
		y1: v.y,
		x2: v.x + v.dx,
		y2: v.y + v.dy,
		stroke: "#4aa3ff",
		strokeWidth: 1.5
	})), v && Math.abs(v.dx) + Math.abs(v.dy) > ce && /* @__PURE__ */ e.createElement("div", {
		className: Y.readout,
		style: {
			left: v.x + v.dx + 14,
			top: v.y + v.dy + 14
		}
	}, `${(-le(c, v.dx, v.dy)).toFixed(1)}°`));
}
function pe(e, t, n, r, i, a) {
	let o = t.x, s = t.y, c = t.width, l = t.height;
	if (e === "move") o += n, s += r;
	else if (i > 0 && e.length === 2) {
		let u = e.includes("e"), d = e.includes("s"), f = u ? t.x : t.x + t.width, p = d ? t.y : t.y + t.height, m = Math.max(Z, u ? t.width + n : t.width - n), h = Math.max(Z, d ? t.height + r : t.height - r), g = a > 0 ? a : i, _ = m / h, v = Math.abs(Math.log(_ / i)) <= Math.abs(Math.log(_ / g)) ? i : g;
		c = Math.max(m, h * v), l = c / v, v >= 1 ? l < Z && (l = Z, c = l * v) : c < Z && (c = Z, l = c / v), o = u ? f : f - c, s = d ? p : p - l;
	} else if (i > 0) {
		let i = t.width / t.height, a = t.x + t.width / 2, u = t.y + t.height / 2;
		e === "e" || e === "w" ? (c = Math.max(Z, e === "e" ? t.width + n : t.width - n), l = c / i, l < Z && (l = Z, c = l * i), o = e === "e" ? t.x : t.x + t.width - c, s = u - l / 2) : (l = Math.max(Z, e === "s" ? t.height + r : t.height - r), c = l * i, c < Z && (c = Z, l = c / i), s = e === "s" ? t.y : t.y + t.height - l, o = a - c / 2);
	} else e.includes("e") && (c += n), e.includes("w") && (o += n, c -= n), e.includes("s") && (l += r), e.includes("n") && (s += r, l -= r);
	return c < Z && (e.includes("w") && (o = t.x + t.width - Z), c = Z), l < Z && (e.includes("n") && (s = t.y + t.height - Z), l = Z), {
		x: o,
		y: s,
		width: c,
		height: l
	};
}
function me({ guide: t, flip: n, w: r, h: i }) {
	if (r <= 1 || i <= 1) return null;
	let { lines: a, paths: o } = k(t, r, i), s = n === 1 ? `translate(${r} 0) scale(-1 1)` : n === 2 ? `translate(0 ${i}) scale(1 -1)` : n === 3 ? `translate(${r} ${i}) scale(-1 -1)` : void 0;
	return /* @__PURE__ */ e.createElement("svg", {
		className: Y.layer,
		width: r,
		height: i
	}, /* @__PURE__ */ e.createElement("g", { transform: s }, a.map((t, n) => /* @__PURE__ */ e.createElement("line", {
		key: n,
		x1: t.x1,
		y1: t.y1,
		x2: t.x2,
		y2: t.y2,
		stroke: "rgba(255,255,255,0.4)",
		strokeWidth: 1
	})), o.map((t, n) => /* @__PURE__ */ e.createElement("path", {
		key: `p${n}`,
		d: t,
		fill: "none",
		stroke: "rgba(255,255,255,0.55)",
		strokeWidth: 1
	}))));
}
function he(e, t) {
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
var ge = (e) => ({
	...e,
	crop: m(d(e.straighten, e.transform, K()))
});
function _e({ rect: n }) {
	let r = t.stores.useDevelopStore, i = r((e) => e.params.crop), a = r((e) => e.params.straighten), o = r((e) => e.params.transform), s = r((e) => e.setParam), c = r((e) => e.commitEdit), l = r((e) => !!e.bypassedPanels["core.crop"] || !!e.bypassedPanels["core.transform"]), { region: f, imageAspect: p } = t.develop.useDevelopOverlay(), { guide: h, guideFlip: g } = z(), { constrain: _, aspect: v } = G(), y = u(a, o, p), b = d(a, o, p), x = f ?? m(b), C = e.useRef(null), w = e.useRef(null), T = (e) => {
		C.current = e, w.current ??= requestAnimationFrame(() => {
			w.current = null, C.current && s("crop", C.current);
		});
	}, E = () => {
		w.current != null && (cancelAnimationFrame(w.current), w.current = null), C.current &&= (s("crop", C.current), null);
	};
	return e.useEffect(() => () => {
		w.current != null && cancelAnimationFrame(w.current), C.current = null;
	}, []), l ? null : /* @__PURE__ */ e.createElement(fe, {
		rect: n,
		crop: i,
		viewCrop: x,
		inv: y,
		forward: b,
		distort: null,
		straightenDeg: a,
		aspect: v === -1 ? p : v,
		imageAspect: p,
		constrain: _,
		guide: h,
		guideFlip: g,
		onChange: T,
		onCommit: () => {
			E(), c("Crop");
		},
		onLevel: (e) => {
			s("straighten", e), _ && s("crop", S(i, u(e, o, p))), c("Straighten");
		}
	});
}
var ve = {
	overlay: _e,
	zoomable: !1,
	viewParams: ge,
	onEscape: () => P(!1)
}, ye = {
	x: 0,
	y: 0,
	width: 1,
	height: 1
}, be = [
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
], xe = (e) => `${Y.choice}${e ? ` ${Y.active}` : ""}`;
function Se() {
	let { Panel: n, Slider: r } = t.components, i = t.stores.useDevelopStore, { cropping: a, guide: o } = z(), { constrain: s, aspect: c } = G(), l = ie(), d = i((e) => e.params.straighten), f = i((e) => e.params.transform), m = i((e) => e.params.crop), h = i((e) => e.setParam), g = i((e) => e.commitEdit), _ = te(), v = e.useRef(null), [y, b] = e.useState("16"), [x, w] = e.useState("10"), T = (() => {
		let e = parseFloat(y), t = parseFloat(x);
		return e > 0 && t > 0 ? e / t : 0;
	})(), E = (e) => {
		if (P(!0), e === 0) {
			W({ aspect: 0 });
			return;
		}
		let t = e === -1 ? _ : e;
		W({ aspect: e === -1 ? -1 : t });
		let n = p(t, _);
		s && (n = S(n, u(d, f, _))), h("crop", n), g("Crop");
	}, D = (e) => e === 0 ? c === 0 : e === -1 ? c === -1 : c > 0 && Math.abs(c - e) < 1e-4;
	return /* @__PURE__ */ e.createElement(n, {
		title: "Crop & Straighten",
		defaultOpen: !1
	}, /* @__PURE__ */ e.createElement("div", { className: Y.panel }, /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: () => P(!a),
		"aria-pressed": a,
		className: `${Y.toggle}${a ? ` ${Y.on}` : ""}`
	}, a ? "Done" : "Crop"), a && /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement("div", { className: Y.grid }, be.map((t) => /* @__PURE__ */ e.createElement("button", {
		key: t.label,
		type: "button",
		onClick: () => E(t.ratio),
		className: xe(D(t.ratio))
	}, t.label))), /* @__PURE__ */ e.createElement("div", { className: Y.custom }, /* @__PURE__ */ e.createElement("input", {
		type: "number",
		min: 1,
		"aria-label": "Custom ratio width",
		value: y,
		onChange: (e) => b(e.target.value),
		className: Y.number
	}), /* @__PURE__ */ e.createElement("span", { className: Y.colon }, ":"), /* @__PURE__ */ e.createElement("input", {
		type: "number",
		min: 1,
		"aria-label": "Custom ratio height",
		value: x,
		onChange: (e) => w(e.target.value),
		className: Y.number
	}), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		disabled: T <= 0,
		onClick: () => E(T),
		className: `${xe(T > 0 && D(T))} ${Y.customButton}`
	}, "Custom"))), /* @__PURE__ */ e.createElement(r, {
		label: "Straighten",
		value: -d,
		min: -45,
		max: 45,
		step: .1,
		onChange: (e) => {
			let t = -e;
			h("straighten", t), s && (v.current ||= m, h("crop", S(v.current, u(t, f, _))));
		},
		onCommit: () => {
			v.current = null, g("Straighten");
		}
	}), a && /* @__PURE__ */ e.createElement("div", { className: Y.guides }, /* @__PURE__ */ e.createElement("div", { className: Y.guidesHeader }, /* @__PURE__ */ e.createElement("span", null, "Overlay"), /* @__PURE__ */ e.createElement("span", null, "O cycles · Shift+O flips")), /* @__PURE__ */ e.createElement("div", { className: Y.grid }, C.map((t) => /* @__PURE__ */ e.createElement("button", {
		key: t.id,
		type: "button",
		onClick: () => F(t.id),
		className: xe(o === t.id)
	}, t.label)))), /* @__PURE__ */ e.createElement("label", { className: Y.check }, /* @__PURE__ */ e.createElement("input", {
		type: "checkbox",
		checked: s,
		onChange: (e) => W({ constrain: e.target.checked })
	}), "Constrain to image"), a && /* @__PURE__ */ e.createElement("p", { className: Y.hint }, "Drag the edges/corners to crop · ", l === "right" ? "Right-drag" : "Ctrl-drag", " across a line to level."), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: () => {
			W({ aspect: -1 }), h("crop", { ...ye }), h("straighten", 0), g("Crop reset");
		},
		className: Y.reset
	}, "Reset crop")));
}
//#endregion
//#region src/stages.ts
var Ce = "safelight.crop.geometry", we = "// The view's point (output, crop coordinates) to source UV: through the crop\n// to the transformed image, then the geometry transform's inverse (straighten,\n// perspective, stretch, scale, offset), which is independent of the crop. vUv\n// already has V flipped, so both are in top-left-origin image space.\nvec2 cropTransformUV(vec2 o) {\n  vec2 p = uCrop.xy + o * uCrop.zw;\n  vec3 q = uInvTransform * vec3(p, 1.0);\n  return q.xy / q.z;\n}", Te = (e, t) => [
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
function Ee(e, t) {
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
	], a = t.perspectiveH / 100 * .6, o = t.perspectiveV / 100 * .6, s = 1.5 ** (t.aspect / 100), c = 2 ** ((t.scale - 100) / 200), l = r(i, Te(t.flipH ? -1 : 1, t.flipV ? -1 : 1));
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
	]), l = r(l, Te(1 / s, s)), l = r(l, Te(1 / c, 1 / c));
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
function De(e) {
	return {
		id: Ce,
		name: "Crop & Straighten",
		phase: "geometry",
		anchor: "geometry",
		glsl: "",
		helpers: we,
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
			uInvTransform: Ee(e.straighten, e.transform)
		})
	};
}
//#endregion
//#region src/index.tsx
var Oe = "core.crop", ke = "safelight.crop.styles", Ae = 3, $ = null;
function je(e) {
	n(e), B(), ee(), re(), e.registerStylesheet({
		id: ke,
		css: ae(e.ui.tokens)
	}), e.registerProcessingStage(De(3)), e.registerPanel({
		id: Oe,
		title: "Crop & Straighten",
		component: Se,
		defaultDock: {
			module: "develop",
			direction: "right",
			order: 3,
			width: 280,
			height: 150
		},
		onReset: () => {
			W({ aspect: 0 }), e.stores.useDevelopStore.getState().resetParams(["crop", "straighten"], "Reset Crop & Straighten");
		}
	}), $?.(), $ = R(() => e.develop.setCanvasTool(N().cropping ? ve : null));
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
	});
}
function Me() {
	$?.(), $ = null, B();
}
//#endregion
export { Ae as LINE, Oe as PANEL_ID, ke as STYLESHEET_ID, je as activate, Me as deactivate };

//# sourceMappingURL=index.js.map