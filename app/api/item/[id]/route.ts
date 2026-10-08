import { cacheLife } from "next/cache";

// One small cached value per id (about 1 KB), like a per-entity record.
async function getItem(id: string) {
  "use cache";
  cacheLife("max");
  return { id, body: "x".repeat(1000) };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const item = await getItem(id);
  return Response.json({ id: item.id, length: item.body.length });
}
