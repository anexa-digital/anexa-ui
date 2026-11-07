/// <reference path="./assets.d.ts" />
// The fonts of the skins, self-hosted (SIL Open Font License; see fonts/LICENSES.md). They are imported as files, not
// referenced from CSS: Bun's CSS bundler inlines every url() as a data URI, which would put 1.2 MB of fonts in
// every stylesheet; as JS imports Bun emits each file with a hashed name and the browser downloads only the
// families and ranges the active skin uses. `installFonts()` registers the @font-face rules once.
import f0 from "./fonts/inter-italic-100-900-latin-ext.woff2";
import f1 from "./fonts/inter-italic-100-900-latin.woff2";
import f2 from "./fonts/inter-normal-100-900-latin-ext.woff2";
import f3 from "./fonts/inter-normal-100-900-latin.woff2";
import f4 from "./fonts/fraunces-italic-100-900-latin-ext.woff2";
import f5 from "./fonts/fraunces-italic-100-900-latin.woff2";
import f6 from "./fonts/fraunces-normal-100-900-latin-ext.woff2";
import f7 from "./fonts/fraunces-normal-100-900-latin.woff2";
import f8 from "./fonts/jetbrains-mono-italic-100-800-latin-ext.woff2";
import f9 from "./fonts/jetbrains-mono-italic-100-800-latin.woff2";
import f10 from "./fonts/jetbrains-mono-normal-100-800-latin-ext.woff2";
import f11 from "./fonts/jetbrains-mono-normal-100-800-latin.woff2";
import f12 from "./fonts/ibm-plex-mono-italic-400-latin-ext.woff2";
import f13 from "./fonts/ibm-plex-mono-italic-400-latin.woff2";
import f14 from "./fonts/ibm-plex-mono-normal-400-latin-ext.woff2";
import f15 from "./fonts/ibm-plex-mono-normal-400-latin.woff2";
import f16 from "./fonts/ibm-plex-mono-normal-500-latin-ext.woff2";
import f17 from "./fonts/ibm-plex-mono-normal-500-latin.woff2";
import f18 from "./fonts/ibm-plex-mono-normal-600-latin-ext.woff2";
import f19 from "./fonts/ibm-plex-mono-normal-600-latin.woff2";
import f20 from "./fonts/ibm-plex-sans-italic-400-latin-ext.woff2";
import f21 from "./fonts/ibm-plex-sans-italic-400-latin.woff2";
import f22 from "./fonts/ibm-plex-sans-normal-400-latin-ext.woff2";
import f23 from "./fonts/ibm-plex-sans-normal-400-latin.woff2";
import f24 from "./fonts/ibm-plex-sans-normal-500-latin-ext.woff2";
import f25 from "./fonts/ibm-plex-sans-normal-500-latin.woff2";
import f26 from "./fonts/ibm-plex-sans-normal-600-latin-ext.woff2";
import f27 from "./fonts/ibm-plex-sans-normal-600-latin.woff2";
import f28 from "./fonts/manrope-normal-200-800-latin-ext.woff2";
import f29 from "./fonts/manrope-normal-200-800-latin.woff2";
import f30 from "./fonts/space-grotesk-normal-300-700-latin-ext.woff2";
import f31 from "./fonts/space-grotesk-normal-300-700-latin.woff2";

type Face = { family: string; style: string; weight: string; url: string; range: string };

export const FONT_FACES: Face[] = [
  { family: "Inter", style: "italic", weight: "100 900", url: f0, range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "Inter", style: "italic", weight: "100 900", url: f1, range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { family: "Inter", style: "normal", weight: "100 900", url: f2, range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "Inter", style: "normal", weight: "100 900", url: f3, range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { family: "Fraunces", style: "italic", weight: "100 900", url: f4, range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "Fraunces", style: "italic", weight: "100 900", url: f5, range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { family: "Fraunces", style: "normal", weight: "100 900", url: f6, range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "Fraunces", style: "normal", weight: "100 900", url: f7, range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { family: "JetBrains Mono", style: "italic", weight: "100 800", url: f8, range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "JetBrains Mono", style: "italic", weight: "100 800", url: f9, range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { family: "JetBrains Mono", style: "normal", weight: "100 800", url: f10, range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "JetBrains Mono", style: "normal", weight: "100 800", url: f11, range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { family: "IBM Plex Mono", style: "italic", weight: "400", url: f12, range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "IBM Plex Mono", style: "italic", weight: "400", url: f13, range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { family: "IBM Plex Mono", style: "normal", weight: "400", url: f14, range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "IBM Plex Mono", style: "normal", weight: "400", url: f15, range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { family: "IBM Plex Mono", style: "normal", weight: "500", url: f16, range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "IBM Plex Mono", style: "normal", weight: "500", url: f17, range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { family: "IBM Plex Mono", style: "normal", weight: "600", url: f18, range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "IBM Plex Mono", style: "normal", weight: "600", url: f19, range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { family: "IBM Plex Sans", style: "italic", weight: "400", url: f20, range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "IBM Plex Sans", style: "italic", weight: "400", url: f21, range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { family: "IBM Plex Sans", style: "normal", weight: "400", url: f22, range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "IBM Plex Sans", style: "normal", weight: "400", url: f23, range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { family: "IBM Plex Sans", style: "normal", weight: "500", url: f24, range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "IBM Plex Sans", style: "normal", weight: "500", url: f25, range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { family: "IBM Plex Sans", style: "normal", weight: "600", url: f26, range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "IBM Plex Sans", style: "normal", weight: "600", url: f27, range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { family: "Manrope", style: "normal", weight: "200 800", url: f28, range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "Manrope", style: "normal", weight: "200 800", url: f29, range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { family: "Space Grotesk", style: "normal", weight: "300 700", url: f30, range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  { family: "Space Grotesk", style: "normal", weight: "300 700", url: f31, range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
];

const STYLE_ID = "anexa-fonts";

/** Adds the @font-face rules of every skin to the document, once. Call it before rendering (AppShell does too). */
export function installFonts(): void {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = FONT_FACES.map((face) => `@font-face{font-family:"${face.family}";font-style:${face.style};font-weight:${face.weight};font-display:swap;src:url("${face.url}") format("woff2");unicode-range:${face.range}}`).join("\n");
  document.head.append(style);
}
