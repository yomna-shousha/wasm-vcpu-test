import wasmModule from './compute.wasm';

let exportsPromise = null;
async function loadWasm() {
  if (exportsPromise) return exportsPromise;
  // wasmModule is bundled by wrangler as a WebAssembly.Module
  exportsPromise = (async () => {
    const { instance } = await WebAssembly.instantiate(wasmModule, {});
    return instance.exports;
  })();
  return exportsPromise;
}

addEventListener('fetch', event => event.respondWith(handle(event.request)));

async function handle(request) {
  const url = new URL(request.url);
  if (url.pathname === '/health') return new Response('ok');
  if (url.pathname !== '/compute') return new Response('Not found', { status: 404 });

  const mode = url.searchParams.get('mode') || 'prime'; // 'prime' or 'matrix'
  const iters = parseInt(url.searchParams.get('iters') || '20000', 10);
  const n = parseInt(url.searchParams.get('n') || '70', 10);
  const runs = parseInt(url.searchParams.get('runs') || '2', 10);

  const start = Date.now();
  try {
    const wasm = await loadWasm();
    let result = 0;
    if (mode === 'prime') {
      result = wasm.heavyPrimeWork(iters);
    } else {
      result = wasm.matrixMultiply(n, runs);
    }
    const wallMs = Date.now() - start;
    const body = { ok: true, mode, iters, n, runs, result: Number(result), wallMs };
    return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' }});
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
}

