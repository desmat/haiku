import { put } from '@vercel/blob';
import { User } from '@/types/User';
import { dataUriToBuffer } from 'data-uri-to-buffer';


export async function save(user: User, filename: string, image: any) {
  console.log(">> services.image.save", { user, filename, image });
  // const imageBuffer = Buffer.from(await image.arrayBuffer())
  // const imageBuffer = Buffer.from(image);
  const imageBuffer = dataUriToBuffer(image).buffer;
  const blob = await put(`TESTING3.png`, imageBuffer, {
    access: 'public',
    addRandomSuffix: false,
  });

  console.log(">> services.image.screenshot", { blob });
}
