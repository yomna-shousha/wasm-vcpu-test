// assembly/compute.ts
export function heavyPrimeWork(iterations: i32): i32 {
  let count: i32 = 0;
  for (let k: i32 = 0; k < iterations; k++) {
    let n: i32 = (k * 48271) & 0x7fffffff;
    if (n < 3) { count++; continue; }
    let isPrime: bool = true;
    for (let i: i32 = 2; i * i <= n; i++) {
      if (n % i == 0) { isPrime = false; break; }
    }
    if (isPrime) count++;
  }
  return count;
}

export function matrixMultiply(n: i32, runs: i32): i32 {
  const size = n * n;
  let a = new Array<f64>(size);
  let b = new Array<f64>(size);
  let c = new Array<f64>(size);
  for (let i = 0; i < size; i++) {
    a[i] = (i % 7) as f64 + 1.0;
    b[i] = (i % 13) as f64 + 1.0;
    c[i] = 0.0;
  }
  for (let r = 0; r < runs; r++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let sum = 0.0;
        for (let k = 0; k < n; k++) {
          sum += a[i * n + k] * b[k * n + j];
        }
        c[i * n + j] = sum;
      }
    }
  }
  let s: f64 = 0.0;
  for (let i = 0; i < size; i++) s += c[i];
  return <i32>(s) | 0;
}

