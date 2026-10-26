// A small pool of compressor workers. Jobs of the image being viewed jump the queue,
// and jobs of removed / reset images can be dropped before they start.
import type { Distortion } from './imageCompressor'
import type { WorkerRequest, WorkerResponse } from './imageCompressor.worker'

type JobRequest = Exclude<WorkerRequest, { type: 'release' }>
type JobInput = JobRequest extends infer R ? (R extends unknown ? Omit<R, 'job'> : never) : never

export interface JobResult {
  bytes: ArrayBuffer
  metrics: Distortion | null
}

export class CancelledError extends Error {
  constructor() {
    super('cancelled')
  }
}

interface Job {
  id: number
  key: number
  input: JobInput
  resolve: (r: JobResult) => void
  reject: (e: Error) => void
}

interface Slot {
  worker: Worker
  job: Job | null
}

export class CompressorPool {
  private readonly size: number
  private readonly slots: Slot[] = []
  private queue: Job[] = []
  private seq = 0
  /** Image whose jobs run first */
  priority = -1

  constructor(size = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1))) {
    this.size = size
  }

  run(key: number, input: JobInput): Promise<JobResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id: ++this.seq, key, input, resolve, reject })
      this.pump()
    })
  }

  /** Drops queued jobs of an image (running ones still finish) and frees its decoded source in the workers. */
  cancel(key: number) {
    const dropped = this.queue.filter((j) => j.key === key)
    this.queue = this.queue.filter((j) => j.key !== key)
    for (const j of dropped) j.reject(new CancelledError())
    for (const s of this.slots) s.worker.postMessage({ type: 'release', key } satisfies WorkerRequest)
  }

  dispose() {
    for (const j of this.queue) j.reject(new CancelledError())
    this.queue = []
    for (const s of this.slots) {
      s.job?.reject(new CancelledError())
      s.worker.terminate()
    }
    this.slots.length = 0
  }

  private spawn(): Slot {
    const slot: Slot = { worker: new Worker(new URL('./imageCompressor.worker.ts', import.meta.url), { type: 'module' }), job: null }
    slot.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const job = slot.job
      slot.job = null
      if (job && job.id === e.data.job) {
        if (e.data.ok) job.resolve({ bytes: e.data.bytes, metrics: e.data.metrics })
        else job.reject(new Error(e.data.error))
      }
      this.pump()
    }
    slot.worker.onerror = (e) => {
      const job = slot.job
      slot.job = null
      job?.reject(new Error(e.message || 'worker error'))
      this.pump()
    }
    this.slots.push(slot)
    return slot
  }

  private next(): Job | undefined {
    const i = this.queue.findIndex((j) => j.key === this.priority)
    return this.queue.splice(i >= 0 ? i : 0, 1)[0]
  }

  private pump() {
    while (this.queue.length) {
      const slot = this.slots.find((s) => !s.job) ?? (this.slots.length < this.size ? this.spawn() : null)
      if (!slot) return
      const job = this.next()!
      slot.job = job
      slot.worker.postMessage({ ...job.input, job: job.id } as WorkerRequest)
    }
  }
}
