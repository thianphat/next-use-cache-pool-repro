import { cacheLife } from "next/cache";
import { Suspense } from "react";

// One small cached value per id (about 1 KB), like a per-entity record.
async function getItem(id: string) {
  "use cache";
  cacheLife("max");
  return { id, body: "x".repeat(1000) };
}

async function Item({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItem(id);
  return (
    <article>
      <h1>Item {item.id}</h1>
      <p>{item.body.length} bytes cached</p>
      {/* An ordinary page body: the render's short-lived buffers share
          Buffer pool slabs with the cache entry stored during it. */}
      <ul>
        {Array.from({ length: 300 }, (_, row) => (
          <li key={row}>
            Row {row} of item {item.id}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Loading</p>}>
      <Item params={params} />
    </Suspense>
  );
}
