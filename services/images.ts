import chroma from 'chroma-js';
import sharp from 'sharp';
import { HaikuPreviewImage } from '@/types/Haiku';

// Small enough to be cheap, big enough for a palette and a ~6% band.
const sampleSize = 64;
const minBlankBandRows = 4;
const nearWhite = 245;

export async function imageColors(buffer: Buffer, type: string = 'image/png') {
  const getColors = require('get-image-colors');
  const colors = await getColors(buffer, type);
  // sort by darkness and pick darkest for foreground, lightest for background
  const sortedColors = colors.sort((a: any, b: any) => chroma.deltaE(a.hex(), "#000000") - chroma.deltaE(b.hex(), "#000000"));

  return {
    color: sortedColors[0].darken(0.5).hex(),
    bgColor: sortedColors[sortedColors.length - 1].brighten(0.5).hex(),
    colorPalette: sortedColors.map((c: any) => c.hex()),
  };
}

// WebP for the client, plus raw sample pixels for `isBottomUnrendered`.
export async function encodePreview(buffer: Buffer, size: number, { quality = 70 } = {}): Promise<{ preview: HaikuPreviewImage, pixels: Buffer }> {
  const sample = () => sharp(buffer).resize(sampleSize, sampleSize);
  const [webp, png, pixels] = await Promise.all([
    sharp(buffer).resize(size, size).webp({ quality }).toBuffer(),
    // get-image-colors doesn't read WebP
    sample().png().toBuffer(),
    sample().removeAlpha().raw().toBuffer(),
  ]);

  return {
    preview: {
      image: webp.toString("base64"),
      contentType: "image/webp",
      ...await imageColors(png),
    },
    pixels,
  };
}

function blankBottomRows(pixels: Buffer) {
  const rowBytes = sampleSize * 3;
  let rows = 0;
  for (let y = sampleSize - 1; y >= 0; y--) {
    const row = pixels.subarray(y * rowBytes, (y + 1) * rowBytes);
    if (!row.every((value) => value >= nearWhite)) break;
    rows++;
  }

  return rows;
}

// A streamed partial can arrive with its bottom rows not yet rendered: flat, opaque near-white.
// A white background looks the same, so only flag rows the previous partial had drawn.
export function isBottomUnrendered(pixels: Buffer, previousPixels?: Buffer) {
  return !!previousPixels && blankBottomRows(pixels) - blankBottomRows(previousPixels) >= minBlankBandRows;
}
