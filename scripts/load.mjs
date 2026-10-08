// Fills the default "use cache" handler with ENTRIES small entries (about
// 1 KB each, well under the 50 MB cacheMaxMemorySize) and prints memory
// after a forced GC before and after.
const base = process.env.BASE_URL ?? "http://127.0.0.1:3077";
const entries = Number(process.env.ENTRIES ?? 20000);
const concurrency = Number(process.env.CONCURRENCY ?? 16);

const memory = async () => (await fetch(`${base}/api/memory`)).json();

console.log("before", await memory());
let next = 0;
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    while (next < entries) {
      const id = next++;
      const response = await fetch(`${base}/${process.env.ROUTE ?? "item"}/${id}`);
      await response.arrayBuffer();
    }
  }),
);
console.log(`after ${entries} cache entries`, await memory());
