// Web Worker that decimates a mesh off the main thread, so large models don't freeze the page.
import { simplifyMesh, type Mesh } from './lowPoly'

export interface WorkerRequest {
  job: number
  mesh: Mesh
  reduction: number
  lockBorder: boolean
}

export type WorkerResponse = { job: number; ok: true; mesh: Mesh; ms: number } | { job: number; ok: false; error: string }

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { job, mesh, reduction, lockBorder } = e.data
  const start = performance.now()
  let res: WorkerResponse
  try {
    const out = await simplifyMesh(mesh, reduction, { lockBorder })
    res = { job, ok: true, mesh: out, ms: performance.now() - start }
  } catch (err) {
    res = { job, ok: false, error: err instanceof Error ? err.message : String(err) }
  }
  self.postMessage(res, { transfer: res.ok ? [res.mesh.positions.buffer, res.mesh.indices.buffer] : [] })
}
