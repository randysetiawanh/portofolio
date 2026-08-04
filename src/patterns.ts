/**
 * Background patterns.
 *
 * Defined once and used twice: the Worker injects them into the page, and the
 * admin renders the same declarations as swatches. Two copies would drift, and
 * a picker that lies about what you are choosing is worse than no picker.
 */

export interface Pattern {
  id: string;
  label: string;
  note: string;
  /** Declarations applied to the page body / the admin swatch. */
  css: string;
  /** Overrides for the light theme, where a baked-in stroke colour needs swapping. */
  cssLight?: string;
}

const ISO = (c: string, step = 44) =>
  `background-image:` +
  `repeating-linear-gradient(30deg,${c} 0 1px,transparent 1px ${step}px),` +
  `repeating-linear-gradient(-30deg,${c} 0 1px,transparent 1px ${step}px),` +
  `repeating-linear-gradient(90deg,${c} 0 1px,transparent 1px ${step}px);`;

const circuitSvg = (hex: string, stroke: string, fill: string) =>
  `background-image:url("data:image/svg+xml;utf8,` +
  `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>` +
  `<g fill='none' stroke='%23${hex}' stroke-opacity='${stroke}' stroke-width='1'>` +
  `<path d='M0 20 H24 L34 30 H56 L66 20 H80'/>` +
  `<path d='M20 0 V24 L30 34 V56 L20 66 V80'/>` +
  `<path d='M0 60 H14 L24 50 H46 L56 60 H80'/>` +
  `<path d='M60 0 V14 L50 24 V46 L60 56 V80'/></g>` +
  `<g fill='%23${hex}' fill-opacity='${fill}'>` +
  `<circle cx='34' cy='30' r='1.8'/><circle cx='24' cy='50' r='1.8'/>` +
  `<circle cx='56' cy='60' r='1.8'/><circle cx='50' cy='24' r='1.8'/></g></svg>");` +
  `background-size:80px 80px;`;

/** Star tiles are the same drawing in two ink colours, one per theme. */
const svg = (w: number, h: number, body: string) =>
  `background-image:url("data:image/svg+xml;utf8,` +
  `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${body}</svg>");` +
  `background-size:${w}px ${h}px;`;

/** Four-pointed sparkle, concave sides — reads as a survey mark, not a cartoon star. */
const sparkle = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r}C${cx + r * .06} ${cy - r * .44} ${cx + r * .44} ${cy - r * .06} ${cx + r} ${cy}` +
  `C${cx + r * .44} ${cy + r * .06} ${cx + r * .06} ${cy + r * .44} ${cx} ${cy + r}` +
  `C${cx - r * .06} ${cy + r * .44} ${cx - r * .44} ${cy + r * .06} ${cx - r} ${cy}` +
  `C${cx - r * .44} ${cy - r * .06} ${cx - r * .06} ${cy - r * .44} ${cx} ${cy - r}Z`;

const sparkleTile = (hex: string, op: string) =>
  svg(72, 72, `<path d='${sparkle(36, 36, 10)}' fill='%23${hex}' fill-opacity='${op}'/>`);

const asteriskTile = (hex: string, op: string) =>
  svg(64, 64, `<g stroke='%23${hex}' stroke-opacity='${op}' stroke-width='1'>` +
              `<path d='M32 24V40M25.1 28L38.9 36M25.1 36L38.9 28'/></g>`);

const khatamTile = (hex: string, op: string) =>
  svg(80, 80, `<g fill='none' stroke='%23${hex}' stroke-opacity='${op}' stroke-width='1'>` +
              `<rect x='27' y='27' width='26' height='26'/>` +
              `<rect x='27' y='27' width='26' height='26' transform='rotate(45 40 40)'/></g>`);

const constellationTile = (hex: string, lineOp: string, dotOp: string) =>
  svg(240, 240,
    `<g stroke='%23${hex}' stroke-opacity='${lineOp}' stroke-width='1' fill='none'>` +
    `<path d='M40 50L100 30M100 30L150 80M150 80L190 140M60 120L110 170M40 50L60 120M150 80L210 60'/></g>` +
    `<g fill='%23${hex}' fill-opacity='${dotOp}'>` +
    `<circle cx='40' cy='50' r='1.8'/><circle cx='100' cy='30' r='1.4'/>` +
    `<circle cx='150' cy='80' r='2'/><circle cx='60' cy='120' r='1.6'/>` +
    `<circle cx='190' cy='140' r='1.8'/><circle cx='110' cy='170' r='1.4'/>` +
    `<circle cx='30' cy='200' r='1.6'/><circle cx='210' cy='60' r='1.4'/></g>`);

const STARFIELD = (a: string, b: string) =>
  `background-image:` +
  `radial-gradient(1.5px 1.5px at 30px 40px,${a},transparent),` +
  `radial-gradient(1px 1px at 120px 20px,${b},transparent),` +
  `radial-gradient(1.6px 1.6px at 180px 90px,${a},transparent),` +
  `radial-gradient(1px 1px at 60px 130px,${b},transparent),` +
  `radial-gradient(1.3px 1.3px at 205px 172px,${a},transparent),` +
  `radial-gradient(1px 1px at 90px 195px,${b},transparent),` +
  `radial-gradient(1.4px 1.4px at 15px 165px,${b},transparent),` +
  `radial-gradient(1px 1px at 155px 58px,${a},transparent);` +
  `background-size:220px 220px;`;

/** Layered backgrounds need image and size lists that line up index for index. */
const layered = (layers: [string, string][]) =>
  `background-image:${layers.map((l) => l[0]).join(",")};` +
  `background-size:${layers.map((l) => l[1]).join(",")};`;

const star = (x: number, y: number, r: number, c: string) =>
  `radial-gradient(${r}px ${r}px at ${x}px ${y}px,${c},transparent)`;

/** A fixed scatter — random enough to read as sky, stable enough to tile. */
const FIELD: [number, number, number, string][] = [
  [34, 58, 1.5, "A"], [128, 22, 1, "B"], [212, 96, 1.7, "A"], [76, 148, 1.1, "B"],
  [318, 46, 1.3, "A"], [268, 188, 1, "B"], [158, 244, 1.6, "A"], [42, 292, 1.1, "B"],
  [352, 262, 1.4, "A"], [104, 356, 1, "B"], [244, 330, 1.2, "A"], [372, 152, 1, "B"],
  [188, 118, 1, "B"], [16, 206, 1.2, "A"], [296, 372, 1.5, "A"], [138, 76, 1, "B"],
  [226, 14, 1.1, "B"], [64, 232, 1, "B"], [340, 322, 1, "B"], [196, 186, 1.3, "A"],
];
const field = (a: string, b: string) =>
  FIELD.map(([x, y, r, c]) => [star(x, y, r, c === "A" ? a : b), "400px 400px"] as [string, string]);

export const PATTERNS: Pattern[] = [
  { id: "grid", label: "Square grid", note: "Even and neutral. Never competes with content.",
    css: `background-image:linear-gradient(var(--ga) 1px,transparent 1px),` +
         `linear-gradient(90deg,var(--ga) 1px,transparent 1px);background-size:64px 64px;` },

  { id: "graph", label: "Graph paper", note: "Fine ruling with a heavier line every 80px — gives the page an implied scale.",
    css: `background-image:linear-gradient(var(--ga) 1px,transparent 1px),` +
         `linear-gradient(90deg,var(--ga) 1px,transparent 1px),` +
         `linear-gradient(var(--gb) 1px,transparent 1px),` +
         `linear-gradient(90deg,var(--gb) 1px,transparent 1px);` +
         `background-size:16px 16px,16px 16px,80px 80px,80px 80px;` },

  { id: "dots", label: "Dot grid", note: "Intersections only. Quietest option behind dense text.",
    css: `background-image:radial-gradient(var(--gb) 1.1px,transparent 1.2px);background-size:26px 26px;` },

  { id: "cross", label: "Registration crosses", note: "The same crosshair used on the sheet corners and the portrait plate.",
    css: `background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>` +
         `<path d='M32 26.5v11M26.5 32h11' stroke='%233A7BFD' stroke-opacity='.30' stroke-width='1'/></svg>");` +
         `background-size:64px 64px;`,
    cssLight: `background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>` +
         `<path d='M32 26.5v11M26.5 32h11' stroke='%231B52C9' stroke-opacity='.38' stroke-width='1'/></svg>");` },

  { id: "iso", label: "Isometric", note: "Three axes at 30°, all one weight.", css: ISO("var(--ga)") },

  { id: "iso-major", label: "Isometric — major lines",
    note: "Every third line darkened, so the lattice gains scale instead of reading as an even mesh.",
    css: `background-image:` +
         `repeating-linear-gradient(30deg,var(--gc) 0 1px,transparent 1px 132px),` +
         `repeating-linear-gradient(-30deg,var(--gc) 0 1px,transparent 1px 132px),` +
         `repeating-linear-gradient(90deg,var(--gc) 0 1px,transparent 1px 132px),` +
         `repeating-linear-gradient(30deg,var(--ga) 0 1px,transparent 1px 44px),` +
         `repeating-linear-gradient(-30deg,var(--ga) 0 1px,transparent 1px 44px),` +
         `repeating-linear-gradient(90deg,var(--ga) 0 1px,transparent 1px 44px);` },

  { id: "iso-dots", label: "Isometric — vertices only",
    note: "The lattice reduced to its intersection points. Triangular rhythm, almost no noise.",
    css: `background-image:radial-gradient(var(--gc) 1.1px,transparent 1.2px),` +
         `radial-gradient(var(--gc) 1.1px,transparent 1.2px);` +
         `background-size:44px 76px;background-position:0 0,22px 38px;` },

  { id: "iso-fade", label: "Isometric — depth fade",
    note: "Full strength at the foot of the screen, gone by the top. Keeps the pattern where it shows and drops it where it would crowd the diagram.",
    css: ISO("var(--gb)") +
         `-webkit-mask-image:linear-gradient(to top,#000 15%,transparent 92%);` +
         `mask-image:linear-gradient(to top,#000 15%,transparent 92%);` },

  { id: "iso-signal", label: "Isometric — signal axis",
    note: "Two axes in structure blue, the vertical one in signal orange.",
    css: `background-image:` +
         `repeating-linear-gradient(30deg,var(--gb) 0 1px,transparent 1px 44px),` +
         `repeating-linear-gradient(-30deg,var(--gb) 0 1px,transparent 1px 44px),` +
         `repeating-linear-gradient(90deg,var(--so) 0 1px,transparent 1px 44px);` },

  { id: "iso-cubes", label: "Isometric — stacked blocks",
    note: "Filled faces, so the lattice resolves into 3D blocks. The most decorative option here.",
    css: `background-image:` +
         `linear-gradient(30deg,var(--ga) 12%,transparent 12.5%,transparent 87%,var(--ga) 87.5%,var(--ga)),` +
         `linear-gradient(150deg,var(--ga) 12%,transparent 12.5%,transparent 87%,var(--ga) 87.5%,var(--ga)),` +
         `linear-gradient(30deg,var(--ga) 12%,transparent 12.5%,transparent 87%,var(--ga) 87.5%,var(--ga)),` +
         `linear-gradient(150deg,var(--ga) 12%,transparent 12.5%,transparent 87%,var(--ga) 87.5%,var(--ga)),` +
         `linear-gradient(60deg,var(--gb) 25%,transparent 25.5%,transparent 75%,var(--gb) 75%,var(--gb)),` +
         `linear-gradient(60deg,var(--gb) 25%,transparent 25.5%,transparent 75%,var(--gb) 75%,var(--gb));` +
         `background-size:72px 126px;` +
         `background-position:0 0,0 0,36px 63px,36px 63px,0 0,36px 63px;` },

  { id: "circuit", label: "Circuit traces",
    note: "Board routing with vias. Tiles seamlessly — every trace leaves an edge where it re-enters the next tile.",
    css: circuitSvg("3A7BFD", ".20", ".30"),
    cssLight: circuitSvg("1B52C9", ".26", ".36") },

  { id: "scope", label: "Instrument grid",
    note: "Fine ruling with a heavy division every 200px. Orthogonal, so it never fights the diagram's right angles.",
    css: `background-image:linear-gradient(var(--gc) 1px,transparent 1px),` +
         `linear-gradient(90deg,var(--gc) 1px,transparent 1px),` +
         `linear-gradient(var(--ga) 1px,transparent 1px),` +
         `linear-gradient(90deg,var(--ga) 1px,transparent 1px);` +
         `background-size:200px 200px,200px 200px,40px 40px,40px 40px;` },

  { id: "starfield", label: "Star field",
    note: "Scattered points of two sizes on a 220px tile. Quiet, and it makes the dark ground feel like depth rather than a flat panel.",
    css: STARFIELD("var(--gc)", "var(--gb)") },

  { id: "constellation", label: "Constellation",
    note: "Points joined by faint links — the same node-and-connector idea the system diagram is built on, running underneath the whole page.",
    css: constellationTile("3A7BFD", ".13", ".30"),
    cssLight: constellationTile("1B52C9", ".16", ".38") },

  { id: "sparkle", label: "Sparkles",
    note: "A four-pointed star with concave sides at every 72px — closer to a survey mark than a decoration.",
    css: sparkleTile("3A7BFD", ".26"), cssLight: sparkleTile("1B52C9", ".32") },

  { id: "sparkle-grid", label: "Grid + sparkles",
    note: "The square grid with a star sitting on every fourth intersection. Structure underneath, a little glint on top.",
    css: `background-image:` +
         `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'>` +
         `<path d='${sparkle(128, 128, 11)}' fill='%233A7BFD' fill-opacity='.30'/></svg>"),` +
         `linear-gradient(var(--ga) 1px,transparent 1px),` +
         `linear-gradient(90deg,var(--ga) 1px,transparent 1px);` +
         `background-size:256px 256px,64px 64px,64px 64px;`,
    cssLight: `background-image:` +
         `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'>` +
         `<path d='${sparkle(128, 128, 11)}' fill='%231B52C9' fill-opacity='.38'/></svg>"),` +
         `linear-gradient(var(--ga) 1px,transparent 1px),` +
         `linear-gradient(90deg,var(--ga) 1px,transparent 1px);` +
         `background-size:256px 256px,64px 64px,64px 64px;` },

  { id: "asterisk", label: "Asterisk lattice",
    note: "Six-pointed asterisks on a 64px pitch. Reads as a reference mark — precise rather than pretty.",
    css: asteriskTile("3A7BFD", ".26"), cssLight: asteriskTile("1B52C9", ".32") },

  { id: "khatam", label: "Eight-point star",
    note: "Two squares overlaid at 45°, the khatam figure from Islamic geometry. The most ornamental option here, and the only one with any cultural weight behind it.",
    css: khatamTile("3A7BFD", ".20"), cssLight: khatamTile("1B52C9", ".26") },

  { id: "iso-stars", label: "Isometric + stars",
    note: "The isometric lattice with a sparkle landing on it every 144px. Keeps the 3D read and adds a point of interest.",
    css: `background-image:` +
         `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='144' height='144'>` +
         `<path d='${sparkle(72, 72, 9)}' fill='%233A7BFD' fill-opacity='.32'/></svg>"),` +
         `repeating-linear-gradient(30deg,var(--ga) 0 1px,transparent 1px 44px),` +
         `repeating-linear-gradient(-30deg,var(--ga) 0 1px,transparent 1px 44px),` +
         `repeating-linear-gradient(90deg,var(--ga) 0 1px,transparent 1px 44px);` +
         `background-size:144px 144px,auto,auto,auto;`,
    cssLight: `background-image:` +
         `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='144' height='144'>` +
         `<path d='${sparkle(72, 72, 9)}' fill='%231B52C9' fill-opacity='.40'/></svg>"),` +
         `repeating-linear-gradient(30deg,var(--ga) 0 1px,transparent 1px 44px),` +
         `repeating-linear-gradient(-30deg,var(--ga) 0 1px,transparent 1px 44px),` +
         `repeating-linear-gradient(90deg,var(--ga) 0 1px,transparent 1px 44px);` +
         `background-size:144px 144px,auto,auto,auto;` },

  { id: "starfield-signal", label: "Star field — with signal",
    note: "The same field, but a few points burn in the signal orange. Rare enough to read as an accent, not noise.",
    css: `background-image:` +
         `radial-gradient(1.7px 1.7px at 75px 82px,var(--so2),transparent),` +
         `radial-gradient(1.5px 1.5px at 168px 205px,var(--so2),transparent),` +
         `radial-gradient(1.5px 1.5px at 30px 40px,var(--gc),transparent),` +
         `radial-gradient(1px 1px at 120px 20px,var(--gb),transparent),` +
         `radial-gradient(1.6px 1.6px at 180px 90px,var(--gc),transparent),` +
         `radial-gradient(1px 1px at 60px 130px,var(--gb),transparent),` +
         `radial-gradient(1.3px 1.3px at 205px 172px,var(--gc),transparent),` +
         `radial-gradient(1px 1px at 90px 195px,var(--gb),transparent),` +
         `radial-gradient(1.4px 1.4px at 15px 165px,var(--gb),transparent),` +
         `radial-gradient(1px 1px at 155px 58px,var(--gc),transparent);` +
         `background-size:220px 220px;` },

  { id: "deep-field", label: "Deep field",
    note: "Twenty stars across a 400px tile in two brightnesses. Space with the restraint the rest of the page has — the ground gains depth without gaining decoration.",
    css: layered(field("var(--gc)", "var(--gb)")) },

  { id: "deep-space", label: "Deep space",
    note: "The star field over faint nebula clouds in the site's own blue and orange. The most literal reading of the brief, and the one that argues hardest with the drafting language.",
    css: layered([
      ["radial-gradient(ellipse 900px 620px at 18% 12%,var(--neb1),transparent 70%)", "1600px 1200px"],
      ["radial-gradient(ellipse 760px 540px at 82% 68%,var(--neb2),transparent 70%)", "1600px 1200px"],
      ["radial-gradient(ellipse 620px 460px at 46% 92%,var(--neb1),transparent 72%)", "1600px 1200px"],
      ...field("var(--gc)", "var(--gb)"),
    ]) },

  { id: "star-chart", label: "Star chart",
    note: "The same field over a celestial coordinate grid — fine ruling with a heavier line every 200px. A drawing of the sky rather than a photograph of it, which is why it sits easiest here.",
    css: layered([
      ...field("var(--gc)", "var(--gb)"),
      ["linear-gradient(var(--gb) 1px,transparent 1px)", "200px 200px"],
      ["linear-gradient(90deg,var(--gb) 1px,transparent 1px)", "200px 200px"],
      ["linear-gradient(var(--ga) 1px,transparent 1px)", "50px 50px"],
      ["linear-gradient(90deg,var(--ga) 1px,transparent 1px)", "50px 50px"],
    ]) },

  { id: "orbits", label: "Orbits",
    note: "Concentric orbital rings with bodies on them, scattered over a light star field. Closest in spirit to the system diagram at the top of the page — a map of things going round something.",
    css: layered([
      [`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'>` +
       `<g fill='none' stroke='%233A7BFD' stroke-opacity='.16'>` +
       `<ellipse cx='160' cy='160' rx='52' ry='30'/><ellipse cx='160' cy='160' rx='96' ry='55'/>` +
       `<ellipse cx='160' cy='160' rx='140' ry='80'/></g>` +
       `<g fill='%233A7BFD' fill-opacity='.34'><circle cx='160' cy='160' r='2.4'/>` +
       `<circle cx='212' cy='160' r='1.7'/><circle cx='84' cy='142' r='1.7'/>` +
       `<circle cx='160' cy='240' r='1.7'/></g></svg>")`, "320px 320px"],
      ...field("var(--gb)", "var(--ga)"),
    ]),
    cssLight: layered([
      [`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'>` +
       `<g fill='none' stroke='%231B52C9' stroke-opacity='.20'>` +
       `<ellipse cx='160' cy='160' rx='52' ry='30'/><ellipse cx='160' cy='160' rx='96' ry='55'/>` +
       `<ellipse cx='160' cy='160' rx='140' ry='80'/></g>` +
       `<g fill='%231B52C9' fill-opacity='.40'><circle cx='160' cy='160' r='2.4'/>` +
       `<circle cx='212' cy='160' r='1.7'/><circle cx='84' cy='142' r='1.7'/>` +
       `<circle cx='160' cy='240' r='1.7'/></g></svg>")`, "320px 320px"],
      ...field("var(--gb)", "var(--ga)"),
    ]) },

  { id: "none", label: "No pattern", note: "Flat ground. The bordered panels do all the structural work.",
    css: `background-image:none;` },
];

/** Line colours, declared here so the block is self-contained in both hosts. */
const VARS =
  `:root{--ga:rgba(58,123,253,.055);--gb:rgba(58,123,253,.11);` +
  `--gc:rgba(58,123,253,.16);--so:rgba(255,122,24,.09);--so2:rgba(255,122,24,.45);` +
  `--neb1:rgba(58,123,253,.10);--neb2:rgba(255,122,24,.055)}` +
  `:root[data-theme="light"]{--ga:rgba(27,82,201,.075);--gb:rgba(27,82,201,.15);` +
  `--gc:rgba(27,82,201,.22);--so:rgba(179,75,7,.12);--so2:rgba(179,75,7,.5);` +
  `--neb1:rgba(27,82,201,.07);--neb2:rgba(179,75,7,.045)}`;

/** Stylesheet for the public page, keyed on the `data-bg` attribute. */
export function pageStyle(): string {
  return VARS + PATTERNS.map((p) =>
    `:root[data-bg="${p.id}"] body{${p.css}}` +
    (p.cssLight ? `:root[data-theme="light"][data-bg="${p.id}"] body{${p.cssLight}}` : "")
  ).join("");
}

/** Stylesheet for the admin swatches, from the very same declarations. */
export function swatchStyle(): string {
  return VARS + PATTERNS.map((p) =>
    `.sw-${p.id}{${p.css}}` +
    (p.cssLight ? `:root[data-theme="light"] .sw-${p.id}{${p.cssLight}}` : "")
  ).join("");
}
