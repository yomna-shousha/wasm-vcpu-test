#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const cp = require('child_process');

function safeRead(path){ try { return fs.readFileSync(path,'utf8').trim(); } catch(e) { return null; } }

function parseCgroupV2CpuMax(s){
  if(!s) return null;
  const parts = s.split(/\s+/);
  if(parts[0] === 'max') return { quota: Infinity, period: null };
  const quota = parseInt(parts[0],10);
  const period = parseInt(parts[1]||'',10) || null;
  return { quota, period };
}

function parseCgroupV1(quotaStr, periodStr){
  if(!quotaStr || !periodStr) return null;
  const quota = parseInt(quotaStr,10);
  const period = parseInt(periodStr,10);
  if(isNaN(quota) || isNaN(period)) return null;
  return { quota, period };
}

function estimateCpusFromQuota(q, p){
  if(q === null || q === undefined) return null;
  if(!isFinite(q)) return null;
  if(!p || p <= 0) return null;
  const v = q / p;
  return Math.max(1, Math.floor(v));
}

const label = process.argv[2] || 'CHECK';
const ts = new Date().toISOString();

const out = {
  label,
  ts,
  node_version: process.version,
  os_platform: process.platform,
  os_release: os.release(),
  os_cpus_logical: os.cpus().length
};

try {
  out.nproc = cp.execSync('nproc', { timeout: 2000 }).toString().trim();
} catch(e) {
  out.nproc = null;
}

out.proc_status = safeRead('/proc/self/status') || null;
if(out.proc_status){
  const m = out.proc_status.match(/^Cpus_allowed_list:\\s*(.+)$/m);
  out.cpus_allowed_list = m && m[1] ? m[1].trim() : null;
}

// Try cgroup v2 first
const cgCpuMax = safeRead('/sys/fs/cgroup/cpu.max') || safeRead('/sys/fs/cgroup/cpu.max');
if(cgCpuMax){
  const parsed = parseCgroupV2CpuMax(cgCpuMax);
  out.cgroup_v2 = parsed;
  if(parsed && parsed.quota && parsed.period) out.estimated_cpus_from_cgroup = estimateCpusFromQuota(parsed.quota, parsed.period);
} else {
  // try cgroup v1 files
  const quota = safeRead('/sys/fs/cgroup/cpu/cpu.cfs_quota_us') || safeRead('/sys/fs/cgroup/cpuacct/cpu.cfs_quota_us');
  const period = safeRead('/sys/fs/cgroup/cpu/cpu.cfs_period_us') || safeRead('/sys/fs/cgroup/cpuacct/cpu.cfs_period_us');
  if(quota || period){
    const parsed = parseCgroupV1(quota, period);
    out.cgroup_v1 = { quota: parsed ? parsed.quota : quota, period: parsed ? parsed.period : period };
    if(parsed) out.estimated_cpus_from_cgroup = estimateCpusFromQuota(parsed.quota, parsed.period);
  } else {
    out.cgroup = null;
  }
}

console.log('=== CPU DETECTION ===');
console.log(JSON.stringify(out, null, 2));
process.exit(0);
