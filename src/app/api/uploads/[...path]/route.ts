import { readFile, stat } from "fs/promises";
import path from "path";

// `next start` only serves public/ files that existed at build time; uploads are written at runtime.
const TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
};

const SEGMENT_RE = /^[a-z0-9_-][a-z0-9._-]{0,99}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const segments = (await params).path;
  const ext = segments.at(-1)?.split(".").pop()?.toLowerCase() ?? "";
  if (!segments.length || segments.length > 4 || !segments.every((s) => SEGMENT_RE.test(s)) || !TYPES[ext]) {
    return new Response("Not found", { status: 404 });
  }

  const root = path.resolve(process.cwd(), "public", "uploads");
  const file = path.resolve(root, ...segments);
  if (!file.startsWith(root + path.sep)) return new Response("Not found", { status: 404 });

  try {
    if (!(await stat(file)).isFile()) return new Response("Not found", { status: 404 });
    const body = await readFile(file);
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": TYPES[ext],
        "Content-Length": String(body.length),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
