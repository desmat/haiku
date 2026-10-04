import { put } from '@vercel/blob';
import { isBlobMock } from '@/utils/mocks';

const contentTypes: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  json: "application/json",
};

// Drop-in for `put` from @vercel/blob. BLOB_MOCK=true returns a data: URL of the content
// and writes nothing. Node's fetch can read data: URLs.
export async function putBlob(pathname: string, body: Parameters<typeof put>[1], options: { access: 'public', addRandomSuffix?: boolean }) {
  if (!isBlobMock()) {
    return put(pathname, body, options);
  }

  console.warn(`>> services.blob.putBlob: BLOB_MOCK mode: not uploading '${pathname}'`);
  // All callers pass a Buffer or a File.
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(await (body as File).arrayBuffer());
  const contentType = (body as File).type
    || contentTypes[pathname.split(".").pop()?.toLowerCase() || ""]
    || "application/octet-stream";

  return {
    url: `data:${contentType};base64,${buffer.toString("base64")}`,
    pathname,
    contentType,
  };
}
