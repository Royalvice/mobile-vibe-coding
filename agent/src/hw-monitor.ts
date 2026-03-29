// Hardware monitor: collect GPU/CPU/RAM/Disk stats

import si from 'systeminformation';
import type { HwStatus, GpuInfo } from '../../shared/types.js';

export async function collectHwStatus(): Promise<HwStatus> {
  const [cpu, mem, disk, graphics, load] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
    si.graphics(),
    si.currentLoad(),
  ]);

  const gpus: GpuInfo[] = (graphics.controllers || []).map((g) => ({
    name: g.model || 'Unknown GPU',
    utilizationPercent: g.utilizationGpu ?? 0,
    memoryUsedMB: g.memoryUsed ?? 0,
    memoryTotalMB: g.memoryTotal ?? 0,
    temperatureC: g.temperatureGpu ?? null,
  }));

  return {
    timestamp: Date.now(),
    cpu: {
      usagePercent: Math.round(cpu.currentLoad * 10) / 10,
      loadAvg: [load.avgLoad, 0, 0] as [number, number, number],
    },
    ram: {
      usedMB: Math.round(mem.used / 1024 / 1024),
      totalMB: Math.round(mem.total / 1024 / 1024),
    },
    disk: disk.map((d) => ({
      usedGB: Math.round(d.used / 1024 / 1024 / 1024 * 10) / 10,
      totalGB: Math.round(d.size / 1024 / 1024 / 1024 * 10) / 10,
      path: d.mount,
    })),
    gpus,
  };
}
