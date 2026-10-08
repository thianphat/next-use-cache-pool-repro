# Default `"use cache"` handler: small entries pin whole Buffer pool slabs

The built-in `"use cache"` handler stores each entry as the `Buffer.concat`
result of its stream and sizes the LRU by that buffer's `byteLength`. A
`Buffer.concat` result smaller than half of `Buffer.poolSize` is a slice of a
shared pool slab, so each long-lived small entry keeps its whole slab alive
while the LRU counts only the entry's own bytes. Node 26 raised
`Buffer.poolSize` from 8 KiB to 64 KiB (nodejs/node#63597), which makes the
gap large.

## Run

```sh
pnpm install
pnpm build
pnpm start                     # Node 26: 64 KiB pool
# in another shell
ENTRIES=10000 pnpm load        # fills 10,000 small "use cache" entries
```

Compare:

- `pnpm start:pool8k` sets `Buffer.poolSize = 8192`, Node 24's default.
- `ROUTE=item-uncached ENTRIES=10000 pnpm load` renders the same page without
  `"use cache"`, as a control.

`/api/memory` forces two GCs and returns `process.memoryUsage()`.

## Results (Node 26.7.0, next 16.4.0, macOS arm64)

10,000 renders of `/item/[id]`, each storing one cache entry of about 1 KB:

| Run | LRU counted size | ArrayBuffers after GC |
| --- | ---: | ---: |
| `"use cache"`, 64 KiB pool | 9.9 MB | 221 MB |
| `"use cache"`, 8 KiB pool | 9.9 MB | 42 MB |
| Same page without `"use cache"` | n/a | 0 MB |
| `"use cache"`, 64 KiB pool, unpooled copy (fix below) | 9.9 MB | 10 MB |

Through the inspector, the handler's LRU held 10,000 entries counted at
9.9 MB. Those entries referenced 3,525 distinct 64 KiB backing stores, which
is 220 MB.

A route handler that stores entries without rendering (`ROUTE=api/item`) does not show it: the
entries pack into the same slabs. A page render allocates short-lived pooled
buffers between cache writes, and the cache entries then keep those slabs
alive.

## Fix that removes the gap

In `next/dist/server/lib/cache-handlers/default.js`, store an unpooled copy,
as Node's `Buffer.allocUnsafeSlow` documentation recommends for small buffers
retained indefinitely:

```diff
-const value = await streamToBuffer(entry.value);
+const pooled = await streamToBuffer(entry.value);
+// Unpooled copy: a pooled slice would pin its whole Buffer pool slab.
+const value = Buffer.allocUnsafeSlow(pooled.byteLength);
+pooled.copy(value);
```
