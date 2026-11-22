import * as FileSystem from "expo-file-system/legacy";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { FilterMode, ImageFormat, MipmapMode, Skia, TileMode, type SkImage } from "@shopify/react-native-skia";

export type ScanFilter = "original" | "enhanced" | "bw";

export const SCAN_FILTERS: { value: ScanFilter; label: string }[] = [
  { value: "enhanced", label: "Mejorado" },
  { value: "bw", label: "Blanco y negro" },
  { value: "original", label: "Original" },
];

/** Long side of a processed page: sharp enough to read, light enough to upload. */
const MAX_SIDE = 2000;
/** The background is estimated on a copy this many times smaller (fast, and it hides the ink). */
const BG_DOWNSCALE = 8;

/*
 * How it works, the same idea document scanners use:
 * 1. Estimate the paper under the ink: shrink the page, take the lightest pixel around each point
 *    (dilate, so the text disappears) and blur it. That is the light falling on the paper.
 * 2. Divide the page by that background: shadows and uneven light go away and the paper turns white.
 * 3. «Mejorado» adds contrast and a little colour; «Blanco y negro» keeps the luminance and pushes it
 *    to clean black ink on white paper with a soft threshold (no jagged edges).
 */
const SKSL = `
uniform shader page;
uniform shader paper;
uniform float mode;

half4 main(float2 p) {
  half3 c = page.eval(p).rgb;
  half3 bg = paper.eval(p).rgb;
  half3 n = clamp(c / max(bg, half3(0.08)), 0.0, 1.0);
  half l = dot(n, half3(0.299, 0.587, 0.114));
  if (mode > 1.5) {
    half v = smoothstep(0.55, 0.88, l);
    return half4(v, v, v, 1.0);
  }
  n = clamp((n - 0.5) * 1.25 + 0.53, 0.0, 1.0);
  half lum = dot(n, half3(0.299, 0.587, 0.114));
  n = clamp(mix(half3(lum), n, 1.3), 0.0, 1.0);
  return half4(n, 1.0);
}`;

let effect: ReturnType<typeof Skia.RuntimeEffect.Make> | undefined;
function getEffect() {
  if (effect === undefined) effect = Skia.RuntimeEffect.Make(SKSL);
  if (!effect) throw new Error("scan filter shader did not compile");
  return effect;
}

function makeSurface(width: number, height: number) {
  const surface = Skia.Surface.MakeOffscreen(width, height) ?? Skia.Surface.Make(width, height);
  if (!surface) throw new Error("could not create a drawing surface");
  return surface;
}

/** Upright (EXIF applied) and at most MAX_SIDE on the long side, as base64 JPEG. */
async function loadUpright(uri: string): Promise<{ base64: string; width: number; height: number }> {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const long = Math.max(original.width, original.height);
  const context = ImageManipulator.manipulate(uri);
  if (long > MAX_SIDE) {
    context.resize(original.width >= original.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const ref = await context.renderAsync();
  const saved = await ref.saveAsync({ base64: true, compress: 0.92, format: SaveFormat.JPEG });
  return { base64: saved.base64!, width: saved.width, height: saved.height };
}

function filtered(page: SkImage, filter: Exclude<ScanFilter, "original">): SkImage {
  const w = page.width();
  const h = page.height();

  // 1. The paper: small, ink removed (dilate takes the lightest neighbour), then blurred.
  const sw = Math.max(1, Math.ceil(w / BG_DOWNSCALE));
  const sh = Math.max(1, Math.ceil(h / BG_DOWNSCALE));
  const small = makeSurface(sw, sh);
  const bgPaint = Skia.Paint();
  bgPaint.setImageFilter(Skia.ImageFilter.MakeBlur(4, 4, TileMode.Clamp, Skia.ImageFilter.MakeDilate(3, 3, null)));
  small.getCanvas().drawImageRect(page, Skia.XYWHRect(0, 0, w, h), Skia.XYWHRect(0, 0, sw, sh), bgPaint);
  small.flush();
  const paper = small.makeImageSnapshot();

  // 2–3. Divide by the paper and finish with the chosen look.
  const scaleUp = Skia.Matrix();
  scaleUp.scale(w / sw, h / sh);
  const shader = getEffect().makeShaderWithChildren(
    [filter === "bw" ? 2 : 1],
    [
      page.makeShaderOptions(TileMode.Clamp, TileMode.Clamp, FilterMode.Nearest, MipmapMode.None),
      paper.makeShaderOptions(TileMode.Clamp, TileMode.Clamp, FilterMode.Linear, MipmapMode.None, scaleUp),
    ],
  );
  const out = makeSurface(w, h);
  const paint = Skia.Paint();
  paint.setShader(shader);
  out.getCanvas().drawRect(Skia.XYWHRect(0, 0, w, h), paint);
  out.flush();
  return out.makeImageSnapshot();
}

/**
 * Returns a new JPEG file with the filter applied (or just upright and resized for «Original»).
 * The source photo is left untouched, so switching filters never loses quality.
 */
export async function applyScanFilter(uri: string, filter: ScanFilter): Promise<string> {
  const { base64 } = await loadUpright(uri);
  let outBase64 = base64;
  if (filter !== "original") {
    const page = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBase64(base64));
    if (!page) throw new Error("could not decode the page");
    outBase64 = filtered(page, filter).encodeToBase64(ImageFormat.JPEG, 88);
  }
  const target = `${FileSystem.cacheDirectory}scan-${filter}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
  await FileSystem.writeAsStringAsync(target, outBase64, { encoding: FileSystem.EncodingType.Base64 });
  return target;
}
