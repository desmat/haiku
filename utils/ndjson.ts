// Newline-delimited JSON streams between the generate routes and app/_hooks/haikus.ts.

const contentType = "application/x-ndjson";

export function acceptsNdjson(request: Request) {
  return !!request.headers.get("accept")?.includes(contentType);
}

export function isNdjson(response: Response) {
  return !!response.headers.get("content-type")?.includes(contentType);
}

// `run` sends progress events and returns the final one. A throw becomes an `error` event:
// headers are already out, so the status can't change.
export function ndjsonResponse(run: (send: (event: object) => void) => Promise<object>) {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Keeps generating after the client leaves, as the JSON path does.
      const send = (event: object) => !closed && controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      try {
        send(await run(send));
      } catch (error: any) {
        console.error("utils.ndjson.ndjsonResponse", { error });
        send({ type: "error", status: 500, message: "Internal Server Error" });
      }

      if (!closed) {
        closed = true;
        controller.close();
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": contentType,
      // Proxies must not buffer or compress the stream.
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function readNdjson(response: Response, onEvent: (event: any) => void) {
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    lines.filter(Boolean).forEach((line) => onEvent(JSON.parse(line)));
  }

  buffer.trim() && onEvent(JSON.parse(buffer));
}
