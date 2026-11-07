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
}, N = () => A, P = (e) => A.cropping !== e && M({ cropping: e }), ee = (e) => M({ guide: e }), te = () => M({ guide: w(A.guide) }), ne = () => M({ guideFlip: (A.guideFlip + 1) % 4 }), F = (e) => (j.add(e), () => void j.delete(e)), I = () => e.useSyncExternalStore(F, N), L = () => M({
	cropping: !1,
	guide: "thirds",
	guideFlip: 0
}), R = "safelight.crop.options", z = {
	constrain: !0,
	aspect: -1
};
function B() {
	t.variables.register(R, {
		initial: z,
		description: "Crop & Straighten: whether a crop keeps inside the image, and its aspect lock."
	});
}
var V = () => t.variables.get("safelight.crop.options")?.value ?? z, H = (e) => void t.variables.update(R, (t) => ({
	...t,
	...e
}));
function U() {
	let [n, r] = e.useState(V);
	return e.useEffect(() => t.variables.subscribe(R, (e) => r(e.value)), []), n;
}
function W() {
	let { sourceSize: e } = t.stores.useDevelopStore.getState();
	if (e.width > 0 && e.height > 0) return e.width / e.height;
	let { photos: n, activePhotoId: r } = t.stores.useCatalogStore.getState(), i = n.find((e) => e.id === r);
	return i && i.width > 0 && i.height > 0 ? i.width / i.height : 1;
}
function re() {
	return t.stores.useDevelopStore((e) => e.sourceSize), t.stores.useCatalogStore((e) => {
		let t = e.photos.find((t) => t.id === e.activePhotoId);
		return t ? `${t.width}x${t.height}` : "";
	}), W();
}
var ie = "levelWith";
function ae() {
	t.registerSettings({
		title: "Crop & Straighten",
		fields: [{
			key: ie,
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
var G = () => t.settings.get("levelWith", "ctrl") === "right" ? "right" : "ctrl";
function oe() {
	let [n, r] = e.useState(G);
	return e.useEffect(() => t.settings.onChange((e) => {
		e === "levelWith" && r(G());
	}), []), n;
}
//#endregion
//#region src/styles.ts
var K = "safelight-crop", q = {
	panel: `${K}-panel`,
	toggle: `${K}-toggle`,
	on: `${K}-on`,
	grid: `${K}-grid`,
	choice: `${K}-choice`,
	active: `${K}-active`,
	custom: `${K}-custom`,
	number: `${K}-number`,
	colon: `${K}-colon`,
	customButton: `${K}-custom-button`,
	guides: `${K}-guides`,
	guidesHeader: `${K}-guides-header`,
	check: `${K}-check`,
	hint: `${K}-hint`,
	reset: `${K}-reset`,
	canvas: `${K}-canvas`,
	layer: `${K}-layer`,
	dim: `${K}-dim`,
	box: `${K}-box`,
	handle: `${K}-handle`,
	readout: `${K}-readout`
};
function se(e) {
	let t = "border-radius: 0.25rem; padding: 0.25rem 0.5rem; font-size: 11px;", n = `background-color: ${e.surface2}; color: ${e.textSecondary};`, r = `background-color: ${e.surface3}; color: ${e.textPrimary};`;
	return `
:where(.${q.panel} > :not(:last-child)) { margin-block: 0 0.5rem; }
:where(.${q.toggle}) { width: 100%; ${t} font-weight: 500; ${n} }
:where(.${q.toggle}:hover) { ${r} }
:where(.${q.toggle}.${q.on}) { background-color: ${e.sliderFill}; color: ${e.white}; }
:where(.${q.toggle}.${q.on}:hover) { background-color: ${e.surface4}; }
:where(.${q.grid}) { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.25rem; }
:where(.${q.choice}) { ${t} ${n} }
:where(.${q.choice}:hover), :where(.${q.choice}.${q.active}) { ${r} }
:where(.${q.custom}) { display: flex; align-items: center; gap: 0.25rem; }
:where(.${q.number}) { width: 3rem; min-width: 0; border-radius: 0.25rem; background-color: ${e.surface2}; padding: 0.25rem 0.375rem; text-align: center; font-size: 11px; color: ${e.textPrimary}; outline: none; border: 0; }
:where(.${q.number}:focus) { background-color: ${e.surface3}; }
:where(.${q.colon}) { font-size: 11px; color: ${e.textMuted}; }
:where(.${q.customButton}) { min-width: 0; flex: 1 1 0%; }
:where(.${q.customButton}:disabled) { opacity: 0.4; }
:where(.${q.guides} > :not(:last-child)) { margin-block: 0 0.25rem; }
:where(.${q.guidesHeader}) { display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: ${e.textMuted}; }
:where(.${q.check}) { display: flex; cursor: pointer; align-items: center; gap: 0.5rem; font-size: 11px; color: ${e.textSecondary}; }
:where(.${q.check} input) { accent-color: ${e.sliderFill}; }
:where(.${q.hint}) { font-size: 10px; line-height: 1.375; color: ${e.textMuted}; margin: 0; }
:where(.${q.reset}) { width: 100%; ${t} ${n} }
:where(.${q.reset}:hover) { ${r} }
:where(.${q.canvas}) { position: absolute; inset: 0; touch-action: none; }
:where(.${q.layer}) { pointer-events: none; position: absolute; inset: 0; }
:where(.${q.dim}) { fill: rgba(0, 0, 0, 0.55); }
:where(.${q.box}) { pointer-events: none; position: absolute; border: 1px solid rgba(255, 255, 255, 0.8); }
:where(.${q.handle}) { pointer-events: none; position: absolute; width: 0.625rem; height: 0.625rem; transform: translate(-50%, -50%); border-radius: 0.125rem; border: 1px solid rgba(0, 0, 0, 0.4); background: #fff; }
:where(.${q.readout}) { pointer-events: none; position: absolute; border-radius: 0.25rem; background: rgba(0, 0, 0, 0.75); padding: 0.125rem 0.375rem; font-size: 11px; font-variant-numeric: tabular-nums; color: #fff; white-space: nowrap; }
html.sl-larger-text .${q.hint}, html.sl-larger-text .${q.guidesHeader} { font-size: 12px !important; }
`;
}
//#endregion
//#region src/CropBox.tsx
function ce(e, n, r) {
	let i = t.stores.useSettings.getState().uiScale || 1;
	return {
		x: (n - e.left) / i,
		y: (r - e.top) / i
	};
}
var J = (e) => t.cursors.resolve(e), Y = .04, le = 12, ue = (e, t, n) => Math.min(n, Math.max(t, e)), X = (e) => String(Math.round(e * 100) / 100), de = (e, t, n, r) => `M${X(e)} ${X(t)}H${X(n)}V${X(r)}H${X(e)}Z`, fe = 6, pe = (e, t, n) => {
	let r = Math.atan2(n, t) * 180 / Math.PI;
	for (; r > 45;) r -= 90;
	for (; r < -45;) r += 90;
	return ue(e + r, -45, 45);
}, me = (e) => G() === "right" ? e.button === 2 : e.button === 0 && (e.ctrlKey || e.metaKey), he = (e) => {
	switch (e) {
		case "move": return J("crop-move");
		case "nw":
		case "se": return J("crop-resize-nwse");
		case "ne":
		case "sw": return J("crop-resize-nesw");
		case "n":
		case "s": return J("crop-resize-ns");
		case "e":
		case "w": return J("crop-resize-ew");
		default: return J("crosshair");
	}
};
function ge({ rect: t, crop: n, viewCrop: r, inv: a, forward: o, distort: s, straightenDeg: c, aspect: l, imageAspect: u, constrain: d, guide: f, guideFlip: p, onChange: m, onCommit: h, onLevel: g }) {
	let _ = e.useRef(null), [v, y] = e.useState(null), [x, S] = e.useState(null), C = e.useId(), w = (e) => ce(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY), T = l > 0 ? l / u : 0, E = l > 0 ? 1 / (l * u) : 0, D = (e, n) => ({
		x: t.x + (e - r.x) / r.width * t.w,
		y: t.y + (n - r.y) / r.height * t.h
	}), O = D(n.x, n.y), k = D(n.x + n.width, n.y + n.height), A = O.x, j = O.y, M = k.x - O.x, N = k.y - O.y, P = [
		i(o, 0, 0),
		i(o, 1, 0),
		i(o, 1, 1),
		i(o, 0, 1)
	].map((e) => D(e.x, e.y)), ee = Math.min(P[0].x, P[1].x, P[2].x, P[3].x), te = Math.max(P[0].x, P[1].x, P[2].x, P[3].x), ne = `${de(ee, Math.min(P[0].y, P[1].y, P[2].y, P[3].y), te, Math.max(P[0].y, P[1].y, P[2].y, P[3].y))}${de(A, j, A + M, j + N)}`, F = P.map((e) => `${X(e.x)},${X(e.y)}`).join(" "), I = `safelight-crop-dim-${C.replace(/:/g, "")}`, L = [
		{
			id: "nw",
			x: A,
			y: j
		},
		{
			id: "ne",
			x: A + M,
			y: j
		},
		{
			id: "se",
			x: A + M,
			y: j + N
		},
		{
			id: "sw",
			x: A,
			y: j + N
		}
	], R = [
		{
			id: "n",
			x: A + M / 2,
			y: j
		},
		{
			id: "e",
			x: A + M,
			y: j + N / 2
		},
		{
			id: "s",
			x: A + M / 2,
			y: j + N
		},
		{
			id: "w",
			x: A,
			y: j + N / 2
		}
	], z = [...L, ...R], B = (e, t) => {
		for (let n of z) if (Math.abs(e - n.x) <= le && Math.abs(t - n.y) <= le) return n.id;
		return e >= A && e <= A + M && t >= j && t <= j + N ? "move" : null;
	}, V = (e) => {
		let t = me(e);
		if (e.button !== 0 && !t) return;
		let { x: r, y: i } = w(e);
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
		let a = B(r, i);
		a && (S(a), _.current = {
			mode: a,
			startCrop: n,
			sx: r,
			sy: i
		});
	}, H = (e) => {
		let n = _.current;
		if (!n) {
			let { x: t, y: n } = w(e);
			S(G() === "ctrl" && (e.ctrlKey || e.metaKey) ? "level" : B(t, n));
			return;
		}
		let { x: i, y: c } = w(e);
		if (n.mode === "level") {
			y((e) => e && {
				...e,
				dx: i - n.sx,
				dy: c - n.sy
			});
			return;
		}
		let l = (i - n.sx) / t.w * r.width, f = (c - n.sy) / t.h * r.height, p = _e(n.mode, n.startCrop, l, f, T, E);
		p = d ? b(n.startCrop, p, n.mode, a, o, u, T > 0, s) : ye(p, r), m(p);
	}, U = (e) => {
		let t = _.current;
		if (_.current = null, t) {
			if (t.mode === "level") {
				let { x: n, y: r } = w(e), i = n - t.sx, a = r - t.sy;
				y(null), Math.abs(i) + Math.abs(a) > fe && g(pe(c, i, a));
			} else h();
		}
	}, W = () => {
		let e = _.current;
		_.current = null, e && (e.mode === "level" ? y(null) : h());
	};
	return /* @__PURE__ */ e.createElement("div", {
		className: q.canvas,
		style: { cursor: he(x) },
		onPointerDown: V,
		onPointerMove: H,
		onPointerUp: U,
		onPointerCancel: W,
		onLostPointerCapture: W,
		onContextMenu: (e) => {
			G() === "right" && e.preventDefault();
		},
		onPointerLeave: () => {
			_.current || S(null);
		}
	}, /* @__PURE__ */ e.createElement("svg", {
		"data-dim": "",
		className: q.layer,
		width: "100%",
		height: "100%"
	}, /* @__PURE__ */ e.createElement("clipPath", { id: I }, /* @__PURE__ */ e.createElement("polygon", { points: F })), /* @__PURE__ */ e.createElement("path", {
		className: q.dim,
		d: ne,
		fillRule: "evenodd",
		clipPath: `url(#${I})`
	})), /* @__PURE__ */ e.createElement("div", {
		className: q.box,
		style: {
			left: A,
			top: j,
			width: M,
			height: N
		}
	}, /* @__PURE__ */ e.createElement(ve, {
		guide: f,
		flip: p,
		w: M,
		h: N
	})), z.map((t) => /* @__PURE__ */ e.createElement("div", {
		key: t.id,
		"data-handle": t.id,
		className: q.handle,
		style: {
			left: t.x,
			top: t.y
		}
	})), v && /* @__PURE__ */ e.createElement("svg", {
		className: q.layer,
		width: "100%",
		height: "100%"
	}, /* @__PURE__ */ e.createElement("line", {
		x1: v.x,
		y1: v.y,
		x2: v.x + v.dx,
		y2: v.y + v.dy,
		stroke: "#4aa3ff",
		strokeWidth: 1.5
	})), v && Math.abs(v.dx) + Math.abs(v.dy) > fe && /* @__PURE__ */ e.createElement("div", {
		className: q.readout,
		style: {
			left: v.x + v.dx + 14,
			top: v.y + v.dy + 14
		}
	}, `${(-pe(c, v.dx, v.dy)).toFixed(1)}°`));
}
function _e(e, t, n, r, i, a) {
	let o = t.x, s = t.y, c = t.width, l = t.height;
	if (e === "move") o += n, s += r;
	else if (i > 0 && e.length === 2) {
		let u = e.includes("e"), d = e.includes("s"), f = u ? t.x : t.x + t.width, p = d ? t.y : t.y + t.height, m = Math.max(Y, u ? t.width + n : t.width - n), h = Math.max(Y, d ? t.height + r : t.height - r), g = a > 0 ? a : i, _ = m / h, v = Math.abs(Math.log(_ / i)) <= Math.abs(Math.log(_ / g)) ? i : g;
		c = Math.max(m, h * v), l = c / v, v >= 1 ? l < Y && (l = Y, c = l * v) : c < Y && (c = Y, l = c / v), o = u ? f : f - c, s = d ? p : p - l;
	} else if (i > 0) {
		let i = t.width / t.height, a = t.x + t.width / 2, u = t.y + t.height / 2;
		e === "e" || e === "w" ? (c = Math.max(Y, e === "e" ? t.width + n : t.width - n), l = c / i, l < Y && (l = Y, c = l * i), o = e === "e" ? t.x : t.x + t.width - c, s = u - l / 2) : (l = Math.max(Y, e === "s" ? t.height + r : t.height - r), c = l * i, c < Y && (c = Y, l = c / i), s = e === "s" ? t.y : t.y + t.height - l, o = a - c / 2);
	} else e.includes("e") && (c += n), e.includes("w") && (o += n, c -= n), e.includes("s") && (l += r), e.includes("n") && (s += r, l -= r);
	return c < Y && (e.includes("w") && (o = t.x + t.width - Y), c = Y), l < Y && (e.includes("n") && (s = t.y + t.height - Y), l = Y), {
		x: o,
		y: s,
		width: c,
		height: l
	};
}
function ve({ guide: t, flip: n, w: r, h: i }) {
	if (r <= 1 || i <= 1) return null;
	let { lines: a, paths: o } = k(t, r, i), s = n === 1 ? `translate(${r} 0) scale(-1 1)` : n === 2 ? `translate(0 ${i}) scale(1 -1)` : n === 3 ? `translate(${r} ${i}) scale(-1 -1)` : void 0;
	return /* @__PURE__ */ e.createElement("svg", {
		className: q.layer,
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
function ye(e, t) {
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
var be = (e) => ({
	...e,
	crop: m(d(e.straighten, e.transform, W()))
});
function xe({ rect: n }) {
	let r = t.stores.useDevelopStore, i = r((e) => e.params.crop), a = r((e) => e.params.straighten), o = r((e) => e.params.transform), s = r((e) => e.setParam), c = r((e) => e.commitEdit), l = r((e) => !!e.bypassedPanels["core.crop"] || !!e.bypassedPanels["core.transform"]), { region: f, imageAspect: p } = t.develop.useDevelopOverlay(), { guide: h, guideFlip: g } = I(), { constrain: _, aspect: v } = U(), y = u(a, o, p), b = d(a, o, p), x = f ?? m(b), C = e.useRef(null), w = e.useRef(null), T = (e) => {
		C.current = e, w.current ??= requestAnimationFrame(() => {
			w.current = null, C.current && s("crop", C.current);
		});
	}, E = () => {
		w.current != null && (cancelAnimationFrame(w.current), w.current = null), C.current &&= (s("crop", C.current), null);
	};
	return e.useEffect(() => () => {
		w.current != null && cancelAnimationFrame(w.current), C.current = null;
	}, []), l ? null : /* @__PURE__ */ e.createElement(ge, {
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
var Se = {
	overlay: xe,
	zoomable: !1,
	viewParams: be,
	onEscape: () => P(!1)
}, Ce = {
	x: 0,
	y: 0,
	width: 1,
	height: 1
}, we = [
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
], Z = (e) => `${q.choice}${e ? ` ${q.active}` : ""}`;
function Te() {
	let { Panel: n, Slider: r } = t.components, i = t.stores.useDevelopStore, { cropping: a, guide: o } = I(), { constrain: s, aspect: c } = U(), l = oe(), d = i((e) => e.params.straighten), f = i((e) => e.params.transform), m = i((e) => e.params.crop), h = i((e) => e.setParam), g = i((e) => e.commitEdit), _ = re(), v = e.useRef(null), [y, b] = e.useState("16"), [x, w] = e.useState("10"), T = (() => {
		let e = parseFloat(y), t = parseFloat(x);
		return e > 0 && t > 0 ? e / t : 0;
	})(), E = (e) => {
		if (P(!0), e === 0) {
			H({ aspect: 0 });
			return;
		}
		let t = e === -1 ? _ : e;
		H({ aspect: e === -1 ? -1 : t });
		let n = p(t, _);
		s && (n = S(n, u(d, f, _))), h("crop", n), g("Crop");
	}, D = (e) => e === 0 ? c === 0 : e === -1 ? c === -1 : c > 0 && Math.abs(c - e) < 1e-4;
	return /* @__PURE__ */ e.createElement(n, {
		title: "Crop & Straighten",
		defaultOpen: !1
	}, /* @__PURE__ */ e.createElement("div", { className: q.panel }, /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: () => P(!a),
		"aria-pressed": a,
		className: `${q.toggle}${a ? ` ${q.on}` : ""}`
	}, a ? "Done" : "Crop"), a && /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement("div", { className: q.grid }, we.map((t) => /* @__PURE__ */ e.createElement("button", {
		key: t.label,
		type: "button",
		onClick: () => E(t.ratio),
		className: Z(D(t.ratio))
	}, t.label))), /* @__PURE__ */ e.createElement("div", { className: q.custom }, /* @__PURE__ */ e.createElement("input", {
		type: "number",
		min: 1,
		"aria-label": "Custom ratio width",
		value: y,
		onChange: (e) => b(e.target.value),
		className: q.number
	}), /* @__PURE__ */ e.createElement("span", { className: q.colon }, ":"), /* @__PURE__ */ e.createElement("input", {
		type: "number",
		min: 1,
		"aria-label": "Custom ratio height",
		value: x,
		onChange: (e) => w(e.target.value),
		className: q.number
	}), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		disabled: T <= 0,
		onClick: () => E(T),
		className: `${Z(T > 0 && D(T))} ${q.customButton}`
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
	}), a && /* @__PURE__ */ e.createElement("div", { className: q.guides }, /* @__PURE__ */ e.createElement("div", { className: q.guidesHeader }, /* @__PURE__ */ e.createElement("span", null, "Overlay"), /* @__PURE__ */ e.createElement("span", null, "O cycles · Shift+O flips")), /* @__PURE__ */ e.createElement("div", { className: q.grid }, C.map((t) => /* @__PURE__ */ e.createElement("button", {
		key: t.id,
		type: "button",
		onClick: () => ee(t.id),
		className: Z(o === t.id)
	}, t.label)))), /* @__PURE__ */ e.createElement("label", { className: q.check }, /* @__PURE__ */ e.createElement("input", {
		type: "checkbox",
		checked: s,
		onChange: (e) => H({ constrain: e.target.checked })
	}), "Constrain to image"), a && /* @__PURE__ */ e.createElement("p", { className: q.hint }, "Drag the edges/corners to crop · ", l === "right" ? "Right-drag" : "Ctrl-drag", " across a line to level."), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: () => {
			H({ aspect: -1 }), h("crop", { ...Ce }), h("straighten", 0), g("Crop reset");
		},
		className: q.reset
	}, "Reset crop")));
}
//#endregion
//#region src/stages.ts
var Ee = "safelight.crop.geometry", De = "// The view's point (output, crop coordinates) to source UV: through the crop\n// to the transformed image, then the geometry transform's inverse (straighten,\n// perspective, stretch, scale, offset), which is independent of the crop. vUv\n// already has V flipped, so both are in top-left-origin image space.\nvec2 cropTransformUV(vec2 o) {\n  vec2 p = uCrop.xy + o * uCrop.zw;\n  vec3 q = uInvTransform * vec3(p, 1.0);\n  return q.xy / q.z;\n}", Q = (e, t) => [
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
function Oe(e, t) {
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
	], a = t.perspectiveH / 100 * .6, o = t.perspectiveV / 100 * .6, s = 1.5 ** (t.aspect / 100), c = 2 ** ((t.scale - 100) / 200), l = r(i, Q(t.flipH ? -1 : 1, t.flipV ? -1 : 1));
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
	]), l = r(l, Q(1 / s, s)), l = r(l, Q(1 / c, 1 / c));
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
function ke(e) {
	return {
		id: Ee,
		name: "Crop & Straighten",
		phase: "geometry",
		anchor: "geometry",
		glsl: "",
		helpers: De,
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
			uInvTransform: Oe(e.straighten, e.transform)
		})
	};
}
//#endregion
//#region src/index.tsx
var Ae = "core.crop", je = "safelight.crop.styles", Me = 3, $ = null;
function Ne(e) {
	n(e), L(), B(), ae(), e.registerStylesheet({
		id: je,
		css: se(e.ui.tokens)
	}), e.registerProcessingStage(ke(3)), e.registerPanel({
		id: Ae,
		title: "Crop & Straighten",
		component: Te,
		defaultDock: {
			module: "develop",
			direction: "right",
			order: 3,
			width: 280,
			height: 150
		},
		onReset: () => {
			H({ aspect: 0 }), e.stores.useDevelopStore.getState().resetParams(["crop", "straighten"], "Reset Crop & Straighten");
		}
	}), $?.(), $ = F(() => e.develop.setCanvasTool(N().cropping ? Se : null));
	let t = (e) => () => {
		N().cropping && e();
	};
	e.registerKeybinding({
		id: "crop.cycleGuide",
		label: "Cycle crop guide",
		category: "Develop",
		defaultCombo: "O",
		handler: t(te)
	}), e.registerKeybinding({
		id: "crop.flipGuide",
		label: "Flip crop guide",
		category: "Develop",
		defaultCombo: "Shift+O",
		handler: t(ne)
	});
}
function Pe() {
	$?.(), $ = null, L();
}
//#endregion
export { Me as LINE, Ae as PANEL_ID, je as STYLESHEET_ID, Ne as activate, Pe as deactivate };

//# sourceMappingURL=index.js.map