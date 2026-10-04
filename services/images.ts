import chroma from 'chroma-js';
import sharp from 'sharp';
import { HaikuPreviewImage } from '@/types/Haiku';

// Enough for a palette, and cheap.
const colorSampleSize = 64;

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

export async function encodePreview(buffer: Buffer, size: number): Promise<HaikuPreviewImage> {
  const [webp, png] = await Promise.all([
    sharp(buffer).resize(size, size).webp({ quality: 70 }).toBuffer(),
    // get-image-colors doesn't read WebP
    sharp(buffer).resize(colorSampleSize, colorSampleSize).png().toBuffer(),
  ]);

  return {
    image: webp.toString("base64"),
    contentType: "image/webp",
    ...await imageColors(png),
  };
}
