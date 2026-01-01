import type { NodeCapability } from '../graph/ExecutionGraph';
import type { Worker, WorkerDescriptor } from './Worker';

export class WorkerManager {
  private items = new Map<string, Worker>();

  register(worker: Worker): void {
    const d = worker.describe();
    this.items.set(d.id, worker);
  }

  list(): WorkerDescriptor[] {
    return Array.from(this.items.values()).map(w => w.describe());
  }

  get(id: string): Worker | undefined {
    return this.items.get(id);
  }

  getByCapability(capability: NodeCapability): Worker[] {
    const out: Worker[] = [];
    for (const w of this.items.values()) {
      if (w.describe().capabilities.includes(capability)) {
        out.push(w);
      }
    }
    return out;
  }
}

export const workerManager = new WorkerManager();

