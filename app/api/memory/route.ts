import { connection } from "next/server";

export async function GET() {
  await connection();
  const gc = (globalThis as { gc?: () => void }).gc;
  gc?.();
  gc?.();
  const { rss, heapUsed, external, arrayBuffers } = process.memoryUsage();
  const mb = (bytes: number) => Math.round(bytes / 1048576);
  return Response.json({
    node: process.version,
    bufferPoolSize: Buffer.poolSize,
    rssMB: mb(rss),
    heapUsedMB: mb(heapUsed),
    externalMB: mb(external),
    arrayBuffersMB: mb(arrayBuffers),
  });
}
